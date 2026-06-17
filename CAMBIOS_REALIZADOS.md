# Cambios realizados

## Limpieza de cambios anteriores

- Se reemplazo la pantalla anterior de calendario local en `frontend/fitai-coach-cli/src/App.jsx`.
- Se reemplazaron los estilos anteriores de calendario en `frontend/fitai-coach-cli/src/App.css`.
- Se mantuvo la estructura actual del proyecto:
  - Backend Django en `backend/config`.
  - Frontend Vite/React en `frontend/fitai-coach-cli`.
  - Schema SQL en `schema_training_rts_ai.sql`.

## Backend

- Se corrigieron referencias Django de `fitcoach_core` a `config`:
  - `backend/manage.py`
  - `backend/config/settings.py`
  - `backend/config/wsgi.py`
  - `backend/config/asgi.py`
- Se agrego `rest_framework`, `corsheaders` y la app `api` en `backend/config/settings.py`.
- Se habilito CORS para `http://localhost:3000` y `http://127.0.0.1:3000`.
- Se creo la app `backend/api` con:
  - Modelo `User` no gestionado contra la tabla SQL `users`.
  - Serializer para crear/listar usuarios.
  - ViewSet REST para `GET /api/users/` y `POST /api/users/`.
  - Rutas API en `backend/api/urls.py`.
- Se conecto `backend/config/urls.py` con `path('api/', include('api.urls'))`.
- Se creo el comando `ensure_training_schema` para ejecutar `schema_training_rts_ai.sql` desde Django.
- Se actualizo `backend/entrypoint.sh` para aplicar el schema antes de ejecutar migraciones.
- Se actualizo `backend/Dockerfile` para copiar `config` y `api`, no una carpeta antigua.

## Base de datos

- `docker-compose.yml` monta `schema_training_rts_ai.sql` en Postgres:
  - `/docker-entrypoint-initdb.d/schema_training_rts_ai.sql`
- `docker-compose.yml` monta el mismo SQL en backend:
  - `/app/schema_training_rts_ai.sql`
- El backend aplica el SQL al arrancar, incluso si el volumen de Postgres ya existia.
- La creacion de usuarios usa la tabla `users` definida en `schema_training_rts_ai.sql`.
- Las password se guardan en `users.password_hash` usando hash de Django.

## Frontend

- `frontend/fitai-coach-cli/src/App.jsx` ahora compone paginas, no contiene la logica de negocio.
- Se creo `frontend/fitai-coach-cli/src/services/api.js` para centralizar llamadas HTTP.
- Se creo `frontend/fitai-coach-cli/src/components/AuthLayout.jsx`.
- Se rellenaron paginas dentro de `frontend/fitai-coach-cli/src/pages`:
  - `LoginPages.jsx`
  - `RegisterPage.jsx`
  - `ForgotPasswordPage.jsx`
  - `DashboardPage.jsx`
  - `WorkoutsPage.jsx`
  - `DietsPage.jsx`
  - `CoachPage.jsx`
- La pantalla inicial ahora muestra:
  - Inicio de sesion.
  - Creacion de usuario.
  - Recuperacion de password.
- Tras iniciar sesion se muestra dashboard con usuarios registrados.
- `docker-compose.yml` define:
  - `VITE_API_URL=http://localhost:5000/api`
- El frontend llama a:
  - `GET http://localhost:5000/api/users/`
  - `POST http://localhost:5000/api/users/`
  - `POST http://localhost:5000/api/auth/login/`
  - `POST http://localhost:5000/api/auth/password-reset/`

## Validacion

- `docker compose config` ejecutado correctamente.
- `backend/venv/bin/python backend/manage.py check` ejecutado correctamente.
- `docker compose build backend frontend` ejecutado correctamente.
- `docker compose run --rm frontend npm run build` ejecutado correctamente.
