# 📋 Guía de Configuración de Endpoints por Ambiente

## Resumen Rápido ✅

Todos los endpoints han sido movidos a **variables de entorno**. Esto facilita el despliegue en diferentes ambientes sin necesidad de cambiar código.

---

## 🚀 Configuración por Ambiente

### 1️⃣ Desarrollo Local

Usar el archivo `.env.local` (creado automáticamente):

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_ENVIRONMENT=development
```

**Cómo usar:**
```bash
npm run dev  # Vite leerá automáticamente .env.local
```

### 2️⃣ Staging/Testing

```env
VITE_API_BASE_URL=https://staging-api.banquito.com/api/v1
VITE_ENVIRONMENT=staging
```

### 3️⃣ Producción

```env
VITE_API_BASE_URL=https://api.banquito.com/api/v1
VITE_ENVIRONMENT=production
VITE_MOCK_AUTH_ENABLED=false
```

---

## 📁 Archivos Relacionados

| Archivo | Propósito | Versionable |
|---------|----------|-----------|
| `.env.example` | Plantilla de variables (documentación) | ✅ Sí |
| `.env.local` | Configuración local de desarrollo | ❌ No (.gitignore) |
| `.env.staging` | Configuración de staging | ❌ No (usar CI/CD) |
| `.env.production` | Configuración de producción | ❌ No (usar CI/CD) |

---

## 🔐 Configuración en CI/CD (GitHub Actions)

**Ejemplo para despliegue:**

```yaml
- name: Build para Producción
  run: npm run build
  env:
    VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
    VITE_ENVIRONMENT: production
    VITE_MOCK_AUTH_ENABLED: false
```

**Guardar en GitHub Secrets:**
1. Ir a `Settings → Secrets and variables → Actions`
2. Click en `New repository secret`
3. Agregar:
   - `VITE_API_BASE_URL` = `https://api.banquito.com/api/v1`
   - `VITE_ENVIRONMENT` = `production`

---

## 📝 Variables de Entorno Disponibles

```env
# API
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Aplicación
VITE_APP_NAME=BanQuito
VITE_APP_SUBTITLE=Switch Pagos Masivos
VITE_ENVIRONMENT=development

# Autenticación
VITE_MOCK_AUTH_ENABLED=false
VITE_DEFAULT_ADMIN_USER=admin
```

---

## ✨ Cambios Realizados

### Corregidos:
- ❌ `localhost:8080` en `SystemHealth.tsx` → ✅ Usa `ENV.API_BASE_URL`
- ❌ URLs hardcodeadas → ✅ Variables de entorno

### Creados:
- ✅ `.env.example` - Plantilla para documentación
- ✅ `.env.local` - Configuración local de desarrollo
- ✅ `ENDPOINTS_VERIFICATION.md` - Reporte de auditoría

### Verificados:
- ✅ `apiClient.ts` - Usa ENV correctamente
- ✅ `env.ts` - Configuración centralizada
- ✅ Todos los servicios usan `apiClient`
- ✅ `.gitignore` ya excluye `.env.local`

---

## 🎯 Próximos Pasos

1. **Verificar que todo funciona:**
   ```bash
   npm run dev
   ```

2. **Para CI/CD:** Configurar secrets en GitHub/GitLab

3. **Para producción:** Usar las variables configuradas en secrets

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito crear `.env.local` manualmente?**
A: No, ya está creado. Solo editalo según tu ambiente local.

**P: ¿Puedo versionear `.env.production`?**
A: No, úsalo en CI/CD con secrets en GitHub.

**P: ¿Cómo cambio el endpoint en producción?**
A: Configura la variable `VITE_API_BASE_URL` en los secrets de tu CI/CD.

---

## 📞 Soporte

Para más información sobre Vite y variables de entorno:
- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Our Documentation](./ENDPOINTS_VERIFICATION.md)
