'use client';

import App from "./App";
import { useState } from "react";
import { ProjectContext, ProjectDetails } from "./ProjectContext";
import Login from "./Login";
import { MantineProvider } from "@mantine/core";

import 'bootstrap/dist/css/bootstrap.min.css';
import '@mantine/core/styles.css';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient()

export default function Home() {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <ProjectContext.Provider value={projectDetails}>
        <MantineProvider>
          <div className="app">
            {projectDetails ? <App /> : <Login setProjectDetails={setProjectDetails} />}
          </div>
        </MantineProvider>
      </ProjectContext.Provider>
    </QueryClientProvider>
  )
}
