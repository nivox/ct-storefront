<script lang="ts">
  import type { Attribute, ProductPagedSearchResponse, ProductSearchResult } from '@commercetools/platform-sdk';

  let {
    searchResponse,
    page,
    lang,
    triggerPagination,
  }: {
    searchResponse: ProductPagedSearchResponse;
    page: number;
    lang: string;
    triggerPagination: (page: number) => void;
  } = $props();

  let total = $derived(searchResponse.total ?? 0);
  let totalPages = $derived(Math.ceil(total / 10));

  // Track which product cards are expanded
  let expandedIds = $state<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    expandedIds = next;
  }

  // Build a window of page numbers to show
  let pageNumbers = $derived.by(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  function getProductImage(product: ProductSearchResult): string {
    return product.productProjection?.masterVariant?.images?.[0]?.url
      || 'https://placehold.co/300x200?text=Placeholder';
  }

  function getProductName(product: ProductSearchResult): string {
    return product.productProjection?.name?.[lang] || 'Unnamed';
  }

  function getProductKey(product: ProductSearchResult): string {
    return product.productProjection?.key || '';
  }

  function getProductDescription(product: ProductSearchResult): string {
    return product.productProjection?.description?.[lang] || '';
  }

  function getProductAttributes(product: ProductSearchResult): Attribute[] {
    return product.productProjection?.masterVariant?.attributes || [];
  }

  function formatAttributeValue(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      // Localized string — try current lang, then first available
      const obj = value as Record<string, unknown>;
      if (obj[lang]) return String(obj[lang]);
      if ('label' in obj) return formatAttributeValue(obj.label);
      if ('key' in obj && 'label' in obj) return formatAttributeValue(obj.label);
      const vals = Object.values(obj);
      if (vals.length > 0 && typeof vals[0] === 'string') return String(vals[0]);
      return JSON.stringify(value);
    }
    return String(value);
  }
</script>

{#snippet pagination()}
  <nav class="flex items-center gap-1">
    <button
      onclick={() => triggerPagination(Math.max(1, page - 1))}
      disabled={page <= 1}
      class="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-40 hover:bg-gray-100"
    >&laquo;</button>
    {#each pageNumbers as p}
      <button
        onclick={() => triggerPagination(p)}
        class="rounded border px-2 py-1 text-sm {p === page ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 hover:bg-gray-100'}"
      >{p}</button>
    {/each}
    <button
      onclick={() => triggerPagination(Math.min(totalPages, page + 1))}
      disabled={page >= totalPages}
      class="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-40 hover:bg-gray-100"
    >&raquo;</button>
  </nav>
{/snippet}

<div class="flex flex-col gap-4">
  <p class="text-sm text-gray-600">Found {total} products ({totalPages} pages)</p>

  {@render pagination()}

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    {#each searchResponse.results as product (product.id)}
      {@const expanded = expandedIds.has(product.id)}
      {@const attrs = getProductAttributes(product)}
      {@const desc = getProductDescription(product)}
      <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <!-- Collapsed row: image + summary -->
        <button
          type="button"
          onclick={() => toggleExpanded(product.id)}
          class="flex w-full text-left"
        >
          <div class="h-36 w-36 shrink-0 bg-gray-50 p-2">
            <img
              src={getProductImage(product)}
              alt={getProductName(product)}
              class="h-full w-full object-contain"
              onerror={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x200?text=Placeholder'; }}
            />
          </div>
          <div class="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-4">
            <h3 class="text-sm font-semibold text-gray-900 {expanded ? '' : 'line-clamp-2'}">{getProductName(product)}</h3>
            {#if desc && !expanded}
              <p class="text-xs leading-relaxed text-gray-500 line-clamp-2">{desc}</p>
            {/if}
            <div class="flex items-center gap-2">
              {#if getProductKey(product)}
                <span class="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {getProductKey(product)}
                </span>
              {/if}
              <span class="ml-auto text-xs text-gray-400">{expanded ? '▲ collapse' : '▼ details'}</span>
            </div>
          </div>
        </button>

        <!-- Expanded details -->
        {#if expanded}
          <div class="border-t border-gray-100 px-4 py-3">
            {#if desc}
              <div class="mb-3">
                <h4 class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Description</h4>
                <p class="text-sm leading-relaxed text-gray-600">{desc}</p>
              </div>
            {/if}
            {#if attrs.length > 0}
              <h4 class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Attributes</h4>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                {#each attrs as attr}
                  <div class="flex justify-between gap-2 text-xs">
                    <span class="font-medium text-gray-500">{attr.name}</span>
                    <span class="truncate text-right text-gray-700">{formatAttributeValue(attr.value)}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  {@render pagination()}
</div>
