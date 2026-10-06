import { useId, useLayoutEffect, useState, type RefObject } from 'react';
import styles from '../DiscoveryMultiplication.module.css';

export interface HintConnection { from: string; to: string; kind: 'multiplier' | 'operand' | 'carry' | 'units' }
/** Measure actual anchors so arrows stay attached through resizing and font loading. */
export function MultiplicationArrows({ host, connections }: {
  host: RefObject<HTMLDivElement | null>; connections: HintConnection[];
}) {
  const id = useId().replace(/:/g, '');
  const [paths, setPaths] = useState<{ d: string; kind: HintConnection['kind'] }[]>([]);
  const key = JSON.stringify(connections);
  useLayoutEffect(() => {
    const node = host.current;
    if (!node) return;
    const links: HintConnection[] = JSON.parse(key);
    const update = () => {
      const bounds = node.getBoundingClientRect();
      const grid = node.querySelector<HTMLElement>('[data-calculation-grid]');
      const hintArea = node.querySelector<HTMLElement>('[data-hint-area]');
      const gridBounds = grid?.getBoundingClientRect();
      const hintBounds = hintArea?.getBoundingClientRect();
      const rowGap = grid ? parseFloat(getComputedStyle(grid).rowGap) : 0;
      const next = links.flatMap((link, index) => {
        const a = node.querySelector<HTMLElement>(`[data-anchor="${link.from}"]`)?.getBoundingClientRect();
        const b = node.querySelector<HTMLElement>(`[data-anchor="${link.to}"]`)?.getBoundingClientRect();
        if (!a?.width || !b?.width) return [];
        const x1 = a.left + a.width / 2 - bounds.left;
        const x2 = b.left + b.width / 2 - bounds.left;
        const y1 = a.top - bounds.top;
        const y2 = b.top - bounds.top;
        const gap = Number.isFinite(rowGap) && rowGap > 0 ? rowGap : Math.min(a.height, b.height) * .2;
        // Travel in the empty row space and central gutter, never horizontally
        // across a neighboring digit. Both ends meet the TOP border vertically.
        const lift = (anchor: string, height: number) => anchor.startsWith('hint-')
          ? height * (.65 + index * .2) : gap * .8;
        const exitY = y1 - lift(link.from, a.height);
        const entryY = y2 - lift(link.to, b.height);
        const gutter = gridBounds && hintBounds && hintBounds.left > gridBounds.right
          ? gridBounds.right + (hintBounds.left - gridBounds.right) * (index + 1) / (links.length + 1) - bounds.left
          : (x1 + x2) / 2;
        const middleY = (exitY + entryY) / 2;
        // A short straight landing keeps the whole arrowhead aligned with the
        // border, rather than straddling the tight end of a curve.
        const landing = link.to.startsWith('hint-') ? b.height * .35 : gap * .65;
        return [{ kind: link.kind, d: `M ${x1} ${y1} C ${x1} ${exitY}, ${gutter} ${exitY}, ${gutter} ${middleY} C ${gutter} ${entryY}, ${x2} ${entryY}, ${x2} ${y2 - landing} L ${x2} ${y2}` }];
      });
      setPaths(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(node);
    node.querySelectorAll('[data-anchor]').forEach(element => observer?.observe(element));
    window.addEventListener('resize', update);
    return () => { observer?.disconnect(); window.removeEventListener('resize', update); };
  }, [host, key]);
  return <svg className={styles.arrows} aria-hidden="true">
    <defs>{(['multiplier', 'operand', 'carry', 'units'] as const).map(kind => <marker key={kind} id={`${id}-${kind}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="4" markerHeight="4" orient="auto">
      <path d="M 0 1 L 10 5 L 0 9 Z" className={styles[kind]} />
    </marker>)}</defs>
    {paths.map((path, index) => <path key={index} d={path.d} className={styles[path.kind]} markerEnd={`url(#${id}-${path.kind})`} />)}
  </svg>;
}
