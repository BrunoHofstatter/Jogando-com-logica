# RubiksCube Component Notes

Use this when adding lesson animations to `src/RubiksClass/Components/RubiksCube.tsx`.

## Purpose

`RubiksCube` is a reusable visual component. It should not know about a specific class, question, or hint sequence. Lesson hooks should control timing and pass the current visual state as props.

## Sticker-Level Props

Use these for rows, columns, or small squares on one face:

- `highlightRegion`: highlights a row, column, or full face.
- `dimInactive`: dims stickers outside the highlighted region.
- `showIndices`: shows static numbers on highlighted stickers.
- `showCounting`: animates those sticker numbers with staggered timing.

## Face-Level Props

Use these for cube sides/faces as whole surfaces:

- `focusedFaceIndex`: highlights one whole face.
- `focusedFaceLabel`: shows one centered label on that face, such as `1` or `1 lado`.
- `scriptedRotation`: rotates the cube to a lesson-controlled angle.
- `disableInteraction`: prevents dragging while the lesson owns the animation.

Do not use `showCounting` to count cube sides. It counts stickers inside a region.

## Face Order

`focusedFaceIndex` uses this order:

```ts
0 // front
1 // back
2 // right
3 // left
4 // top
5 // bottom
```

`CUBE_FACE_ROTATIONS` is exported from `src/RubiksClass/Components/RubiksCubeAnimations.ts` in the same order.

## Class 3 Pattern

The equal-face Class 3 lesson uses `faceAppearances` to assign one target color
to selected named faces and `muted: true` to every excluded face. This selection
remains stable through hints. The original index mapping above is unchanged.

Optional motion controls preserve the original defaults for other callers:

- `autoRotate={false}` starts in a stationary view and suppresses post-drag inertia
  and automatic resumption. `initialRotation` sets that starting view.
- `scriptedMotionIsFrameBased` disables CSS transform interpolation when a lesson
  supplies its own animation frames.
- `interruptibleScript` allows a pointer gesture to take over a scripted view;
  `onInteractionStart` lets the owner cancel its animation before dragging.
- `onRotationChange` reports the manual/scripted orientation to the lesson owner.
- `focusedFaceLabelRotation` keeps labels upright on rotated top/bottom faces.

Class 3 owns tour timing and routing in `useFaceMotion.ts` and `class3Lesson.ts`.
It visits adjacent faces, tracks which selected faces were already counted, and
uses gray waypoints when necessary. It must not iterate renderer index order,
which places opposite faces next to each other. Reduced motion uses child-paced
views. Tour cancellation cleans up animation frames and leaves the current view.

## Class 3 Review Renderer

The desktop Class 3 cannon game uses `SummaryCube` in Class3_totalSquares rather
than altering the interactive lesson renderer. It has six CSS 3D faces with cached
SVG grid textures (`class3ReviewTextures.ts`), preserving exact sizes, named-face
mapping, and muted/colored appearance without one DOM element per sticker.
The game owns approach and Y motion through its foreground scene clock. Rounds
1–4 rock gently with three inspectable faces; 5–8 sweep continuously back and forth
with four inspectable faces (never back); 9–10 fully rotate with five. Practice and
intro use gentle rocking. `class3ReviewMotion.ts` constrains targets and distractors
to those inspectable sets: top always colored, additional sides adjacent, hidden
faces gray and bottom excluded. This does not change the lesson's manual inspection
or six-face counting tours. Solid clock/checkmark cubes use the same six-face
geometry without sticker grids, dark face borders, or gaps.

## Class 2 Pattern

Class 2 uses `returnToDefault` for free pointer and keyboard rotation without
starting automatic spin. `homeRotation` gives teaching a shallow left/top resting
view while review cubes retain their normal angle. After five idle seconds the cube
returns gently to that home orientation; a new gesture cancels the return.

`focusRequest` brings the current educational face home when a hint changes, and
`hintAnimationKey` replays the short row pulse plus sequential sticker and row-label
counting. These props are optional and do not change Class 3's frame-driven tour.

The snippets below show the underlying single-face props, not the current lesson
sequence or its tour ordering.

For "this is one side":

```tsx
<RubiksCube
  size={3}
  focusedFaceIndex={0}
  focusedFaceLabel="1 lado"
  scriptedRotation={CUBE_FACE_ROTATIONS[0]}
  dimInactive
  disableInteraction
/>
```

For "count all sides", keep the sequence in the class hook:

```ts
const faceStep = 0;

const cubeProps = {
  size: 3,
  focusedFaceIndex: faceStep,
  focusedFaceLabel: String(faceStep + 1),
  scriptedRotation: CUBE_FACE_ROTATIONS[faceStep],
  dimInactive: true,
  disableInteraction: true,
};
```

Useful Portuguese hint text:

- `Este é um lado do cubo. Quantos lados o cubo tem ao todo?`
- `Vamos contar todos os lados: 1, 2, 3, 4, 5, 6.`
