import { useId, useLayoutEffect, useState } from "react";
import type { RefObject } from "react";
import styles from "./tutorial.module.css";

export interface TutorialConnection { from: string; to: string; guide?: boolean }
interface Line { x1: number; x2: number; y1: number; y2: number; guide: boolean }
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
        const sx = link.guide ? a.left + a.width / 2 : Math.max(a.left, Math.min(a.right, tx));
        const sy = link.guide ? a.top + a.height / 2 : Math.max(a.top, Math.min(a.bottom, ty));
        const dx = tx - sx, dy = ty - sy, length = Math.hypot(dx, dy);
        const scale = length ? Math.max(0, (length - Math.min(b.width, b.height) * .23) / length) : 0;
        next.push({ x1: (sx - bounds.left) / bounds.width * 100, y1: (sy - bounds.top) / bounds.height * 100, x2: (sx + dx * scale - bounds.left) / bounds.width * 100, y2: (sy + dy * scale - bounds.top) / bounds.height * 100, guide: !!link.guide });
      });
      setLines(next);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(host);
    links.forEach(link => [link.from, link.to].forEach(selector => { const element = host.querySelector(selector); if (element) observer?.observe(element); }));
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [scene, key, revision]);
  return <svg className={styles.pointers} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs><marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3" markerHeight="3" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#92400e" /></marker></defs>
    {lines.map((line, index) => <line key={index} x1={line.x1} x2={line.x2} y1={line.y1} y2={line.y2} stroke={line.guide ? "#d97706" : "#92400e"} strokeWidth={line.guide ? .65 : .5} markerEnd={`url(#${id})`} />)}
  </svg>;
}
