import React, { useEffect, useState } from "react";
import { PageLayout } from "./components/PageLayout";
import { loginRequest } from "./authConfig";
import { callMsGraph } from "./graph";
import { ProfileData } from "./components/ProfileData";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import "./App.css";
import Button from "react-bootstrap/Button";

const ProfileContent = () => {
    const { instance, accounts } = useMsal();
    const [graphData, setGraphData] = useState(null);

    const RequestProfileData = () => {
        instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
        })
        .then((response) => {
            // console.log("Access token:", response.accessToken);

            // Fetch profile data from Microsoft Graph
            return callMsGraph(response.accessToken);
        })
        .then((graphData) => {
            // console.log(graphData);
            setGraphData(graphData);
        })
        .catch((error) => {
            console.error("Error during token acquisition or profile data fetching:", error);
        });
    };

    return (
        <>
            <h5 className="profileContent">Welcome {accounts[0].name}</h5>
            {graphData ? (
                <ProfileData graphData={graphData} />
            ) : (
                <Button variant="secondary" onClick={RequestProfileData}>
                    Request Profile
                </Button>
            )}
        </>
    );
};

const App = () => {
    const { instance, accounts } = useMsal();

    useEffect(() => {
        if (accounts.length > 0) {
            instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            })
            .then((response) => {
                console.log("Access token:", response.accessToken);
                console.log("Id token:", response.idToken);

                // Send the token to the backend immediately after login
                return fetch("http://localhost:8080/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${response.idToken}`
                    },
                    body: JSON.stringify({ accessToken: response.accessToken }),
                });
            })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Network response was not ok");
                }
                return res.json();
            })
            .then((data) => {
                console.log("Token successfully sent to backend:", data);
            })
            .catch((error) => {
                console.error("Error during token sending process:", error);
            });
        }
    }, [accounts, instance]);

    return (
        <PageLayout>
            <AuthenticatedTemplate>
                <ProfileContent />
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                 {/* <h5 className="card-title">Please sign-in to see your profile information.</h5> */}
            </UnauthenticatedTemplate>
        </PageLayout>
    );
};

export default App;
