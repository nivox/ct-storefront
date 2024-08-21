import { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useCookies } from "react-cookie";
import { apiEndpointDefault, ProjectDetails } from "./ProjectContext";
import Ct from "./ct";

export default function Login(props: { setProjectDetails: (details: ProjectDetails) => void }) {
    const {setProjectDetails} = props;
    const [cookies] = useCookies(["config"]);
    const [projectKey, setProjectKey] = useState(cookies.config ? cookies.config.projectKey : "");
    const [token, setToken] = useState(cookies.config ? cookies.config.token : "");
    const [apiEndpoint, setApiEndpoint] = useState(cookies.config ? cookies.config.apiEndpoint : apiEndpointDefault);

    const login = () => {
        setProjectDetails({
            projectKey: projectKey,
            token: token,
            apiEndpoint: apiEndpoint,
            ct: new Ct(token, projectKey, apiEndpoint)
        })
    }

    return (
        <Container>
            <Row>
                <Col>
                    <Form.Control type="text" value={projectKey} onChange={e => setProjectKey(e.target.value)} placeholder="ProjectKey" />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Form.Control type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="Token" />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Form.Control type="text" value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} placeholder="Api Endpoint" />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Button onClick={_ => login()}>Apply</Button>
                </Col>
            </Row>
        </Container>
    )
}