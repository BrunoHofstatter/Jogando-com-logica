import { Link } from "react-router-dom";
import { testLessons } from "./registry";
import { checkpointUrl } from "./checkpoints";
import styles from "./Testing.module.css";
export default function CheckpointLauncher() {
    return <div className={styles.page}>
        <h1>Testes das aulas</h1>
        <p>Escolha um cubo para começar na primeira pergunta dele.</p>
        {testLessons.map(lesson => <section className={styles.section} key={lesson.route}>
            <h2>{lesson.title}</h2>
            <div className={styles.cubes}>
                {lesson.checkpoints.map(checkpoint => <Link className={styles.link} key={checkpoint.id}
                    to={checkpointUrl(lesson.route, checkpoint.id)}>{checkpoint.label}</Link>)}
            </div>
        </section>)}
    </div>;
}
