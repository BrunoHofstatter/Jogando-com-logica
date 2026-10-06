import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes";
import styles from "../Classes/Class1_dimensions/SummaryView.module.css";

interface Props {
    lessonErrors?: number;
    mistakes: number;
    hints: number;
    nextClass: string;
    onReplay: () => void;
}

export function ReviewCompletion({ lessonErrors, mistakes, hints, nextClass, onReplay }: Props) {
    const navigate = useNavigate();
    const replay = useRef<HTMLButtonElement>(null);
    useEffect(() => { replay.current?.focus(); }, []);
    return <div className={styles.modalOverlay}>
        <section className={styles.completionCard} role="dialog" aria-modal="true" aria-labelledby="review-complete-title"
            onKeyDown={event => {
                if (event.key !== "Tab") return;
                const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
                const first = buttons[0], last = buttons[buttons.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }}>
            <h1 id="review-complete-title" className={styles.modalTitle}>Excelente! 🎉</h1>
            <p className={styles.summaryText}>Você completou os desafios!</p>
            <p className={styles.summaryText}>
                {lessonErrors !== undefined && <>Erros nas lições: {lessonErrors}<br /></>}
                Erros no jogo: {mistakes}<br />Dicas usadas: {hints}
            </p>
            <div className={styles.completionActions}>
                <button ref={replay} className={`${styles.completionButton} ${styles.replayButton}`} onClick={onReplay}>Jogar novamente</button>
                <button className={`${styles.completionButton} ${styles.nextButton}`} onClick={() => navigate(nextClass)}>Próxima aula</button>
            </div>
            <button className={`${styles.completionButton} ${styles.menuButton}`} onClick={() => navigate(ROUTES.CLASS_MENU)}>Aulas</button>
        </section>
    </div>;
}
