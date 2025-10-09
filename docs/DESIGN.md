# RADAR Design System

**Brand Emotion:** Refined humanism • Purposeful vibrancy • Tactile modernism • Structured voice • Calm confidence

**Visual Keywords:** Human • Precise • Bold • Geometric • Playful • Editorial • Minimal • Confident • Cultural • Warm

**Emotion in five words:** Clarity. Warmth. Edge. Charm. Wit.

---

## 1. Brand Identity

### Tone & Philosophy
RADAR blends rational structure with emotional clarity. It balances playful humanism (illustration, warmth, imperfection) with typographic precision and engineered rhythm. The visual tone is confident, curious, and culturally aware — design that thinks like a system but feels like a person.

### Design Principles
- **Color functions as emotion, not decoration** - Each screen has one emotional accent
- **Typography is the engine of identity** - Large type forms compositional anchors
- **Grid discipline, creative elasticity** - Clear baseline grid, intentional breaks for rhythm
- **Motion is felt, not flashy** - Liquid glass physics, 300-800ms durations
- **Sharp geometry** - Circles and rectangles only, no pills or excessive rounding

---

## 2. Color System

### Base Palette (Structural Calm)
```css
--bg-primary: #0E0D0B;        /* Warm near-black */
--bg-surface: #1C1A17;        /* Charcoal with warmth */
--bg-sidebar: #15130F;        /* Between background and surface */

--text-primary: #E8E3D8;      /* Off-white, never pure white */
--text-secondary: #A39A88;    /* Warm gray */
--text-dimmed: opacity 0.6;   /* For metadata */
```

### Accent Families (Emotional Bursts)
```css
--accent-tomato: #FF543D;         /* Urgency, attention, action-needed */
--accent-brown-sugar: #AB6E49;    /* Warmth, waiting, patience */
--accent-forest-green: #4D9042;   /* Success, signals, growth */
--accent-tropical-indigo: #9E87EB; /* Insight, projects, intelligence */
```

### Usage Rules
- **ONE emotional accent per view** - Never more than two dominant hues per screen
- **High saturation** - Accents at full vibrancy, not muted
- **Context-dependent** - Each card type gets its accent color

### Application Map
| Element | Color | Usage |
|---------|-------|-------|
| Action-needed tasks | `#FF543D` (Tomato) | Card backgrounds |
| Waiting tasks | `#AB6E49` (Brown Sugar) | Card backgrounds |
| Signal threads | `#4D9042` (Forest Green) | Card backgrounds |
| Projects | `#9E87EB` (Tropical Indigo) | Card backgrounds |
| Primary CTAs | Context accent | Send, Save, Complete |
| Hover states | Accent + 15% brightness | All interactive elements |
| Success feedback | `#4D9042` | Confirmations, completed states |
| Error/urgent | `#FF543D` | Warnings, alerts |

### Interactive States
```css
/* Hover */
filter: brightness(1.15);

/* Active (pressed) */
filter: brightness(0.9);
transform: translateY(1px);

/* Disabled */
opacity: 0.4;
cursor: not-allowed;
```

---

## 3. Typography

### Font Stack
```css
font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Rationale:** Space Grotesk is geometric, modern, and architectural. Fallback to system fonts ensures performance.

### Type Scale
```css
/* Headlines (H1) - App name, major sections */
font-size: 32px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: -0.02em;
line-height: 1.1;

/* Subheads (H2) - Task titles, signal subjects */
font-size: 20px;
font-weight: 600;
letter-spacing: -0.01em;
line-height: 1.3;

/* Body - Descriptions, content */
font-size: 14px;
font-weight: 400;
line-height: 1.5;
letter-spacing: 0;

/* Labels/Meta - Badges, timestamps, counts */
font-size: 11px;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.04em;
line-height: 1.2;
```

### Typography Principles
- **Large type anchors layout** - Headers define visual hierarchy
- **Uppercase for emphasis** - Headlines and labels use caps sparingly
- **Tight tracking on large sizes** - Improves geometric precision
- **Generous line-height on body** - Ensures readability

---

## 4. Layout System

### Grid Structure
```css
/* Baseline grid */
--spacing-unit: 8px;

/* Sidebar */
--sidebar-width: 320px;
--sidebar-min: 280px;
--sidebar-max: 500px;

