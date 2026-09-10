import type { ComponentId } from "../Logic/navigation";
import { componentLabels } from "./navigationLabels";

export function MarkerIcon({ id }: { id: ComponentId }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor" stroke="currentColor" strokeWidth="2">
    {id === 0 ? <circle cx="16" cy="16" r="10" /> : id === 1 ? <path d="M16 4 29 27 H3 Z" /> : <rect x="6" y="6" width="20" height="20" rx="1" />}
  </svg>;
}

export function ComponentIcon({ id }: { id: ComponentId }) {
  return <svg viewBox="0 0 48 40" role="img" aria-label={componentLabels[id]} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20 H8 M40 20 H46" />
    {id === 0 ? <path d="M8 20 C8 1 40 1 40 20 C40 37 14 38 14 21 C14 9 34 10 34 21 C34 30 21 30 21 21 C21 17 27 17 27 21" /> : id === 1 ? <path d="M8 20 13 9 20 31 27 9 34 31 40 20" /> : <path d="M8 20 H17 M17 6 V34 M31 6 V34 M31 20 H40" />}
  </svg>;
}

export function Probe({ energy }: { energy?: number }) {
  return <span style={{ display: "inline-grid", width: "100%", height: "100%", placeItems: "center" }} role="img" aria-label={energy === undefined ? "Sonda" : `Sonda com ${energy} de energia`}>
    <svg viewBox="0 0 48 48" aria-hidden="true" style={{ gridArea: "1 / 1", width: "100%", height: "100%" }}>
      <path d="M38 20 47 24 38 28 M5 18 V30" fill="#ffc83d" stroke="#080d10" strokeWidth="2" />
      <rect x="7" y="7" width="32" height="34" rx="11" fill="#b1c3c8" stroke="#080d10" strokeWidth="3" />
      <rect x="11" y="12" width="24" height="24" rx="7" fill="#12303a" />
      {energy === undefined && <path d="M25 15 17 25 H23 L21 33 31 22 H25 Z" fill="#80e8f4" />}
    </svg>
    {energy !== undefined && <strong aria-hidden="true" style={{ gridArea: "1 / 1", color: "#e8fcff", fontWeight: 400, fontSize: "inherit", zIndex: 1 }}>{energy}</strong>}
  </span>;
}

export function DangerIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
    <path d="M7 3 H25 L30 25 26 29 H6 L2 25 Z" fill="#36161c" />
    <path d="M18 7 11 17 H17 L14 25 23 13 H17 Z" fill="currentColor" />
  </svg>;
}
