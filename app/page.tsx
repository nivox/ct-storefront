import HomePage from "./HomePage";

export default function Page() {
  const envConfig = {
    projectKey: process.env.CTP_PROJECT_KEY,
    clientId: process.env.CTP_CLIENT_ID,
    clientSecret: process.env.CTP_CLIENT_SECRET,
    apiUrl: process.env.CTP_API_URL,
    authUrl: process.env.CTP_AUTH_URL,
  };

  return <HomePage envConfig={envConfig} />;
}
