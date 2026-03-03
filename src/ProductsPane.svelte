<script lang="ts">
  import type { ProductPagedSearchResponse, ProductSearchResult } from '@commercetools/platform-sdk';

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

  {#each searchResponse.results as product (product.id)}
    <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <img
        src={getProductImage(product)}
        alt={getProductName(product)}
        class="h-48 w-full object-scale-down bg-gray-50"
        onerror={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x200?text=Placeholder'; }}
      />
      <div class="p-3">
        <p class="text-sm font-medium text-gray-900">{getProductName(product)}</p>
        {#if getProductKey(product)}
          <span class="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {getProductKey(product)}
          </span>
        {/if}
      </div>
    </div>
  {/each}

  {@render pagination()}
</div>
