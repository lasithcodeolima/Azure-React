const express = require('express');
require('dotenv').config();
const cors = require('cors');
const axios = require('axios'); 
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const jwtAuthz = require('express-jwt-authz');

const config = {
  auth: {
    tenant: process.env.AZURE_TENANT_ID,
    audience: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET
  }
};

// Initialize Express
const app = express();
app.use(cors());

// Log incoming request headers
app.use((req, res, next) => {
  console.log('Incoming request headers:', req.headers);
  next();
});

// Endpoint to start authentication process
app.get('/auth', (req, res) => {
  const tenantId = config.auth.tenant;
  const clientId = config.auth.audience;
  const redirectUri = 'http://localhost:8080/callback';

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_mode=query&` +
    `scope=api_scope` +
    `state=${encodeURIComponent(generateRandomState())}`;

  res.redirect(authUrl);
cd });

// Generate a random string for state parameter
function generateRandomState() {
  return Math.random().toString(36).substring(2, 15);
}

// Handle callback and exchange authorization code for access token
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Authorization code not provided.');
  }

  try {
    const tokenResponse = await axios.post(`https://login.microsoftonline.com/${config.auth.tenant}/oauth2/v2.0/token`, null, {
      params: {
        client_id: config.auth.audience,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://localhost:8080/callback',
        client_secret: config.auth.clientSecret,
        scope: 'openid profile offline_access api_scope'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    res.json({ accessToken });

  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).send('Failed to exchange code for token.');
  }
});

// Protected endpoint requiring authentication
app.get('/protected', 
  jwt({
    secret: jwks.expressJwtSecret({
      jwksUri: `https://login.microsoftonline.com/${config.auth.tenant}/discovery/v2.0/keys`
    }),
    aud: config.auth.audience,
    iss: `https://login.microsoftonline.com/${config.auth.tenant}/v2.0`,
    algorithms: ['RS256']
  }),
  // jwtAuthz(['Greeting.Read'], { customScopeKey: 'scp' }), // Check for the required scope
  (req, res) => {
    res.send('Hello, world. You were able to access this because you provided a valid access token with the Greeting.Read scope as a claim.');
  }
);

app.listen(8080, () => console.log('\nListening here:\nhttp://localhost:8080'));
