import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { analytics } from "./events";

function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    const pageLocation = new URL(
      `${location.pathname}${location.search}`,
      window.location.origin,
    ).toString();

    analytics.pageViewed({
      pageTitle: document.title,
      pageLocation,
    });
  }, [location.pathname, location.search]);

  return null;
}

export default PageViewTracker;
