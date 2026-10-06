# Review 5: Presentation consistency across Rubik's Classes 1–3

Scope: 2026-09-28; current Classes 1, 2, and 3, including the two existing review games and Class 3's embedded calculator. Inspected HEAD `eb47905f053272ca746ee12065cb008aff635d89` plus the existing uncommitted RubiksClass changes, including the new shared `TemporaryFeedback` files. This is a presentation/copy consistency review only, not a bug, behavior, accessibility, or pedagogy audit. No implementation changes were made.

The current working tree already standardizes ordinary wrong-answer messages through `Components/TemporaryFeedback.tsx`, red wrong-option colors, bottom-left `Aulas` controls, and the main yellow hint-card skin. Classes 1 and 3 compose Class 2's hint styles. These are not outstanding inconsistencies.

## R5-1 — Use one lesson success-message presentation

**Type:** product/usability suggestion. **Impact:** medium. **Confidence:** confirmed by source and browser inspection.

The same `Correto!` acknowledgement changes position between classes on portrait screens. Class 1 puts it at `43dvh`, at the boundary between the cube and answers; Classes 2 and 3 put it at `3dvh`, at the top. Class 1 also retains its own animated success card and size rules, while Classes 2 and 3 define a nonanimated fixed overlay. A repeated, familiar status should have a consistent visual home.

**Evidence:** `src/RubiksClass/Classes/Class1_dimensions/Class1Dimensions.tsx:53`; `Class1Dimensions.module.css:76`, `:104`, `:206`; `src/RubiksClass/Classes/Class2_faceArea/Class2FaceArea.module.css:439`; `src/RubiksClass/Classes/Class3_totalSquares/Class3TotalSquares.module.css:80`. Browser screenshots at 390×844 confirmed the placement difference between Classes 1 and 3; Class 2's desktop overlay was also inspected.

**Direction:** share the lesson success overlay's position, typography, padding, and animation rules across all three. Preserve each lesson's existing transitions and timing.

## R5-2 — Standardize completion presentation and common labels

**Type:** product/usability suggestion. **Impact:** medium. **Confidence:** confirmed structural/copy differences; rendered completion appearance was not browser-verified.

Classes 1 and 2 finish in blue modal panels headed `Excelente! 🎉`, with white outlined statistics. Class 3 finishes inside the ordinary right lesson panel with `Aula completa!` and plain dark-blue text. Even the same destination has three labels: Class 1 uses `Aulas`, Class 2 `Voltar ao Menu`, and Class 3 `Voltar às Aulas`. The Class 3 completion button uses the blue answer-button skin, whereas the others use purple for returning to the class menu. Class 1 calls review mistakes `Erros no jogo`; Class 2 calls them `Tentativas incorretas no jogo`.

**Evidence:** `src/RubiksClass/Classes/Class1_dimensions/SummaryView.tsx:77–98` and `SummaryView.module.css:521–531`; `src/RubiksClass/Classes/Class2_faceArea/Class2SummaryView.tsx:159–166` and `Class2SummaryView.module.css:258–306`; `src/RubiksClass/Classes/Class3_totalSquares/Class3TotalSquares.tsx:50–55` and `Class3TotalSquares.module.css:25–28`.

**Direction:** define a common completion visual hierarchy and shared menu-button label/color, plus consistent names for equivalent statistics. It can support both lesson and game completion without forcing identical content. Keep the existing action sets, counters, and the absence of a Class 3 review game outside this styling change.

## R5-3 — Give Class 3 calculator help the lesson's visual language

**Type:** product/usability suggestion. **Impact:** medium. **Confidence:** confirmed hint appearance in browser; feedback styling confirmed in source.

The ordinary lessons use a yellow, brown-bordered hint card with a pronounced shadow and warm-colored hint controls. When Class 3 reaches written multiplication, help becomes a near-white card without that border/shadow, with small white action buttons. Its hint invitation says `Quer uma dica?`, versus `Precisa de uma dica?` elsewhere. Calculation feedback inherits dark-blue text within the calculator, while ordinary wrong answers use the shared red status styling. The calculator therefore looks like a separate help system within the same course.

**Evidence:** `src/RubiksClass/Classes/Class3_totalSquares/Class3TotalSquares.tsx:78–85`; `src/Shared/Calculation/components/VerticalMultiplication.tsx:18–20`; `components/DiscoveryMultiplication.tsx:90–128`; `src/Shared/Calculation/DiscoveryMultiplication.module.css:19–42`; comparison with `src/RubiksClass/Classes/Class2_faceArea/Class2FaceArea.module.css:160–175`, `:229–250` and `src/RubiksClass/Components/TemporaryFeedback.module.css:1`. The Class 3 4×4 calculation hint was inspected at 390×844.

**Direction:** provide a Rubik's presentation variant for the calculator's hint shell, generic help copy, and feedback colors. Preserve the right-hand help area, arrows, digit cue colors, local feedback placement, and specialized controls: the calculation documentation explicitly describes those teaching arrangements. Avoid changing the calculator's global appearance for other consumers solely to match this course.

## R5-4 — Align the ordinary hint controls' wording and mobile frame

**Type:** product/usability suggestion. **Impact:** low. **Confidence:** confirmed in source; first-hint labels verified in the browser.

After the first hint, Class 1 still says `Dica` although its next click reveals another level; Classes 2 and 3 say `Mais uma dica`. When help is offered, Classes 2 and 3 add `Precisa de uma dica?`, while Class 1 shows only the button outline. The yellow cards themselves share styling, but Class 3 overrides their portrait wrapper width to 70%, versus the shared 76% in Classes 1 and 2, giving the same kind of message different available space.

