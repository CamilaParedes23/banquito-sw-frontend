# Verificacion de Endpoints Frontend

## Estado R9I Local

El frontend no usa endpoints hardcodeados para negocio. Las bases actuales son:

```env
VITE_CORE_KONG_BASE_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8010/api/v1
```

## Archivos Relevantes

| Archivo | Estado |
| --- | --- |
| `src/app/services/authService.ts` | Usa `VITE_CORE_KONG_BASE_URL` para `/api/v1/auth/login`, `/api/v1/auth/me` y `/api/v1/auth/refresh`. |
| `src/app/services/apiClient.ts` | Usa `VITE_API_BASE_URL` para rutas Switch y adjunta `Authorization: Bearer` si hay token. |
| `src/app/pages/health/SystemHealth.tsx` | Usa `VITE_API_BASE_URL`; fallback local en `8010`. |
| `src/app/pages/batches/BatchUpload.tsx` | Envia `companyRuc`, `companyCustomerUuid`, `channel` y `receivedBy`. |

## Fronteras Validadas

- Auth/Core por `8000`.
- Switch por `8010`.
- Core no se publica en el Kong `switch-only`.
- Rutas Switch no se publican en el Kong R9I local.
- No se usa `localhost:8080` como configuracion activa.

## Nota de Despliegue

Esta separacion `8000/8010` es solo para pruebas locales con dos Kong. En despliegue real el equipo puede apuntar ambas variables al gateway unificado correspondiente.
