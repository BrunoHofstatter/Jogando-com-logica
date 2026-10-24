import { useId, useLayoutEffect, useState } from "react";
import type { RefObject } from "react";
import styles from "./tutorial.module.css";

export interface TutorialConnection { from: string; to: string; elbow?: boolean }
interface Line { x1: number; x2: number; y1: number; y2: number; via?: Array<{ x: number; y: number }> }
export default function TutorialPointers({ scene, connections, revision }: { scene: RefObject<HTMLDivElement | null>; connections: TutorialConnection[]; revision: number }) {
  const id = useId().replace(/:/g, "");
  const [lines, setLines] = useState<Line[]>([]);
  const key = JSON.stringify(connections);
  useLayoutEffect(() => {
    const host = scene.current;
    if (!host) return;
    const links = JSON.parse(key) as TutorialConnection[];
    const measure = () => {
      const bounds = host.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const next: Line[] = [];
      links.forEach(link => {
        const a = host.querySelector(link.from)?.getBoundingClientRect();
        const b = host.querySelector(link.to)?.getBoundingClientRect();
        if (!a || !b) return;
        const tx = b.left + b.width / 2, ty = b.top + b.height / 2;
        // Enter the piece-value term from above, without crossing the energy result.
        const via = link.elbow ? { x: tx, y: b.top - Math.min(b.width, b.height) * .6 } : undefined;
        const sx = link.elbow ? a.left + a.width / 2 : Math.max(a.left, Math.min(a.right, tx));
        const sy = link.elbow ? a.bottom : Math.max(a.top, Math.min(a.bottom, ty));
        const finalX = via?.x ?? sx, finalY = via?.y ?? sy;
        const dx = tx - finalX, dy = ty - finalY, length = Math.hypot(dx, dy);
        // Stop outside the target rectangle so arrowheads never cover its number.
        const inset = length ? Math.min(dx ? b.width * length / (2 * Math.abs(dx)) : Infinity, dy ? b.height * length / (2 * Math.abs(dy)) : Infinity) + Math.min(b.width, b.height) * .1 : 0;
        const scale = length ? Math.max(0, (length - inset) / length) : 0;
        const boardBounds = host.querySelector('[data-practice-board]')?.getBoundingClientRect();
        const route = via && boardBounds ? [
          { x: sx, y: a.bottom + a.height * .8 },
          { x: boardBounds.left - Math.min(b.width, b.height) * .6, y: a.bottom + a.height * .8 },
          via,
        ] : via ? [via] : undefined;
        next.push({ x1: (sx - bounds.left) / bounds.width * 100, y1: (sy - bounds.top) / bounds.height * 100, x2: (finalX + dx * scale - bounds.left) / bounds.width * 100, y2: (finalY + dy * scale - bounds.top) / bounds.height * 100,
          ...(route ? { via: route.map(p => ({ x: (p.x - bounds.left) / bounds.width * 100, y: (p.y - bounds.top) / bounds.height * 100 })) } : {}) });
      });
      setLines(next);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(host);
    const board = host.querySelector('[data-practice-board]');
    if (board) observer?.observe(board);
    links.forEach(link => [link.from, link.to].forEach(selector => { const element = host.querySelector(selector); if (element) observer?.observe(element); }));
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [scene, key, revision]);
  return <svg className={styles.pointers} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs><marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3" markerHeight="3" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#92400e" /></marker></defs>
    {lines.map((line, index) => Array.isArray(line.via)
      ? <polyline key={index} points={`${line.x1},${line.y1} ${line.via.map(p => `${p.x},${p.y}`).join(" ")} ${line.x2},${line.y2}`} fill="none" stroke="#92400e" strokeWidth={.5} strokeLinejoin="round" markerEnd={`url(#${id})`} />
      : <line key={index} x1={line.x1} x2={line.x2} y1={line.y1} y2={line.y2} stroke="#92400e" strokeWidth={.5} markerEnd={`url(#${id})`} />)}
  </svg>;
}
