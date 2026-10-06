import { useEffect, useState } from "react";

export function useCubeMobileLayout() {
    const query = "(max-width: 650px) and (orientation: portrait)";
    const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
        const media = window.matchMedia(query);
        const update = () => setMobile(media.matches);
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);
    return mobile;
}

