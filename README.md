# Domov

**Panel de administración para gestión de arrendamientos.** Plataforma completa para administrar propiedades, contratos, pagos, propietarios e inquilinos con portales independientes para cada rol.

---

## Funcionalidades

### Panel administrador (`/admin`)
- **Dashboard** con indicadores clave: propiedades disponibles, contratos activos, próximos vencimientos, pagos pendientes del mes
- **Propiedades** — CRUD completo, fotos con portada, toggle publicado/no publicado, mapa embebido, características dinámicas por tipo
- **Propietarios** — CRUD + asociación de propiedades con porcentaje de copropiedad
- **Arrendatarios** — CRUD con validación de documentos, bloqueo de eliminación si tiene contratos activos
- **Contratos** — CRUD, generación automática de filas de pago mes a mes, flujo de terminación (preaviso → finalizado), edición, adendas
- **Adendas** — Modificaciones a contratos con versión, aumento de canon, IPC, administración; generación de PDF
- **Pagos** — Registro de pago con recibo, estados (pendiente/pagado/vencido), calendario de pagos
- **Documentos** — Carga y gestión de documentos por contrato (PDF, imágenes)
- **Auditoría** — Registro cronológico de todas las operaciones CRUD con filtros, paginación, detalle expandible de cambios, exportación CSV
- **Configuración del sistema** — IPC anual, aumento de salario mínimo, días de preaviso; gestión de almacenamiento (Storage) con limpieza de archivos huérfanos

### Portal inquilino (`/tenant`)
- Dashboard con resumen de contrato y próximo pago
- Vista detallada del contrato vigente
- Historial y calendario de pagos

### Portal propietario (`/owner`)
- Dashboard con propiedades asociadas
- Vista detallada de cada propiedad

### Sitio público (`/propiedades`)
- Listado de propiedades publicadas con búsqueda y filtros
- Página de detalle con galería de fotos, mapa y características
- Landing page con hero asimétrico, bento grid de propiedades, barra de estadísticas

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16.2.6 (App Router, Turbopack) |
| **Lenguaje** | TypeScript 5.9 |
| **UI** | Tailwind CSS 4 + shadcn/ui (base-nova) |
| **Fuentes** | DM Serif Display (headings públicos), Plus Jakarta Sans (body y admin) |
| **Base de datos** | Supabase (PostgreSQL) con Row Level Security |
| **Autenticación** | Supabase Auth con SSR (cookie-based) |
| **Almacenamiento** | Supabase Storage (fotos públicas, documentos y recibos privados) |
| **Formularios** | React Hook Form + Zod |
| **PDF** | pdf-lib (generación de adendas) |
| **Iconos** | Lucide React |
| **Notificaciones** | Sonner (toast) |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (admin)/admin/          # Panel administrador (7 módulos)
│   ├── (auth)/login/           # Autenticación
│   ├── (owner)/owner/          # Portal propietario
│   ├── (tenant)/tenant/        # Portal inquilino
│   ├── propiedades/            # Sitio público
│   └── layout.tsx              # Layout raíz (fuentes, providers)
├── components/
│   ├── ui/                     # shadcn/ui primitivas
│   ├── admin/                  # Componentes del panel admin
│   ├── contracts/              # Gestión de contratos
│   ├── properties/             # Gestión de propiedades
│   ├── owners/                 # Gestión de propietarios
│   └── tenants/                # Gestión de inquilinos
├── lib/
│   ├── actions/                # Server actions (12 archivos)
│   ├── supabase/               # Clientes Supabase (browser, server, admin)
│   ├── audit.ts                # Instrumentación de auditoría
│   ├── crypto.ts               # Cifrado
│   └── utils.ts                # cn() y utilidades
├── proxy.ts                    # Middleware de autenticación y roles
└── types/database.ts           # Tipos de Supabase

supabase/migrations/            # Migraciones (001-014)
```

---

## Inicio rápido

### Requisitos

- Node.js 20+
- npm
- Proyecto Supabase activo

### Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PASSWORD_ENCRYPTION_KEY=64-char-hex-string
```

### Instalación

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Migraciones

Ejecutar las migraciones de Supabase en orden (`supabase/migrations/001_initial_schema.sql` a `014_contract_amendments.sql`).

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |

---

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| **admin** | Panel completo /admin, CRUD de todo |
| **tenant** | Portal /tenant, solo lectura de su contrato y pagos |
| **owner** | Portal /owner, solo lectura de sus propiedades asociadas |

El middleware en `src/proxy.ts` protege las rutas por rol. La base de datos aplica Row Level Security (RLS) como segunda capa.

---

## Arquitectura de seguridad

- **Autenticación:** Supabase SSR con cookies HttpOnly
- **Autorización:** Middleware por ruta + RLS en PostgreSQL
- **Server Actions:** Validación de rol antes de cada operación
- **Auditoría:** Todas las operaciones CRUD se registran con timestamp, usuario, entidad y cambios
- **Archivos:** Storage con buckets públicos (fotos) y privados (documentos, recibos)

---

## Licencia

Privado — uso interno.
