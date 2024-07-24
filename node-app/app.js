require('dotenv').config();
const express = require('express');
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const jwtAuthz = require('express-jwt-authz');

const config = {
  auth: {
    // 'Directory (tenant) ID' of app registration in the Microsoft Entra admin center - this value is a GUID
    tenant: process.env.AZURE_TENANT_ID,
    // 'Application (client) ID' of app registration in the Microsoft Entra admin center - this value is a GUID
    audience: process.env.AZURE_CLIENT_ID
  }
};

// Initialize Express
const app = express();

// Add Express middleware to validate JWT access tokens
app.use(jwt({
  secret: jwks.expressJwtSecret({
    jwksUri: 'https://login.microsoftonline.com/' + config.auth.tenant + '/discovery/v2.0/keys'
  }),
  audience: config.auth.audience,
  issuer: 'https://login.microsoftonline.com/' + config.auth.tenant + '/v2.0',
  algorithms: ['RS256']
}));

// Verify the JWT access token is valid and contains 'Greeting.Read' for the scope to access the endpoint.
// Instruct jwtAuthz to pull scopes from the 'scp' claim, which is the claim used by Azure AD.
app.get('/', jwtAuthz(['Greeting.Read'], { customScopeKey: 'scp' }), (req, res) => {
  res.send('Hello, world. You were able to access this because you provided a valid access token with the Greeting.Read scope as a claim.');
});

app.listen(8080, () => console.log('\nListening here:\nhttp://localhost:8080'));
