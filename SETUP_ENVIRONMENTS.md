# Configuracion de Endpoints por Ambiente

## Desarrollo Local Core R9I

En pruebas locales R9I el frontend separa autenticacion Core y APIs Switch:

```env
VITE_CORE_KONG_BASE_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8010/api/v1
VITE_ENVIRONMENT=development
VITE_MOCK_AUTH_ENABLED=false
```

- `VITE_CORE_KONG_BASE_URL` apunta al Kong integrado de Core R9I.
- `VITE_API_BASE_URL` apunta al Kong local `switch-only`.
- `localhost:8010` no debe usarse para Auth/Core.
- `localhost:8000` no debe usarse para rutas Switch en esta prueba local.

## Staging/Produccion

En ambientes integrados debe existir un gateway unificado o variables equivalentes definidas por despliegue:

```env
VITE_CORE_KONG_BASE_URL=https://api.banquito.com
VITE_API_BASE_URL=https://api.banquito.com/api/v1
VITE_ENVIRONMENT=production
VITE_MOCK_AUTH_ENABLED=false
```

## Archivos

| Archivo | Proposito | Versionable |
| --- | --- | --- |
| `.env.example` | Plantilla documentada | Si |
| `.env.local` | Configuracion local | No |
| `.env` | Configuracion local del workspace | Depende del flujo del equipo |

## Verificacion Rapida

```powershell
node node_modules/vite/bin/vite.js build
node node_modules/vite/bin/vite.js --host 127.0.0.1
```

URL local:

```text
http://127.0.0.1:5173/switch/
```
