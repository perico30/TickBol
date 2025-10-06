# 🧪 GUÍA DE TESTING - Wizard de Eventos

## 📋 PREPARACIÓN PARA LA PRUEBA

### 1. Credenciales de Acceso
- **Admin**: admin@eventosdisc.com / admin123
- **Business Usuario**: Usar las credenciales que se generaron al crear un negocio

### 2. Crear Negocio de Prueba (si no existe)
1. Login como admin → `/admin`
2. Gestionar Negocios → Agregar Negocio
3. Datos ejemplo:
   - Nombre: "Club Nocturno Paradiso"
   - Email: "info@paradiso.bo"
   - Teléfono: "78005026"
   - Dirección: "Av. Montes 123, Santa Cruz"

## 🎯 FLUJO COMPLETO DE TESTING

### PASO 1: LOGIN COMO NEGOCIO
1. Ir a `/login`
2. Usar credenciales del negocio creado
3. Verificar redirección a `/dashboard`
4. Click en "Wizard de Eventos"

---

### PASO 1: INFORMACIÓN BÁSICA
**Campos a completar:**

```
📝 DATOS EJEMPLO:
• Título: "Noche Electrónica - Año Nuevo 2025"
• Descripción: "La mejor fiesta electrónica para recibir el año nuevo con los mejores DJs internacionales, bebidas premium y un ambiente único en Santa Cruz."
• Fecha: 2025-01-01 (o cualquier fecha futura)
• Hora: 22:00
• Ubicación: Club Nocturno Paradiso (se llena automático)
• Ciudad: Santa Cruz
• Imagen: Usar URL de ejemplo o subir imagen
```

**URLs de Imagen de Ejemplo:**
- `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800`
- `https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800`

---

### PASO 2: SECTORES Y PRECIOS
**Configurar 3 sectores ejemplo:**

```
🏷️ SECTOR 1 - VIP:
• Nombre: "Zona VIP"
• Color: #FF6B6B (rojo)
• Capacidad: 50
• Tipo de Precio: Por mesa
• Precio Base: 800

🏷️ SECTOR 2 - GENERAL:
• Nombre: "Pista General"
• Color: #4ECDC4 (turquesa)
• Capacidad: 200
• Tipo de Precio: Por persona
• Precio Base: 150

🏷️ SECTOR 3 - TERRAZA:
• Nombre: "Terraza Lounge"
• Color: #45B7D1 (azul)
• Capacidad: 80
• Tipo de Precio: Por mesa
• Precio Base: 500
```

---

### PASO 3: CONDICIONES Y COMBOS
**Condiciones de Reserva ejemplo:**

```
📋 CONDICIÓN 1:
• Descripción: "Mesas VIP requieren mínimo 4 personas"
• Mín. por mesa: 4
• Máx. por mesa: 8
• Pago adelantado: 50%

📋 CONDICIÓN 2:
• Descripción: "Entrada general incluye 1 trago de bienvenida"
• Política cancelación: "48 horas antes del evento"
```

**Combos ejemplo:**

```
🍾 COMBO 1 - CUMPLEAÑOS:
• Nombre: "Paquete Cumpleañero"
• Descripción: "Botella de whisky + torta + decoración"
• Precio: 650
• Stock: 20
• Tipo: cumple
• Sectores: Solo VIP

🍹 COMBO 2 - TRAGOS:
• Nombre: "Barra Libre Premium"
• Descripción: "Tragos ilimitados por 3 horas"
• Precio: 280
• Stock: 100
• Tipo: tragos
• Sectores: Todos
```

---

### PASO 4: CROQUIS/MAPA DE ASIENTOS
**Elementos a agregar:**

```
🗺️ ELEMENTOS DEL MAPA:
• Agregar 5-8 mesas en zona VIP (capacidad 6-8 personas)
• Agregar área de pista (sector general)
• Agregar bar principal
• Agregar baños
• Agregar escenario/DJ booth
• Agregar entrada principal

💡 TIP: Usar diferentes colores para cada sector
```

---

### PASO 5: CONTACTO Y PAGOS
**Información de contacto:**

```
📞 CONTACTO:
• Teléfono: 78005026
• WhatsApp: 78005026 (o diferente si se desea)
```

**Información de pagos:**

```
💳 PAGOS:
• QR: Subir imagen QR o usar URL ejemplo
• Instrucciones:
"1. Escanea el código QR con la app de tu banco
2. Realiza la transferencia por el monto exacto
3. Envía el comprobante de pago por WhatsApp
4. Recibirás la confirmación en máximo 30 minutos"
```

**URL QR de Ejemplo:**
```
https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=400&h=400
```

---

## ✅ VERIFICACIONES FINALES

### Antes de Crear:
1. ✅ Vista previa del evento
2. ✅ Todos los campos obligatorios completados
3. ✅ Al menos 1 sector configurado
4. ✅ Información de contacto válida
5. ✅ Instrucciones de pago claras

### Después de Crear:
1. ✅ Mensaje: "¡Evento creado exitosamente!"
2. ✅ Redirección al dashboard
3. ✅ Evento aparece en lista (estado: pendiente)
4. ✅ Admin puede ver evento en panel admin

---

## 🚨 ERRORES COMUNES A VERIFICAR

### ❌ Si aparece error:
- Verificar que todos los campos requeridos estén llenos
- Verificar conexión a Supabase
- Revisar console del navegador para errores JavaScript
- Verificar que el usuario esté loggeado correctamente

### ❌ Si el wizard no avanza:
- Verificar validaciones de cada paso
- Asegurar que al menos 1 sector esté configurado
- Verificar que fecha sea futura
- Confirmar formato de hora correcto (HH:MM)

---

## 📊 RESULTADO ESPERADO

Al completar exitosamente:
1. **Evento guardado** en base de datos
2. **Estado**: "pending" (pendiente aprobación)
3. **Visible para admin** en panel de eventos
4. **Dashboard business** muestra evento creado
5. **No visible públicamente** hasta aprobación admin

## 🎯 DATOS RÁPIDOS PARA COPY-PASTE

```
Título: Noche Electrónica - Año Nuevo 2025
Descripción: La mejor fiesta electrónica para recibir el año nuevo con los mejores DJs internacionales, bebidas premium y un ambiente único en Santa Cruz.
Fecha: 2025-01-01
Hora: 22:00
Ciudad: Santa Cruz
Imagen: https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800

Sector VIP: Zona VIP, #FF6B6B, 50, Por mesa, 800
Sector General: Pista General, #4ECDC4, 200, Por persona, 150

Teléfono: 78005026
Instrucciones: 1. Escanea el código QR con la app de tu banco\n2. Realiza la transferencia por el monto exacto\n3. Envía el comprobante de pago por WhatsApp\n4. Recibirás la confirmación en máximo 30 minutos
```
