import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { unseenLessons } from "../../Shared/Tutorial/tutorialHistory";
import { hasActiveMathWarMultiplayerSession } from "../Hooks/useMathWarMultiplayer";
import { ROUTES } from "../../routes";
import { MATH_TUTORIAL } from "./lesson";
import { validateReturn } from "./navigation";

export default function TutorialGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!hasActiveMathWarMultiplayerSession() && unseenLessons([MATH_TUTORIAL]).length) {
    return <Navigate to={ROUTES.MATH_WAR_TUTORIAL} replace state={{ tutorialReturn: validateReturn({ destination: location.pathname, difficulty: location.state?.difficulty }) }} />;
  }
  return <>{children}</>;
}
