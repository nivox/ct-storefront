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
  import SettingsPanel from './Settings.svelte';
  import Cookies from 'js-cookie';
  import { getSettings, getIgnoredAttributes, setIgnoredAttributes } from './lib/settings.svelte';

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
  let showSettings = $state(false);
  let error = $state<string | null>(null);

  const settings = getSettings();

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

      // Apply ignored attributes from settings store (preferred) or legacy cookie
      const settingsIgnored = getIgnoredAttributes(ctx.projectKey);
      const legacyIgnored = cookieConfig?.ignoredAttributes?.[ctx.projectKey] || [];
      const ignoredList = settingsIgnored.length > 0 ? settingsIgnored : legacyIgnored;
      ignoredList.forEach((a: string) => attrs.setIgnoreAttribute(a, true));
      if (legacyIgnored.length > 0 && settingsIgnored.length === 0) {
        // migrate legacy ignored attrs into new settings store
        setIgnoredAttributes(ctx.projectKey, legacyIgnored);
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
    enabled: initReady && settings.suggestionsEnabled,
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

  // --- Sync ignored attributes from settings ---
  $effect(() => {
    const ignored = getIgnoredAttributes(ctx.projectKey);
    productTypeAttributes.getAllAttributes().forEach(a =>
      productTypeAttributes.setIgnoreAttribute(a.definition.name, false)
    );
    ignored.forEach(a => {
      if (productTypeAttributes.attributeMap[a]) {
        productTypeAttributes.setIgnoreAttribute(a, true);
      }
    });
    // Force reactivity
    productTypeAttributes = productTypeAttributes;
  });

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

  <!-- Title bar with settings -->
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold text-gray-900">{ctx.projectKey} storefront</h1>
    <button
      onclick={() => (showSettings = true)}
      class="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      aria-label="Settings"
      title="Settings"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  </div>

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
  {#if categoryTree && settings.showCategories}
    <CategoryBar {selectedCategoryId} setSelectedCategoryId={(id) => (selectedCategoryId = id)} {categoryTree} lang={currentLang} />
  {/if}

  <!-- Facets (only shown when facetable attributes exist and enabled) -->
  {#if settings.showFacets && productTypeAttributes.getAllAttributes().length > 0}
    <div class="mt-6">
      <div class="mb-2 flex items-center gap-3">
        <h2 class="text-xl font-semibold text-gray-900">Facets</h2>
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

  <!-- Settings panel -->
  <SettingsPanel
    open={showSettings}
    onClose={() => (showSettings = false)}
    projectKey={ctx.projectKey}
    {attributeOptions}
  />

  <!-- Results -->
  <div class="mt-6">
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
