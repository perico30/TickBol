# 🚀 Guía de Deploy en Vercel - EventosDiscos

## 📋 Pre-requisitos

Antes de hacer deploy, asegúrate de:

1. ✅ **Esquema SQL ejecutado** en Supabase
2. ✅ **Base de datos funcionando** con admin creado
3. ✅ **Variables de entorno** configuradas
4. ✅ **Proyecto testeado** localmente

---

## 🎯 **Opción 1: Deploy Directo desde Vercel Dashboard**

### 1. **Acceder a Vercel**
- Ve a https://vercel.com
- Inicia sesión con GitHub/Google
- Click en "New Project"

### 2. **Conectar Repositorio**
- **Import Git Repository**
- Autoriza acceso a GitHub si es necesario
- Selecciona el repositorio del proyecto
- Click en "Import"

### 3. **Configurar el Proyecto**
```bash
Project Name: eventosdisc-platform
Framework Preset: Next.js
Root Directory: ./
Build Command: bun run build
Output Directory: .next
Install Command: bun install
```

### 4. **Variables de Entorno**
En la sección "Environment Variables", agregar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gtqydwhbzcnhltkgzpzd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

### 5. **Deploy**
- Click en "Deploy"
- Esperar 2-3 minutos
- ✅ **¡Proyecto en vivo!**

---

## 🎯 **Opción 2: Deploy con Vercel CLI**

### 1. **Instalar Vercel CLI**
```bash
bun add -g vercel
```

### 2. **Login**
```bash
vercel login
```

### 3. **Deploy desde el proyecto**
```bash
cd discoteca-events
vercel --prod
```

### 4. **Configurar variables**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Pegar: https://gtqydwhbzcnhltkgzpzd.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Pegar: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add NODE_ENV
# Pegar: production
```

---

## 🌐 **Configurar Dominio Personalizado**

### 1. **En Vercel Dashboard**
- Ve a tu proyecto deployado
- Click en "Settings" → "Domains"
- Click en "Add Domain"

### 2. **Opciones de Dominio**

**🆓 Subdominio gratuito de Vercel:**
```
eventosdisc.vercel.app
eventosdisc-platform.vercel.app
bolivia-eventos.vercel.app
```

**💰 Dominio personalizado:**
```
eventosdisc.com
eventosdisc.bo
tudominio.com
```

### 3. **Configurar DNS** (para dominio personalizado)
En tu proveedor de dominio (GoDaddy, Namecheap, etc.):

```dns
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.61
```

---

## 🔒 **SSL Automático**

Vercel incluye **SSL automático** para todos los proyectos:
- ✅ **HTTPS habilitado** por defecto
- ✅ **Certificado renovado** automáticamente
- ✅ **HTTP redirige** a HTTPS
- ✅ **Compatible** con dominios personalizados

---

## ⚡ **Optimizaciones de Performance**

### 1. **Configuración automática de Vercel:**
- ✅ **CDN global** con 100+ regiones
- ✅ **Edge caching** inteligente
- ✅ **Compresión** automática
- ✅ **Image optimization** incluida
- ✅ **Static file serving** optimizado

### 2. **Verificaciones incluidas:**
- ✅ **Core Web Vitals** monitoring
- ✅ **Performance analytics**
- ✅ **Error tracking**
- ✅ **Real User Monitoring**

---

## 📊 **Monitoreo y Analytics**

### 1. **Vercel Analytics** (incluido)
- Visitas y usuarios únicos
- Performance metrics
- Core Web Vitals
- Geolocalización de usuarios

### 2. **Logs y Debugging**
- Function logs en tiempo real
- Error tracking automático
- Deploy logs detallados
- Runtime metrics

---

## 🔄 **Deploy Automático**

### 1. **Git Integration**
Vercel detecta automáticamente:
- ✅ **Push a main/master** → Deploy a producción
- ✅ **Pull requests** → Preview deployments
- ✅ **Branch deployments** → Testing environments

### 2. **Preview Deployments**
```
Cada PR genera URL única:
https://eventosdisc-git-feature-branch.vercel.app
```

---

## 🛠️ **Configuración Avanzada**

### 1. **Build Settings**
```json
// vercel.json ya configurado con:
{
  "buildCommand": "bun run build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/**": {
      "maxDuration": 30
    }
  }
}
```

### 2. **Security Headers**
```json
// Headers ya configurados:
"X-Frame-Options": "DENY",
"X-Content-Type-Options": "nosniff",
"Referrer-Policy": "origin-when-cross-origin"
```

---

## 🎯 **URLs de Resultado**

### **Producción:**
```
https://eventosdisc.vercel.app
https://tudominio.com (si configuraste dominio)
```

### **Paneles principales:**
```
https://tudominio.com/admin
https://tudominio.com/dashboard
https://tudominio.com/porteria
https://tudominio.com/login
```

### **Credenciales iniciales:**
```
Email: admin@eventosdisc.com
Password: admin123
```

---

## 🔧 **Troubleshooting**

### **Error: Build Failed**
```bash
# Verificar en local:
bun run build

# Si falla, arreglar errores y hacer commit:
git add .
git commit -m "Fix build errors"
git push
```

### **Error: Variables de entorno**
```bash
# Verificar en Vercel Dashboard:
Settings → Environment Variables

# O con CLI:
vercel env ls
```

### **Error: Database connection**
```bash
# Verificar Supabase URL y keys
# Verificar que el esquema SQL esté ejecutado
# Verificar desde Functions → Logs en Vercel
```

---

## 🎉 **¡Deploy Exitoso!**

Una vez completado el deploy:

1. ✅ **Verifica que el sitio carga**
2. ✅ **Login con credenciales de admin**
3. ✅ **Crea un negocio de prueba**
4. ✅ **Crea un evento de prueba**
5. ✅ **Aprueba el evento**
6. ✅ **Verifica que aparece en homepage**

---

## 📈 **Próximos Pasos**

### **Inmediato:**
- 🔧 **Configurar dominio personalizado**
- 📊 **Configurar analytics**
- 🛡️ **Review de seguridad**

### **Corto plazo:**
- 💳 **Integrar pasarelas de pago**
- 📧 **Sistema de emails**
- 📱 **Optimización móvil**

### **Largo plazo:**
- 🤖 **AI features**
- 📊 **Advanced analytics**
- 🌍 **Multi-región**

---

**🚀 ¡EventosDiscos en producción y listo para conquistar el mercado!**
