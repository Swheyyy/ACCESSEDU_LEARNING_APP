# AccessEdu Design Guidelines

## Design Approach

**Selected Framework:** Material Design 3 principles for accessibility-first structure, with inspiration from Duolingo's friendly educational approach and Zoom's professional video interface design.

**Rationale:** AccessEdu requires exceptional accessibility compliance, clear information hierarchy for real-time data, and trustworthy professionalism while remaining approachable for diverse user groups (Deaf, elderly, visually-challenged).

---

## Typography System

**Font Families:**
- Primary: Inter (Google Fonts) - excellent readability, accessibility-optimized
- Monospace: JetBrains Mono - for confidence scores and technical data

**Hierarchy:**
- Hero headline: text-5xl md:text-6xl, font-bold, leading-tight
- Section headers: text-3xl md:text-4xl, font-semibold
- Subsection headers: text-xl md:text-2xl, font-semibold
- Body text: text-base md:text-lg, font-normal, leading-relaxed
- Labels/UI controls: text-sm md:text-base, font-medium
- Caption/metadata: text-xs md:text-sm, font-normal
- Recognized text display: text-2xl md:text-4xl, font-bold (high visibility)
- Confidence scores: text-lg, font-mono

**Accessibility:** All text maintains minimum 4.5:1 contrast ratio. User-controlled font scaling (100%, 125%, 150%) via accessibility menu.

---

## Layout & Spacing System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24 for consistency
- Component padding: p-4 to p-8
- Section spacing: py-16 md:py-24
- Card spacing: p-6 md:p-8
- Button padding: px-6 py-3
- Grid gaps: gap-6 md:gap-8

**Container Widths:**
- Landing sections: max-w-7xl mx-auto
- Recognition interface: max-w-6xl mx-auto
- Form content: max-w-2xl mx-auto
- Text content: max-w-prose

**Responsive Breakpoints:** Mobile-first, stack to single column below md:, 2-column layouts at md:, 3-column at lg: where appropriate

---

## Component Library

### Navigation
- Sticky header with logo (left), primary navigation (center), accessibility toggle + user menu (right)
- Mobile: Hamburger menu with slide-out drawer
- Accessibility menu dropdown: Font size controls, high contrast toggle, screen reader mode, keyboard shortcuts guide

### Landing Page (7 sections)

**Hero Section (80vh):**
- Split layout: Left 50% - headline, subheadline, dual CTAs ("Start Translating" primary, "Watch Demo" secondary), trust indicator ("Used by 10,000+ learners")
- Right 50% - large hero image/illustration showing diverse users using sign language with technology
- Background: subtle gradient treatment

**Feature Grid (3 columns → 1 mobile):**
- Icon + title + description cards with subtle elevation
- Features: Real-time Recognition, Multi-Input Support, Progress Tracking, Text-to-Speech, Privacy First, Accessibility Built-in

**Input Modes Showcase (2-column alternating):**
- Row 1: Image left, content right - "Live Webcam Recognition"
- Row 2: Content left, image right - "Upload Videos"  
- Row 3: Image left, content right - "Static Image Analysis"
- Each with screenshot/demo image, headline, feature bullets

**User Types Section:**
- 4-column grid (2x2 on tablet, stacked mobile)
- Cards for each user type with icon, persona name, use case description

**Social Proof:**
- 3-column testimonial cards with user photo, quote, name, role
- Stats banner: "X translations processed" "Y% accuracy" "Z languages supported"

**How It Works (Timeline):**
- Vertical timeline with numbered steps (1-4)
- Each step: Large number, title, description, supporting icon

**CTA Section:**
- Centered content with headline, supporting text, primary CTA, secondary link
- Background: full-width with subtle pattern

**Footer:**
- 4-column layout: About links, Features, Resources, Contact
- Newsletter signup form, social icons, privacy policy links, accessibility statement

### Auth Mock Screen
- Centered card (max-w-md) with logo, headline "Choose Your Experience"
- 4 large button tiles (2x2 grid) representing user types
- Each tile: Icon, user type name, brief description
- Subtle hover elevation, focus ring for keyboard nav

