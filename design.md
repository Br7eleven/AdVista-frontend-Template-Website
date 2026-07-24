# AdVista Rewards — Design System

> Documenting the visual language, component patterns, and animation approach established across Login, Register, and ForgotPassword — and how to apply them consistently to the Dashboard and remaining app pages.

---

## Brand Identity

| Role | Value |
|------|-------|
| **Brand name** | AdVista Rewards |
| **Tagline** | Earn rewards by watching ads |
| **Accent / CTA** | `#E60023` (royal crimson) |
| **Primary font** | Sora (Google Fonts) — weights 400, 500, 600, 700 |
| **Body copy** | Sora 14–16px, weight 400–500 |

---

## Color System

Three layers: **canvas → surface → element**, each with light and dark values.

### Light Mode
```css
--pin-canvas:  #f4f2f3   /* page background — warm off-white */
--pin-surface: #ffffff   /* cards, panels */
--pin-element: #f3f4f6  /* chips, badges, inside-card elements */
--pin-text:    #111827   /* primary text */
--pin-muted:   #6b7280   /* labels, placeholders, secondary copy */
--pin-accent:  #e60023   /* buttons, links, focus rings */
--pin-border:  rgba(15,15,20, 0.08)
```

### Dark Mode
```css
--pin-canvas:  #121214   /* near-black */
--pin-surface: #1a1b20   /* card surfaces */
--pin-element: #252830   /* chips, badges */
--pin-text:    #ffffff   /* primary text */
--pin-muted:   #9ba3b2   /* secondary text */
--pin-accent:  #e60023   /* same crimson — feels brighter against dark */
--pin-border:  rgba(255,255,255, 0.1)
```

Dark mode is toggled by adding/removing the `dark` class on `<html>`. All components respond to `html:not(.dark)` vs `html.dark`.

### Status Colors
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Error | `#b91c1c` bg `rgba(254,226,226,0.6)` | `#fca5a5` bg `rgba(127,29,29,0.3)` | Form errors, auth alerts |
| Success | `#15803d` | `#86efac` | Positive feedback |
| Warning | `#92400e` | `#fcd34d` | Cautions |

---

## Typography Scale

| Style | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| Display | 24px | 700 | 1.2 | Page titles (`h1`) |
| Heading | 20px | 600 | 1.3 | Section headers (`h2`) |
| Body | 14–16px | 400–500 | 1.5 | Paragraphs, labels |
| Small | 13px | 500 | 1.4 | Secondary labels, metadata |
| Caption | 11–12px | 600 | 1.3 | Legal copy, dividers |

**Mobile typography** — reduce display/heading by ~20% (e.g. `text-2xl` → `text-xl`) and card padding from `1.75rem` → `1.25rem`.

---

## Layout System

### Auth Pages (complete pattern)
```
<div className="auth-layout">          ← flex-col, min-h-100dvh, overflow-anchor:none
  <AuthBackground />                   ← fixed, full-screen animated orbs
  <ThemeToggle compact />              ← top-right, zIndex 10
  <div className="auth-scroll">        ← flex:1, overflow-y:auto, pb-safe-area
    <GlassCard>                        ← centered, max-w-[420px]
      <div ref={formRef}>              ← GSAP scope root
        {/* .auth-field elements staggered in */}
      </div>
    </GlassCard>
  </div>
</div>
```

**Key rule:** Always wrap GSAP target elements in a scoped container ref. Never animate by selector strings without a scope.

### Dashboard Layout (target pattern)
Dashboard pages use `<Layout>` (header + bottom dock). The content area should:
- Use `auth-scroll` equivalent: `flex-1 overflow-y-auto px-4 pb-4`
- NOT use fixed `min-h-[calc(100dvh-72px)]` + `items-center` (causes overflow on mobile)
- Apply consistent `space-y-4` or `gap-4` between cards; avoid inconsistent spacing

