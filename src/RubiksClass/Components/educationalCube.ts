import type { RubiksCubeProps, StickerColor } from "./RubiksCube";

export const rowColors: readonly StickerColor[] = ["blue", "yellow", "red", "green", "orange", "white"];

/** Color only the chosen rows of the front face; retain faint colors elsewhere. */
export function coloredRows(size: number, rows: number, striped = true): RubiksCubeProps["faceAppearances"] {
    return {
        front: {
            stickers: Array.from({ length: size * size }, (_, index) => {
                const row = Math.floor(index / size);
                return { color: striped ? rowColors[row % rowColors.length] : undefined, muted: row >= rows };
            }),
        },
        back: { muted: true }, right: { muted: true }, left: { muted: true },
        top: { muted: true }, bottom: { muted: true },
    };
}

