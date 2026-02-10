# GymProLuxe Design Principles

## Brand Identity
- **Primary Color:** #6366f1 (Indigo)
- **Secondary Color:** #ec4899 (Pink)
- **Accent Color:** #f59e0b (Amber)
- **Font:** Inter (system-ui fallback)
- **Tone:** Professional yet motivational. Clean, modern, fitness-forward.

## Layout Rules
- Mobile-first responsive design
- Max content width: 1280px (centered)
- Page padding: 16px (mobile), 24px (tablet), 32px (desktop)
- Card border-radius: 12px
- Consistent 8px spacing grid (8, 16, 24, 32, 48, 64)

## Typography Scale
| Element | Mobile | Desktop | Weight |
|---------|--------|---------|--------|
| h1 | 28px | 36px | Bold (700) |
| h2 | 22px | 28px | Semibold (600) |
| h3 | 18px | 22px | Semibold (600) |
| Body | 14px | 16px | Regular (400) |
| Caption | 12px | 14px | Regular (400) |

## Component Standards
- **Buttons:** Min height 44px (touch target), border-radius 8px
- **Inputs:** Min height 44px, border-radius 8px, clear focus ring
- **Cards:** Background white, subtle shadow, 12px border-radius, 16px padding
- **Icons:** Lucide icons, 20px default size, 24px for navigation

## Interaction States
- **Hover:** Slight scale (1.02) or color shift on interactive elements
- **Active/Pressed:** Scale down (0.98)
- **Focus:** 2px ring with primary color offset
- **Disabled:** 50% opacity, cursor not-allowed
- **Loading:** Skeleton placeholders, never blank screens

## Accessibility Requirements (WCAG 2.1 AA)
- Color contrast ratio: 4.5:1 minimum for normal text
- Color contrast ratio: 3:1 minimum for large text (18px+)
- All interactive elements keyboard accessible
- All images have meaningful alt text
- Form inputs have associated labels
- Error messages are descriptive and associated with fields
- Focus order follows logical reading order
- No content relies solely on color to convey meaning

## PWA Standards
- Theme color matches primary brand color
- Splash screen with logo on app launch
- Offline indicator when connectivity is lost
- Native-like transitions between pages
- Bottom navigation on mobile (max 5 items)
- No horizontal scroll on any viewport

## Admin Panel Specifics
- Desktop-first layout with sidebar navigation
- Data tables with sorting, filtering, pagination
- Breadcrumb navigation for nested pages
- Action confirmations for destructive operations (delete, ban)
- Dashboard cards with clear metric labels and trend indicators
