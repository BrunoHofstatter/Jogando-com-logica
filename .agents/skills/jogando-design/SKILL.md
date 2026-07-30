---
name: jogando-design
description: This skill should be used when the user explicitly asks to "use the design skill", "follow the design system", "apply the jogando design", or "use the design guide".
version: 1.0.0
---

# Jogando com Lógica - Design System

**Jogando com Lógica** uses a "Cartoon Arcade" visual style: bright saturated colors, hard flat shadows, bold text outlines, chunky borders, and snappy press animations. No gradients. No soft shadows. No `px` or `rem` in layout.

## Units

Use only `vw`, `dvh`, `%`, `min()`, and `clamp()` for layout, spacing, and font sizes. `px` and `rem` are forbidden for layout. On desktop, prefer `vw`. On mobile, use `min(Xvw, Ydvh)` to scale with both axes.

## Typography

- Font: `"Cherry Bomb One", system-ui` everywhere
- `font-weight: 200; font-style: normal`
- Hard text outline: `-webkit-text-stroke: [size] [dark color]`
- Hard 3D text shadow: `text-shadow: 0 [size] 0 [dark color]`
- Set `padding-bottom` slightly larger than `padding-top` inside buttons because Cherry Bomb One sits visually high

## Button Pattern

Every interactive button on the platform follows this pattern:

```css
.button {
  font-family: "Cherry Bomb One", system-ui;
  font-weight: 200;
  background-color: [main color];
  color: [accent, usually gold/yellow];
  border: [0.3-0.6vw] solid [dark shade];
  border-radius: [2-5vw];
  -webkit-text-stroke: [0.1-0.3vw] [dark shade];
  padding: [top] [right] [bottom-larger] [left];
  line-height: 1;
  box-shadow: 0 [0.5-1.5vw] 0 [darkest shade];
  cursor: pointer;
  transition: all 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  justify-content: center;
}

.button:hover {
  background-color: [lighter shade];
  transform: translateY(-0.2vw);
  box-shadow: 0 [slightly bigger] 0 [darkest shade];
}

.button:active {
  transform: translateY([shadow size]);
  box-shadow: 0 [tiny] 0 [darkest shade];
}
```

The press effect works by moving the element down by roughly the shadow offset while shrinking the shadow to near zero, simulating a physical key press.

## Containers and Cards

Use the same principle as buttons: solid background, thick border, hard bottom shadow. No blur and no spread.

```css
.card {
  background-color: [main color];
  border: [0.4-0.6vw] solid [dark shade];
  border-radius: [3-5vw];
  box-shadow: 0 [1-2vw] 0 [darkest shade];
}
```

## Color Themes

Each game and section has its own color theme. Every theme should include a light background, a main action color, a dark border or shadow shade, and a gold or yellow accent for text.

When creating a new game, define its own color theme following the same structure. Do not reuse another game's palette.

## Layout

**Desktop:** Use flexbox or CSS Grid. Pages are generally horizontal, such as board plus info panel side by side or content split left and right.

**Mobile:** Use `@media (orientation: portrait) and (max-width: 650px)`. Restructure into a CSS Grid with 2-3 explicit rows defined in `dvh` such as `grid-template-rows: 40dvh 54dvh 0dvh`. Rows should sum to about `100dvh`. Stack sections vertically: info panel, then board, then action buttons.

### Mobile CSS Rules

**Redeclare every value.** Every size that appears in the desktop rules must be restated inside the media query using `min(Xvw, Ydvh)`. Never rely on desktop `vw` values carrying over to portrait phones.

**`min()` ratio.** Always write mobile sizes as `min(Xvw, Ydvh)`. The `dvh` value controls how much the element scales as the screen gets wider:

- `dvh` around 50% of `vw`: element barely grows with width
- `dvh` around 60% of `vw`: element scales more freely with width
- Use a ratio of about 55% by default; go lower to clamp growth and higher to allow it

Example: `min(15.5vw, 8dvh)` keeps the element compact as width grows.

**No colors in the mobile block.** Only override dimension values such as sizes, border widths, border radii, padding, font sizes, gaps, and box-shadow offsets. Colors, backgrounds, and text colors should stay in the desktop rules.

**Touch targets belong in the bottom half.** Put the board and action buttons in the lower rows of the grid. Passive read-only info such as score, turn indicator, captures, and timer goes in the top row. Inside a row, put tappable buttons at the bottom, never floating in the middle.

## Home Button

The home or back button is fixed at the top-right of every non-home screen and rendered by `App.tsx`. Keep that corner free on every page.

## Animations

- **Ambient loops:** subtle scale pulse or float with `2s` to `5s` duration
- **Interactions:** `0.1s` transitions for hover and active states. They should feel snappy, never slow
