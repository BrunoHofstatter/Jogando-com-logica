import { ROUTES } from "../../routes";
import { CLASS1_CUBES } from "../Classes/Class1_dimensions/class1Lesson";
import { LESSON_STEPS as CLASS2_STEPS } from "../Classes/Class2_faceArea/class2Lesson";
import { CONFIGURATIONS, LESSON_STEPS as CLASS3_STEPS } from "../Classes/Class3_totalSquares/class3Lesson";
import { cubeCheckpoints } from "./checkpoints";
export const lessonCheckpoints = {
    class1: cubeCheckpoints(CLASS1_CUBES),
    class2: cubeCheckpoints(CLASS2_STEPS.map(step => ({ id: step.cubeId, size: step.size }))),
    class3: cubeCheckpoints(CLASS3_STEPS.map(step => CONFIGURATIONS[step.configuration])),
};
export const testLessons = [
    { title: "Aula 1 — Dimensões", route: ROUTES.CLASS_1, checkpoints: lessonCheckpoints.class1 },
    { title: "Aula 2 — Multiplicação no Cubo", route: ROUTES.CLASS_2, checkpoints: lessonCheckpoints.class2 },
    { title: "Aula 3 — Multiplicação nas Faces", route: ROUTES.CLASS_3, checkpoints: lessonCheckpoints.class3 },
];
