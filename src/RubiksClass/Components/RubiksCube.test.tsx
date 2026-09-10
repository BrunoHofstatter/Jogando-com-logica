import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RubiksCube from "./RubiksCube";
import styles from "./RubiksCube.module.css";

describe("educational cube appearances", () => {
    it("keeps original face colors and no grouping overlays for existing callers", () => {
        const html = renderToStaticMarkup(<RubiksCube size={2} />);
        for (const color of ["colorGreen", "colorBlue", "colorRed", "colorOrange", "colorWhite", "colorYellow"]) {
            expect(html.split(styles[color]).length - 1).toBe(4);
        }
        expect(html).not.toContain(styles.rowGuide);
        expect(html).not.toContain(styles.excludedSticker);
        expect(html).not.toContain(styles.patternCover);
    });

    it("supports face defaults, sticker overrides, and contrast on recolored stickers", () => {
        const html = renderToStaticMarkup(<RubiksCube size={2}
            faceAppearances={{ front: { color: "blue", muted: true, stickers: [{ color: "yellow", muted: false }] }, back: { color: "blue" } }}
            highlightRegion={{ type: "row", index: 0 }} showIndices
            rowGuides={{ front: [{ row: 0, label: "2" }, { row: 8, label: "invalid" }] }} />);
        expect(html.split(styles.excludedSticker).length - 1).toBe(3);
        expect(html.split(styles.darkText).length - 1).toBe(1);
        expect(html.split(styles.colorBlue).length - 1).toBe(7);
        expect(html).toContain(styles.rowLabel);
        expect(html).not.toContain("invalid");
    });
});