### Responsive Breakpoints
| Breakpoint | Strategy |
|------------|----------|
| Mobile (< 640px) | 1 column, reduced padding/font, scrollable layouts |
| Tablet (640–1024px) | 2 columns for stats grids |
| Desktop (> 1024px) | 4-column stats grid, wider cards |

---

## Component Library

### Glass Card
`.glass-card` — the primary content container.

**Light:**
```css
background: rgba(255,255,255,0.55);
backdrop-filter: blur(24px) saturate(180%);
border: 1px solid rgba(255,255,255,0.8);
border-radius: 24px;
box-shadow: 0 8px 32px rgba(15,15,20,0.08), 0 1px 0 rgba(255,255,255,0.9) inset;
```

**Dark:**
```css
background: rgba(22,23,31,0.72);
backdrop-filter: blur(28px) saturate(160%);
border: 1px solid rgba(255,255,255,0.07);
border-radius: 24px;
box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset;
```

**Usage:** Wrap page content sections in `<GlassCard>`. Optional props: `className`, `style={{ padding: '1.75rem' }}`.

---

### Auth Input
`.auth-input` — unified text input style.

```css
.auth-input {
  width: 100%;
  padding: 0.7rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.7);
  color: #1a1714;
  font-family: 'Sora', system-ui, sans-serif;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.auth-input:focus {
  outline: none;
  border-color: #e60023;
  box-shadow: 0 0 0 3px rgba(230,0,35,0.12);
  background: rgba(255,255,255,0.9);
}
```

**Dark mode** adjusts border, background, text, and focus ring alpha.

**Always wrap inputs in `.auth-input-group` + `.auth-label`** for consistent label-spacing rhythm:
```html
<div className="auth-input-group">
  <label className="auth-label">Email address</label>
  <input className="auth-input" />
</div>
```

---

### Primary Button (Shimmer CTA)
`.auth-btn-primary` — main call-to-action. **Signature element:** shimmer sweep on hover.

```css
.auth-btn-primary {
  position: relative; overflow: hidden;
  width: 100%; padding: 0.8rem 1.5rem;
  border-radius: 12px; border: none;
  background: #e60023; color: #fff;
  font-family: 'Sora'; font-size: 0.9rem; font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(230,0,35,0.35);
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
}
.auth-btn-primary:hover {
  background: #c4001e; transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(230,0,35,0.45);
}
.auth-btn-primary:active { transform: translateY(0) scale(0.98); }

/* Shimmer */
.auth-btn-primary::after {
  content: ''; position: absolute; top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
  transform: skewX(-15deg); transition: left 0.5s ease;
}
.auth-btn-primary:hover::after { left: 160%; }
```

**Loading state:** show spinner SVG inside the button, preserve button height.

---

### Secondary Button
`.auth-btn-secondary` — ghost/secondary actions.

```css
.auth-btn-secondary {
  width: 100%; padding: 0.75rem 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.6);
  color: #4a3f38;
  font-family: 'Sora'; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; backdrop-filter: blur(8px);
  transition: all 0.2s;
}
.dark .auth-btn-secondary {
  border-color: rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05); color: #b8b0a8;
}
```

---

### Tab Toggle (Email/Phone)
`.auth-tab-group` + `.auth-tab-btn` + `.auth-tab-btn.active`

```css
.auth-tab-group {
  display: flex; gap: 4px; padding: 4px;
  border-radius: 14px;
  background: rgba(0,0,0,0.05);   /* light */
  background: rgba(255,255,255,0.06); /* dark */
}
.auth-tab-btn {
  flex: 1; padding: 0.5rem 1rem; border-radius: 10px;
  border: none; background: transparent;
  color: #7a6f6a; font-size: 0.82rem; font-weight: 600;
  transition: background 0.25s, color 0.25s, box-shadow 0.25s;
}
.auth-tab-btn.active {
  background: #fff; color: #e60023;
  box-shadow: 0 1px 6px rgba(0,0,0,0.1);
}
/* dark: active = bg rgba(255,255,255,0.1), color: #ff9aa6 */
```

