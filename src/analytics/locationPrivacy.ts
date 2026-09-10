const SAFE_CAMPAIGN_PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const SAFE_CAMPAIGN_VALUE_PATTERN = /^[a-z0-9][a-z0-9._-]{0,79}$/i;

interface RawPageContext {
  pageLocation?: string;
  pageReferrer?: string;
}

export interface SafePageContext {
  page_location?: string;
  page_referrer?: string;
}

function parseWebUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function getSafePageLocation(rawLocation: string): string | undefined {
  const source = parseWebUrl(rawLocation);
  if (!source) {
    return undefined;
  }

  const safeLocation = new URL(source.pathname, source.origin);

  for (const parameter of SAFE_CAMPAIGN_PARAMETERS) {
    const value = source.searchParams.get(parameter);
    if (value && SAFE_CAMPAIGN_VALUE_PATTERN.test(value)) {
      safeLocation.searchParams.set(parameter, value);
    }
  }

  return safeLocation.toString();
}

export function getSafePageReferrer(
  rawReferrer: string,
  currentLocation?: string,
): string | undefined {
  const source = parseWebUrl(rawReferrer);
  if (!source) {
    return undefined;
  }

  const current = currentLocation ? parseWebUrl(currentLocation) : null;
  const safePath = current?.origin === source.origin ? source.pathname : "/";
  return new URL(safePath, source.origin).toString();
}

export function getSafePageContext({
  pageLocation,
  pageReferrer,
}: RawPageContext): SafePageContext {
  const context: SafePageContext = {};
  const safeLocation = pageLocation
    ? getSafePageLocation(pageLocation)
    : undefined;
  const safeReferrer = pageReferrer
    ? getSafePageReferrer(pageReferrer, pageLocation)
    : undefined;

  if (safeLocation) {
    context.page_location = safeLocation;
  }
  if (safeReferrer) {
    context.page_referrer = safeReferrer;
  }

  return context;
}

export function getBrowserSafePageContext(): SafePageContext {
  if (typeof window === "undefined") {
    return {};
  }

  return getSafePageContext({
    pageLocation: window.location.href,
    pageReferrer: document.referrer,
  });
}
