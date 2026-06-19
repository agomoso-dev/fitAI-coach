# Backend apps

Esta carpeta agrupa la logica de dominio de FitAI Coach.

- `home_feed/`: portada inteligente, feeds deportivos, resumen con IA y calculo de lectura.
- `users/`: usuarios, autenticacion, recuperacion de contraseña y rutas publicas/admin de usuario.
- `profiles/`: perfiles deportivos de atletas y entrenadores.
- `nutrition/`: dietas, alimentos y planes nutricionales.
- `workouts/`: entrenamientos, sesiones, ejercicios y progresion.

No se necesita `fitcoach_core/`: la configuracion del proyecto Django vive en `backend/config/`.

La antigua carpeta `backend/api/` ya no se usa. Las URLs externas se mantienen bajo `/api/`, pero ahora apuntan a `apps.users.urls`.
