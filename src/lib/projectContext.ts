import { getContext, setContext } from 'svelte';
import type { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk';

export const apiEndpointDefault = "https://api.europe-west1.gcp.commercetools.com";
export const authEndpointDefault = "https://auth.europe-west1.gcp.commercetools.com";

export interface ProjectDetails {
  projectKey: string;
  token: string;
  clientId: string;
  clientSecret: string;
  apiEndpoint: string;
  authEndpoint: string;
  projectClient: ByProjectKeyRequestBuilder;
}

const PROJECT_CTX_KEY = Symbol('project');

export function setProjectContext(details: ProjectDetails) {
  setContext(PROJECT_CTX_KEY, details);
}

export function getProjectContext(): ProjectDetails {
  return getContext<ProjectDetails>(PROJECT_CTX_KEY);
}
