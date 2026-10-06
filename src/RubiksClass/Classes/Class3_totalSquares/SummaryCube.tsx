import { memo, type CSSProperties } from "react";
import type { CubeFace } from "../../Components/RubiksCube";
import { ALL_CUBE_FACES } from "./class3ReviewGeneration";
import type { ReviewColor } from "./class3ReviewConfig";
import { faceTexture } from "./class3ReviewTextures";
import { CheckIcon, ClockIcon } from "./assets/ReviewArtwork";
import styles from "./SummaryCube.module.css";


export const SummaryCube = memo(function SummaryCube({ size = 3, faces = [], color, special, outlined = false }:
    { size?: number; faces?: CubeFace[]; color: ReviewColor; special?: "clock" | "success"; outlined?: boolean }) {
    return <div className={styles.scene} aria-hidden="true"><div className={styles.cube}>
        {ALL_CUBE_FACES.map(face => <div key={face} data-face={face}
            className={`${styles.face} ${styles[face]} ${special ? styles.solid : ""} ${outlined && face === "top" ? styles.outlined : ""}`}
            style={{ backgroundImage: special ? undefined : `url("${faceTexture(size, color, !faces.includes(face))}")`,
                backgroundColor: special === "clock" ? "#2289eb" : special === "success" ? "#24b963" : undefined } as CSSProperties}>
            {special === "clock" ? <ClockIcon /> : special === "success" ? <CheckIcon /> : null}
        </div>)}
    </div></div>;
});
