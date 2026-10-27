# Migración de `enlista/global_state`

## Respaldo inicial

El respaldo de esta etapa se guardó fuera del repositorio público:

- Documento original: `enlista/global_state`
- Captura: `2026-10-27T05:19:30Z`
- SHA-256 del JSON Firestore: `c5b1e8f497b64a6edd9aca99ece59ec64bed6e42553f6052004607a55cfd0796`
- Eventos: 1
- Invitados: 1
- Links de registro: 1
- Perfiles heredados omitidos: 3

## Destino de la primera etapa

El migrador copia sin borrar el documento original:

- `events/{eventId}`
- `guests/{guestId}` con `eventId`
- `registrationLinks/{linkId}`
- `migrations/global_state_v1` como registro de la operación

Cada documento conserva su ID y sus campos, incluidos los códigos QR. Se añade `migratedFrom: enlista/global_state`.

Los perfiles dentro del arreglo heredado `users` no se copian automáticamente: los permisos reales provienen de Firebase Authentication y de `users/{uid}` o `promoters/{uid}`.

## Ejecución controlada

El workflow manual `.github/workflows/migrate-firestore.yml` acepta:

- `dry-run`: valida IDs, cuenta documentos y detecta colisiones; no escribe.
- `apply`: copia documentos con `merge: true`, sin borrar ni modificar `enlista/global_state`.

La aplicación continuará usando el modelo legado hasta completar una segunda etapa de código. No se deben cerrar todavía las reglas de `enlista/global_state`.
