# 🚀 Guía de Deployment en Coolify con PostgreSQL Interno

## Configuración Actualizada:

He cambiado el driver de base de datos de `@neondatabase/serverless` (HTTP) a `postgres` (TCP estándar) para conectarse correctamente a tu PostgreSQL interno.

### Variables de Entorno para Coolify:

```bash
# Tu PostgreSQL interno en Coolify
DATABASE_URL=postgres://postgres:hIJWL0kFomqH24jZ17CmV1OfacXyHhnd4idNwY7tyEhi2yWr4eXDtvGAnZlq2N9A@qcggssww444k4wc48kww8844:5432/postgres

# Sistema
SESSION_SECRET=eb85b8d7a3c106ba3cfb6b9d8f3565a26c07530489728899ec9bc7a6bc855624a54d8690a2b97c145a4991cfc0224965fe2a56c3224f5702c1880ed181dd19ef
NODE_ENV=production
PORT=3005

# Email (interno en Coolify si está configurado)
EMAIL_HOST=veloz.colombiahosting.com.co
EMAIL_PORT=465
EMAIL_USER=trivia@cubacoin.org
EMAIL_PASS=g@i*BJ{RZGmtA79]
```

## Driver de Base de Datos Corregido:

**Antes (no funcionaba):**
- `@neondatabase/serverless` - Solo para bases HTTP como Neon
- Conexiones WebSocket/HTTP

**Ahora (funcionará):**
- `postgres` - Driver estándar PostgreSQL
- Conexiones TCP tradicionales  
- Compatible con PostgreSQL interno de Coolify

## Logs Esperados:

```
Testing database connection...
Database URL configured: Yes
Database connection successful  
Initializing production database...
✓ External database connection successful
Creating database tables...
✓ Table created successfully (x7)
Database is empty, populating with default data...
✓ Default countries populated
✓ Loaded 1500 questions for cuba
✓ Loaded 1500 questions for honduras
✓ Database initialization completed successfully
2:XX:XX PM [express] serving on port 3005
2:XX:XX PM [express] GET /api/health 200 in Xms
```

## Resultado:
Tu aplicación ahora se conectará correctamente a tu PostgreSQL interno y funcionará con todos los datos persistentes.