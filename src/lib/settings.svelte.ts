import Cookies from 'js-cookie';

const SETTINGS_COOKIE_KEY = 'storefront-settings';

export interface StorefrontSettings {
  showCategories: boolean;
  showFacets: boolean;
  suggestionsEnabled: boolean;
  ignoredAttributes: Record<string, string[]>; // keyed by projectKey
}

const defaults: StorefrontSettings = {
  showCategories: true,
  showFacets: true,
  suggestionsEnabled: false,
  ignoredAttributes: {},
};

function loadSettings(): StorefrontSettings {
  try {
    const raw = Cookies.get(SETTINGS_COOKIE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return { ...defaults };
}

function saveSettings(settings: StorefrontSettings) {
  Cookies.set(SETTINGS_COOKIE_KEY, JSON.stringify(settings), { expires: 365 });
}

/**
 * Reactive settings singleton using Svelte 5 runes.
 * Import and call `getSettings()` inside a component to get the reactive state.
 */
let _settings = $state<StorefrontSettings>(loadSettings());

export function getSettings(): StorefrontSettings {
  return _settings;
}

export function updateSettings(patch: Partial<StorefrontSettings>) {
  Object.assign(_settings, patch);
  saveSettings({ ..._settings });
}

export function getIgnoredAttributes(projectKey: string): string[] {
  return _settings.ignoredAttributes[projectKey] || [];
}

export function setIgnoredAttributes(projectKey: string, ignored: string[]) {
  _settings.ignoredAttributes = {
    ..._settings.ignoredAttributes,
    [projectKey]: ignored,
  };
  saveSettings({ ..._settings });
}
