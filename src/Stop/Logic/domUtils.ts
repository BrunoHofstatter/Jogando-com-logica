/**
 * Detects if the current device supports touch interactions.
 * This is a basic check and might need refinement for edge cases (like hybrids),
 * but detecting 'ontouchstart' or maxTouchPoints is usually sufficient for this context.
 */
export function isTouchDevice(): boolean {
    if (typeof window === "undefined") return false;
    // 'pointer: coarse' is the most reliable way to detect primary touch input
    // ignoring 'ontouchstart' which can be true on laptops with touchscreens but mouse usage
    return window.matchMedia("(pointer: coarse)").matches;
}
