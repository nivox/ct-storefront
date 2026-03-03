'use client';

import App from "./App";
import { useState } from "react";
import { ProjectContext, ProjectDetails } from "./ProjectContext";
import Login from "./Login";
import { MantineProvider } from "@mantine/core";

import '@mantine/core/styles.css';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient()

export interface EnvConfig {
  projectKey?: string;
  clientId?: string;
  clientSecret?: string;
  apiUrl?: string;
  authUrl?: string;
}

export default function HomePage({ envConfig }: { envConfig: EnvConfig }) {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <ProjectContext.Provider value={projectDetails}>
        <MantineProvider>
          <div className="app">
            {projectDetails ? <App /> : <Login setProjectDetails={setProjectDetails} envConfig={envConfig} />}
          </div>
        </MantineProvider>
      </ProjectContext.Provider>
    </QueryClientProvider>
  )
}
