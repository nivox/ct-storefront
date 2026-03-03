import { useCallback, useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import { apiEndpointDefault, authEndpointDefault, ProjectDetails } from "./ProjectContext";
import commercetools, { getAccessToken } from "./CommercetoolsClient";
import { ByProjectKeyRequestBuilder } from "@commercetools/platform-sdk";
import { Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { EnvConfig } from "./HomePage";

export default function Login(props: { setProjectDetails: (details: ProjectDetails) => void; envConfig: EnvConfig }) {
  const { setProjectDetails, envConfig } = props;
  const [cookies, setCookies] = useCookies(["config"]);

  // Priority: cookies > env vars > defaults
  const [projectKey, setProjectKey] = useState(cookies.config?.projectKey || envConfig.projectKey || "");
  const [clientId, setClientId] = useState(cookies.config?.clientId || envConfig.clientId || "");
  const [clientSecret, setClientSecret] = useState(cookies.config?.clientSecret || envConfig.clientSecret || "");
  const [apiEndpoint, setApiEndpoint] = useState(cookies.config?.apiEndpoint || envConfig.apiUrl || apiEndpointDefault);
  const [authEndpoint, setAuthEndpoint] = useState(cookies.config?.authEndpoint || envConfig.authUrl || authEndpointDefault);

  const autoLoginAttempted = useRef(false);

  console.log(cookies.config);

  const login = useCallback(async () => {
    const projectClient: ByProjectKeyRequestBuilder = commercetools(projectKey, clientId, clientSecret, apiEndpoint, authEndpoint).withProjectKey({ projectKey });
    const token = await getAccessToken(clientId, clientSecret, authEndpoint);

    setCookies("config", { token: token, projectKey: projectKey, clientId: clientId, clientSecret: clientSecret, apiEndpoint: apiEndpoint, authEndpoint: authEndpoint, ignoredAttributes: {} });

    setProjectDetails({
      projectKey: projectKey,
      token: token,
      clientId,
      clientSecret,
      apiEndpoint: apiEndpoint,
      authEndpoint: authEndpoint,
      projectClient
    })
  }, [projectKey, clientId, clientSecret, apiEndpoint, authEndpoint, setProjectDetails, setCookies])

  // Auto-login when all env variables are provided
  useEffect(() => {
    if (
      !autoLoginAttempted.current &&
      envConfig.projectKey &&
      envConfig.clientId &&
      envConfig.clientSecret
    ) {
      autoLoginAttempted.current = true;
      login();
    }
  }, [envConfig, login]);

  return (
    <Stack>
      <h2>Login</h2>
      <form onSubmit={(e) => e.preventDefault()}>
          <TextInput value={projectKey} onChange={e => setProjectKey(e.target.value)} placeholder="Project Key" />
          <TextInput value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Client ID" />
          <PasswordInput value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="Client Secret" />
          <TextInput value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} placeholder="Api Endpoint" />
          <TextInput value={authEndpoint} onChange={e => setAuthEndpoint(e.target.value)} placeholder="Auth Endpoint" />
        <Button onClick={_ => login()} variant="primary" type="submit">
          Submit
        </Button>
      </form>
    </Stack>
  )
}
