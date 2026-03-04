<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import type { ProductPagedSearchResponse } from '@commercetools/platform-sdk';
  import type { ProjectDetails } from './lib/projectContext';
  import { CategoryTree, ProductTypeAttributes } from './lib/utils';
  import {
    fetchCategories, fetchLanguages, fetchProductTypes,
    productSearch, productSearchFacets, productSuggestions,
    type ProductSuggestions, type SearchMode
  } from './lib/ct';
  import CategoryBar from './CategoryBar.svelte';
  import SearchBar from './SearchBar.svelte';
  import FacetsPane from './FacetsPane.svelte';
  import ProductsPane from './ProductsPane.svelte';
  import Cookies from 'js-cookie';

  export type FacetsMap = Map<string, Map<string, number>>;

  let { projectDetails: ctx }: { projectDetails: ProjectDetails } = $props();

  // --- State ---
  let initStarted = false;
  let initReady = $state(false);
  let categoryTree = $state<CategoryTree | null>(null);
  let productTypeAttributes = $state<ProductTypeAttributes>(new ProductTypeAttributes([]));
  let languageList = $state<string[]>([]);
  let selectedLanguage = $state<string | null>(null);
  let searchMode = $state<SearchMode>('semantic');
  let searchValue = $state('');
  let suggestValue = $state('');
  let selectedCategoryId = $state<string | null>(null);
  let page = $state(1);
  let facetsSelection = $state<Record<string, string[]> | null>(null);
  let showFacetConfig = $state(false);
  let error = $state<string | null>(null);

  let currentLang = $derived(selectedLanguage || 'en');

  // --- Cookie helpers ---
  function getCookieConfig(): Record<string, any> | null {
    try {
      const raw = Cookies.get('config');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveCookieConfig(config: Record<string, any>) {
    Cookies.set('config', JSON.stringify(config));
  }

  // --- Init ---
  $effect(() => {
    if (ctx && !initStarted) {
      initStarted = true;
      initApp();
    }
  });

  async function initApp() {
    try {
      const cats = new CategoryTree(await fetchCategories(ctx.projectClient));
      const attrs = new ProductTypeAttributes(await fetchProductTypes(ctx.projectClient));
      const langs = await fetchLanguages(ctx.projectClient);

      const cookieConfig = getCookieConfig();
      if (cookieConfig?.ignoredAttributes) {
        (cookieConfig.ignoredAttributes[ctx.projectKey] || []).forEach((a: string) =>
          attrs.setIgnoreAttribute(a, true)
        );
      }

      categoryTree = cats;
      productTypeAttributes = attrs;
      languageList = langs;
      selectedLanguage = langs[0];

      saveCookieConfig({
        projectKey: ctx.projectKey,
        clientId: ctx.clientId,
        clientSecret: ctx.clientSecret,
        token: ctx.token,
        apiEndpoint: ctx.apiEndpoint,
        authEndpoint: ctx.authEndpoint,
        ignoredAttributes: cookieConfig?.ignoredAttributes || {}
      });

      initReady = true;
    } catch (e) {
      error = 'Init error: ' + (e as Error).message;
    }
  }

  // --- Queries ---
  // svelte-query v5 with Svelte 5: pass a function returning options for reactivity
  const productsQuery = createQuery(() => ({
    queryKey: ['products', { page, searchValue, selectedCategoryId, selectedLanguage, facetsSelection, searchMode }] as const,
    queryFn: async (): Promise<ProductPagedSearchResponse> => {
      return (await productSearch(
        ctx.projectClient, searchValue, selectedCategoryId, currentLang,
        productTypeAttributes, facetsSelection || {}, (page - 1) * 10, 10, searchMode
      )).body;
    },
    enabled: initReady,
    retry: false,
  }));

  const suggestionsQuery = createQuery(() => ({
    queryKey: ['suggestions', suggestValue] as const,
    queryFn: async (): Promise<ProductSuggestions> => {
      return productSuggestions(ctx, suggestValue, currentLang);
    },
    enabled: initReady,
    retry: false,
  }));

  const facetsQuery = createQuery(() => ({
    queryKey: ['facets', { page, searchValue, selectedCategoryId, selectedLanguage, facetsSelection, searchMode }] as const,
    queryFn: async (): Promise<FacetsMap> => {
      return productSearchFacets(
        ctx.projectClient, searchValue, selectedCategoryId, currentLang,
        productTypeAttributes, facetsSelection || {}, searchMode
      );
    },
    enabled: initReady && productTypeAttributes.getAllAttributes().length > 0,
    retry: false,
  }));

  // --- Facet selection ---
  function setSingleFacetSelection(facetName: string, selections: string[]) {
    const current = facetsSelection || {};
    if (!selections || selections.length === 0) {
      console.log(`Removing facet selection for ${facetName}`);
      const cleaned = { ...current };
      delete cleaned[facetName];
      facetsSelection = cleaned;
    } else {
      console.log(`Setting facet selection for ${facetName} to ${selections}`);
      facetsSelection = { ...current, [facetName]: selections };
    }
  }

  // --- Ignore attributes ---
  let ignoredAttributeNames = $derived(
    productTypeAttributes.getAllAttributes().filter(a => a.ignored).map(a => a.definition.name)
  );

  function handleIgnoreAttributes(ignored: string[]) {
    if (!productTypeAttributes) return;

    productTypeAttributes.getAllAttributes().forEach(a =>
      productTypeAttributes.setIgnoreAttribute(a.definition.name, false)
    );
    ignored.forEach(a => productTypeAttributes.setIgnoreAttribute(a, true));

    const cookieConfig = getCookieConfig() || {};
    const config = {
      ...cookieConfig,
      projectKey: ctx.projectKey,
      token: ctx.token,
      apiEndpoint: ctx.apiEndpoint,
      ignoredAttributes: { ...(cookieConfig.ignoredAttributes || {}), [ctx.projectKey]: ignored }
    };
    saveCookieConfig(config);
    console.log(`Setting ignored attributes to ${ignored}`);

    // Force reactivity by reassigning
    productTypeAttributes = productTypeAttributes;
  }

  let attributeOptions = $derived(
    productTypeAttributes.getAllAttributes().map(a => a.definition.name)
  );

  // --- Search handlers ---
  function triggerSearch(value: string) {
    searchValue = value;
  }

  function handleSuggestKeyDown(value: string) {
    suggestValue = value;
  }
</script>

<div class="mx-auto max-w-7xl px-4 py-6">
  <!-- Error alert -->
  {#if error}
    <div class="mb-4 flex items-center justify-between rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <span>{error}</span>
      <button onclick={() => (error = null)} class="ml-2 font-bold hover:text-red-900">&times;</button>
    </div>
  {/if}

  <!-- Title -->
  <h1 class="mb-6 text-3xl font-bold text-gray-900">{ctx.projectKey} storefront</h1>

  <!-- Top bar: search + language + mode -->
  <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-12">
    <div class="md:col-span-6">
      <SearchBar
        suggestions={suggestionsQuery.data?.suggestions || []}
        onTriggerSearch={triggerSearch}
        onKeyDown={handleSuggestKeyDown}
      />
    </div>
    <div class="md:col-span-3">
      <label for="language" class="mb-1 block text-sm font-medium text-gray-700">Language</label>
      <select id="language" bind:value={selectedLanguage}
        class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
        {#each languageList as lang}
          <option value={lang}>{lang}</option>
        {/each}
      </select>
    </div>
    <div class="md:col-span-3">
      <label for="searchMode" class="mb-1 block text-sm font-medium text-gray-700">Search Mode</label>
      <select id="searchMode" bind:value={searchMode}
        class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
        <option value="semantic">Semantic</option>
        <option value="lexical">Lexical</option>
      </select>
    </div>
  </div>

  <!-- Categories -->
  {#if categoryTree}
    <CategoryBar {selectedCategoryId} setSelectedCategoryId={(id) => (selectedCategoryId = id)} {categoryTree} lang={currentLang} />
  {/if}

  <!-- Facets (only shown when facetable attributes exist) -->
  {#if productTypeAttributes.getAllAttributes().length > 0}
    <div class="mt-6">
      <div class="mb-2 flex items-center gap-3">
        <h2 class="text-xl font-semibold text-gray-900">Facets</h2>
        <button onclick={() => (showFacetConfig = true)}
          class="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100">
          Config
        </button>
      </div>

      {#if facetsQuery.isError}
        <div class="mb-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {facetsQuery.error?.message}
        </div>
      {/if}

      {#if facetsQuery.data}
        <FacetsPane
          facets={facetsQuery.data}
          {productTypeAttributes}
          lang={currentLang}
          facetsSelection={facetsSelection || {}}
          setFacetSelection={setSingleFacetSelection}
        />
      {/if}
    </div>
  {/if}

  <!-- Facet config modal -->
  {#if showFacetConfig && productTypeAttributes.getAllAttributes().length > 0}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onkeydown={(e) => { if (e.key === 'Escape') showFacetConfig = false; }}
      onclick={(e) => { if (e.target === e.currentTarget) showFacetConfig = false; }}
      role="dialog">
      <div class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold">Ignore attributes</h3>
          <button onclick={() => (showFacetConfig = false)} class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="mb-2 block text-sm font-medium text-gray-700">Attributes to ignore</label>
          <div class="flex max-h-60 flex-col gap-1 overflow-y-auto rounded border border-gray-200 p-2">
            {#each attributeOptions as attr}
              <label class="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50">
                <input type="checkbox"
                  checked={ignoredAttributeNames.includes(attr)}
                  onchange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    const updated = checked
                      ? [...ignoredAttributeNames, attr]
                      : ignoredAttributeNames.filter(a => a !== attr);
                    handleIgnoreAttributes(updated);
                  }}
                  class="rounded" />
                {attr}
              </label>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Results -->
  <div class="mt-6">
    <h2 class="mb-2 text-xl font-semibold text-gray-900">Results</h2>

    {#if productsQuery.isError}
      <div class="mb-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {productsQuery.error?.message}
      </div>
    {/if}

    {#if productsQuery.data}
      <ProductsPane
        searchResponse={productsQuery.data}
        lang={currentLang}
        {page}
        triggerPagination={(p) => (page = p)}
      />
    {:else if productsQuery.isLoading}
      <div class="flex items-center gap-2 text-gray-500">
        <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        Loading...
      </div>
    {/if}
  </div>
</div>
