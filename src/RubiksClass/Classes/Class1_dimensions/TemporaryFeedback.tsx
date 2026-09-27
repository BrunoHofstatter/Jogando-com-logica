import { useEffect, useState } from "react";
import styles from "./Class1Chrome.module.css";

/** Mount with the attempt's key so repeated feedback gets a fresh lifetime. */
export function TemporaryFeedback({ message, success = false }: { message: string; success?: boolean }) {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const timeout = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timeout);
    }, []);
    return visible ? <p role="status" aria-live="polite" className={`${styles.feedback} ${success ? styles.success : ""}`}>{message}</p> : null;
}
