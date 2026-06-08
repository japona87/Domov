# Domov — Design System

> **Tesis visual:** "Oficina privada de primer nivel" — la estética de un despacho boutique de gestión de activos. Serio sin ser rígido, moderno sin ser una startup cualquiera.
>
> **Memorable:** Lo único que alguien debe recordar al ver Domov: **"Esto se ve serio y confiable."**

---

## Audiencias

| Audiencia | Contexto | Prioridades de diseño |
|-----------|----------|-----------------------|
| **Gestor (admin)** | Panel interno, desktop principalmente | Velocidad, densidad de información, claridad de estado |
| **Inquilino (público)** | Landing `/propiedades`, mobile 70% | Confianza, claridad de oferta, contacto fácil |

---

## Paleta de color

Uso del color como institución, no como decoración. Cada color tiene un rol específico.

### Tokens base

```css
--background: #FFFFFF          /* Superficie principal */
--surface:    #F8FAFC          /* Fondos de cards, sidebar */
--foreground: #0F172A          /* Texto principal (slate-900) */
--muted:      #64748B          /* Texto secundario (slate-500) */
--border:     #E2E8F0          /* Divisores (slate-200) */
```

### Paleta navy (autoridad)

```css
--navy-900: #151C2A   /* Footer, sidebar fondo oscuro, barra de stats */
--navy-800: #2A344E   /* Botón navy, hover de navy */
--navy-700: #3D4968
--navy-100: #E5E9F1
--navy-50:  #F2F4F8
```

### Acento — Lime (#90C74A)

**Regla de oro: el lime es una firma, no un relleno.** Usarlo en ≤4 contextos:

1. **Botones primarios** (`bg-accent text-accent-foreground`)
2. **Estado activo en sidebar** (`border-r-[3px] border-accent`)
3. **Borde superior de stat-cards positivos** (`border-t-3 border-accent`)
4. **Badge "Portada"** en gestión de fotos

En todo lo demás: slate/border/muted. La restricción es lo que hace que el lime se sienta intencional.

```css
--accent:      #90C74A   /* oklch(0.72 0.12 130) */
--accent-dark: #74A337   /* hover de botón primario */
--accent-fg:   #0F172A   /* texto sobre fondo lime */
```

### Semánticos

```css
--destructive: oklch(0.55 0.18 25)   /* #DC2626 — rojo error */
--warning:     #D97706               /* amber */
```

---

## Tipografía

Sistema dual: **serif en la landing pública** para institucion y permanencia, **sans en el admin** para velocidad y densidad de datos. Esta combinación es la principal diferenciación visual frente a portales competidores en Colombia (Metrocuadrado, Finca Raíz) que son 100% sans.

### Fuentes

| Rol | Fuente | Uso |
|-----|--------|-----|
| **Display / Headings públicos** | DM Serif Display | `h1`, `h2` en `/propiedades` y `/propiedades/[id]` |
| **Body y UI** | Plus Jakarta Sans | Todo lo demás — admin, forms, labels, cuerpo de texto público |
| **Números de datos** | Plus Jakarta Sans 700, tabular-nums | Precios, estadísticas, valores de contratos |

### Escala tipográfica

```
Display serif:    48px / line-height 1.15  — Landing h1
Heading serif:    32px / line-height 1.2   — Landing h2, nombre de propiedad en detalle
Admin title:      20px / weight 700        — Títulos de sección en admin
Subheading:       16px / weight 600
Body:             14px / weight 400 / lh 1.6
Label/UI:         12px / weight 600 / uppercase / tracking .08em
Caption:          11px / weight 500
```

### Configuración Next.js

```ts
// src/app/layout.tsx
import { DM_Serif_Display, Plus_Jakarta_Sans } from 'next/font/google'

const dmSerif = DM_Serif_Display({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-heading',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})
```

```css
/* globals.css — @theme inline */
--font-heading: var(--font-heading);   /* DM Serif Display */
--font-sans:    var(--font-sans);      /* Plus Jakarta Sans */
```

```html
<!-- Uso en landing -->
<h1 class="font-heading text-5xl">Tu próximo hogar, <em>sin complicaciones</em></h1>

<!-- Uso en admin -->
<h2 class="font-sans text-xl font-bold">Contratos activos</h2>
```

---

## Espaciado y radios

Sistema de 4px base (Tailwind default).

### Radios de borde

