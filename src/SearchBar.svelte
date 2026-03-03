<script lang="ts">
  let {
    suggestions,
    onTriggerSearch,
    onKeyDown
  }: {
    suggestions: string[];
    onTriggerSearch: (value: string) => void;
    onKeyDown: (value: string) => void;
  } = $props();

  let query = $state('');
  let opened = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      // Immediate search on Enter — cancel any pending debounce
      if (debounceTimer) clearTimeout(debounceTimer);
      if (query) {
        onTriggerSearch(query);
        opened = false;
      }
    } else {
      onKeyDown((e.target as HTMLInputElement).value);
      opened = true;

      // Debounced search-as-you-type (400ms)
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (query) onTriggerSearch(query);
      }, 400);
    }
  }

  function selectSuggestion(item: string) {
    query = item;
    opened = false;
    onTriggerSearch(item);
  }

  function handleBlur() {
    // Delay to allow click on suggestion
    setTimeout(() => { opened = false; }, 150);
  }
</script>

<div class="relative">
  <label for="search" class="mb-1 block text-sm font-medium text-gray-700">&nbsp;</label>
  <input
    id="search"
    type="text"
    bind:value={query}
    placeholder="Search..."
    onkeyup={handleKeyUp}
    onfocus={() => { if (suggestions.length > 0) opened = true; }}
    onblur={handleBlur}
    class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
  />

  {#if opened && suggestions.length > 0}
    <div class="absolute z-10 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
      {#each suggestions as item}
        <button
          type="button"
          class="w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
          onmousedown={() => selectSuggestion(item)}
        >
          {item}
        </button>
      {/each}
    </div>
  {/if}
</div>
