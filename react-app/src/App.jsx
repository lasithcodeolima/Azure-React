import React, { useEffect, useState } from "react";
import { PageLayout } from "./components/PageLayout";
import { loginRequest } from "./authConfig";
import { callMsGraph } from "./graph";
import { ProfileData } from "./components/ProfileData";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import "./App.css";
import Button from "react-bootstrap/Button";
import { jwtDecode } from 'jwt-decode';

const ProfileContent = () => {
    const { instance, accounts } = useMsal();
    const [graphData, setGraphData] = useState(null);

    const RequestProfileData = () => {
        instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
        })
        .then((response) => {
            console.log("Access token:", response.accessToken);

            // Fetch profile data from Microsoft Graph
            return callMsGraph(response.accessToken);
        })
        .then((graphData) => {
            console.log(graphData);
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
    const [isTokenValid, setIsTokenValid] = useState(true);

    useEffect(() => {
        const storedIdToken = localStorage.getItem("idToken");

        if (storedIdToken) {
            const decodedToken = jwtDecode(storedIdToken);
            const now = Date.now() / 1000; // current time in seconds
            const tokenExpired = decodedToken.exp <= now;

            if (tokenExpired) {
                console.log("ID Token has expired.");
                setIsTokenValid(false);
                // Clear the expired token from storage
                localStorage.removeItem("idToken");

                // Acquire a new token
                if (accounts.length > 0) {
                    instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0],
                    })
                    .then((response) => {
                        console.log("New ID Token acquired:", response.idToken);

                        // Store the new ID token
                        localStorage.setItem("idToken", response.idToken);

                        // Send the new token to the backend
                        return fetch("http://localhost:8080/token", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${response.idToken}`
                            },
                            body: JSON.stringify({ idToken: response.idToken }),
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
            } else {
                console.log("ID Token is still valid.");
                setIsTokenValid(true);

                // Send the stored token to the backend immediately after login
                fetch("http://localhost:8080/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${storedIdToken}`
                    },
                    body: JSON.stringify({ idToken: storedIdToken }),
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
        } else if (accounts.length > 0) {
            // If no token in storage, acquire a new one
            instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            })
            .then((response) => {
                console.log("New ID Token acquired:", response.idToken);

                // Store the new ID token
                localStorage.setItem("idToken", response.idToken);

                // Send the new token to the backend
                return fetch("http://localhost:8080/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${response.idToken}`
                    },
                    body: JSON.stringify({ idToken: response.idToken }),
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
            </UnauthenticatedTemplate>
        </PageLayout>
    );
};

export default App;
