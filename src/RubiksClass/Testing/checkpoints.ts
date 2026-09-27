export interface CubeSection { id: string; size: number }
export interface Checkpoint { id: string; label: string; stepIndex: number }
/** Resolve positions from the live lesson sequence, never a second question list. */
export function cubeCheckpoints(steps: readonly CubeSection[]): Checkpoint[] {
    const seen = new Set<string>();
    const sections = steps.flatMap((section, stepIndex) => {
        if (seen.has(section.id)) return [];
        seen.add(section.id);
        return [{ ...section, stepIndex }];
    });
    const counts = new Map<number, number>();
    sections.forEach(({ size }) => counts.set(size, (counts.get(size) ?? 0) + 1));
    const occurrences = new Map<number, number>();
    return sections.map(({ id, size, stepIndex }) => {
        const occurrence = (occurrences.get(size) ?? 0) + 1;
        occurrences.set(size, occurrence);
        return { id, stepIndex, label: `${counts.get(size)! > 1 ? `${occurrence}º ` : ""}${size}×${size}` };
    });
}
export function resolveCheckpoint(search: string, checkpoints: readonly Checkpoint[]) {
    const params = new URLSearchParams(search);
    const isCheckpoint = params.has("checkpoint");
    const checkpoint = checkpoints.find(item => item.id === params.get("checkpoint"));
    return { isCheckpoint, valid: !isCheckpoint || Boolean(checkpoint), stepIndex: checkpoint?.stepIndex ?? 0 };
}
export function checkpointUrl(route: string, id: string) {
    return `${route}?${new URLSearchParams({ checkpoint: id })}`;
}
