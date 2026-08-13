// ============================================
// EN LISTA! — Firebase Cloud Functions
// Secure payment processing with Mercado Pago
// ============================================

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

admin.initializeApp();
const db = admin.firestore();

// Secret for Mercado Pago Access Token (set via Firebase CLI)
const MP_ACCESS_TOKEN = defineSecret("MP_ACCESS_TOKEN");

// ============================================
// 1. CREATE PAYMENT PREFERENCE
// Called from the frontend when user clicks "Pagar"
// ============================================
exports.createPayment = onRequest(
  { cors: true, secrets: [MP_ACCESS_TOKEN] },
  async (req, res) => {
    try {
      // Only allow POST
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { email } = req.body;

      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Email valido es requerido" });
      }

      // Initialize Mercado Pago client
      const client = new MercadoPagoConfig({
        accessToken: MP_ACCESS_TOKEN.value(),
      });

      const preference = new Preference(client);

      // Create a unique external reference to track this payment
      const externalReference = `ENLISTA_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      // Store pending payment in Firestore
      await db.collection("pending_payments").doc(externalReference).set({
        email: email,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create Mercado Pago preference
      const preferenceData = await preference.create({
        body: {
          items: [
            {
              id: "enlista-pro-license",
              title: "EN LISTA! PRO - Licencia (3 dispositivos)",
              description: "Licencia unica para EN LISTA! PRO. Control de acceso para eventos.",
              quantity: 1,
              unit_price: 35,
              currency_id: "USD",
            },
          ],
          payer: {
            email: email,
          },
          external_reference: externalReference,
          notification_url: `https://${req.headers.host}/mpWebhook`,
          back_urls: {
            success: `${req.headers.origin || "https://enlistapro.web.app"}/#payment-success/${externalReference}`,
            failure: `${req.headers.origin || "https://enlistapro.web.app"}/#payment-failure`,
            pending: `${req.headers.origin || "https://enlistapro.web.app"}/#payment-pending/${externalReference}`,
          },
          auto_return: "approved",
          statement_descriptor: "ENLISTA PRO",
        },
      });

      return res.status(200).json({
        preferenceId: preferenceData.id,
        initPoint: preferenceData.init_point,
        externalReference: externalReference,
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      return res.status(500).json({ error: "Error al crear el pago" });
    }
  }
);

// ============================================
// 2. MERCADO PAGO WEBHOOK
// Receives payment notifications from Mercado Pago
// Only generates license when payment is APPROVED
// ============================================
exports.mpWebhook = onRequest(
  { cors: true, secrets: [MP_ACCESS_TOKEN] },
  async (req, res) => {
    try {
      // Mercado Pago sends GET for verification and POST for notifications
      if (req.method === "GET") {
        return res.status(200).send("OK");
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method not allowed");
      }

      const { type, data } = req.body;

      // We only care about payment notifications
      if (type !== "payment" || !data?.id) {
        return res.status(200).send("OK - Not a payment notification");
      }

      // Fetch the full payment details from Mercado Pago
      const client = new MercadoPagoConfig({
        accessToken: MP_ACCESS_TOKEN.value(),
      });

      const payment = new Payment(client);
      const paymentData = await payment.get({ id: data.id });

      console.log(`[Webhook] Payment ${data.id} - Status: ${paymentData.status}`);

      // Only process APPROVED payments
      if (paymentData.status !== "approved") {
        console.log(`[Webhook] Payment ${data.id} not approved (${paymentData.status}), skipping.`);

        // Update pending payment status
        if (paymentData.external_reference) {
          await db.collection("pending_payments").doc(paymentData.external_reference).update({
            status: paymentData.status,
            paymentId: data.id.toString(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        return res.status(200).send("OK - Not approved");
      }

      // ========== PAYMENT APPROVED! ==========
      const externalRef = paymentData.external_reference;
      const payerEmail = paymentData.payer?.email || paymentData.additional_info?.payer?.first_name || "";

      console.log(`[Webhook] APPROVED! Ref: ${externalRef}, Email: ${payerEmail}`);

      // Check if we already processed this payment (idempotency)
      const pendingDoc = await db.collection("pending_payments").doc(externalRef).get();

      if (pendingDoc.exists && pendingDoc.data().licenseKey) {
        console.log(`[Webhook] Payment ${externalRef} already processed. License: ${pendingDoc.data().licenseKey}`);
        return res.status(200).send("OK - Already processed");
      }

      // Generate license key
      const licenseKey = "ENLS-" +
        Math.random().toString(36).substr(2, 4).toUpperCase() + "-" +
        Math.random().toString(36).substr(2, 4).toUpperCase();

      // Create license in Firestore
      await db.collection("licenses").doc(licenseKey).set({
        key: licenseKey,
        email: pendingDoc.exists ? pendingDoc.data().email : payerEmail,
        plan: "PRO",
        maxDevices: 3,
        devices: [],
        status: "active",
        paymentId: data.id.toString(),
        externalReference: externalRef,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update pending payment with license info
      await db.collection("pending_payments").doc(externalRef).update({
        status: "approved",
        licenseKey: licenseKey,
        paymentId: data.id.toString(),
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[Webhook] License ${licenseKey} created for ${externalRef}`);

      return res.status(200).send("OK - License created");
    } catch (error) {
      console.error("[Webhook] Error processing notification:", error);
      // Always return 200 to Mercado Pago so it doesn't retry infinitely
      return res.status(200).send("OK - Error logged");
    }
  }
);

// ============================================
// 3. CHECK PAYMENT STATUS
// Frontend polls this to check if payment was processed
// ============================================
exports.checkPaymentStatus = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const { externalReference } = req.query;

      if (!externalReference) {
        return res.status(400).json({ error: "externalReference requerido" });
      }

      const doc = await db.collection("pending_payments").doc(externalReference).get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Pago no encontrado" });
      }

      const data = doc.data();

      return res.status(200).json({
        status: data.status,
        licenseKey: data.licenseKey || null,
        email: data.email,
      });
    } catch (error) {
      console.error("Error checking payment:", error);
      return res.status(500).json({ error: "Error al verificar el pago" });
    }
  }
);
