import React, { useRef, useState, useCallback, useEffect } from "react";
import styles from "./RubiksCube.module.css";

// --- Types -------------------------------------------------------------------

type RotationMode = "auto" | "dragging" | "idle" | "locked";

export interface HighlightRegion {
  type: "row" | "col" | "face";
  index: number;
}

interface RubiksCubeProps {
  /** Grid dimension: 2 = 2×2, 3 = 3×3, etc. */
  size: number;
  /** Total visual cube size in vw units (default 25). */
  cubeSize?: number;
  /** When true, snap to front angle and disable interaction. */
  resetToFront?: boolean;
  /** Highlight a row, column, or entire face on the front face. Can be an array. */
  highlightRegion?: HighlightRegion | HighlightRegion[] | null;
  /** Dim stickers outside the highlighted region (default false). */
  dimInactive?: boolean;
  /** Show index numbers (1, 2, 3...) on highlighted stickers (default false). */
  showIndices?: boolean;
  /** Animate counting numbers with staggered popIn (default false). */
  showCounting?: boolean;
}

// --- Face config -------------------------------------------------------------

interface FaceConfig {
  name: string;
  className: string;
  colorClass: string;
  /** Whether text on this face color should be dark (for light stickers). */
  darkText: boolean;
}

const FACES: FaceConfig[] = [
  { name: "front", className: styles.front, colorClass: styles.colorGreen, darkText: false },
  { name: "back", className: styles.back, colorClass: styles.colorBlue, darkText: false },
  { name: "right", className: styles.right, colorClass: styles.colorRed, darkText: false },
  { name: "left", className: styles.left, colorClass: styles.colorOrange, darkText: false },
  { name: "top", className: styles.top, colorClass: styles.colorWhite, darkText: true },
  { name: "bottom", className: styles.bottom, colorClass: styles.colorYellow, darkText: true },
];

// --- Constants ---------------------------------------------------------------

const FRONT_ANGLE = { x: -20, y: -25 };
const SENSITIVITY = 0.3;
const RESUME_DELAY_MS = 10000;
const SPIN_DURATION_S = 100; // seconds for one full 360° rotation

// --- Helpers -----------------------------------------------------------------

/**
 * Extract rotateX / rotateY from a CSS matrix3d string.
 *
 * CSS matrix3d values are in column-major order:
 *   matrix3d(a1, b1, c1, d1,  a2, b2, c2, d2,  a3, b3, c3, d3,  a4, b4, c4, d4)
 *
 * Row/Col mapping:
 *   Row 0: [0]  [4]  [8]  [12]
 *   Row 1: [1]  [5]  [9]  [13]
 *   Row 2: [2]  [6]  [10] [14]
 *   Row 3: [3]  [7]  [11] [15]
 *
 * CSS `transform: rotateX(a) rotateY(b)` multiplies left-to-right → M = Rx(a) · Ry(b):
 *   m11 = cos(a)    → v[5]
 *   m21 = sin(a)    → v[6]
 *   m00 = cos(b)    → v[0]
 *   m02 = sin(b)    → v[8]
 *
 *   rotX = atan2(v[6], v[5])
 *   rotY = atan2(v[8], v[0])
 */
function matrixToAngles(matrix: string): { x: number; y: number } {
  const match = matrix.match(/matrix3d\((.+)\)/);
  if (!match) {
    return { x: -25, y: 0 };
  }

  const v = match[1].split(",").map((s) => parseFloat(s.trim()));

  const rotX = Math.atan2(v[6], v[5]);
  const rotY = Math.atan2(v[8], v[0]);

  return {
    x: (rotX * 180) / Math.PI,
    y: (rotY * 180) / Math.PI,
  };
}

/** Normalize degrees to 0..360 range */
function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Check if a sticker index (in a size×size grid) belongs to the highlighted region.
 */
