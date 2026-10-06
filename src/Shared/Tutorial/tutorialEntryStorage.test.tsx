// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { useDifficultyLock } from "../Hooks/useDifficultyLock";
import { getActivePlayerName, setActivePlayerName } from "../PlayerName/activePlayerName";
import RotateDeviceOverlay from "../../Main/Components/RotateDeviceOverlay";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function blockStorage() {
  for (const method of ["getItem", "setItem", "removeItem"] as const) {
    vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error("Storage blocked"); });
  }
}

it("blocked storage does not break player-name initialization used by the online entry gate", async () => {
  blockStorage();
  expect(() => getActivePlayerName()).not.toThrow();
  setActivePlayerName("  Ana  ");
  expect(getActivePlayerName()).toBe("Ana");
  const multiplayer = await import("../../CrownChase/Hooks/useCrownChaseMultiplayer");
  expect(multiplayer.hasActiveCrownChaseMultiplayerSession()).toBe(false);
  setActivePlayerName("");
});

it("returning to play can dismiss rotation guidance and use difficulty state without storage", () => {
  blockStorage(); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  function Progress() {
    const progress = useDifficultyLock("crownchase");
    return <><output>{progress.maxUnlockedDifficulty}</output><button onClick={() => progress.unlockNext(1)}>Avançar</button><button onClick={progress.resetProgress}>Reiniciar</button></>;
  }
  try {
    act(() => root.render(<><RotateDeviceOverlay /><Progress /></>));
    const button = (text: string) => [...container.querySelectorAll("button")].find(node => node.textContent === text)!;
    act(() => button("Continuar mesmo assim").click());
    expect(container.textContent).not.toContain("Gire sua tela");
    act(() => button("Avançar").click());
    expect(container.querySelector("output")?.textContent).toBe("2");
    act(() => button("Reiniciar").click());
    expect(container.querySelector("output")?.textContent).toBe("1");
  } finally { act(() => root.unmount()); container.remove(); }
});
