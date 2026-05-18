# Sistema de Gestión Inmobiliaria — Documento de Diseño

**Fecha:** 2026-05-18
**Proyecto:** Domov
**Estado:** Aprobado para implementación

---

## 1. Contexto y Objetivo

Inmobiliaria en Colombia que administra arrendamientos de ~49 inmuebles. Actualmente opera con procesos manuales (papel, WhatsApp). El objetivo es migrar a una plataforma digital centralizada que sea económica, simple de mantener y escalable.

**Restricciones clave:**
- Lo mantiene el propio dueño del negocio (sin equipo técnico)
- Costo operativo mínimo
- Cumplimiento normativa colombiana (DNPM, plazos legales de arrendamiento)
- Coordinación con aseguradora Suramericana es manual (externa al sistema)

---

## 2. Stack Técnico

| Componente | Tecnología | Justificación |
|---|---|---|
| Frontend + API | Next.js (App Router) | Ya existe el proyecto Domov |
| Base de datos | Supabase (PostgreSQL) | Gestionado, sin servidor que administrar |
| Autenticación | Supabase Auth | Incluido, soporta RBAC |
| Almacenamiento | Supabase Storage | Documentos y fotos de inmuebles |
| Hosting | Vercel (gratuito) | Despliegue automático desde GitHub |
| Dominio | domov.co | Ya existe con cPanel (correos se mantienen en cPanel) |

**Costo estimado:** $0/mes en plan gratuito para escala actual (49 inmuebles).

---

## 3. Arquitectura General

```
domov.co (cPanel - solo correos)
app.domov.co → Vercel → Next.js
                              ├── /app/(admin)/     → Portal Administrador
                              ├── /app/(tenant)/    → Portal Arrendatario
                              ├── /app/propiedades/ → Landing pública
                              └── /app/api/         → API Routes

                         Supabase
                              ├── PostgreSQL (base de datos)
                              ├── Auth (login + RBAC)
                              └── Storage (documentos + fotos)
```

**Dos roles de acceso:**
- **Admin:** acceso completo al sistema
- **Arrendatario:** acceso solo a su portal personal (vinculado a su contrato)

---

## 4. Modelo de Datos

### 4.1 Diagrama ER
Archivo: `docs/modelo-datos-inmobiliaria.excalidraw`

### 4.2 Tablas

**owners** — Propietarios de inmuebles
```
id (PK), full_name, document_number, phone, email, created_at
```

**property_owners** — Co-propiedad (N:M entre owners y properties)
```
id (PK), property_id (FK), owner_id (FK), ownership_pct, created_at
```
> Un inmueble puede tener 1 o más propietarios con porcentaje de propiedad (ej. 50%/50%)

**properties** — Inmuebles
```
id (PK), name, address, type, description,
features (JSONB),     ← características dinámicas: {bedrooms, bathrooms, area_sqm, ...}
is_published,         ← visible en landing pública
created_at
```
> `features` usa JSONB para flexibilidad: un local no tiene dormitorios, un garaje tiene dimensiones, etc.

**property_photos** — Fotos de inmuebles (1:N con properties)
```
id (PK), property_id (FK), photo_url, is_cover, sort_order, created_at
```

**tenants** — Arrendatarios
```
id (PK), user_id (FK → Supabase Auth), full_name, document_number,
phone, email, created_at
```

**contracts** — Contratos (tabla central)
```
id (PK),
property_id (FK), tenant_id (FK),
start_date, end_date,
monthly_rent,           ← canon mensual
administration_fee,     ← cuota de administración
ipc_rate,               ← % IPC vigente al crear el contrato
status,                 ← active | ending | ended | cancelled
termination_reason,     ← non_renewal_admin | non_renewal_tenant | renewed | null
termination_notice_date,← fecha en que se notificó la no renovación
ended_at,
notes, created_at
```

**payments** — Pagos por contrato
```
id (PK), contract_id (FK), amount, due_date, paid_date,
status,        ← pending | paid | overdue
receipt_url,   ← comprobante en Supabase Storage
notes, created_at
```

**documents** — Documentos del contrato
```
id (PK), contract_id (FK), type, file_url, uploaded_by, created_at
```

**insurance_policies** — Pólizas de seguro vinculadas al contrato
```
id (PK), contract_id (FK), insurer_id (FK),
policy_number, monthly_cost, start_date, end_date, created_at
```
> La póliza dura lo mismo que el contrato

**insurers** — Aseguradoras (ej. Suramericana)
```
id (PK), name, contact_name, phone, email, created_at
```

**system_config** — Configuración global del sistema
```
id (PK), year,
ipc_rate,             ← % IPC del año (afecta canon)
min_wage_increase,    ← % aumento salario mínimo (afecta administración)
renewal_notice_days,  ← días de anticipación para alertar vencimiento (ej. 120)
updated_at
```

---

## 5. Módulos del Sistema

### M1. Autenticación
- Login para admin y arrendatario (emails distintos)
- RBAC: admin ve todo, arrendatario solo ve su portal
- Recuperación de contraseña vía email

