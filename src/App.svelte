<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import HomePage from './HomePage.svelte';

  const queryClient = new QueryClient();

  const envConfig = {
    projectKey: import.meta.env.VITE_CTP_PROJECT_KEY,
    clientId: import.meta.env.VITE_CTP_CLIENT_ID,
    clientSecret: import.meta.env.VITE_CTP_CLIENT_SECRET,
    apiUrl: import.meta.env.VITE_CTP_API_URL,
    authUrl: import.meta.env.VITE_CTP_AUTH_URL,
  };
</script>

<QueryClientProvider client={queryClient}>
  <HomePage {envConfig} />
</QueryClientProvider>
