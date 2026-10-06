import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../../routes";
import { resolveCheckpoint, type Checkpoint } from "./checkpoints";
import { EntryContext } from "./entryContext";
import styles from "./Testing.module.css";
/** Navigation remounts all lesson state, including timers and cube-local state. */
export function LessonEntry({ checkpoints, children }: { checkpoints: readonly Checkpoint[]; children: ReactNode }) {
    const location = useLocation();
    const entry = resolveCheckpoint(location.search, checkpoints);
    if (!entry.valid) return <div className={styles.page}>
        <h1>Ponto de teste não encontrado</h1>
        <p>Escolha um cubo na página de testes.</p>
        <Link className={styles.link} to={ROUTES.CLASS_TESTS}>Voltar aos testes</Link>
    </div>;
    return <EntryContext.Provider key={location.key} value={entry}>
        {children}
        {entry.isCheckpoint && <Link className={styles.returnLink} to={ROUTES.CLASS_TESTS}>Voltar aos testes</Link>}
    </EntryContext.Provider>;
}