**Evidence:** `src/RubiksClass/Classes/Class1_dimensions/Class1Dimensions.tsx:79–85`; `src/RubiksClass/Classes/Class2_faceArea/Class2FaceArea.tsx:155–163`; `src/RubiksClass/Classes/Class3_totalSquares/Class3TotalSquares.tsx:95–100`; `Class3TotalSquares.module.css:33`; `src/RubiksClass/Classes/Class2_faceArea/Class2FaceArea.module.css:348`; `src/RubiksClass/Classes/Class1_dimensions/Class1Chrome.module.css:5–6`.

**Direction:** use the same wording for the same available action and the same invitation treatment. Use one portrait hint frame unless Class 3 has a documented space requirement. Keep `Ver dica novamente` where replay is actually available and `Dica completa` where it is exhausted; changing replay availability, hint counts, or offer delays is outside this review.

## R5-5 — Standardize explanatory text and emphasis

**Type:** product/usability suggestion. **Impact:** low. **Confidence:** confirmed by source and browser inspection of Classes 1 and 3.

Class 1's notation reveal uses white text with a dark outline for the explanation and red outlined text for its successful discovery (`Este cubo é chamado de 2×2.`). Class 3's equivalent explanatory pauses use plain dark-blue body text and dark-blue results. Class 2 also establishes dark-blue text around its grouping explanation, retaining row colors for mathematical terms. The Class 1 emphasis is a different visual convention for the same explanatory role, and uses red for a positive discovery in a course that also uses red for errors.

**Evidence:** `src/RubiksClass/Classes/Class1_dimensions/Class1Dimensions.tsx:67–70`, `Class1Dimensions.module.css:293–294`; `src/RubiksClass/Classes/Class3_totalSquares/Class3TotalSquares.tsx:66–75`, `Class3TotalSquares.module.css:19–22`; `src/RubiksClass/Classes/Class2_faceArea/Class2FaceArea.module.css:129–155`. Both the Class 1 notation reveal and Class 3 one-face result were inspected at 390×844.

**Direction:** share body-text and positive-emphasis treatments for explanation screens. Retain meaningful mathematical row/face colors and each class's own explanation content.

## R5-6 — Align review success-feedback colors and typography

**Type:** product/usability suggestion. **Impact:** low. **Confidence:** confirmed in source; not browser-verified during a successful review match.

Class 1 review renders `Combinação correta!` through `TemporaryFeedback` with green success text. Class 2 renders its `Muito bem!` calculation confirmation through a separate brown-text style (`#713f12`) with independent text sizing. Successful matching therefore has two different visual status conventions, despite review errors already sharing one component.

**Evidence:** `src/RubiksClass/Classes/Class1_dimensions/SummaryView.tsx:71`; `src/RubiksClass/Components/TemporaryFeedback.module.css:1–5`; `src/RubiksClass/Classes/Class2_faceArea/Class2SummaryView.tsx:172–174`; `Class2SummaryView.module.css:502`, `:613`.

**Direction:** share success color and typography tokens. Preserve Class 2's calculation text and its below-instruction placement, which the current Rubik's documentation explicitly describes; its moving-number board need not use Class 1's bottom placement.

## Checks and boundaries

- Traced the live class components, active CSS composition, review views, shared feedback, and the adaptive calculation branch. Compared the current Rubik's and calculation documentation where apparent differences could be intentional.
- Browser inspection used the local Vite frontend at 1280×720 and 390×844. Checked ordinary hints/errors in all three classes on desktop; success in Class 2 on desktop and Classes 1/3 on portrait; Class 1/Class 3 explanatory reveals and the Class 3 calculation hint on portrait. The hidden checkpoint launcher was used; its testing-only return link is not treated as normal student UI.
- Completion and successful review-match findings are source-based. This was not an exhaustive visual pass through every question or screen size. No functional tests, build, or lint were needed for the report-only changes.
- Deliberate differences excluded: four versus six answer choices, cube orientations and teaching cues, two versus three hint levels, Class 2's hint-free review (documented product decision), different review mechanics, Class 3's lack of `Jogar`, calculator input/arrow arrangements, and differing completion action sets. No behavior changes are recommended here.
- The existing implementation edits were preserved. Working-tree status was checked again before report creation; the same scoped files remained modified. Browser viewport override was reset after inspection.

## Follow-up decisions and implementation — 2026-09-28

The user approved R5-1, R5-2 (Classes 1 and 2 only), R5-4, R5-5, and R5-6. R5-3 was rejected: the reworked Class 3 vertical calculator remains unchanged. Class 3's lesson-only completion also remains unchanged.

Implemented a shared top-positioned lesson success message; Class 1's additional-hint label and help invitation; the shared portrait hint width; plain dark-blue Class 1 explanation text; and shared green review-success typography, retaining Class 2's calculation and placement. Classes 1 and 2 now render the same completion component based on Class 1, including replay, next class, and Aulas actions. Class 2 replay restarts its review introduction with fresh game state and excludes the previous lesson's statistics; next class opens Class 3.

Validation: production build passed (Vite reported its large-chunk advisory), targeted ESLint passed, and 15 Class 1/Class 2 interaction tests passed, including a new two-round Class 2 replay/statistics/focus test. Browser checks confirmed Class 1's top success message and revised explanation on portrait, Class 2's green calculation feedback, and its shared completion dialog on desktop and portrait.
