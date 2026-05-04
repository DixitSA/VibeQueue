---
name: VibeQueue
description: A premium, editorial jukebox experience for modern venues.
colors:
  primary: "#10B981"
  neutral-bg: "#F5F0E8"
  neutral-text: "#1C1C1C"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "Inter, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xs: "2px"
  sm: "4px"
  md: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.full}"
    padding: "8px 24px"
  card:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
---

# Design System: VibeQueue

## 1. Overview

**Creative North Star: "The Editorial Menu"**

VibeQueue is designed to feel like a high-end physical object—a well-curated menu in a dimly lit taproom. It rejects the generic "SaaS-blue" aesthetics of typical apps in favor of high-contrast, editorial typography and tactile interaction. The system is built for low-light legibility and one-handed thumb navigation.

**Key Characteristics:**
- **High-Contrast Vellum**: Cream backgrounds against deep charcoal text for maximum readability.
- **Tactile Depth**: 3D transforms and multi-layered shadows simulate physical card thickness.
- **Strategic Emerald**: Use of color is reserved strictly for state changes and primary actions.

## 2. Colors

The palette is a restrained, high-end combination of vellum neutrals and a single signal accent.

### Primary
- **Signal Emerald** (#10B981): Used exclusively for active states, upvoted indicators, and progress bars. Its rarity is the point.

### Neutral
- **Midnight Charcoal** (#1C1C1C): The primary text and structural color. Used for deep-background surfaces and high-contrast labels.
- **Vellum Cream** (#F5F0E8): The primary background color. Provides a warm, paper-like feel that reduces eye strain in dark environments.

### Named Rules
**The Rarity Rule.** The Signal Emerald accent must never exceed 10% of the total screen area. It should feel like a highlighted note on a page, not a brand wash.

## 3. Typography

**Display Font:** Outfit (with sans-serif fallback)
**Body Font:** Inter (with sans-serif fallback)

**Character:** A pairing of a geometric, high-character display face for impact and a neutral, highly-legible sans for data and labels.

### Hierarchy
- **Display** (Bold (700), 1.1 line-height): Used for "Now Playing" titles and prominent session names.
- **Headline** (SemiBold (600), 1.2 line-height): Section headers like "Up Next".
- **Body** (Regular (400), 1.5 line-height): Track names and descriptions. Max line length of 65ch.
- **Label** (Bold (700), 0.05em letter-spacing, Uppercase): Artist names, vote counts, and metadata tags.

## 4. Elevation

The system uses multi-layered "3D depth" instead of single diffuse shadows. Surfaces feel like they have physical thickness (vellum sheets or cards).

### Shadow Vocabulary
- **Shadow 3D** (`box-shadow: 0 1px 1px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.1), 0 4px 4px rgba(0,0,0,0.1), 0 8px 8px rgba(0,0,0,0.1)`): Used on cards to simulate a stack of physical objects.

### Named Rules
**The Depth-on-Action Rule.** Cards are flat or have minimal depth at rest. Depth is amplified during interaction (flip, focus) to indicate the active state.

## 5. Components

### Buttons
- **Shape:** Pill-shaped (rounded-full).
- **Primary:** Vellum Cream background with Midnight Charcoal text.
- **Upvoted State:** Transitions to Signal Emerald background.
- **Interaction:** 150ms transition with a slight scale-down (95%) on click.

### Cards
- **Corner Style:** Subtle (4px radius).
- **Background:** Vellum Cream.
- **Shadow Strategy:** 3D multi-layered shadow when active or flipped.
- **Internal Padding:** Responsive (12px to 16px).

### Search FAB
- **Style:** Circular, glass-vellum backdrop (`backdrop-blur-xl`).
- **Icon:** Charcoal stroke (2.5px width) for maximum visibility.

### Search Overlay
- **Background:** Vellum Overlay (`bg-stone-50/90` with `backdrop-blur-2xl`).
- **Motion:** Slide-up from bottom with `cubic-bezier(0.16, 1, 0.3, 1)`.

## 6. Do's and Don'ts

### Do:
- **Do** use OKLCH for any new color derivations to maintain perceptual lightness.
- **Do** use uppercase for metadata labels to create editorial rhythm.
- **Do** maintain a minimum contrast ratio of 7:1 for all primary text.

### Don't:
- **Don't** use neon or cyberpunk gradients.
- **Don't** use side-stripe borders as indicators; use full background shifts or Signal Emerald text.
- **Don't** use "SaaS Blue" or default Tailwind colors.
- **Don't** wrap everything in cards; use white space and vellum layering to define sections.