/* Main content */
--main-min-width: 600px;
--main-padding: 64px; /* Horizontal margins */

/* Card spacing */
--card-gap: 8px;
```

### Spacing Scale
```css
--space-xs: 4px;   /* Micro gaps */
--space-sm: 8px;   /* Small gaps, inline elements */
--space-md: 16px;  /* Standard padding, card padding */
--space-lg: 24px;  /* Section spacing */
--space-xl: 48px;  /* Major divisions */
```

### Compositional Rules
- **40% breathing room** - Negative space is intentional
- **Asymmetry creates interest** - Offset cards by 4px for visual rhythm
- **Type-as-structure** - Headers carry visual weight
- **No hard borders** - Use color contrast and shadow for separation

---

## 5. Components

### Buttons

#### Primary CTA (Rectangle, Sharp Corners)
```css
/* Base */
width: auto; /* min 140px */
height: 44px;
border-radius: 0px; /* Sharp, no rounding */
background: var(--accent-context); /* Context-dependent */
color: #1C1A17; /* Dark text on bright accent */
font-size: 13px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.05em;
padding: 0 24px;
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover */
filter: brightness(1.15);
box-shadow: 0 4px 12px rgba(0,0,0,0.3);

/* Active */
filter: brightness(0.9);
transform: translateY(1px);
```

#### Secondary (Rectangle Outline)
```css
/* Base */
height: 44px;
border-radius: 0px;
border: 2px solid var(--accent-context);
background: transparent;
color: var(--text-primary);
font-size: 13px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.05em;
padding: 0 24px;

/* Hover */
background: rgba(var(--accent-context-rgb), 0.15);
```

#### Icon Button (Circle)
```css
/* Base */
width: 36px;
height: 36px;
border-radius: 50%; /* Perfect circle */
background: rgba(255,255,255,0.08);
display: flex;
align-items: center;
justify-content: center;
transition: all 200ms ease;

/* Hover */
background: rgba(var(--accent-context-rgb), 0.2);
box-shadow: 0 0 12px rgba(var(--accent-context-rgb), 0.3);

/* Active */
transform: scale(0.95);
```

#### Tab Buttons (Rectangle Segments)
```css
/* Container */
display: flex;
gap: 0;
background: rgba(0,0,0,0.2);
padding: 4px;
position: relative;

/* Tab button */
min-width: 80px;
height: 40px;
border-radius: 0px;
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
color: var(--text-secondary);
transition: color 200ms ease;

/* Active tab text */
color: var(--text-primary);

/* Active indicator (slides underneath) */
position: absolute;
height: 3px;
bottom: 0;
background: var(--accent-context);
transition: transform 400ms cubic-bezier(0.65, 0, 0.35, 1), width 400ms ease;
```

### Cards

#### Base Card Structure
```css
/* All cards */
background: var(--accent-context); /* Full saturation color */
border-radius: 8px; /* Minimal softness, not pill */
padding: 16px;
box-shadow: 
  0 4px 16px rgba(0,0,0,0.3),
  0 0 0 1px rgba(255,255,255,0.02);
cursor: pointer;
transition: all 200ms ease;

/* Hover */
filter: brightness(1.1);
transform: translateY(-2px);
box-shadow: 
  0 6px 20px rgba(0,0,0,0.4),
  0 0 0 1px rgba(255,255,255,0.04);
```

#### Card Action Button (Bottom-Right)
```css
/* Circle button carved into card corner */
position: absolute;
bottom: 12px;
right: 12px;
width: 32px;
height: 32px;
border-radius: 50%;
background: rgba(255,255,255,0.2);
display: flex;
align-items: center;
justify-content: center;

/* Icon color adjusts to card background */
color: inherit; /* Or contrast color */

