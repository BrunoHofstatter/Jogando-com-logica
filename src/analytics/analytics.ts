import ReactGA from "react-ga4";

export const GA_MEASUREMENT_ID = "G-BXWR3NBDQL";

const PRODUCTION_HOSTS = new Set([
  "jogandocomlogica.com",
  "www.jogandocomlogica.com",
]);

const FORBIDDEN_PARAMETER_KEYS = new Set([
  "answer",
  "answer_text",
  "attempt_id",
  "classroom_code",
  "classroom_management_token",
  "client_id",
  "error",
  "error_message",
  "free_text",
  "host_name",
  "message",
  "management_token",
  "name",
  "player_name",
  "raw_error",
  "room_code",
  "school",
  "school_name",
  "student_name",
  "teacher_name",
  "user_id",
]);

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;
const PARAMETER_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export type AnalyticsEventName =
  | "classroom_create_result"
  | "feedback_open"
  | "game_end"
  | "game_start"
  | "level_end"
  | "level_start"
  | "local_progress_reset"
  | "page_view"
  | "select_content"
  | "tutorial_begin"
  | "tutorial_complete"
  | "tutorial_skip";
export type AnalyticsParameterValue = string | number | boolean;
export type AnalyticsParameters = Record<
  string,
  AnalyticsParameterValue | undefined
>;

export interface AnalyticsEnvironment {
  hostname: string;
  isProductionBuild: boolean;
}

interface AnalyticsAdapter {
  initialize: (
    measurementId: string,
    options?: { gtagOptions?: Record<string, boolean> },
  ) => void;
  event: (name: string, parameters?: Record<string, AnalyticsParameterValue>) => void;
}

export function shouldCollectAnalytics({
  hostname,
  isProductionBuild,
}: AnalyticsEnvironment): boolean {
  return isProductionBuild && PRODUCTION_HOSTS.has(hostname.toLowerCase());
}

export function sanitizeAnalyticsParameters(
  parameters: AnalyticsParameters,
): Record<string, AnalyticsParameterValue> {
  return Object.fromEntries(
    Object.entries(parameters).filter(
      (entry): entry is [string, AnalyticsParameterValue] => {
        const [key, value] = entry;
        return (
          value !== undefined &&
          PARAMETER_NAME_PATTERN.test(key) &&
          !FORBIDDEN_PARAMETER_KEYS.has(key)
        );
      },
    ),
  );
}

export class AnalyticsClient {
  private enabled = false;
  private initialized = false;

  constructor(private readonly adapter: AnalyticsAdapter) {}

  initialize(environment: AnalyticsEnvironment): boolean {
    if (this.initialized) {
      return this.enabled;
    }

    this.initialized = true;
    this.enabled = shouldCollectAnalytics(environment);

    if (!this.enabled) {
      return false;
    }

    this.adapter.initialize(GA_MEASUREMENT_ID, {
      gtagOptions: {
        allow_ad_personalization_signals: false,
        allow_google_signals: false,
        send_page_view: false,
      },
    });

    return true;
  }

  send(
    eventName: AnalyticsEventName,
    parameters: AnalyticsParameters = {},
  ): boolean {
    if (!EVENT_NAME_PATTERN.test(eventName)) {
      throw new Error(`Invalid analytics event name: ${eventName}`);
    }

    if (!this.enabled) {
      return false;
    }

    this.adapter.event(
      eventName,
      sanitizeAnalyticsParameters(parameters),
    );
    return true;
  }
}

const analyticsClient = new AnalyticsClient(ReactGA);

function getBrowserEnvironment(): AnalyticsEnvironment {
  return {
    hostname: typeof window === "undefined" ? "" : window.location.hostname,
    isProductionBuild: import.meta.env.PROD,
  };
}

export function initializeAnalytics(): boolean {
  return analyticsClient.initialize(getBrowserEnvironment());
}

export function sendAnalyticsEvent(
  eventName: AnalyticsEventName,
  parameters?: AnalyticsParameters,
): boolean {
  return analyticsClient.send(eventName, parameters);
}
