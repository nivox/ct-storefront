import { useCallback, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useCookies } from "react-cookie";
import { apiEndpointDefault, authEndpointDefault, ProjectDetails } from "./ProjectContext";
import Ct from "./ct";
import commercetools, { getAccessToken } from "./CommercetoolsClient";
import { ByProjectKeyRequestBuilder } from "@commercetools/platform-sdk";

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
            ct: new Ct(token, projectKey, apiEndpoint),
            projectClient
        })
    }, [projectKey, clientId, clientSecret, apiEndpoint, authEndpoint, setProjectDetails, setCookies])

    return (
        <Container>
            <h2>Login</h2>
            <Row>
                <Col>
                    <Form onSubmit={(e) => e.preventDefault()}>
                        <Form.Group className="mb-3" controlId="formProjectKey">
                            <Form.Label>Project Key</Form.Label>
                            <Form.Control type="text" value={projectKey} onChange={e => setProjectKey(e.target.value)} placeholder="Project Key" />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formClientId">
                            <Form.Label>Client ID</Form.Label>
                            <Form.Control type="text" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Client ID" />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formClientSecret">
                            <Form.Label>Client Secret</Form.Label>
                            <Form.Control type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="Client Secret" />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formApiEndpoint">
                            <Form.Label>API Endpoint</Form.Label>
                            <Form.Control type="text" value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} placeholder="Api Endpoint" />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formAuthEndpoint">
                            <Form.Label>API Endpoint</Form.Label>
                            <Form.Control type="text" value={authEndpoint} onChange={e => setAuthEndpoint(e.target.value)} placeholder="Auth Endpoint" />
                        </Form.Group>
                        <Button onClick={_ => login()} variant="primary" type="submit">
                            Submit
                        </Button>
                    </Form>
                </Col>
            </Row>

        </Container>
    )
}