| Token Tailwind | Valor | Uso |
|---------------|-------|-----|
| `rounded-sm` | 6px | Chips pequeños, badges inline |
| `rounded-md` | 8px | Inputs, selects |
| `rounded-lg` | 10px | Botones, tooltips |
| `rounded-xl` | 14px | Botones grandes, stat cards |
| `rounded-2xl` | 16px | Cards, secciones |
| `rounded-3xl` | 22px | Modales, hero sections |
| `rounded-full` | 9999px | Badges de estado, chips de features |

### Densidad de espaciado

- **Admin panel:** más denso — `p-4 p-5` para contenido, `gap-3 gap-4` entre elementos
- **Landing pública:** más holgado — `py-10 py-16`, `gap-6 gap-8`, más respiro visual

---

## Sombras

Sombras mínimas, solo para crear jerarquía de elevación. Nunca decorativas.

```css
shadow-sm  → cards, sidebar items hover
shadow-md  → dropdowns, popovers
shadow-lg  → modales
```

---

## Movimiento

Deliberado y sin prisas. No hay animaciones bouncy — el software serio no hace piruetas.

```
Micro-interacciones:  150ms ease-out
Transiciones de page: 200ms ease
Entradas de modal:    200ms ease-out (scale 0.97 → 1 + opacity)
Salidas:              100ms ease-in
```

**Nunca animar:** width, height, padding (layout thrashing). Solo `transform` y `opacity`.

**Hover en cards de propiedades:**
```css
transition: box-shadow 150ms, transform 150ms;
hover: shadow-lg + translateY(-2px)
```

---

## Componentes clave

### Botones

```tsx
/* Primario — acento lime */
<button className="bg-accent text-accent-foreground font-medium text-sm rounded-xl px-4 py-2.5 hover:bg-accent/90 transition-colors">
  Guardar
</button>

/* Secundario */
<button className="border border-border bg-background text-foreground text-sm rounded-xl px-4 py-2.5 hover:bg-muted transition-colors">
  Cancelar
</button>

/* Peligro */
<button className="bg-destructive/10 text-destructive border border-destructive/20 text-sm rounded-xl px-4 py-2.5 hover:bg-destructive/15 transition-colors">
  Eliminar
</button>
```

### Badges de estado

```tsx
const variants = {
  active:  'bg-green-50 text-green-800',
  ending:  'bg-amber-50 text-amber-800',
  ended:   'bg-muted text-muted-foreground',
  pending: 'bg-blue-50 text-blue-800',
  paid:    'bg-green-50 text-green-800',
  cover:   'bg-accent text-accent-foreground',
  type:    'bg-muted text-muted-foreground border border-border',
}
// Tamaño: text-xs font-semibold px-2.5 py-0.5 rounded-full
```

### Stat cards (admin)

```tsx
/* Positivo (lime) */
<div className="border border-border rounded-xl p-5 bg-card border-t-[3px] border-t-accent">
  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disponibles</p>
  <p className="text-3xl font-bold text-green-700 mt-1">4</p>
</div>

/* Alerta (rojo) */
<div className="border border-border rounded-xl p-5 bg-card border-t-[3px] border-t-destructive">
  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pagos pendientes</p>
  <p className="text-3xl font-bold text-destructive mt-1">3</p>
</div>
```

### Sidebar (admin)

- Fondo blanco (`bg-background`), borde derecho sutil
- Item activo: `bg-accent/8 border-r-[3px] border-accent text-navy-900 font-semibold`
- Nav container: `pl-3 pr-0` — borde toca el edge del sidebar
- Logo: `w-9 h-9 rounded-lg bg-navy-50 border border-border`

### Hero de landing

```tsx
<h1 className="font-heading text-5xl md:text-6xl leading-tight text-foreground">
  Tu próximo hogar, <em>sin complicaciones</em>
</h1>
```

El `<em>` en la tipografía serif crea el momento de "craft" sin esfuerzo — italic serif sobre regular serif.

### Barra de stats (landing, fondo navy)

```tsx
<div className="bg-[#151C2A] py-10">
  <div className="flex divide-x divide-white/10">
    <div className="px-10 text-center">
      <p className="text-3xl font-bold text-accent">4</p>
      <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Disponibles</p>
    </div>
    {/* ... */}
  </div>
</div>
```

---

## Navegación pública

