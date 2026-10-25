# Firebase Authentication para EN LISTA!

## Activar Email/Password

En Firebase Console, abrir **Authentication → Sign-in method → Email/Password**, activar **Email/Password** y guardar. La app ya usa `signInWithEmailAndPassword` y `createUserWithEmailAndPassword`.

## Primer administrador

El primer Admin debe registrarse con el correo de creador configurado en las reglas:

```text
eternalbeatmedioscl@gmail.com
```

El registro crea el usuario de Firebase Authentication y su perfil en `users/{uid}`. Las reglas limitan el bootstrap de Admin a ese correo. Para agregar otros administradores se debe usar una operación backend posterior, no editar el navegador.

## Crear RRPP

Una vez autenticado el Admin:

1. Ir a **Admin → Promotores → Nuevo promotor**.
2. Completar nombre, email, contraseña inicial y teléfono opcional.
3. La app llama a la Cloud Function `createPromoter`.
4. La Function crea el usuario en Firebase Authentication y el perfil en `promoters/{uid}`.

El RRPP entra con su propio email y contraseña desde la pantalla inicial. No se debe usar el selector demo ni compartir una cuenta.

## Estado de seguridad

Las reglas nuevas protegen:

- `users/{uid}`: perfil propio o Admin.
- `promoters/{uid}`: lectura del propio RRPP; escritura solo Admin.
- `guests/{guestId}`: el RRPP solo puede leer, crear, modificar o eliminar invitados cuyo `addedBy` sea su UID; Admin puede administrar todos.

`enlista/global_state` todavía se conserva abierto por compatibilidad con la aplicación heredada, que almacena allí eventos, invitados y links. Debe migrarse a colecciones individuales antes de cerrar esa regla; mientras permanezca abierta, no debe considerarse una protección completa para el estado legado.
