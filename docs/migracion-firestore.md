# Migración de invitados fuera de `enlista/global_state`

## Estado del cambio

La aplicación ahora conserva eventos, usuarios y links en `enlista/global_state`, pero lee y escribe invitados en `guests/{guestId}`. Cada invitado migrado conserva su `id`, `qrCode`, estado, promotor y datos originales; se agrega únicamente `eventId` para permitir consultas seguras por evento.

## Respaldo y migración

Ejecutar desde la raíz del repositorio con una cuenta de servicio de Firebase Admin. No guardar la credencial en Git ni en el chat.

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/ruta/segura/service-account.json
export FIREBASE_PROJECT_ID=en-lista-app-z1e6wt
node scripts/migrate-global-state.mjs
```

El script realiza estas operaciones en orden:

1. Lee `enlista/global_state`.
2. Valida que cada invitado tenga un ID único, `eventId` y `qrCode` no vacío ni duplicado.
3. Crea una copia local y otra en `enlista_backups/global_state_<timestamp>`.
4. Escribe cada invitado en `guests/{id}` sin cambiar su ID ni QR.
5. Lee nuevamente los documentos migrados y comprueba cantidad, IDs y códigos QR.

Para inspeccionar sin escribir:

```bash
node scripts/migrate-global-state.mjs --dry-run
```

Para generar solo el respaldo:

```bash
node scripts/migrate-global-state.mjs --backup-only
```

Los JSON locales de `backups/` están ignorados por Git porque pueden contener datos personales.

## Verificación funcional

Después de ejecutar el script, publicar el código y las reglas. Probar con cuentas separadas:

- **RRPP A:** debe consultar únicamente invitados cuyo `addedBy` sea su UID, crear/eliminar sus invitados y no leer los de RRPP B.
- **RRPP B:** debe ver solo su propia lista y conservar los QR existentes.
- **Administrador:** debe listar todos los invitados, agregar invitados y revisar métricas.
- **Puerta:** debe listar todos los invitados, buscar por nombre o QR y actualizar únicamente `status`, `checkedInAt` y `checkedInBy`.
- **Registro público:** debe crear un invitado `selfRegistered` en estado `pending`, sin poder leer la colección.

Comprobar explícitamente que el QR histórico `ENLISTA-g_5ohipbzaizgx` siga resolviendo al mismo invitado antes de retirar el uso del documento legado.

## Rollback

No se elimina `enlista/global_state` durante esta etapa. Si la validación falla, revertir el commit de código/reglas y mantener la copia `enlista_backups/...`. Para restaurar invitados, usar una operación Admin SDK que lea `globalState.guests` del backup y vuelva a escribir los documentos `guests/{id}` con el mismo `qrCode`.
