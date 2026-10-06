import { COLOR_DETAILS, type ReviewColor } from "./class3ReviewConfig";

const textures = new Map<string, string>();
/** One cached image per face appearance instead of n² sticker elements. */
export function faceTexture(size: number, color: ReviewColor, muted: boolean) {
    const key = `${size}-${color}-${muted}`;
    if (textures.has(key)) return textures.get(key)!;
    const fill = muted ? "#aeb4bc" : COLOR_DETAILS[color].fill;
    const light = muted ? "#d0d4d9" : COLOR_DETAILS[color].light;
    const cell = 100 / size, gap = cell * 0.06;
    const squares = Array.from({ length: size * size }, (_, index) =>
        `<rect x="${index % size * cell + gap}" y="${Math.floor(index / size) * cell + gap}" width="${cell - 2 * gap}" height="${cell - 2 * gap}" rx="${cell * 0.08}" fill="url(#s)" stroke="${light}" stroke-width="${cell * 0.035}"/>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="s" x2=".8" y2="1"><stop stop-color="${light}"/><stop offset="1" stop-color="${fill}"/></linearGradient></defs><rect width="100" height="100" rx="3" fill="#303948"/>${squares}</svg>`;
    const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    textures.set(key, url);
    return url;
}
