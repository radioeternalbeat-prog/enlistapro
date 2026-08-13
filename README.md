# EN LISTA! 🎉

**Gestion de listas de invitados y control de acceso para eventos nocturnos.**

Una Progressive Web App (PWA) optimizada para ambientes de vida nocturna — clubs, discotecas y eventos — con escaneo de QR, dashboard en tiempo real y sistema multi-rol.

## Caracteristicas

- **Dashboard Admin** — Estadisticas en tiempo real, gestion de eventos, promotores y reportes de cierre.
- **Panel RRPP** — Los promotores gestionan sus listas, agregan invitados y generan links de auto-registro.
- **Modo Puerta** — Interfaz optimizada para baja luz con escaneo QR integrado y check-in rapido.
- **Auto-Registro** — Links publicos para que los invitados se registren solos y obtengan su QR.
- **PWA** — Instalable como app nativa en celulares.
- **Sincronizacion en tiempo real** — Firestore sync entre multiples dispositivos.
- **Sistema de Licencias** — Validacion comercial por dispositivo.

## Tech Stack

- **Frontend:** Vanilla JS + Vite
- **Backend:** Firebase (Firestore, Hosting)
- **QR:** html5-qrcode (scanner) + qrcode (generator)
- **Deploy:** Firebase Hosting

## Instalacion

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
firebase deploy
```

## Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables (sidebar, dashboard, etc.)
├── lib/            # Logica core (router, store, firebase, utils)
├── styles/         # CSS Design System
├── views/          # Vistas principales (login, admin, gate, etc.)
└── main.js         # Entry point
```

## Roles

| Rol | Acceso |
|-----|--------|
| Admin | Dashboard completo, gestion de eventos y promotores |
| RRPP | Gestion de sus listas, agregar invitados, generar links |
| Puerta | Escaneo QR, check-in, control de aforo |

## Demo

Visita [enlistapro.web.app](https://enlistapro.web.app) y usa los botones de demo para probar cada rol.

---

Powered by **EN LISTA!** — Control de acceso inteligente para la noche.
