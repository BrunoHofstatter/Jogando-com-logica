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

export interface DynamicTutorialProps {
  steps: TutorialStep[];
  onFinish?: (skipped: boolean) => void;
  onStart?: () => void;
  storageKey: string; // Required for localStorage
  locale?: "pt" | "en";
}

// ============================================================================
// COMPONENT
// ============================================================================

const DynamicTutorial: React.FC<DynamicTutorialProps> = ({
  steps,
  onFinish,
  onStart,
  storageKey,
  locale = "pt",
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

  // Localization
  const labels = {
    pt: {
      next: "Próximo",
      back: "Voltar",
      skip: "Pular",
      finish: "Concluir",
      stepCounter: (current: number, total: number) => `${current} de ${total}`,
    },
    en: {
      next: "Next",
      back: "Back",
      skip: "Skip",
      finish: "Finish",
      stepCounter: (current: number, total: number) => `${current} of ${total}`,
    },
  };

  const t = labels[locale];

  // ============================================================================
  // CALL onStart
  // ============================================================================

  useEffect(() => {
    onStart?.();
  }, [onStart]);

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

    const gap = 30; // Space between target and tooltip
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
        // Not enough space, default to bottom
        placement = "bottom";
      }
    }

    let top = 0;
    let left = 0;
    let arrowTop = 0;
    let arrowLeft = 0;
    let arrowRotation = 0;

    // Calculate tooltip and arrow positions based on placement
    if (placement === "top") {
      top = targetRect.top - tooltipRect.height - gap;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;

      // Arrow points down from bottom of tooltip
      arrowTop = tooltipRect.height;
      arrowLeft = tooltipRect.width / 2;
      arrowRotation = 180;
    } else if (placement === "bottom") {
      top = targetRect.bottom + gap;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;

      // Arrow points up from top of tooltip
      arrowTop = -arrowSize - 2;
      arrowLeft = tooltipRect.width / 2;
      arrowRotation = 0;
    } else if (placement === "left") {
      top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      left = targetRect.left - tooltipRect.width - gap;

      // Arrow points right from right side of tooltip
      arrowTop = tooltipRect.height / 2;
      arrowLeft = tooltipRect.width;
      arrowRotation = 90;
    } else if (placement === "right") {
      top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      left = targetRect.right + gap;

      // Arrow points left from left side of tooltip
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
      setArrowPosition({
        top: arrowTop,
        left: arrowLeft,
        rotation: arrowRotation,
      });
    }
  }, [currentStepIndex, steps]);

  // ============================================================================
  // UPDATE ON STEP CHANGE OR RESIZE
  // ============================================================================

  useEffect(() => {
    // Small delay to ensure DOM elements are rendered
    const timeoutId = setTimeout(() => {
      calculatePosition();
    }, 100);

    const handleUpdate = () => calculatePosition();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true); // Use capture phase

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
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish(false);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleFinish(true);
  };

  const handleFinish = (skipped: boolean) => {
    // Mark as completed in localStorage
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
  const shouldShowMask = currentStep.highlight && (spotlightRect || secondaryRects.length > 0);

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
              {/* White rectangle covers entire screen */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              
              {/* Black rectangles create cutouts (holes) */}
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
          
          {/* Dark overlay with mask applied */}
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
        // No highlights - just a simple dark overlay
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

      {/* Fixed Skip button (top-right of the viewport) */}
      <button
        onClick={handleSkip}
        style={{
          position: "fixed",
          top: "2vw",
          right: "2vw",
          padding: "0.7vw 1.3vw 1.2vw 1.3vw",
          fontSize: "2.5vw",
          borderRadius: "1.5vw",
          border: "0.25vw solid #ba0eeeff",
          background:
            "radial-gradient(circle, #7574bebb 50%, #35347edd 100%)",
          color: "#a1e1ffff",
          WebkitTextStroke: "0.17vw #26095eff",
          lineHeight: "1",
          cursor: "pointer",
          fontFamily: "Cherry Bomb One",
          transition: "all 0.2s",
          zIndex: 100001,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {t.skip}
      </button>

      {/* Spotlight highlights - borders only */}
      {currentStep.highlight && spotlightRect && (
        <div
          style={{
            position: "fixed",
            top: spotlightRect.top - 10,
            left: spotlightRect.left - 10,
            width: spotlightRect.width + 20,
            height: spotlightRect.height + 20,
            border: "4px solid #940eeeff",
            borderRadius: "16px",
            boxShadow: "0 0 30px #940eeeff",
            zIndex: 99999,
            pointerEvents: "none",
            animation: "tutorialPulse 2s infinite",
          }}
        />
      )}

      {/* Secondary highlights */}
      {currentStep.highlight && secondaryRects.map((rect, index) => (
        <div
          key={index}
          style={{
            position: "fixed",
            top: rect.top - 10,
            left: rect.left - 10,
            width: rect.width + 20,
            height: rect.height + 20,
            border: "4px solid #940eeeff",
            borderRadius: "16px",
            boxShadow: "0 0 30px #940eeeff",
            zIndex: 99999,
            pointerEvents: "none",
            animation: "tutorialPulse 2s infinite",
          }}
        />
      ))}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: "fixed",
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          zIndex: 100000,
          background:
            "radial-gradient(circle, #7574bebb 50%, #35347edd 100%)",
          borderRadius: "20px",
          padding: "24px", 
          minWidth: "20vw",
          maxWidth: "35vw",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          border: "0.5vw solid #940eeeff",
          fontFamily: '"Cherry Bomb One", system-ui',
        }}
      >
        {/* Arrow pointing to target */}
        {arrowPosition && (
          <div
            style={{
              position: "absolute",
              top: arrowPosition.top,
              left: arrowPosition.left,
              width: 0,
              height: 0,
              borderLeft: "14px solid transparent",
              borderRight: "14px solid transparent",
              borderTop: "14px solid #940eeeff",
              transform: `translate(-50%, -50%) rotate(${arrowPosition.rotation}deg)`,
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
              zIndex: 1,
            }}
          />
        )}

        {/* Title */}
        {currentStep.title && (
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "3vw",
              color: "#67caf8ff",
              WebkitTextStroke: "0.24vw #26095eff",
              lineHeight: 1.2,
            }}
          >
            {currentStep.title}
          </h3>
        )}

        {/* Image */}
        {currentStep.image && (
          <img
            src={currentStep.image}
            alt=""
            style={{
              width: "100%",
              maxHeight: "200px",
              objectFit: "contain",
              borderRadius: "12px",
              marginBottom: "16px",
            }}
          />
        )}

        {/* Body */}
        <div
          style={{
            fontSize: "20px",
            color: "#eee",
            marginBottom: "24px",
            lineHeight: 1.5,
            WebkitTextStroke: "0.5px #af2020",
          }}
        >
          {currentStep.body}
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            marginTop: "24px",
          }}
        >
          {/* Back button container */}
          {currentStepIndex > 0 && (
            <button
              onClick={handleBack}
              style={{
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
                marginLeft: "1vw",
                padding: "0.5vw 1.5vw 0.8vw 1.5vw",
                fontSize: "2.5vw",
                borderRadius: "1.5vw",
                border: "0.25vw solid #780ac2ff",
                background:
                  "radial-gradient(circle, #8dacbbff, #4a7e96ff)",
                color: "#780ac2ff",
                lineHeight: "1",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <ArrowBigLeftDash size='3.3vw' />
            </button>
          )}

          {/* Next button container - takes remaining space and pushes button to right */}
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={handleNext}
              style={{
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
                marginRight: "1vw",
                padding: "0.5vw 1.5vw 0.8vw 1.5vw",
                fontSize: "2.5vw",
                borderRadius: "1.5vw",
                border: "0.25vw solid #780ac2ff",
                background:
                  "radial-gradient(circle, #8dacbbff, #4a7e96ff)",
                color: "#780ac2ff",
                lineHeight: "1",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.backgroundColor = "#8b5cf6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.backgroundColor = "#7c3aed";
              }}
            >
              <ArrowBigRightDash size='3.3vw' />
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes tutorialPulse {
          0%, 100% {
            box-shadow: 0 0 30px #940eeeff;
          }
          50% {
            box-shadow: 0 0 45px #940eeeff, 0 0 60px #940eee99;
          }
        }
      `}</style>
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