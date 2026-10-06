import { REVIEW_CONFIG as C } from "./class3ReviewConfig";
import { cannonAim, projectClock, projectCube, resolveAim, sceneTargets, yaw } from "./class3ReviewGeometry";
import type { Point, Projection, ReviewState } from "./class3ReviewTypes";

function place(element: HTMLElement, point: Projection, aspect: number, width: number) {
    element.style.left = `${point.x * 100}%`;
    element.style.top = `${point.y * 100}%`;
    element.style.width = `${point.size * 100}%`;
    element.style.height = `${point.size * aspect * 100}%`;
    element.style.setProperty("--cube-half", `${point.size * width / window.innerWidth * 50}vw`);
    element.style.zIndex = String(10 + Math.round(point.depth * 100));
}

/** Paint transforms/positions only. Face components do not render on motion frames. */
export function paintScene(root: HTMLDivElement, state: ReviewState, pointer: Point | null) {
    const width = root.clientWidth, height = root.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    const rounds = state.phase === "practice" ? [state.practice] : state.rounds;
    for (const node of root.querySelectorAll<HTMLElement>("[data-motion]")) {
        const id = node.dataset.motion;
        const round = rounds.find(round => round.cubes.some(cube => cube.id === id) || `clock-${round.id}` === id);
        if (!round) continue;
        const cube = round.cubes.find(cube => cube.id === id);
        place(node, cube ? projectCube(cube, round.progress) : projectClock(round), aspect, width);
        node.style.setProperty("--yaw", `${cube ? yaw(cube, state.inspectionTime) : state.inspectionTime * 28}deg`);
        const reaction = cube ? round.reactions[cube.id] - state.inspectionTime : 0;
        node.style.filter = reaction > 0 ? "sepia(1) saturate(6) hue-rotate(310deg)" : round.hitTarget === id && round.status === "resolving" ? "brightness(1.2)" : "";
        node.style.transform = reaction > 0 ? `translate(-50%, -50%) translate(${Math.sin(reaction * 90) * 0.4}vw, ${-Math.sin(reaction / C.reactionSeconds * Math.PI) * 1.5}dvh)` : "translate(-50%, -50%)";
    }
    for (const node of root.querySelectorAll<HTMLElement>("[data-effect]")) {
        const effect = state.effects.find(effect => effect.id === Number(node.dataset.effect));
        if (!effect) continue;
        const age = state.inspectionTime - effect.started;
        let point = effect.point;
        if (effect.kind === "pellet" && effect.from) {
            const t = Math.min(1, age / effect.duration);
            point = { ...point, x: effect.from.x + (point.x - effect.from.x) * t, y: effect.from.y + (point.y - effect.from.y) * t, size: 0.009 };
            const angle = Math.atan2((effect.point.y - effect.from.y) * height, (effect.point.x - effect.from.x) * width) * 180 / Math.PI;
            node.style.setProperty("--pellet-angle", `${angle}deg`);
        }
        place(node, point, aspect, width);
        node.style.zIndex = "150";
        const dustAge = effect.kind === "wrong" ? Math.max(0, age - C.reactionSeconds) : age;
        const dustProgress = dustAge / C.dustSeconds;
        node.style.opacity = effect.kind === "dust" || effect.kind === "wrong" && age >= C.reactionSeconds ? String(Math.max(0, Math.min(1, (1 - dustProgress) * 1.7))) : "1";
        node.style.transform = effect.kind === "dust" || effect.kind === "wrong" && age >= C.reactionSeconds
            ? `translate(-50%, -50%) translateY(${-dustProgress * 1.5}dvh) scale(${1.15 + dustProgress * 0.95})`
            : effect.kind === "wrong" ? `translate(-50%, -50%) translate(${Math.sin(age * 90) * 0.4}vw, ${-Math.sin(age / C.reactionSeconds * Math.PI) * 1.5}dvh)` : "translate(-50%, -50%)";
        node.style.setProperty("--yaw", `${effect.cube ? yaw(effect.cube, effect.started) : -25}deg`);
        if (effect.kind === "wrong") {
            node.querySelector<HTMLElement>("[data-wrong-cube]")!.style.display = age < C.reactionSeconds ? "block" : "none";
            node.querySelector<HTMLElement>("[data-wrong-dust]")!.style.display = age < C.reactionSeconds ? "none" : "block";
        }
    }
    const crosshair = root.querySelector<HTMLElement>("[data-crosshair]");
    if (crosshair) {
        crosshair.style.display = pointer ? "block" : "none";
        if (pointer) {
            crosshair.style.left = `${pointer.x * 100}%`; crosshair.style.top = `${pointer.y * 100}%`;
            crosshair.dataset.assisted = String(resolveAim(sceneTargets(state), pointer, aspect) !== null);
        }
    }
    const barrel = root.querySelector<SVGGElement>("[data-cannon-barrel]");
    const recoil = root.querySelector<SVGGElement>("[data-cannon-recoil]");
    if (barrel) barrel.setAttribute("transform", `rotate(${cannonAim(pointer ?? { x: 0.5, y: 0.3 }, aspect).angle} 50 70)`);
    const shotAge = state.inspectionTime - state.lastShot;
    if (recoil) recoil.setAttribute("transform", `translate(0 ${shotAge < 0.2 ? Math.sin(shotAge / 0.2 * Math.PI) * 7 : 0})`);
    const muzzle = root.querySelector<HTMLElement>("[data-muzzle]");
    if (muzzle) {
        const point = cannonAim(pointer ?? { x: 0.5, y: 0.3 }, aspect).muzzle;
        muzzle.style.left = `${point.x * 100}%`; muzzle.style.top = `${point.y * 100}%`;
        muzzle.style.opacity = shotAge < 0.12 ? String(1 - shotAge / 0.12) : "0";
    }
}
