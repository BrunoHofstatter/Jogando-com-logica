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
