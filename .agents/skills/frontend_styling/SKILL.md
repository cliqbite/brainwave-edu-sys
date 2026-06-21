---
name: Frontend Styling and Aesthetics
description: Guidelines for styling React components using TailwindCSS v4, emphasizing premium dark mode and glassmorphism.
---

# Frontend Styling Guidelines

When building or modifying frontend components in this repository, you MUST adhere to the following aesthetic rules to maintain a premium feel.

## 1. Core Technologies
- **Framework**: React with Vite
- **Styling**: TailwindCSS v4
- **Icons**: `lucide-react` (Do NOT use other icon libraries to maintain consistency)

## 2. Design Language (Glassmorphism & Dark Mode)
- **Backgrounds**: The app uses a dark slate theme. Use `bg-slate-900` or `bg-slate-800` for primary surfaces.
- **Glassmorphism**: Use translucent backgrounds with backdrop blur. Example: `bg-slate-900/80 backdrop-blur-xl`.
- **Borders**: Always use subtle, low-opacity white borders to separate elements instead of hard solid lines. Example: `border border-white/10` or `border-white/5`.

## 3. Colors
- **Brand Color**: The primary accent color is blue (referred to as `brand`). Use `bg-brand-500`, `text-brand-400`, etc.
- **Avoid Generic Colors**: Do not use generic solid colors (like standard red, green, blue). Always use the Tailwind palette (e.g., `emerald-500` for success, `red-500` for danger, `slate-400` for muted text).

## 4. Typography & Spacing
- Use `text-slate-300` or `text-slate-200` for primary text, and `text-slate-400` or `text-muted` for secondary/helper text.
- Maintain consistent padding/margins (`p-4`, `p-6`, `gap-4`).

## 5. Reusable UI Components
- Always prefer using the pre-built components located in `apps/frontend/src/components/ui/` (e.g., `<Card>`, `<Table>`, `<Badge>`).
- If you need a card layout, wrap it in `<Card>` rather than building custom divs.

## 6. Animations
- Use subtle micro-animations for interactions.
- Examples: `transition-colors`, `hover:bg-slate-800/40`, `animate-fade-in`, `animate-slide-up`.