---

### Divider
`.auth-divider` + `.auth-divider-line` + `.auth-divider-text`

Centered horizontal rule with uppercase "or" label. Gradient fade at edges for subtlety.

---

### Alert / Error
`.auth-alert` — inline form error feedback.

```css
.auth-alert {
  padding: 0.7rem 0.9rem; border-radius: 10px;
  border: 1px solid rgba(220,38,38,0.2);
  background: rgba(254,226,226,0.6); color: #b91c1c;
  font-size: 0.82rem; font-weight: 500;
}
```

---

### Stats Card (Dashboard)
Replaces the current `bg-white dark:bg-dark-600 p-6 rounded-lg` pattern.

```html
<div className="widget-surface p-5">
  <div className="flex items-center gap-3 mb-3">
    <div className="w-10 h-10 rounded-full flex items-center justify-center"
         style={{ background: 'rgba(230,0,35,0.1)' }}>
      <!-- lucide icon, text-rose-600 dark:text-rose-400 -->
    </div>
    <p className="text-sm text-pin-muted">Label</p>
  </div>
  <div className="text-2xl font-bold text-pin">Value</div>
</div>
```

**Mobile:** reduce padding `p-6` → `p-4`, icon wrapper `w-10 h-10` → `w-8 h-8`, value `text-2xl` → `text-xl`.

---

## GSAP Animation Patterns

### 1. Entrance Stagger (form/content elements)
**Hook:** `useGSAP` from `@gsap/react`
**Scope:** always pass a container ref as scope
**Targets:** elements with `.auth-field` class inside the scoped container
**Pattern:**
```tsx
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const formRef = useRef<HTMLDivElement>(null);

useGSAP(() => {
  if (!formRef.current) return;
  gsap.fromTo(
    formRef.current.querySelectorAll('.auth-field'),
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, stagger: 0.07, duration: 0.5, ease: 'power2.out' }
  );
}, { scope: formRef });
```

**Responsive:** on mobile (breakpoint < 640px), reduce stagger duration or set `stagger: 0` if janky. Wrap in `gsap.matchMedia()` for clean breakpoints:
```tsx
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: reduce)', () => { /* skip */ return; });
  mm.add('(max-width: 639px)', () => {
    gsap.fromTo('.auth-field', { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.05 });
    return () => {};
  });
  mm.add('(min-width: 640px)', () => {
    gsap.fromTo('.auth-field', { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.5, ease: 'power2.out' });
    return () => {};
  });
  return () => mm.revert();
}, { scope: formRef });
```

### 2. Ambient Floating Orbs (full-page background)
**Component:** `AuthBackground.tsx` — three fixed-position orbs animated with GSAP yoyo timelines, `repeat: -1`.
**Orb sizes:** 520px / 420px / 320px (or `min(520px, 80vw)` responsive)
**Mix-blend-mode:** `multiply` (light), `screen` (dark)
**Colors:** crimson radial, purple radial, rose radial

```tsx
// Per-orb animation (looping yoyo)
gsap.timeline({ repeat: -1, yoyo: true, delay: i * -3 })
  .to(orb, { x: xRange, y: yRange, scale: 1.08, rotation: 15, duration: dur })
  .to(orb, { /* mid drift */ })
  .to(orb, { x: 0, y: 0, scale: 1, rotation: 0, duration: dur * 0.7 });
```

### 3. Glass Card Entrance
```tsx
const cardRef = useRef<HTMLDivElement>(null);
useGSAP(() => {
  gsap.fromTo(cardRef.current,
    { y: 48, opacity: 0, scale: 0.96 },
    { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.4)' }
  );
}, { scope: cardRef });
```

### 4. Dock Tab Pop
`@keyframes dock-pop` in CSS — triggered via `.dock-tab-active .dock-tab-icon`. No GSAP needed for dock tabs.

---

## App Shell (Dashboard/Nav)

