<script lang="ts">
  import type { CategoryTree } from './lib/utils';

  let {
    selectedCategoryId,
    setSelectedCategoryId,
    categoryTree,
    lang
  }: {
    selectedCategoryId: string | null;
    setSelectedCategoryId: (id: string | null) => void;
    categoryTree: CategoryTree;
    lang: string;
  } = $props();

  let pathToRoot = $derived(
    selectedCategoryId ? categoryTree.getPathToRoot(selectedCategoryId) : []
  );

  let children = $derived(
    selectedCategoryId
      ? categoryTree.getChildren(selectedCategoryId)
      : categoryTree.getRoots()
  );
</script>

<div class="mb-4">
  {#if selectedCategoryId}
    <h3 class="mb-2 text-lg font-semibold text-gray-900">Current Category</h3>
    <!-- Breadcrumb -->
    <nav class="mb-3 flex flex-wrap items-center gap-1 text-sm">
      <button onclick={() => setSelectedCategoryId(null)}
        class="text-blue-600 hover:underline">All</button>
      {#each pathToRoot as cat, i}
        <span class="text-gray-400">›</span>
        {#if i === pathToRoot.length - 1}
          <span class="text-gray-700">{cat.name[lang]}</span>
        {:else}
          <button onclick={() => setSelectedCategoryId(cat.id)}
            class="text-blue-600 hover:underline">{cat.name[lang]}</button>
        {/if}
      {/each}
    </nav>
  {/if}

  <h3 class="mb-2 text-lg font-semibold text-gray-900">Categories</h3>
  <div class="flex flex-wrap gap-2">
    {#each children as cat}
      <button onclick={() => setSelectedCategoryId(cat.id)}
        class="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors">
        {cat.name[lang]}
      </button>
    {/each}
    {#if children.length === 0}
      <span class="text-sm text-gray-400">No subcategories</span>
    {/if}
  </div>
</div>
