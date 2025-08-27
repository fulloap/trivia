# 🚨 Errores de Producción en Coolify - Diagnóstico y Solución

## Problemas Identificados

### 1. Error de Conexión a Base de Datos
```
Database connection failed: NeonDbError: Error connecting to database: fetch failed
ECONNREFUSED
```

**Causa**: La URL de base de datos no es accesible desde el contenedor Docker en Coolify.

### 2. Error de Conexión SMTP
```
Email server connection failed: Error: Connection timeout
ETIMEDOUT
```

**Causa**: Timeout de conexión al servidor SMTP desde el contenedor.

### 3. Aplicación Funcionando Parcialmente
- Health checks: ✅ OK
- Servidor Express: ✅ Funcionando en puerto 3005
- Base de datos: ❌ ECONNREFUSED
- Email: ❌ Connection timeout
- Registro de usuarios: ❌ Falla por base de datos

## Análisis Técnico

### Base de Datos
La URL `postgres://postgres:hIJWL0kFomqH24jZ17CmV1OfacXyHhnd4idNwY7tyEhi2yWr4eXDtvGAnZlq2N9A@qcggssww444k4wc48kww8844:5432/postgres` parece ser una URL interna que no es accesible desde el contenedor Docker en Coolify.

### SMTP
El servidor `veloz.colombiahosting.com.co:465` no es accesible o hay restricciones de red.

## Soluciones Requeridas

### Para Base de Datos:
1. **Verificar URL pública**: Necesitas la URL pública de la base de datos
2. **Configurar whitelist**: Agregar IP de Coolify a la whitelist de la base de datos
3. **Usar servicio externo**: Como Neon, Supabase, o PostgreSQL público

### Para Email:
1. **Verificar conectividad**: Probar conexión SMTP desde el servidor
2. **Usar servicio alternativo**: Como SendGrid, Resend, o SMTP público
3. **Configurar firewall**: Permitir conexiones salientes en puerto 465

## Variables de Entorno a Actualizar

```bash
# Nueva URL de base de datos (necesaria)
DATABASE_URL=postgresql://nueva-url-publica-aqui

# Mantener estas
SESSION_SECRET=eb85b8d7a3c106ba3cfb6b9d8f3565a26c07530489728899ec9bc7a6bc855624a54d8690a2b97c145a4991cfc0224965fe2a56c3224f5702c1880ed181dd19ef
NODE_ENV=production
PORT=3000

# Email (verificar conectividad)
EMAIL_HOST=veloz.colombiahosting.com.co
EMAIL_PORT=465
EMAIL_USER=trivia@cubacoin.org
EMAIL_PASS=g@i*BJ{RZGmtA79]
```

## Próximos Pasos

1. **Obtener URL pública de base de datos**
2. **Probar conectividad SMTP**
3. **Actualizar variables en Coolify**
4. **Redeploy y verificar**

La aplicación está bien configurada, solo necesita URLs/credenciales accesibles desde el entorno de producción.