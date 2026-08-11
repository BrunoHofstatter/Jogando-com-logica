import { describe, expect, it, vi } from "vitest";
import {
  AnalyticsClient,
  GA_MEASUREMENT_ID,
  sanitizeAnalyticsParameters,
  shouldCollectAnalytics,
} from "./analytics";
import {
  formatAiDifficulty,
  formatLevelId,
  getSafePageLocation,
} from "./events";
import { ActivityTimer } from "./ActivityTimer";

function createAdapter() {
  return {
    initialize: vi.fn(),
    event: vi.fn(),
  };
}

describe("analytics collection guard", () => {
  it("enables collection only for approved hosts in production builds", () => {
    expect(
      shouldCollectAnalytics({
        hostname: "jogandocomlogica.com",
        isProductionBuild: true,
      }),
    ).toBe(true);
    expect(
      shouldCollectAnalytics({ hostname: "localhost", isProductionBuild: true }),
    ).toBe(false);
    expect(
      shouldCollectAnalytics({
        hostname: "jogandocomlogica.com",
        isProductionBuild: false,
      }),
    ).toBe(false);
  });

  it("does not initialize or send events when collection is disabled", () => {
    const adapter = createAdapter();
    const client = new AnalyticsClient(adapter);

    expect(
      client.initialize({ hostname: "localhost", isProductionBuild: false }),
    ).toBe(false);
    expect(
      client.send("select_content", {
        content_type: "game",
        content_id: "caca_soma",
      }),
    ).toBe(false);
    expect(adapter.initialize).not.toHaveBeenCalled();
    expect(adapter.event).not.toHaveBeenCalled();
  });

  it("initializes once with automatic page views and advertising signals disabled", () => {
    const adapter = createAdapter();
    const client = new AnalyticsClient(adapter);
    const environment = {
      hostname: "www.jogandocomlogica.com",
      isProductionBuild: true,
    };

    expect(client.initialize(environment)).toBe(true);
    expect(client.initialize(environment)).toBe(true);
    expect(adapter.initialize).toHaveBeenCalledTimes(1);
    expect(adapter.initialize).toHaveBeenCalledWith(GA_MEASUREMENT_ID, {
      gtagOptions: {
        allow_ad_personalization_signals: false,
        allow_google_signals: false,
        send_page_view: false,
      },
    });
  });

  it("sends the GA4-native event name and sanitized parameters", () => {
    const adapter = createAdapter();
    const client = new AnalyticsClient(adapter);

    client.initialize({
      hostname: "jogandocomlogica.com",
      isProductionBuild: true,
    });

    expect(
      client.send("select_content", {
        content_type: "game",
        content_id: "caca_soma",
        player_name: "Ana",
      }),
    ).toBe(true);
    expect(adapter.event).toHaveBeenCalledOnce();
    expect(adapter.event).toHaveBeenCalledWith("select_content", {
      content_type: "game",
      content_id: "caca_soma",
    });
  });
});

describe("analytics payload safeguards", () => {
  it("omits undefined, malformed, and forbidden parameters", () => {
    expect(
      sanitizeAnalyticsParameters({
        content_type: "game",
        content_id: "caca_soma",
        optional_value: undefined,
        PlayerName: "Ana",
        player_name: "Ana",
        classroom_code: "ABC123",
        room_id: "room-123",
        socket_id: "socket-456",
        management_token: "secret-token",
        teacher_name: "Professora Ana",
        raw_error: "private error details",
      }),
    ).toEqual({
      content_type: "game",
      content_id: "caca_soma",
    });
  });

  it("removes non-campaign query parameters from page locations", () => {
    expect(
      getSafePageLocation(
        "https://jogandocomlogica.com/aulas/1?mode=game&room_code=ABC123&utm_source=email&utm_campaign=school_outreach#step-2",
      ),
    ).toBe(
      "https://jogandocomlogica.com/aulas/1?utm_source=email&utm_campaign=school_outreach",
    );
  });

  it("formats stable, zero-padded level IDs", () => {
    expect(formatLevelId(1)).toBe("level_01");
    expect(formatLevelId(10)).toBe("level_10");
  });

  it("formats controlled AI difficulty values", () => {
    expect(formatAiDifficulty(1)).toBe("very_easy");
    expect(formatAiDifficulty(4)).toBe("hard");
    expect(formatAiDifficulty(9)).toBe("unknown");
  });
});

describe("ActivityTimer", () => {
  it("counts foreground time and finalizes only once", () => {
    const timer = new ActivityTimer(1_000);

    timer.pause(6_000);
    timer.resume(11_000);

    expect(timer.finish(14_500)).toBe(8);
    expect(timer.finish(20_000)).toBeNull();
  });
});
