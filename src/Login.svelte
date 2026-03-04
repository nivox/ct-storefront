<script lang="ts">
  import type { EnvConfig } from './HomePage.svelte';
  import { apiEndpointDefault, authEndpointDefault, type ProjectDetails } from './lib/projectContext';
  import commercetools, { getAccessToken } from './lib/CommercetoolsClient';
  import Cookies from 'js-cookie';

  let { setProjectDetails, envConfig }: { setProjectDetails: (d: ProjectDetails) => void; envConfig: EnvConfig } = $props();

  // Destructure envConfig once — it's static env vars, won't change
  // svelte-ignore state_referenced_locally
  const { projectKey: envProjectKey, clientId: envClientId, clientSecret: envClientSecret, apiUrl: envApiUrl, authUrl: envAuthUrl } = envConfig;

  function getCookieConfig(): Record<string, any> | null {
    try {
      const raw = Cookies.get('config');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  const cookieConfig = getCookieConfig();

  // Priority: cookies > env vars > defaults
  let projectKey = $state(cookieConfig?.projectKey || envProjectKey || '');
  let clientId = $state(cookieConfig?.clientId || envClientId || '');
  let clientSecret = $state(cookieConfig?.clientSecret || envClientSecret || '');
  let apiEndpoint = $state(cookieConfig?.apiEndpoint || envApiUrl || apiEndpointDefault);
  let authEndpoint = $state(cookieConfig?.authEndpoint || envAuthUrl || authEndpointDefault);
  let loginError = $state<string | null>(null);
  let loggingIn = $state(false);

  let autoLoginAttempted = false;

  async function login() {
    loginError = null;
    loggingIn = true;
    try {
      const projectClient = commercetools(projectKey, clientId, clientSecret, apiEndpoint, authEndpoint)
        .withProjectKey({ projectKey });
      const token = await getAccessToken(clientId, clientSecret, authEndpoint);

      Cookies.set('config', JSON.stringify({
        token, projectKey, clientId, clientSecret, apiEndpoint, authEndpoint, ignoredAttributes: {}
      }));

      setProjectDetails({ projectKey, token, clientId, clientSecret, apiEndpoint, authEndpoint, projectClient });
    } catch (e) {
      loginError = (e as Error).message;
      loggingIn = false;
    }
  }

  // Auto-login when all env variables are provided
  $effect(() => {
    if (!autoLoginAttempted && envProjectKey && envClientId && envClientSecret) {
      autoLoginAttempted = true;
      login();
    }
  });

  function handleSubmit(e: Event) {
    e.preventDefault();
    login();
  }
</script>

<div class="flex min-h-screen items-center justify-center">
  <div class="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
    <h2 class="mb-6 text-2xl font-semibold text-gray-900">Login</h2>

    {#if loginError}
      <div class="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {loginError}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="flex flex-col gap-4">
      <div>
        <label for="projectKey" class="mb-1 block text-sm font-medium text-gray-700">Project Key</label>
        <input id="projectKey" type="text" bind:value={projectKey} placeholder="Project Key"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label for="clientId" class="mb-1 block text-sm font-medium text-gray-700">Client ID</label>
        <input id="clientId" type="text" bind:value={clientId} placeholder="Client ID"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label for="clientSecret" class="mb-1 block text-sm font-medium text-gray-700">Client Secret</label>
        <input id="clientSecret" type="password" bind:value={clientSecret} placeholder="Client Secret"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label for="apiEndpoint" class="mb-1 block text-sm font-medium text-gray-700">API Endpoint</label>
        <input id="apiEndpoint" type="text" bind:value={apiEndpoint} placeholder="API Endpoint"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label for="authEndpoint" class="mb-1 block text-sm font-medium text-gray-700">Auth Endpoint</label>
        <input id="authEndpoint" type="text" bind:value={authEndpoint} placeholder="Auth Endpoint"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </div>
      <button type="submit" disabled={loggingIn}
        class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {loggingIn ? 'Logging in...' : 'Submit'}
      </button>
    </form>
  </div>
</div>