/* Hover */
background: rgba(255,255,255,0.3);
```

#### Task Card (Action-Needed)
```css
background: #FF543D; /* Tomato */
color: #1C1A17; /* Dark text on bright background */
```

#### Task Card (Waiting)
```css
background: #AB6E49; /* Brown Sugar */
color: #E8E3D8; /* Light text */
```

- **Task card sizing**: All task cards lock to 80px height with 16px vertical padding. Titles truncate with `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` so controls can occupy the lower-right corner without wrapping content.
- **Completed hover micro-interaction**: Hovering a completed card morphs the "DONE" badge into a tomato-red `MARK AS INCOMPLETE?` CTA (300ms ease), fades the open arrow to 0 opacity, and adds a 2px blurred gradient mask over the trailing edge of long titles so the CTA stays legible.

#### Signal Card (Radar Tab)
```css
background: #4D9042; /* Forest Green */
color: #E8E3D8;
```

#### Project Card
```css
background: #9E87EB; /* Tropical Indigo */
color: #1C1A17;
```

- **Primary bubble**: 16px corner radius, #5b4842 background, #fef3ea body text. Content uses 24px horizontal padding, 20px vertical padding, and supports Markdown with 1.6 line height. Timestamp (11px uppercase #A39A88) sits 8px above the bubble. Overall shadow: `0 2px 8px rgba(0,0,0,0.2)`.
- **Confidence indicator**: 28px circle showing the numeric score only. Same color ramp (`>=8` forest, `5-7.9` gold, `<5` tomato) with tooltip “Confidence level”.
- **Control column**: Vertical stack in the left margin `[Confidence][Clock snooze][Flame back burner][Calendar reschedule]`. Buttons are 32px circles with no background; default state is 40% opacity + grayscale, hover transitions (200ms) remove grayscale, lift opacity to 100%, and tint icons blue (#4A9EFF), orange (#FF8C42), or green (#4D9042). The stack scales slightly to fit within the 80px card band.
- **Embedded cards**: Shifted 48px to the right of the bubble to clear the control column. Tasks keep gradient styling, fixed 80px height, and only expose Complete + Open buttons. Projects remain translucent buttons with ArrowUpRight.
- **Follow-up prompts**: Snooze/reschedule replies indent 80px to nest beneath the originating action. No connector line is used; alignment alone communicates relationship.
- **Catch-up variant**: Bubble copy summarises backlog; multiple cards may appear stacked. Snooze button omitted to keep focus on reviewing or opening tasks. Animation helper pulses affected task cards after snooze/back-burner actions.

### CommitmentDock Components

#### Mini Task Card - Untouched State
```css
/* Base card */
width: 180px;
height: 96px;
border-radius: 12px;
background: #5b6e4c; /* Default green */
padding: 8px;
cursor: pointer;
transition: all 300ms cubic-bezier(0.65, 0, 0.35, 1);

/* Hover */
filter: brightness(1.1);
box-shadow: 0 0 16px rgba(255,255,255,0.3);

/* Title */
font-size: 14px;
font-weight: 600;
color: white;
line-clamp: 2;

/* Due date */
font-size: 11px;
text-transform: uppercase;
color: rgba(255,255,255,0.7);

/* Accept button (+ icon) */
width: 32px;
height: 32px;
border-radius: 50%;
background: rgba(255,255,255,0.2);
position: absolute;
bottom: 8px;
right: 8px;
transition: all 200ms ease;

/* Button hover */
background: rgba(255,255,255,0.3);
```

#### Mini Task Card - Expanded State
```css
/* Expanded card */
width: calc(36px * 4 + 12px * 3 + 16px); /* ~196px - fits 4 buttons with gaps */
height: 96px;
transition: width 300ms cubic-bezier(0.65, 0, 0.35, 1);

/* Control buttons (4 icons in row) */
width: 36px;
height: 36px;
border-radius: 50%;
background: rgba(255,255,255,0.2);
gap: 12px;
justify-content: center;
align-items: center;

/* Button hover */
background: rgba(255,255,255,0.4);
```

#### Mini Task Card - Snooze Expanded State
```css
/* Snooze prompt expansion */
width: auto; /* Expands to fit prompt + buttons */
min-width: 420px;
height: 96px;
transition: width 400ms cubic-bezier(0.65, 0, 0.35, 1);

/* X button (rotated +) */
width: 36px;
height: 36px;
position: absolute;
left: 16px;
top: 50%;
transform: translateY(-50%) rotate(45deg);
transition: transform 200ms ease;

/* Snooze prompt text */
font-size: 16px;
font-weight: 500;
color: white;
text-align: center;

/* Snooze option pills */
height: 40px;
padding: 0 20px;
border-radius: 20px;
background: rgba(255,255,255,0.15);
font-size: 13px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.04em;
color: white;
gap: 8px;
transition: all 200ms ease;