- Nav: `bg-white border-b border-border h-16 sticky top-0 z-50`
- Logo: imagen + wordmark "Domov" en `font-heading text-lg font-bold`
- CTA nav: `text-sm text-muted-foreground hover:text-foreground` → texto, no botón
- Footer: `bg-[#151C2A]` con texto `text-white/40` y links `hover:text-white/70`

---

## Filosofía de diseño — qué evitar

| ❌ Evitar | ✅ En su lugar |
|-----------|--------------|
| Lime en más de 4 contextos | Lime solo en CTAs, active nav, accent border, cover badge |
| Serif en el admin panel | Plus Jakarta Sans para todo el admin |
| Animaciones con bounce/spring | ease-out 150ms, sobrio |
| Gradientes decorativos | Fondos planos, max 1 sutil gradiente en hero si se justifica |
| Emojis como iconos | SVG icons (Lucide) |
| Centrado en todo | Alineado a la izquierda en listas y tablas |
| Z-index aleatorio | Escala: 0 / 10 / 20 / 40 / 100 / 1000 |

---

## Landing page — estructura y patrones (2025)

Actualizado 2026-06-06 con rediseño completo de `src/app/page.tsx`.

### Memorable thing
**"Esto es moderno y diferente."** Romper el patrón de portales colombianos. Layout asimétrico que ningún competidor usa.

### Estructura de secciones

1. **Nav glass** — `fixed`, `bg-[#151C2A]/90 backdrop-blur-md`, siempre visible
2. **Hero split-screen** — `grid md:grid-cols-[60%_40%]`. Izquierda: texto + stats inline. Derecha: `/hero.jpg` con overlay gradiente y floating badge
3. **Bento propiedades** — muestra 3 propiedades disponibles reales (Supabase); se adapta a 1 o 2 si hay menos. CTA card "Ver todas" solo si hay exactamente 3
4. **Stats bar** — `bg-[#151C2A]`, `AnimatedCounter` reutilizado de `/propiedades`
5. **Why Domov** — grid 2 columnas: feature list (no cards iguales) + testimonial card navy
6. **CTA final** — `background: #050505`, radial gradient lime, máximo contraste
7. **Footer** — `bg-[#151C2A]`, 3 columnas
8. **WhatsApp float** — fijo bottom-right, mismo que `/propiedades`

### Riesgos intencionales aplicados
- Hero asimétrico 60/40 — ningún portal colombiano lo usa
- Propiedades visibles sin hacer scroll — diferencia clave vs. competencia
- CTA final en negro puro #050505 — contraste máximo con lime

### Patrones de código landing

```tsx
// Fetch: propiedades publicadas (limit 4, filtrar disponibles) + count total
const [{ data: propertiesRaw }, { data: activeContracts }, { count: totalPublished }] = await Promise.all([...])

// Cast Supabase never type para activeContracts
const occupiedSet = new Set(((activeContracts ?? []) as { property_id: string }[]).map((c) => c.property_id))

// Bento grid responsive
className={`grid gap-4 ${available.length === 1 ? 'grid-cols-1 max-w-md' : available.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr]'}`}
```

### Animaciones landing

```css
/* En globals.css ya existe fadeInUp */
style={{ animation: 'fadeInUp 0.6s ease both 0.1s' }}   /* section header */
style={{ animation: 'fadeInUp 0.6s ease both 0.25s' }}  /* grid / content */
```

---

## Investigación competitiva (resumen)

Consultado 2026-05-30 y 2026-06-06.

- **Metrocuadrado** (2.18M visitas/mes): catálogo de listings, azul/naranja, 100% sans, genérico
- **Finca Raíz** (2.18M visitas/mes): similar, formulario pesado, mobile-first
- **Compass**: full-bleed hero, propiedades visibles en primer scroll, nav minimalista — referencia directa
- **Buildium/AppFolio**: blanco + azul, sidebar izquierda, dashboards funcionales pero sin personalidad de marca
- **Oportunidad EUREKA:** todos asumen que el usuario quiere buscar entre miles. Domov tiene ~49 propiedades curadas — la ventaja es curaduría y confianza, no cantidad. Un diseño que lo comunica ya diferencia radicalmente.

**Domov se posiciona en el gap:** moderno y diferente, con layout asimétrico que rompe el patrón del sector y propiedades visibles desde el primer viewport.

---

*Última actualización: 2026-06-06 · Aplicado por: design-consultation skill*
