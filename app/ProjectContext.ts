import { createContext } from "react";
import { ByProjectKeyRequestBuilder } from "@commercetools/platform-sdk";

export const apiEndpointDefault = "https://api.europe-west1.gcp.commercetools.com";
export const authEndpointDefault = "https://auth.europe-west1.gcp.commercetools.com";

export interface ProjectDetails {
    projectKey: string,
    token: string,
    clientId: string,
    clientSecret: string,
    apiEndpoint: string,
    authEndpoint: string,
    projectClient: ByProjectKeyRequestBuilder
}

export const ProjectContext = createContext<ProjectDetails | null>(null);