/* Pill hover */
background: rgba(255,255,255,0.25);

/* Confirmation message */
font-size: 16px;
font-weight: 500;
color: white;
text-align: center;
duration: 4s;
```

#### Mini Task Card - Snoozed State
```css
/* Snoozed visual state */
background: #4a4a4a; /* Dark grey */
opacity: 0.8;

/* Clock icon indicator */
width: 20px;
height: 20px;
color: rgba(255,255,255,0.6);
position: absolute;
top: 8px;
right: 8px;
```

#### Expanded Purple Task Card
```css
/* Big card above mini cards */
width: 100%;
height: 128px;
border-radius: 12px;
background: #5b4f8a; /* Purple */
padding: 20px;
box-shadow: 0 4px 16px rgba(0,0,0,0.3);
transition: all 300ms cubic-bezier(0.65, 0, 0.35, 1);

/* Title */
font-size: 18px;
font-weight: 600;
color: white;

/* Due date */
font-size: 12px;
text-transform: uppercase;
color: rgba(255,255,255,0.7);

/* Action buttons (circle + arrow) */
width: 32px;
height: 32px;
border-radius: 50%;
background: rgba(255,255,255,0.2);
position: absolute;
bottom: 16px;
right: 16px;
gap: 8px;

/* Button hover */
background: rgba(255,255,255,0.3);
```

#### CommitmentDock Animations
```css
/* Card expand animation */
transition: width 300ms cubic-bezier(0.65, 0, 0.35, 1),
            opacity 300ms ease;

/* Other cards slide animation */
transition: transform 300ms cubic-bezier(0.65, 0, 0.35, 1);

/* Card disappear animation */
opacity: 0;
transform: translateX(-32px);
transition: all 300ms ease;

/* Purple card slide into mini card */
transform: translateY(0);
scale: 0.5;
opacity: 0;
transition: all 400ms cubic-bezier(0.65, 0, 0.35, 1);

/* Confirmation fade */
opacity: 0;
transition: opacity 300ms ease;
```

#### CommitmentDock Toast/Popup
```css
/* Confirmation popup */
position: fixed;
bottom: 96px;
left: 50%;
transform: translateX(-50%);
background: #5b4842;
color: #fef3ea;
padding: 12px 20px;
border-radius: 8px;
font-size: 14px;
font-weight: 500;
box-shadow: 0 4px 12px rgba(0,0,0,0.3);
z-index: 50;
animation: fadeIn 200ms ease;

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
```

### Input Fields

```css
/* Text input */
background: #1C1A17;
border: 1px solid rgba(255,255,255,0.08);
border-radius: 4px;
padding: 12px 16px;
color: var(--text-primary);
font-size: 14px;
transition: border-color 200ms ease;

/* Focus */
border-color: rgba(255,255,255,0.2);
outline: none;
box-shadow: 0 0 0 3px rgba(255,255,255,0.05);

/* Label (oversized, above field) */
font-size: 14px;
font-weight: 500;
color: var(--text-primary);
margin-bottom: 8px;
```

### Badges & Pills

```css
/* Status badge */
display: inline-flex;
align-items: center;
gap: 6px;
padding: 4px 10px;
border-radius: 4px; /* Rectangle, not pill */
font-size: 11px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.04em;
background: rgba(255,255,255,0.1);
color: var(--text-primary);

/* Dot indicator */
width: 6px;
height: 6px;
border-radius: 50%;
background: currentColor;
```

---

## 6. Motion & Animation

### Easing Curves
```css
/* Liquid glass - soft overshoot */
--ease-overshoot: cubic-bezier(0.34, 1.20, 0.64, 1);

/* Smooth deceleration - thick liquid settling */
--ease-decelerate: cubic-bezier(0.65, 0, 0.35, 1);

/* Camera pan - editorial movement */
--ease-camera: cubic-bezier(0.4, 0, 0.2, 1);
```

### Timing Guidelines
```css
/* UI micro-interactions */
--duration-fast: 150ms;
--duration-medium: 300ms;

/* Content transitions */
--duration-moderate: 400ms;
--duration-slow: 600ms;

/* Large reveals */
--duration-deliberate: 800ms;
--duration-cinematic: 1000ms;
```

### Key Animations

#### Tab Indicator Slide
```css
/* Active indicator slides to new tab */
transition: transform 400ms var(--ease-decelerate),
            width 400ms ease;
