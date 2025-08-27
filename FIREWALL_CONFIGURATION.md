# 🔥 Configuración de Firewall para Coolify

## Puertos y Conexiones Requeridas

### 1. Base de Datos PostgreSQL
```bash
# Puerto estándar PostgreSQL
Puerto: 5432
Protocolo: TCP
Tipo: Conexiones SALIENTES desde Coolify
Destino: Tu servidor de base de datos
```

### 2. Servidor SMTP (veloz.colombiahosting.com.co)
```bash
# SMTP con SSL/TLS
Puerto: 465
Protocolo: TCP
Tipo: Conexiones SALIENTES desde Coolify
Host: veloz.colombiahosting.com.co
```

### 3. DNS y Resolución
```bash
# Para resolver nombres de dominio
Puerto: 53
Protocolo: UDP/TCP
Tipo: Conexiones SALIENTES
Destino: Servidores DNS (8.8.8.8, 1.1.1.1)
```

### 4. HTTPS para APIs externas
```bash
# Para servicios web externos
Puerto: 443
Protocolo: TCP
Tipo: Conexiones SALIENTES
```

## Configuración Específica por Servicio

### En tu Servidor de Base de Datos:
1. **Permitir conexiones desde la IP de Coolify**
2. **Puerto 5432 abierto**
3. **SSL habilitado (recomendado)**

### En tu Servidor SMTP (veloz.colombiahosting.com.co):
1. **Puerto 465 (SMTPS) abierto**
2. **Autenticación SMTP habilitada**
3. **Permitir conexiones desde IPs externas**

## IP del Servidor SMTP
Para obtener la IP exacta de veloz.colombiahosting.com.co:

```bash
# Desde tu servidor o terminal
nslookup veloz.colombiahosting.com.co
# o
dig veloz.colombiahosting.com.co +short
```

## Reglas de Firewall Sugeridas

### Para iptables (Linux):
```bash
# Permitir conexiones salientes a PostgreSQL
iptables -A OUTPUT -p tcp --dport 5432 -j ACCEPT

# Permitir conexiones salientes SMTP
iptables -A OUTPUT -p tcp --dport 465 -j ACCEPT

# DNS
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT

# HTTPS
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT
```

### Para UFW (Ubuntu):
```bash
# Permitir salientes
ufw allow out 5432/tcp
ufw allow out 465/tcp
ufw allow out 53
ufw allow out 443/tcp
```

## Testing de Conectividad

### Desde el servidor de Coolify, probar:
```bash
# Test PostgreSQL
telnet tu-servidor-db 5432

# Test SMTP
telnet veloz.colombiahosting.com.co 465

# Test DNS
nslookup veloz.colombiahosting.com.co
```

## Problemas Comunes

### Si sigue fallando:
1. **Verificar que tu proveedor de hosting permita conexiones salientes**
2. **Contactar soporte de Coolify para conocer sus IPs**
3. **Usar servicios cloud con IPs públicas conocidas (Neon, SendGrid)**

### Alternativas si el firewall es muy restrictivo:
- **Base de datos**: Neon.tech, Supabase (URLs públicas)
- **Email**: SendGrid, Resend, Gmail SMTP (servicios confiables)

## Información para el Administrador de Red

Tu aplicación necesita hacer conexiones salientes a:
- **Base de datos PostgreSQL** (puerto 5432)
- **Servidor SMTP** (puerto 465)  
- **Servicios DNS** (puerto 53)
- **APIs HTTPS** (puerto 443)

Todas son conexiones **SALIENTES** desde el contenedor Docker de Coolify.