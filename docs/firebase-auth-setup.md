# Firebase Authentication para EN LISTA!

## Activar Email/Password

En Firebase Console, abrir **Authentication → Sign-in method → Email/Password**, activar **Email/Password** y guardar.

## Flujo RRPP sin Cloud Functions

El RRPP solicita su propia cuenta desde la pantalla inicial:

1. Pulsar **Solicitar cuenta RRPP**.
2. Completar nombre, email, contraseña y teléfono opcional.
3. Firebase Authentication crea la identidad.
4. Firestore crea `promoters/{uid}` con `status: pending` y `active: false`.
5. El Admin ve la solicitud en **Admin → Promotores**.
6. El Admin puede aprobar, rechazar, suspender o reactivar el perfil.
7. El RRPP solo puede ingresar cuando su perfil está `approved` y `active: true`.

El Admin nunca recibe ni almacena la contraseña del RRPP. Para recuperar una contraseña se usa el correo de recuperación de Firebase.

## Primer administrador

El primer Admin debe registrarse con:

```text
eternalbeatmedioscl@gmail.com
```

Las reglas limitan el bootstrap de Admin a ese correo. Para agregar otros administradores se requiere una operación administrativa posterior.

## Reglas de seguridad

- `users/{uid}`: lectura propia o Admin.
- `promoters/{uid}`: el propietario puede crear solamente su propia solicitud pendiente; solo Admin puede aprobar, rechazar, suspender o borrar.
- `guests/{guestId}`: el RRPP solo puede operar sobre invitados cuyo `addedBy` coincida con su UID.
- `enlista/global_state`: permanece temporalmente abierto por compatibilidad con los datos heredados. Debe migrarse antes de cerrar completamente el modelo legado.

## Despliegue

El workflow de GitHub Actions publica únicamente:

```text
Firebase Hosting
Firestore Rules
```

No despliega Cloud Functions, Cloud Build ni Artifact Registry. Por eso este flujo no requiere habilitar esos servicios para crear cuentas RRPP.