### Recognition Interface (Primary App Screen)

**Layout:** 3-zone split
- **Left Sidebar (25%):** Input mode selector (pills: Webcam/Video/Image), saved translations list with thumbnails
- **Main Area (50%):** Video/image display canvas, real-time recognized text overlay panel, confidence score badge (top-right of canvas)
- **Right Panel (25%):** Controls (Start/Pause, Save, Listen buttons stacked), session info, settings

**Webcam Mode:**
- Large video canvas with rounded corners, subtle border
- Floating recognized text panel (bottom overlay, semi-transparent background with blur)
- Confidence meter: Circular progress indicator (top-right)
- Control buttons: Large, icon + label, high contrast

**Video Upload Mode:**
- Drag-and-drop zone (dashed border, centered icon + text)
- Once uploaded: Video player with custom timeline scrubber showing text markers
- Timeline: Horizontal strip with recognized text snippets at timestamps
- Export transcript button (top-right)

**Image Upload Mode:**
- Drag-and-drop zone or browse button
- Once uploaded: Image display with instant text overlay
- Larger confidence score display, TTS button prominent

### Translation History
- List view with thumbnail, recognized text preview, timestamp, confidence badge, input type icon
- Filters: Dropdown for input type, date range picker, search bar
- Each item expandable to show full details, playback audio, delete action
- Empty state: Illustration + "Start your first translation" message

### Privacy Consent Modal
- Centered overlay (max-w-lg)
- Camera icon, clear headline "Camera Access Required"
- Bulleted explanation of data usage, storage opt-in checkbox
- Dual buttons: "Allow and Continue" (primary), "Learn More" (secondary link)

---

## UI Patterns

**Cards:** Rounded corners (rounded-lg), subtle shadow (shadow-sm), hover elevation increase (hover:shadow-md), padding p-6
**Buttons:** Rounded (rounded-lg), padding px-6 py-3, font-medium, focus ring (ring-2 ring-offset-2)
- Primary: Bold, high contrast
- Secondary: Outlined style
- Icon buttons: Square p-3, icon centered
**Form Inputs:** Rounded (rounded-md), border, padding p-3, focus ring
**Badges:** Small rounded pills (rounded-full), text-xs, px-3 py-1
**Progress Indicators:** Circular for confidence (0-100%), linear for video timeline

---

## Animations

**Use sparingly:**
- Page transitions: Smooth fade-in (300ms)
- Recognized text update: Gentle fade + slight scale (200ms) for emphasis
- Button interactions: Built-in states only
- Card hover: Elevation change (150ms ease)
- Modal entry: Fade + slight scale from center (250ms)

**No animations on:**
- Recognition data updates (instant)
- Video playback controls
- Accessibility toggles

---

## Accessibility Requirements

**ARIA Labels:** Every interactive element labeled, landmarks defined (nav, main, aside, footer)
**Keyboard Navigation:** Visible focus rings (ring-2), logical tab order, skip links
**Screen Reader:** Live regions for recognized text updates, status announcements for actions
**High Contrast Mode:** Alternative theme with increased contrast ratios (7:1 minimum)
**Motion Reduction:** Respect prefers-reduced-motion, disable non-essential animations
**Touch Targets:** Minimum 44x44px for all interactive elements

---

## Images

**Hero Section:** Large, vibrant image/illustration showing diverse individuals (varying ages, ethnicities) using sign language with laptops/tablets. Should convey collaboration, technology, and inclusion. Full-width right panel of hero split.

**Input Mode Showcase:** 
1. Screenshot of webcam interface with live recognition in action
2. Screenshot of video player with timeline markers
3. Screenshot of uploaded image with recognized text overlay

**User Type Cards:** Simple, friendly icons representing each persona (not photos)

**Testimonials:** Circular user photos (diverse representation)

**How It Works:** Supporting icons for each timeline step (hand gesture, upload, brain/AI, speaker icons)