# 🗄️ Configuración de Base de Datos Neon para Producción

## Problema Actual
Tu URL actual `postgres://postgres:hIJWL0kFom...` no es accesible desde contenedores Docker en Coolify. Necesitas una base de datos con URL pública.

## Solución: Neon Database (Gratis)

### Pasos para Configurar Neon:

1. **Crear Cuenta**
   - Ir a https://neon.tech
   - Registrarse con email
   - Verificar cuenta

2. **Crear Proyecto**
   - Nombre: "trivia-production"
   - Región: US East (más cerca de la mayoría de servidores)
   - PostgreSQL versión: 15 o 16

3. **Obtener Connection String**
   - En el dashboard de Neon
   - Sección "Connection Details"
   - Copiar la URL completa que incluye `?sslmode=require`

4. **Migrar Datos**
   - Exportar datos actuales con `pg_dump`
   - Importar a Neon con `psql`

### Formato de URL de Neon:
```
postgresql://username:password@ep-name-123456.region.aws.neon.tech/dbname?sslmode=require
```

### Variables de Entorno Actualizadas:
```bash
# Nueva base de datos Neon
DATABASE_URL=postgresql://username:password@ep-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require

# Mantener estas
SESSION_SECRET=eb85b8d7a3c106ba3cfb6b9d8f3565a26c07530489728899ec9bc7a6bc855624a54d8690a2b97c145a4991cfc0224965fe2a56c3224f5702c1880ed181dd19ef
NODE_ENV=production
PORT=3000

# Email - Probar con Gmail si el servidor actual sigue fallando
EMAIL_HOST=veloz.colombiahosting.com.co
EMAIL_PORT=465
EMAIL_USER=trivia@cubacoin.org
EMAIL_PASS=g@i*BJ{RZGmtA79]
```

## Límites de Neon (Plan Gratuito):
- 512 MB de almacenamiento
- 1 base de datos
- Conexiones concurrentes: 100
- Perfecto para tu aplicación

## Alternativas si no quieres usar Neon:
1. **Supabase** - También gratis hasta 500MB
2. **Railway** - PostgreSQL público
3. **Aiven** - PostgreSQL en la nube
4. **ElephantSQL** - PostgreSQL especializado

## Estado Actual de la App:
✅ Frontend funcionando
✅ Backend funcionando  
✅ Health checks OK
✅ Sistema de errores robusto
❌ Base de datos inaccesible
❌ SMTP timeout (firewall)

Una vez que tengas la URL de Neon, tu aplicación funcionará completamente.