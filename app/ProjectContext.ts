import { createContext } from "react";
import Ct from "./ct";

export const apiEndpointDefault = "https://api.europe-west1.gcp.commercetools.com";

export interface ProjectDetails {
    projectKey: string,
    token: string,
    apiEndpoint: string,
    ct: Ct
}

export const ProjectContext = createContext<ProjectDetails | null>(null);