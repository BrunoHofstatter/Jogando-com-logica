import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VerticalAddition, VerticalMultiplication, VerticalSubtraction } from "../index";

describe("vertical calculation components", () => {
  it("renders multiplication with an aligned leading blank column", () => {
    const html = renderToString(
      <VerticalMultiplication topNumber={36} bottomNumber={6} maxTopDigits={3} />,
    );

    expect(html).toContain("x");
  });

  it("renders addition and subtraction without crashing", () => {
    const addition = renderToString(<VerticalAddition numbers={[25, 36, 14]} maxDigits={3} />);
    expect(addition).toContain("+");

    const subtraction = renderToString(<VerticalSubtraction topNumber={102} bottomNumber={47} maxDigits={3} />);
    expect(subtraction).toContain("-");
  });
});