function isStickerHighlighted(
  stickerIdx: number,
  size: number,
  region: HighlightRegion | HighlightRegion[]
): boolean {
  if (Array.isArray(region)) {
    return region.some((r) => isStickerHighlighted(stickerIdx, size, r));
  }

  switch (region.type) {
    case "row": {
      const rowStart = region.index * size;
      return stickerIdx >= rowStart && stickerIdx < rowStart + size;
    }
    case "col": {
      return stickerIdx % size === region.index;
    }
    case "face": {
      return true; // All stickers on the target face
    }
    default:
      return false;
  }
}

/**
 * Get the sequential display number for a sticker within its highlighted region.
 * Returns the 1-based position within the region (left→right for rows, top→bottom for cols).
 */
function getRegionDisplayIndex(
  stickerIdx: number,
  size: number,
  region: HighlightRegion | HighlightRegion[]
): number {
  if (Array.isArray(region)) {
    // If multiple regions highlight this sticker, pick the first one for the numbering
    const match = region.find((r) => isStickerHighlighted(stickerIdx, size, r));
    if (!match) return 0;
    return getRegionDisplayIndex(stickerIdx, size, match);
  }

  switch (region.type) {
    case "row":
      return (stickerIdx % size) + 1;
    case "col":
      return Math.floor(stickerIdx / size) + 1;
    case "face":
      return stickerIdx + 1;
    default:
      return 0;
  }
}

// --- Component ---------------------------------------------------------------

