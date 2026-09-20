# Adidaya Studio — Development Guidelines

## Responsive Design & Platform Habits
1. **Strict Desktop & Mobile Separation**:
   - Desktop and Mobile user habits and UX patterns are fundamentally different. Never mix or bleed responsive utility classes in a way that compromises desktop layout.
   - When revamping or styling a component for mobile, lock and verify the desktop design first. Changes to mobile layout must never alter or break the approved desktop version.
   - When needed, use isolated, dedicated markup blocks or scoped media queries to guarantee clean separation between desktop (`>= 768px`) and mobile (`< 768px`).

2. **Design Tokens & Aesthetics**:
   - Dark theme aesthetic with rich architectural feel.
   - Frosted glass cards: `bg-white/[0.04] backdrop-blur-md border border-white/10`.
   - Accent color: `text-adidaya-red` / `stroke-adidaya-red` (`#e53935`).
   - Iconography: Lucide React with uniform `strokeWidth={1.5}`.
