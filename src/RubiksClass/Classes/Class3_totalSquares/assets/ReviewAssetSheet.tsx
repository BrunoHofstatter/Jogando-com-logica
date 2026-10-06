import { Cannon, CheckIcon, ClockIcon, Crosshair, Dust, FragmentHeart } from "./ReviewArtwork";
import { SummaryCube } from "../SummaryCube";
import styles from "./ReviewAssetSheet.module.css";

/** Static, standalone asset fixture; intentionally not a public application route. */
export function ReviewAssetSheet() {
    return <div className={styles.sheet}>
        <h1>Elementos do jogo da Aula 3</h1>
        <div className={styles.cards}>
            <section><h2>Canhão</h2><div className={styles.art}><Cannon angle={-25} /></div></section>
            <section><h2>Mira</h2><div className={styles.art}><Crosshair /></div></section>
            <section><h2>Poeira</h2><div className={styles.art}><Dust /></div></section>
            <section><h2>Corações</h2><div className={styles.hearts}>{[3, 2, 1, 0].map(points => <FragmentHeart key={points} points={points} />)}</div></section>
            <section><h2>Tempo e acerto</h2><div className={styles.icons}><ClockIcon /><CheckIcon /></div></section>
            <section><h2>Cubo do jogo</h2><div className={styles.art}><SummaryCube size={3} color="orange" faces={["top", "right"]} /></div></section>
            <section><h2>Tempo parado</h2><div className={styles.art}><SummaryCube color="blue" special="clock" /></div></section>
            <section><h2>Acerto</h2><div className={styles.art}><SummaryCube color="green" special="success" /></div></section>
        </div>
    </div>;
}
