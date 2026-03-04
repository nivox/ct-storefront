<script lang="ts">
  import type { ProductTypeAttributes } from './lib/utils';
  import type { FacetsMap } from './StoreFront.svelte';

  let {
    facets,
    facetsSelection,
    productTypeAttributes,
    lang,
    setFacetSelection,
  }: {
    facets: FacetsMap;
    facetsSelection: Record<string, string[]>;
    productTypeAttributes: ProductTypeAttributes;
    lang: string;
    setFacetSelection: (facetName: string, selections: string[]) => void;
  } = $props();

  let facetEntries = $derived(
    Array.from(facets.entries())
      .filter(([_, opts]) => opts.size > 0)
      .map(([name, opts]) => ({
        name,
        label: productTypeAttributes.getAttribute(name).definition.label[lang] || name,
        options: buildOptions(name, opts),
        selection: facetsSelection[name] || [],
      }))
  );

  function buildOptions(facetName: string, facetOptions: Map<string, number>) {
    let options = Array.from(facetOptions.entries()).map(([key, count]) => ({
      label: `${key} (${count})`,
      value: key,
    }));

    if (facetName === 'size') {
      const optionsMap = new Map(options.map(o => [o.value, o.label]));
      const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      sizes.forEach(size => {
        if (!optionsMap.has(size)) {
          optionsMap.set(size, size + ' (forced)');
        }
      });
      options = Array.from(optionsMap.entries()).map(([value, label]) => ({ label, value }));
    }

    return options;
  }

  // Track which dropdowns are open
  let openDropdown = $state<string | null>(null);

  function toggleDropdown(name: string) {
    openDropdown = openDropdown === name ? null : name;
  }

  function toggleOption(facetName: string, value: string, currentSelection: string[]) {
    const isSelected = currentSelection.includes(value);
    const updated = isSelected
      ? currentSelection.filter(v => v !== value)
      : [...currentSelection, value];
    setFacetSelection(facetName, updated);
  }
</script>

<h3 class="mb-2 text-base font-semibold text-gray-900">Filter</h3>
{#if facetEntries.length === 0}
  <p class="text-sm text-gray-500 italic">No filters available (product attributes are not indexed for faceting in this dataset)</p>
{:else}
<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
  {#each facetEntries as facet}
    <div class="relative">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="mb-1 block text-sm font-medium text-gray-700">{facet.label}</label>
      <button
        type="button"
        onclick={() => toggleDropdown(facet.name)}
        class="flex w-full items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <span class="truncate">
          {#if facet.selection.length > 0}
            {facet.selection.join(', ')}
          {:else}
            <span class="text-gray-400">{facet.name}</span>
          {/if}
        </span>
        <svg class="ml-1 h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </button>

      {#if openDropdown === facet.name}
        <div class="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-lg">
          {#each facet.options as opt}
            <label class="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-blue-50">
              <input
                type="checkbox"
                checked={facet.selection.includes(opt.value)}
                onchange={() => toggleOption(facet.name, opt.value, facet.selection)}
                class="rounded"
              />
              {opt.label}
            </label>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
{/if}

<!-- Close dropdown when clicking outside -->
<svelte:window onclick={(e) => {
  if (openDropdown && !(e.target as HTMLElement).closest('.relative')) {
    openDropdown = null;
  }
}} />
