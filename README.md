# Banco BanQuito - Frontend Switch

Frontend React/Vite del Switch de Pagos Masivos.

## Ubicacion

```text
C:\Users\COLINAM\Documents\ARQUI\final_ver\banquito-frontend-switch
```

Este proyecto tiene Docker Compose propio y queda separado del backend `banquito-switch`.

## Bases API Locales R9I

Para pruebas locales con Core R9I se usan dos gateways:

```text
Core/Auth:  http://localhost:8000
Switch API: http://localhost:8010/api/v1
```

`8010` corresponde al Kong local `switch-only` y publica solo rutas del Switch. En despliegue real debe existir un gateway unificado.

## Levantar con Docker Compose

Desde esta carpeta:

```powershell
docker compose up -d --build
```

URL local:

```text
http://localhost:5173/switch/
```

## Levantar en modo local sin Docker

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

URL local:

```text
http://127.0.0.1:5173/switch/
```

## Variables principales

```env
VITE_CORE_KONG_BASE_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8010/api/v1
VITE_BASE_PATH=/switch/
VITE_ALLOWED_HOSTS=localhost,127.0.0.1
```

## Documentacion

- `docs/FRONTEND_API_HANDOFF.md`: contrato practico con backend/Kong.
- `.env.example`: valores locales sugeridos.
