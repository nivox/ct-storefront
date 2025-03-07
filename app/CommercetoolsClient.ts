import {
    ClientBuilder,
} from '@commercetools/sdk-client-v2'
import { ApiRoot, createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'

const authMiddlewareOptions = (projectKey: string, clientId: string, clientSecret: string, authEndpoint: string) => ({
    host: authEndpoint,
    projectKey: projectKey,
    credentials: {
        clientId: clientId,
        clientSecret: clientSecret,
    },
    fetch,
})

const httpMiddlewareOptions = (apiEndpoint: string) => ({
    host: apiEndpoint,
    fetch,
})

function commercetools(projectKey: string, clientId: string, clientSecret: string, apiEndpoint: string, authEndpoint: string): ApiRoot {
    return createApiBuilderFromCtpClient(new ClientBuilder()
        .withProjectKey(projectKey)
        .withClientCredentialsFlow(authMiddlewareOptions(projectKey, clientId, clientSecret, authEndpoint))
        .withHttpMiddleware(httpMiddlewareOptions(apiEndpoint))
        .withUserAgentMiddleware()
        .build())
}

export default commercetools;

export const getAccessToken = async (clientId: string, clientSecret: string, authEndpoint: string, scope?: string): Promise<string> => {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const params: Record<string, string> = scope ? {
        grant_type: 'client_credentials',
        scope: scope
    } : {
        grant_type: 'client_credentials'
    };

    const response = await fetch(`${authEndpoint}/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        },
        body: new URLSearchParams(params)
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
};
