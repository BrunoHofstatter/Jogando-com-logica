import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LessonEntry } from "./LessonEntry";
import { lessonCheckpoints } from "./registry";
import { useClass1 } from "../Classes/Class1_dimensions/useClass1";
import { useClass2 } from "../Classes/Class2_faceArea/useClass2";
import { useClass3 } from "../Classes/Class3_totalSquares/useClass3";

function Class1Probe() {
    const { step, state } = useClass1();
    return <output>{`${step.size}:${state.phase}:${state.incorrectCount}:${state.assistanceCount}`}</output>;
}
function Class2Probe() {
    const { currentStep, state } = useClass2();
    return <output>{`${currentStep.id}:${state.phase}:${state.hintLevel}:${state.incorrectCount}`}</output>;
}
function Class3Probe() {
    const { config, state } = useClass3();
    return <output>{`${config.id}:${state.phase}:${state.hintLevel}:${state.incorrectCount}`}</output>;
}

describe("lesson checkpoint entry integration", () => {
    it("initializes each hook at its checkpoint with fresh state, overriding review mode", () => {
        const cases = [
            { checkpoints: lessonCheckpoints.class1, id: "six", child: <Class1Probe />, expected: "6:question:0:0" },
            { checkpoints: lessonCheckpoints.class2, id: "five", child: <Class2Probe />, expected: "five-expression:question:0:0" },
            { checkpoints: lessonCheckpoints.class3, id: "six-all-faces", child: <Class3Probe />, expected: "six-all-faces:question:0:0" },
        ];
        for (const entry of cases) {
            const html = renderToStaticMarkup(<MemoryRouter initialEntries={[{ pathname: "/lesson", search: `?checkpoint=${entry.id}&mode=game`, state: { mode: "game" } }]}>
                <LessonEntry checkpoints={entry.checkpoints}>{entry.child}</LessonEntry>
            </MemoryRouter>);
            expect(html).toContain(entry.expected);
            expect(html).toContain("Voltar aos testes");
        }
    });
    it("preserves normal lesson and review entry without testing controls", () => {
        for (const mode of ["", "?mode=game"]) {
            const html = renderToStaticMarkup(<MemoryRouter initialEntries={[`/lesson${mode}`]}>
                <LessonEntry checkpoints={lessonCheckpoints.class1}><Class1Probe /></LessonEntry>
                <LessonEntry checkpoints={lessonCheckpoints.class2}><Class2Probe /></LessonEntry>
            </MemoryRouter>);
            expect(html).toContain(`2:${mode ? "summary" : "question"}:0:0`);
            expect(html).toContain(`one-row:${mode ? "summary" : "question"}:0:0`);
            expect(html).not.toContain("Voltar aos testes");
        }
    });
    it("does not mount a lesson for an invalid checkpoint", () => {
        function ShouldNotMount(): never { throw new Error("Invalid checkpoint mounted the lesson"); }
        const html = renderToStaticMarkup(<MemoryRouter initialEntries={["/lesson?checkpoint=missing"]}>
            <LessonEntry checkpoints={lessonCheckpoints.class1}><ShouldNotMount /></LessonEntry>
        </MemoryRouter>);
        expect(html).toContain("Ponto de teste não encontrado");
        expect(html).toContain("Voltar aos testes");
    });
});