### Header / Top Bar
```html
<header className="glass-header sticky top-0 z-30">
  <!-- logo left, actions right, backdrop-filter blur -->
</header>
```

Apply `.glass-header` to the sticky top header. Not `.auth-layout` — that's auth pages only.

### Bottom Dock
```html
<nav className="glass-dock fixed bottom-0 inset-x-0 z-30 safe-bottom">
  <div className="flex">
    {tabs.map(tab => (
      <div className={`dock-tab ${isActive ? 'dock-tab-active' : ''}`}>
        <div className="dock-tab-icon">
          <Icon size={20} />
        </div>
        <span className="dock-tab-label">{tab.label}</span>
      </div>
    ))}
  </div>
</nav>
```

### Page Content Padding
```html
<main className="flex-1 overflow-y-auto px-4 pt-4 pb-24"> <!-- pb-24 = above dock -->
  <!-- content -->
</main>
```

**Mobile:** reduce `px-4` → `px-3`, `pt-4` → `pt-3`, `pb-24` → `pb-20`.

---

## Mobile Responsiveness Checklist

> **Top priority.** Components and text are currently oversized on mobile.

### Typography
- [ ] Display titles: `text-2xl` → `text-xl` (mobile)
- [ ] Section headings: `text-xl` → `text-lg`
- [ ] Body text: 16px default, never smaller than 14px
- [ ] Stats values: `text-3xl` → `text-2xl` or `text-xl`

### Spacing
- [ ] Card padding: `p-6` → `p-4` (mobile)
- [ ] Glass card border-radius: 24px → 20px
- [ ] Gap between cards: `gap-6` → `gap-4`
- [ ] Top bar padding: `px-6` → `px-4`
- [ ] Bottom nav safe-area: `pb-24` → `pb-20`

### Input/Buttons
- [ ] Auth inputs: full-width on mobile
- [ ] Country code select: works via portal (already implemented)
- [ ] Buttons: touch targets minimum 44px height

### Grid
- [ ] Dashboard stats grid: `grid-cols-1` on mobile, 2cols on tablet, 4cols on desktop
- [ ] Use `gap-4` instead of `gap-6` on mobile

### Layout Pattern
```html
<!-- ✅ CORRECT — scrollable content area -->
<div className="flex flex-col min-h-0 flex-1">
  <div className="flex-1 overflow-y-auto px-3 pt-3 pb-20">
    <GlassCard className="p-4">...</GlassCard>
  </div>
</div>

<!-- ❌ WRONG — fixed center causes overflow on small screens -->
<div className="min-h-[calc(100dvh-72px)] items-center">...</div>
```

---

## File Reference

| File | Purpose |
|------|---------|
| `src/index.css` | All design tokens and component CSS classes |
| `src/components/AuthBackground.tsx` | Three-orb animated background |
| `src/components/GlassCard.tsx` | Reusable glass card with GSAP entrance |
| `src/components/CountryCodeSelect.tsx` | Portal-based mobile-friendly dropdown |
| `src/pages/Login.tsx` | Auth page with GSAP stagger pattern |
| `src/pages/Register.tsx` | Auth page with tab toggle |
| `src/pages/ForgotPassword.tsx` | Auth page with success state |
| `src/pages/Dashboard.tsx` | Needs full redesign pass |

---

## Implementation Order

1. **Dashboard cards** — replace `bg-white dark:bg-dark-600` with `.glass-card` or `.widget-surface`, apply mobile-responsive spacing
2. **Stats grid** — mobile: 1-col, tablet: 2-col, desktop: 4-col with responsive font sizes
3. **GSAP entrance** — add staggered fade-in for dashboard stat cards on mount
4. **Layout wrapper** — apply `auth-scroll` flex pattern to dashboard content area
5. **Bottom dock** — ensure `pb-safe-bottom` matches final layout
6. **Earn / Withdraw / Referrals / Account** — same treatment, page by page
7. **Background** — optional ambient orbs on Dashboard (behind glass surfaces)