```

#### Card Transition (Stagger Cascade)
```css
/* Exit animation */
opacity: 0;
transform: translateY(20px) scaleY(0.95);
filter: blur(4px);
transition: all 250ms ease;

/* Enter animation (staggered by 50ms per card) */
opacity: 1;
transform: translateY(0) scaleY(1);
filter: blur(0);
transition: all 350ms var(--ease-overshoot);
transition-delay: calc(var(--card-index) * 50ms);
```

#### Message Send (Oil Drop Morph)
```css
/* Input text spawns bubble */
/* Bubble scales from 0.3 → 1.0 */
/* Stretches upward with path curve */
/* Settles with subtle wobble */
animation: message-morph 800ms var(--ease-overshoot);

@keyframes message-morph {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(40px) skewY(2deg);
  }
  60% {
    opacity: 1;
    transform: scale(1.0) translateY(0) skewY(0);
  }
  80% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1.0);
  }
}
```

#### Button Hover
```css
/* Subtle lift + glow */
transition: all 200ms ease;

/* Hover state */
filter: brightness(1.15);
transform: scale(1.02);
box-shadow: 0 4px 12px rgba(0,0,0,0.3);
```

#### Button Press
```css
/* Depresses with surface tension */
transform: translateY(1px) scale(0.98);
filter: brightness(0.9);
transition: all 100ms ease;
```

---

## 7. Liquid Glass Effects

### Card Materiality
```css
/* Subtle glass texture */
background: var(--accent-color);
backdrop-filter: blur(20px);
box-shadow: 
  0 4px 16px rgba(0,0,0,0.3),
  0 0 0 1px rgba(255,255,255,0.02),
  inset 0 1px 0 rgba(255,255,255,0.1); /* Inner highlight */
```

### Noise Texture Overlay
```css
/* Organic feel - applied to cards */
position: relative;

&::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,...'); /* Noise pattern */
  opacity: 0.05;
  pointer-events: none;
}
```

### Gradient Border Shift (Hover)
```css
/* Oil-on-water refraction effect */
border: 2px solid transparent;
background: 
  linear-gradient(var(--accent-color), var(--accent-color)) padding-box,
  linear-gradient(45deg, var(--accent-color), var(--accent-secondary)) border-box;
transition: background 300ms ease;

/* Hover - gradient rotates */
background: 
  linear-gradient(var(--accent-color), var(--accent-color)) padding-box,
  linear-gradient(90deg, var(--accent-secondary), var(--accent-color)) border-box;
```

---

## 8. Responsive Behavior

### Breakpoints
```css
/* Mobile */
@media (max-width: 640px) {
  --sidebar-width: 100%; /* Full screen drawer */
  --main-padding: 16px;
  --card-gap: 6px;
}

/* Tablet */
@media (max-width: 1024px) {
  --sidebar-width: 280px;
  --main-padding: 32px;
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full layout as designed */
  --sidebar-width: 320px;
  --main-padding: 64px;
}
```

### Touch Targets
- **Minimum size**: 44px × 44px for all interactive elements
- **Icon buttons**: 36px visual, 44px touch area
- **Text links**: 32px minimum height with padding

---

## 9. Accessibility

### Contrast Requirements
- **Body text**: Minimum 4.5:1 against background
- **Large text (18px+)**: Minimum 3:1
- **Interactive elements**: Minimum 3:1 for borders/icons

### Focus States
```css
/* Keyboard focus indicator */
outline: 2px solid var(--accent-context);
outline-offset: 2px;
border-radius: 4px;
```

### Screen Reader Support
- All icon-only buttons require `aria-label`
- Status changes announce via `aria-live` regions
- Form validation errors linked with `aria-describedby`

---

## 10. Implementation Notes

### CSS Architecture
- Use CSS custom properties for theming
- Component-scoped styles in respective `.tsx` files
- Global variables in `/src/styles/globals.css`

### Performance
- Use `will-change` sparingly (only during active animations)
- Prefer `transform` and `opacity` for 60fps animations
- Lazy load images, defer non-critical CSS

### Browser Support
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox for layouts
- Progressive enhancement for older browsers

---

*Last updated: 2025-10-08*
*Design inspiration: Velvele, L'Étude, Perplexity, Flow*
