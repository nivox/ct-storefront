import { useCallback, useState } from "react";
import { useCookies } from "react-cookie";
import { apiEndpointDefault, authEndpointDefault, ProjectDetails } from "./ProjectContext";
import commercetools, { getAccessToken } from "./CommercetoolsClient";
import { ByProjectKeyRequestBuilder } from "@commercetools/platform-sdk";
import { Button, PasswordInput, Stack, TextInput } from "@mantine/core";

export default function Login(props: { setProjectDetails: (details: ProjectDetails) => void }) {
  const { setProjectDetails } = props;
  const [cookies, setCookies] = useCookies(["config"]);
  const [projectKey, setProjectKey] = useState(cookies.config ? cookies.config.projectKey : "");
  const [clientId, setClientId] = useState(cookies.config ? cookies.config.clientId : "");
  const [clientSecret, setClientSecret] = useState(cookies.config ? cookies.config.clientSecret : "");
  const [apiEndpoint, setApiEndpoint] = useState(cookies.config ? cookies.config.apiEndpoint : apiEndpointDefault);
  const [authEndpoint, setAuthEndpoint] = useState(cookies.config ? cookies.config.authEndpoint : authEndpointDefault);

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
