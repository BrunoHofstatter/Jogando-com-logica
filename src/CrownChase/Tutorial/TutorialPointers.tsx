import { useId, useLayoutEffect, useState } from "react";
import type { RefObject } from "react";
import type { MoveIntent, Position } from "../Logic/v2";
import styles from "./tutorial.module.css";

interface PointerProps {
  activation: number;
  scene: RefObject<HTMLDivElement | null>;
  primary: RefObject<HTMLDivElement | null>;
  secondary: RefObject<HTMLDivElement | null>;
  primaryTargets: Position[];
  secondaryTarget?: Position;
  guidance?: MoveIntent | null;
}
interface Line { x1: number; y1: number; x2: number; y2: number; guide: boolean }

/** Measure actual cells and pop-ups so pointers survive resizing and wrapping. */
export default function TutorialPointers({ activation, scene, primary, secondary, primaryTargets, secondaryTarget, guidance }: PointerProps) {
  const markerId = useId().replace(/:/g, "");
  const [lines, setLines] = useState<Line[]>([]);
  const targetsKey = primaryTargets.map(p => p.row + ":" + p.col).join(",");
  const secondaryKey = secondaryTarget ? secondaryTarget.row + ":" + secondaryTarget.col : "";
  const guideKey = guidance ? [guidance.from.row, guidance.from.col, guidance.to.row, guidance.to.col].join(":") : "";
  useLayoutEffect(() => {
    const host = scene.current;
    if (!host) return;
    const measure = () => {
      const bounds = host.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const next: Line[] = [];
      const cell = (key: string) => {
        const [row, col] = key.split(":").map(Number);
        return host.querySelector<HTMLElement>('[data-square="' + String.fromCharCode(97 + col) + (row + 1) + '"]')?.getBoundingClientRect();
      };
      const add = (source: DOMRect | undefined, target: DOMRect | undefined, guide = false) => {
        if (!source || !target) return;
        const tx = target.left + target.width / 2, ty = target.top + target.height / 2;
        const sx = guide ? source.left + source.width / 2 : Math.max(source.left, Math.min(source.right, tx));
        const sy = guide ? source.top + source.height / 2 : Math.max(source.top, Math.min(source.bottom, ty));
        // Stop just before the symbol, preserving its readability.
        const dx = tx - sx, dy = ty - sy, length = Math.hypot(dx, dy);
        const inset = Math.min(target.width, target.height) * .25;
        const scale = length ? Math.max(0, (length - inset) / length) : 0;
        next.push({ x1: (sx - bounds.left) / bounds.width * 100, y1: (sy - bounds.top) / bounds.height * 100,
          x2: (sx + dx * scale - bounds.left) / bounds.width * 100, y2: (sy + dy * scale - bounds.top) / bounds.height * 100, guide });
      };
      if (primary.current) for (const key of targetsKey.split(",").filter(Boolean)) add(primary.current.getBoundingClientRect(), cell(key));
      if (secondary.current && secondaryKey) add(secondary.current.getBoundingClientRect(), cell(secondaryKey));
      if (guideKey) {
        const [r, c, r2, c2] = guideKey.split(":");
        add(cell(r + ":" + c), cell(r2 + ":" + c2), true);
      }
      setLines(next);
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    [host, primary.current, secondary.current].forEach(node => { if (node) observer?.observe(node); });
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [activation, scene, primary, secondary, targetsKey, secondaryKey, guideKey]);

  return <svg className={styles.pointers} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#713f12" /></marker></defs>
    {lines.map((line, index) => <line key={index} {...{ x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2 }} className={line.guide ? styles.guideLine : undefined} stroke="#713f12" strokeWidth={line.guide ? .65 : .45} markerEnd={"url(#" + markerId + ")"} />)}
  </svg>;
}
