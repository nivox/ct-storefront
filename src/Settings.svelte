<script lang="ts">
  import { getSettings, updateSettings, getIgnoredAttributes, setIgnoredAttributes } from './lib/settings.svelte';

  let {
    open,
    onClose,
    projectKey,
    attributeOptions,
  }: {
    open: boolean;
    onClose: () => void;
    projectKey: string;
    attributeOptions: string[];
  } = $props();

  const settings = getSettings();

  let ignoredAttrs = $derived(getIgnoredAttributes(projectKey));

  function toggleIgnoredAttribute(attr: string, checked: boolean) {
    const updated = checked
      ? [...ignoredAttrs, attr]
      : ignoredAttrs.filter(a => a !== attr);
    setIgnoredAttributes(projectKey, updated);
  }
</script>

{#if open}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 bg-black/40 transition-opacity"
    onclick={onClose}
    onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
  ></div>

  <!-- Slide-out panel -->
  <div class="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <h2 class="text-lg font-semibold text-gray-900">Settings</h2>
      <button onclick={onClose} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
      <!-- Visibility Toggles -->
      <section>
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Visibility</h3>
        <div class="space-y-3">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-gray-700">Show Categories</span>
            <input
              type="checkbox"
              checked={settings.showCategories}
              onchange={() => updateSettings({ showCategories: !settings.showCategories })}
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-gray-700">Show Facets / Filters</span>
            <input
              type="checkbox"
              checked={settings.showFacets}
              onchange={() => updateSettings({ showFacets: !settings.showFacets })}
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </section>

      <!-- Suggestions Toggle -->
      <section>
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Search</h3>
        <label class="flex items-center justify-between cursor-pointer">
          <span class="text-sm text-gray-700">Enable Suggestions</span>
          <input
            type="checkbox"
            checked={settings.suggestionsEnabled}
            onchange={() => updateSettings({ suggestionsEnabled: !settings.suggestionsEnabled })}
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
      </section>

      <!-- Ignored Attributes -->
      {#if attributeOptions.length > 0}
        <section>
          <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Facet Attributes</h3>
          <p class="mb-2 text-xs text-gray-500">Check attributes to <strong>ignore</strong> them from faceted filtering.</p>
          <div class="flex max-h-60 flex-col gap-1 overflow-y-auto rounded border border-gray-200 p-2">
            {#each attributeOptions as attr}
              <label class="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ignoredAttrs.includes(attr)}
                  onchange={(e) => toggleIgnoredAttribute(attr, (e.target as HTMLInputElement).checked)}
                  class="rounded"
                />
                {attr}
              </label>
            {/each}
          </div>
        </section>
      {/if}
    </div>
  </div>
{/if}
