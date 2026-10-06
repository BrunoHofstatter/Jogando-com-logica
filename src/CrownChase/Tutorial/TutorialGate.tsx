import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { unseenLessons } from "../../Shared/Tutorial/tutorialHistory";
import { hasActiveCrownChaseMultiplayerSession } from "../Hooks/useCrownChaseMultiplayer";
import { ROUTES } from "../../routes";
import { CROWN_TUTORIAL } from "./lesson";
import { validateReturn } from "./navigation";

export default function TutorialGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!hasActiveCrownChaseMultiplayerSession() && unseenLessons([CROWN_TUTORIAL]).length) {
    return <Navigate to={ROUTES.CROWN_CHASE_TUTORIAL} replace state={{ tutorialReturn: validateReturn({ destination: location.pathname, difficulty: location.state?.difficulty }) }} />;
  }
  return <>{children}</>;
}
