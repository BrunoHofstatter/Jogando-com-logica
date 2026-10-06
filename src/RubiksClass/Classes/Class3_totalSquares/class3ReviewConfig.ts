export const REVIEW_CONFIG = {
    rounds: 10, health: 9, wrongDamage: 1, escapeDamage: 3,
    travelSeconds: 28, turnSeconds: 10, successorAt: 0.55,
    rockDegrees: 8, rockSeconds: 6, sweepDegrees: 55, sweepSeconds: 10,
    spawnInterval: 1.2, activeTimeFloor: 12, cooldown: 0.45,
    projectileSeconds: 0.15, resolutionSeconds: 0.55, spawnDelay: 1,
    reactionSeconds: 0.35, dustSeconds: 0.9,
    successSeconds: 0.8, freezeSeconds: 5, clockSpeed: 2,
    practiceStop: 0.76, readableAt: 0.18,
} as const;

export const REVIEW_COLORS = ["blue", "red", "green", "orange", "yellow"] as const;
export type ReviewColor = typeof REVIEW_COLORS[number];
export const COLOR_DETAILS: Record<ReviewColor, { fill: string; light: string; adjective: string }> = {
    blue: { fill: "#3475e5", light: "#91bdff", adjective: "azul" },
    red: { fill: "#e54452", light: "#ff9ca3", adjective: "vermelha" },
    green: { fill: "#22b95c", light: "#90efb0", adjective: "verde" },
    orange: { fill: "#f18826", light: "#ffca89", adjective: "laranja" },
    yellow: { fill: "#efbf24", light: "#fff08a", adjective: "amarela" },
};
