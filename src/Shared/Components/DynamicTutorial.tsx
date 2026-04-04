import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowBigRightDash, ArrowBigLeftDash } from "lucide-react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TutorialPlacement =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "center"
  | "auto";

export interface TutorialStep {
  id: string;
  target?: string; // CSS selector or 'none' for centered
  highlight?: boolean; // Show spotlight around target
  secondaryTargets?: string[]; // Additional CSS selectors to highlight
  placement?: TutorialPlacement; // 'auto' will choose best position
  title?: string;
  body: React.ReactNode;
  image?: string; // Optional image URL
}

export interface TutorialStyles {
  skipBtn?: string;
  spotlight?: string;
  tooltip?: string;
  arrow?: string;
  title?: string;
  stepImage?: string;
  body?: string;
  controls?: string;
  backBtn?: string;
  nextBtnContainer?: string;
  nextBtn?: string;
}

export interface DynamicTutorialProps {
  steps: TutorialStep[];
  onFinish?: (skipped: boolean) => void;
  onStart?: () => void;
  onStepChange?: (index: number) => void;
  storageKey: string; // Required for localStorage
  locale?: "pt" | "en";
  styles: TutorialStyles;
}

// ============================================================================
// COMPONENT
// ============================================================================

const DynamicTutorial: React.FC<DynamicTutorialProps> = ({
  steps,
  onFinish,
  onStart,
  onStepChange,
  storageKey,
  locale = "pt",
  styles,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<{
    top: number;
    left: number;
    rotation: number;
  } | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [secondaryRects, setSecondaryRects] = useState<DOMRect[]>([]);

  const tooltipRef = useRef<HTMLDivElement>(null);

  const skipLabel = locale === "pt" ? "Pular" : "Skip";

  // ============================================================================
  // CALL onStart
  // ============================================================================

  useEffect(() => {
    onStart?.();
    onStepChange?.(0);
  }, [onStart, onStepChange]);

  // ============================================================================
  // POSITIONING LOGIC
  // ============================================================================

  const calculatePosition = useCallback(() => {
    if (!tooltipRef.current) return;

    const step = steps[currentStepIndex];
    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let targetElement: HTMLElement | null = null;

    if (step.target && step.target !== "none") {
      targetElement = document.querySelector(step.target);

      if (!targetElement) {
        console.warn(
          `Tutorial: Target "${step.target}" not found, centering tooltip`
        );
      }
    }

    if (!targetElement || !step.target || step.target === "none") {
      // Center in viewport
      const top = (viewportHeight - tooltipRect.height) / 2;
      const left = (viewportWidth - tooltipRect.width) / 2;
      setTooltipPosition({ top, left });
      setSpotlightRect(null);
      setSecondaryRects([]);
      setArrowPosition(null);
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    setSpotlightRect(targetRect);

    // Handle secondary targets
    const secondaryElements: DOMRect[] = [];
    if (step.secondaryTargets && step.secondaryTargets.length > 0) {
      step.secondaryTargets.forEach((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          secondaryElements.push(element.getBoundingClientRect());
        } else {
          console.warn(`Tutorial: Secondary target "${selector}" not found`);
        }
      });
    }
    setSecondaryRects(secondaryElements);

    const gap = 30;
    const arrowSize = 12;

    let placement = step.placement || "auto";

    // Auto-detect best placement based on available space
    if (placement === "auto") {
      const spaceTop = targetRect.top;
      const spaceBottom = viewportHeight - targetRect.bottom;
      const spaceLeft = targetRect.left;
      const spaceRight = viewportWidth - targetRect.right;

      const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);

      if (maxSpace === spaceBottom && spaceBottom > tooltipRect.height + gap) {
        placement = "bottom";
      } else if (maxSpace === spaceTop && spaceTop > tooltipRect.height + gap) {
        placement = "top";
      } else if (
        maxSpace === spaceRight &&
        spaceRight > tooltipRect.width + gap
      ) {
        placement = "right";
      } else if (
        maxSpace === spaceLeft &&
        spaceLeft > tooltipRect.width + gap
      ) {
        placement = "left";
      } else {
        placement = "bottom";
      }
    }

    let top = 0;
    let left = 0;
    let arrowTop = 0;
    let arrowLeft = 0;
    let arrowRotation = 0;

    if (placement === "top") {
      top = targetRect.top - tooltipRect.height - gap;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
      arrowTop = tooltipRect.height;
      arrowLeft = tooltipRect.width / 2;
      arrowRotation = 180;
    } else if (placement === "bottom") {
      top = targetRect.bottom + gap;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
      arrowTop = -arrowSize - 2;
      arrowLeft = tooltipRect.width / 2;
      arrowRotation = 0;
    } else if (placement === "left") {
      top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      left = targetRect.left - tooltipRect.width - gap;
      arrowTop = tooltipRect.height / 2;
      arrowLeft = tooltipRect.width;
      arrowRotation = 90;
    } else if (placement === "right") {
      top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      left = targetRect.right + gap;
      arrowTop = tooltipRect.height / 2;
      arrowLeft = -arrowSize - 2;
      arrowRotation = -90;
    } else if (placement === "center") {
      top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
      setArrowPosition(null);
    }

    // Keep tooltip within viewport bounds
    const padding = 20;
    if (top < padding) top = padding;
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = viewportHeight - tooltipRect.height - padding;
    }
    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }

    setTooltipPosition({ top, left });

    if (placement !== "center") {
      setArrowPosition({ top: arrowTop, left: arrowLeft, rotation: arrowRotation });
    }
  }, [currentStepIndex, steps]);

  // ============================================================================
  // UPDATE ON STEP CHANGE OR RESIZE
  // ============================================================================

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculatePosition();
    }, 100);

    const handleUpdate = () => calculatePosition();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [currentStepIndex, calculatePosition]);

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => {
        const next = prev + 1;
        onStepChange?.(next);
        return next;
      });
    } else {
      handleFinish(false);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => {
        const next = prev - 1;
        onStepChange?.(next);
        return next;
      });
    }
  };

  const handleSkip = () => handleFinish(true);

  const handleFinish = (skipped: boolean) => {
    localStorage.setItem(`tutorial_${storageKey}_completed`, "true");
    onFinish?.(skipped);
  };

  // ============================================================================
  // KEYBOARD SUPPORT
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStepIndex]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const currentStep = steps[currentStepIndex];
  const shouldShowMask =
    currentStep.highlight && (spotlightRect || secondaryRects.length > 0);

  return (
    <>
      {/* SVG Mask Overlay - creates cutouts for highlights */}
      {shouldShowMask ? (
        <svg
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 99998,
            pointerEvents: "none",
          }}
        >
          <defs>
            <mask id="tutorial-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <rect
                  x={spotlightRect.left - 10}
                  y={spotlightRect.top - 10}
                  width={spotlightRect.width + 20}
                  height={spotlightRect.height + 20}
                  rx="16"
                  fill="black"
                />
              )}
              {secondaryRects.map((rect, index) => (
                <rect
                  key={index}
                  x={rect.left - 10}
                  y={rect.top - 10}
                  width={rect.width + 20}
                  height={rect.height + 20}
                  rx="16"
                  fill="black"
                />
              ))}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.5)"
            mask="url(#tutorial-mask)"
          />
        </svg>
      ) : (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            zIndex: 99998,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Blocking layer for clicks */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99998,
          cursor: "default",
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      />

      {/* Skip button */}
      <button onClick={handleSkip} className={styles.skipBtn}>
        {skipLabel}
      </button>

      {/* Primary spotlight */}
      {currentStep.highlight && spotlightRect && (
        <div
          className={styles.spotlight}
          style={{
            top: spotlightRect.top - 10,
            left: spotlightRect.left - 10,
            width: spotlightRect.width + 20,
            height: spotlightRect.height + 20,
          }}
        />
      )}

      {/* Secondary spotlights */}
      {currentStep.highlight &&
        secondaryRects.map((rect, index) => (
          <div
            key={index}
            className={styles.spotlight}
            style={{
              top: rect.top - 10,
              left: rect.left - 10,
              width: rect.width + 20,
              height: rect.height + 20,
            }}
          />
        ))}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={styles.tooltip}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Arrow pointing to target */}
        {arrowPosition && (
          <div
            className={styles.arrow}
            style={{
              top: arrowPosition.top,
              left: arrowPosition.left,
              transform: `translate(-50%, -50%) rotate(${arrowPosition.rotation}deg)`,
            }}
          />
        )}

        {/* Title */}
        {currentStep.title && (
          <h3 className={styles.title}>{currentStep.title}</h3>
        )}

        {/* Image */}
        {currentStep.image && (
          <img src={currentStep.image} alt="" className={styles.stepImage} />
        )}

        {/* Body */}
        <div className={styles.body}>{currentStep.body}</div>

        {/* Controls */}
        <div className={styles.controls}>
          {currentStepIndex > 0 && (
            <button onClick={handleBack} className={styles.backBtn}>
              <ArrowBigLeftDash size="3.3vw" />
            </button>
          )}
          <div className={styles.nextBtnContainer}>
            <button onClick={handleNext} className={styles.nextBtn}>
              <ArrowBigRightDash size="3.3vw" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DynamicTutorial;

// ============================================================================
// HELPER HOOK - Use this in rules pages to check if tutorial was seen
// ============================================================================

export function useTutorialCompleted(
  storageKey: string
): [boolean, () => void] {
  const [completed, setCompleted] = useState(() => {
    return localStorage.getItem(`tutorial_${storageKey}_completed`) === "true";
  });

  const reset = () => {
    localStorage.removeItem(`tutorial_${storageKey}_completed`);
    setCompleted(false);
  };

  return [completed, reset];
}
