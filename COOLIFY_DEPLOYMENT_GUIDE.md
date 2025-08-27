# 🚀 Guía de Deployment en Coolify - Configuración Completa

## Variables de Entorno Requeridas

### En Coolify → Environment Variables, configurar:

```bash
# Base de Datos (CRÍTICO - necesita ser URL pública)
DATABASE_URL=postgresql://user:password@public-host:5432/database

# Seguridad de Sesiones
SESSION_SECRET=eb85b8d7a3c106ba3cfb6b9d8f3565a26c07530489728899ec9bc7a6bc855624a54d8690a2b97c145a4991cfc0224965fe2a56c3224f5702c1880ed181dd19ef

# Configuración del Servidor
NODE_ENV=production
PORT=3000

# Sistema de Correo (veloz.colombiahosting.com.co)
EMAIL_HOST=veloz.colombiahosting.com.co
EMAIL_PORT=465
EMAIL_USER=trivia@cubacoin.org
EMAIL_PASS=g@i*BJ{RZGmtA79]

# Opcional - Dominio personalizado
REPLIT_DOMAINS=trivia.cubacoin.org
```

## Problemas Actuales y Soluciones

### 1. Base de Datos
**Problema**: La URL actual no es accesible desde Docker
**Solución**: Usar una base de datos con URL pública como:
- Neon (neon.tech) - Gratis hasta 500MB
- Supabase (supabase.com) - Gratis hasta 500MB  
- Railway (railway.app) - PostgreSQL público
- PlanetScale, Aiven, etc.

### 2. Servidor SMTP
**Problema**: Timeout de conexión
**Soluciones posibles**:
- Verificar que `veloz.colombiahosting.com.co` permita conexiones desde IPs externas
- Configurar whitelist en el servidor de correo para la IP de Coolify
- Alternativamente usar: Gmail SMTP, SendGrid, Resend, etc.

## Configuración Recomendada para Neon

1. Ir a [neon.tech](https://neon.tech)
2. Crear cuenta gratuita
3. Crear nuevo proyecto "trivia-production"
4. Copiar la connection string que te dan
5. Usar esa URL en `DATABASE_URL`

Ejemplo de URL de Neon:
```
postgresql://user:password@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Estado de la Aplicación

### ✅ Funcionando
- Servidor Express (puerto 3005)
- Health checks (/api/health)
- Sistema de autenticación
- Frontend compilado
- Docker container

### ❌ Problemas
- Conexión a base de datos
- Envío de emails
- Registro de usuarios (depende de DB)

## Build Actual

El build está listo y optimizado:
- Tamaño del servidor: 52.6kb
- Frontend optimizado con Vite
- Todas las dependencias incluidas
- Sistema de errores mejorado

## Pasos para Arreglar

1. **Obtener URL de base de datos pública**
2. **Actualizar DATABASE_URL en Coolify**
3. **Redeploy**
4. **Verificar logs**
5. **Probar registro de usuario**

La aplicación está bien construida, solo necesita servicios externos accesibles.