### M2. Gestión de Propiedades
- CRUD de inmuebles con características dinámicas (JSONB)
- Gestión de propietarios y co-propiedad (%)
- Subida de fotos (Supabase Storage)
- Toggle `is_published` para controlar visibilidad en landing pública
- Dashboard de ocupación: vista de todos los inmuebles con estado (libre/ocupado)

### M3. Gestión de Contratos
- Vinculación de arrendatario a inmueble
- Subida de documentos del contrato
- Asignación de póliza de seguro (opcional)
- Gestión de vencimientos con alertas configurables
- Flujo de renovación con cálculo automático de nuevos valores
- Flujo de no renovación con generación de carta formal
- Registro de carta de no renovación del inquilino

### M4. Gestión de Pagos
- Registro manual de pagos por el admin
- Subida de comprobante (foto/PDF)
- Estado por cuota: pendiente / pagado / vencido
- Historial completo por contrato
- Calendario de pagos generado automáticamente al crear el contrato

### M5. Portal del Arrendatario
- Mis pagos y comprobantes descargables
- Calendario de próximos pagos
- Estado de mi contrato (días para vencimiento, fecha renovación)
- Datos de cuenta bancaria para transferencias
- Preguntas frecuentes
- Notificaciones (recordatorios de pago, cambios de canon)

### M6. Configuración del Sistema
- IPC anual (%)
- % Aumento salario mínimo
- Días de preaviso para alertas de vencimiento (default: 120)
- Parámetros actualizables por año

### M7. Landing Page Pública
- Vista pública sin login: `domov.co/propiedades`
- Muestra solo inmuebles con `is_published = true` y sin contrato activo
- Fotos, características, precio de arriendo
- Información de contacto del admin
- Link compartible con interesados

---

## 6. Flujos Principales

### Flujo 1: Vinculación de nuevo arrendatario
1. Admin crea el tenant en el sistema
2. Admin crea el contrato (inmueble, fechas, canon, administración)
3. Admin sube documentos requeridos
4. Admin asigna póliza de seguro (opcional)
5. Admin confirma → contrato queda `active`
6. Sistema genera calendario de pagos automáticamente
7. Arrendatario recibe invitación por email para acceder a su portal

### Flujo 2: Registro de pago mensual
1. Admin recibe comprobante (actualmente por WhatsApp)
2. Admin entra al sistema → busca el contrato
3. Registra el pago + sube el comprobante
4. Cuota cambia de `pending` a `paid`
5. Arrendatario ve el pago reflejado en su portal

### Flujo 3: Actualización anual de canon (Colombia)
1. Admin entra a Configuración → ingresa valores del año:
   - IPC % (afecta `monthly_rent`)
   - % Salario mínimo (afecta `administration_fee`)
2. Admin selecciona contratos a reajustar
3. Sistema muestra vista previa con valores antes/después por contrato
4. Admin confirma → contratos actualizados
5. Notificación enviada a cada arrendatario con el nuevo valor

### Flujo 4A: Vencimiento — Admin no renueva
1. Sistema alerta al admin cuando faltan `renewal_notice_days` días
2. Admin decide "no renovar"
3. Sistema genera carta formal con literales legales
4. Admin revisa y confirma el envío
5. Contrato cambia a status `ending`
6. En fecha de entrega → admin confirma recepción → contrato pasa a `ended`

### Flujo 4B: Vencimiento — Inquilino no renueva
1. Inquilino entrega carta física al admin
2. Admin registra en el sistema: sube la carta + ingresa fecha
3. Sistema calcula: fecha_carta + 90 días = fecha de entrega
4. Contrato cambia a status `ending`
5. Dashboard muestra fecha estimada de entrega
6. Admin confirma entrega → contrato pasa a `ended`

### Flujo 4C: Renovación
1. Admin decide renovar el contrato
2. Sistema calcula nuevos valores automáticamente:
   - Nuevo canon = monthly_rent × (1 + IPC%)
   - Nueva admin = administration_fee × (1 + % salario mínimo)
3. Admin ve vista previa y confirma
4. Contrato anterior pasa a `ended`
5. Nuevo contrato creado con duración de 1 año y nuevos valores

---

## 7. Principios de Seguridad y UX

### Confirmación obligatoria
Toda acción irreversible requiere confirmación explícita antes de ejecutarse:
- Registrar / editar pago
- Actualizar canon (con vista previa antes/después)
- Terminar contrato
- Eliminar documento o foto
- Crear / editar contrato
- Asignar o remover póliza

### Seguridad
- Autenticación gestionada por Supabase Auth
- RBAC estricto: arrendatario solo accede a sus propios datos
- Cumplimiento DNPM (protección de datos Colombia)
- Encriptación en tránsito (HTTPS vía Vercel)
- Backups automáticos de Supabase

### Trazabilidad
- El historial de contratos se preserva (status `ended`, nunca se eliminan)
- `termination_reason` registra quién inició la terminación
- Pagos y documentos permanecen ligados al contrato histórico

---

## 8. Fases Futuras (fuera del alcance actual)

- Bot de WhatsApp para que el arrendatario suba comprobantes
- Integración directa con Suramericana (API)
- Módulo de gestión de impuestos prediales (ya se tiene el CSV base)
- Notificaciones automáticas por WhatsApp