const RubiksCube: React.FC<RubiksCubeProps> = ({
  size,
  cubeSize = 25,
  resetToFront = false,
  highlightRegion = null,
  dimInactive = false,
  showIndices = false,
  showCounting = false,
}) => {
  const cubeRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<RotationMode>("auto");
  const [rotation, setRotation] = useState({ x: -25, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inertia: velocity (degrees/frame) and animation frame id
  const velocity = useRef({ x: 0, y: 0 });
  const [isHighVelocity, setIsHighVelocity] = useState(false);
  const rafId = useRef<number | null>(null);
  // Separately settles the X angle back to -25deg after auto-spin resumes
  const xNormalizeRaf = useRef<number | null>(null);

  // Mirrors rotation state in real-time so inertia callbacks don't close over stale state.
  // This lets us read the final position to schedule resumeAuto WITHOUT putting
  // a setTimeout inside a setRotation updater (which would double-fire in React Strict Mode).
  const rotationRef = useRef({ x: -25, y: 0 });

  // Negative animation-delay to resume auto-spin from the current Y angle
  const [animOffset, setAnimOffset] = useState(0);
  // X angle at the moment inertia stopped — smoothly eased back to -25deg on resume
  const [autoX, setAutoX] = useState(-25);

  // --- resetToFront effect ---------------------------------------------------
  useEffect(() => {
    if (resetToFront) {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      setRotation({ x: FRONT_ANGLE.x, y: FRONT_ANGLE.y });
      setMode("locked");
    } else {
      // Unlock: go back to auto from the locked angle
      if (mode === "locked") {
        setAnimOffset(-(normalizeDeg(FRONT_ANGLE.y) / 360) * SPIN_DURATION_S);
        setMode("auto");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToFront]);

  // --- Switch to auto with correct offset ------------------------------------
  const resumeAuto = useCallback((fromX: number, fromY: number) => {
    const offset = -(normalizeDeg(fromY) / 360) * SPIN_DURATION_S;
    setAnimOffset(offset);
    setAutoX(fromX);
    setMode("auto");

    // Gently settle X back to -25deg so weird tilts don't persist during auto-spin.
    // We use a lerp RAF loop so the return is smooth, not a snap.
    if (xNormalizeRaf.current !== null) cancelAnimationFrame(xNormalizeRaf.current);
    const TARGET_X = -25;
    const SETTLE_LERP = 0.0005; // ~2-3s to settle depending on distance
    const settleLoop = () => {
      setAutoX((prev) => {
        const next = prev + (TARGET_X - prev) * SETTLE_LERP;
        if (Math.abs(next - TARGET_X) < 0.1) {
          xNormalizeRaf.current = null;
          return TARGET_X;
        }
        xNormalizeRaf.current = requestAnimationFrame(settleLoop);
        return next;
      });
    };
    xNormalizeRaf.current = requestAnimationFrame(settleLoop);
  }, []);

  // --- Pointer handlers ------------------------------------------------------

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);

      // Cancel any running inertia or settle loops
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (xNormalizeRaf.current !== null) {
        cancelAnimationFrame(xNormalizeRaf.current);
        xNormalizeRaf.current = null;
      }
      if (resumeTimer.current) clearTimeout(resumeTimer.current);

      // Reset velocity on new drag
      velocity.current = { x: 0, y: 0 };

      // Snapshot current rotation from computed style ONLY when leaving auto mode.
      // In auto mode the CSS keyframe animation runs independently of React state,
      // so we must read the real angle from the DOM. In idle/inertia mode,
      // rotationRef is always up-to-date — no DOM read needed.
      if (mode === "auto" && cubeRef.current) {
        const computed = getComputedStyle(cubeRef.current).transform;
        const snapped = matrixToAngles(computed);
        rotationRef.current = snapped; // keep ref in sync
        setRotation(snapped);
      }

      lastPointer.current = { x: e.clientX, y: e.clientY };
      setMode("dragging");
    },
    [mode]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (mode !== "dragging") return;

      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      // Track velocity and update rotationRef in sync with state
      setRotation((prev) => {
        const cosX = Math.cos((prev.x * Math.PI) / 180);
        const hFactor = cosX >= 0 ? 1 : -1;

        const deltaX = -dy * SENSITIVITY;
        const deltaY = dx * SENSITIVITY * hFactor;

        // Smooth velocity with exponential moving average
        let newVx = velocity.current.x * 0.6 + deltaX * 0.4;
        let newVy = velocity.current.y * 0.6 + deltaY * 0.4;

        // Cap maximum velocity to prevent massive pixel jumps and lag on large cubes
        const MAX_VELOCITY = 20;
        if (newVx > MAX_VELOCITY) newVx = MAX_VELOCITY;
        if (newVx < -MAX_VELOCITY) newVx = -MAX_VELOCITY;
        if (newVy > MAX_VELOCITY) newVy = MAX_VELOCITY;
        if (newVy < -MAX_VELOCITY) newVy = -MAX_VELOCITY;

        velocity.current = { x: newVx, y: newVy };

        // Track high velocity for animation disabling
        const speed = Math.abs(newVx) + Math.abs(newVy);
        if (speed > 1 && !isHighVelocity) setIsHighVelocity(true);
        else if (speed <= 1 && isHighVelocity) setIsHighVelocity(false);

        const next = { x: prev.x + deltaX, y: prev.y + deltaY };
        rotationRef.current = next; // ref update inside updater is fine (idempotent)
        return next;
      });
    },
    [mode]
  );

  const onPointerUp = useCallback(() => {
    if (mode !== "dragging") return;

    setMode("idle");

    // Launch inertia decay loop
    const FRICTION = 0.90; // velocity multiplier per frame (lower = stops faster)
    const MIN_VELOCITY = 0.01; // degrees/frame threshold to stop

    const inertiaLoop = () => {
      velocity.current = {
        x: velocity.current.x * FRICTION,
        y: velocity.current.y * FRICTION,
      };

      const speed = Math.abs(velocity.current.x) + Math.abs(velocity.current.y);

      // Update high velocity state
      if (speed <= 0.5 && isHighVelocity) {
        setIsHighVelocity(false);
      }

      if (speed < MIN_VELOCITY) {
        // Velocity negligible — schedule auto-spin resume.
        // CRITICAL: We read rotationRef (not state) and schedule OUTSIDE of any
        // setRotation updater. Putting setTimeout inside a state updater causes
        // React Strict Mode to invoke it twice, spawning an orphaned timer that
        // fires at the wrong time and calls resumeAuto from the wrong position.
        rafId.current = null;
        resumeTimer.current = setTimeout(() => {
          resumeAuto(rotationRef.current.x, rotationRef.current.y);
        }, RESUME_DELAY_MS);
        return;
      }

      setRotation((prev) => {
        const next = {
          x: prev.x + velocity.current.x,
          y: prev.y + velocity.current.y,
        };
        rotationRef.current = next; // keep ref in sync
        return next;
      });

      rafId.current = requestAnimationFrame(inertiaLoop);
    };

    rafId.current = requestAnimationFrame(inertiaLoop);
  }, [mode, resumeAuto]);

  // Cleanup timers and animation frames on unmount
  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      if (xNormalizeRaf.current !== null) cancelAnimationFrame(xNormalizeRaf.current);
    };
  }, []);

  // --- Build class names & styles --------------------------------------------

  const cubeClasses = [
    styles.cube,
    mode === "auto" ? styles.autoRotate : "",
    mode === "dragging" || mode === "idle" ? styles.dragging : "",
    mode === "locked" ? styles.locked : "",
    isHighVelocity ? styles.fastSpin : "",
  ]
    .filter(Boolean)
    .join(" ");

  // In auto mode: use animation-delay to resume from current angle.
  // In dragging/locked: use inline transform.
  const inlineStyle: React.CSSProperties =
    mode === "auto"
      ? { animationDelay: `${animOffset}s` }
      : { transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` };

  // --- Sticker rendering helper ----------------------------------------------

  const hasHighlight = highlightRegion !== null;

  const renderSticker = (
    face: FaceConfig,
    stickerIdx: number,
    isFrontFace: boolean
  ) => {
    // Normalize to array
    const regions = Array.isArray(highlightRegion)
      ? highlightRegion
      : highlightRegion
        ? [highlightRegion]
        : [];

    const isHighlighted = regions.some((r) => {
      const isTargetFace =
        r.type === "face" ? face.name === FACES[r.index]?.name : isFrontFace;
      return isTargetFace && isStickerHighlighted(stickerIdx, size, r);
    });

    const isDimmed = regions.length > 0 && dimInactive && !isHighlighted;

    const stickerClasses = [
      styles.sticker,
      face.colorClass,
      isHighlighted ? styles.highlighted : "",
      isDimmed ? styles.dimmed : "",
    ]
      .filter(Boolean)
      .join(" ");

    // Show counting number inside highlighted stickers
    const shouldShowNumber =
      isHighlighted && (showIndices || showCounting);

    const displayNum = shouldShowNumber
      ? getRegionDisplayIndex(stickerIdx, size, highlightRegion!)
      : 0;

    return (
      <div key={stickerIdx} className={stickerClasses}>
        {shouldShowNumber && (
          <span
            className={`${styles.stickerIndex} ${face.darkText ? styles.darkText : ""}`}
            style={{ "--i": displayNum - 1 } as React.CSSProperties}
          >
            {displayNum}
          </span>
        )}
      </div>
    );
  };

  // --- Render ----------------------------------------------------------------

  const cssVars = {
    "--cube-size": `${cubeSize}vw`,
    "--grid-size": String(size),
    "--spin-duration": `${SPIN_DURATION_S}s`,
    // Preserve the user's X tilt when auto-spin resumes (prevents snap to -25deg)
    "--auto-x": `${autoX}deg`,
  } as React.CSSProperties;

  const stickerCount = size * size;

  return (
    <div className={styles.scene} style={cssVars}>
      <div
        ref={cubeRef}
        className={cubeClasses}
        style={inlineStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Inner solid core — blocks visibility through rounded outer edges */}
        <div className={styles.innerCore}>
          <div className={`${styles.innerCoreFace} ${styles.innerFront}`} />
          <div className={`${styles.innerCoreFace} ${styles.innerBack}`} />
          <div className={`${styles.innerCoreFace} ${styles.innerRight}`} />
          <div className={`${styles.innerCoreFace} ${styles.innerLeft}`} />
          <div className={`${styles.innerCoreFace} ${styles.innerTop}`} />
          <div className={`${styles.innerCoreFace} ${styles.innerBottom}`} />
        </div>
        {FACES.map((face) => (
          <div
            key={face.name}
            className={`${styles.face} ${face.className}`}
          >
            {Array.from({ length: stickerCount }, (_, i) =>
              renderSticker(face, i, face.name === "front")
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RubiksCube;
