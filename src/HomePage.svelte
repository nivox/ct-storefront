<script lang="ts">
  import type { ProjectDetails } from './lib/projectContext';
  import { setProjectContext } from './lib/projectContext';
  import Login from './Login.svelte';
  import StoreFront from './StoreFront.svelte';

  export interface EnvConfig {
    projectKey?: string;
    clientId?: string;
    clientSecret?: string;
    apiUrl?: string;
    authUrl?: string;
  }

  let { envConfig }: { envConfig: EnvConfig } = $props();

  let projectDetails = $state<ProjectDetails | null>(null);

  function setProjectDetails(details: ProjectDetails) {
    projectDetails = details;
  }

  // Set context reactively when projectDetails changes
  $effect(() => {
    if (projectDetails) {
      setProjectContext(projectDetails);
    }
  });
</script>

{#if projectDetails}
  <StoreFront {projectDetails} />
{:else}
  <Login {setProjectDetails} {envConfig} />
{/if}
