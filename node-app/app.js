const express = require('express');
require('dotenv').config();
const cors = require('cors');

// Used to validate JWT access tokens
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const jwtAuthz = require('express-jwt-authz');

const config = {
  auth: {
    tenant: process.env.AZURE_TENANT_ID,
    audience: process.env.AZURE_CLIENT_ID
  }
};

// Initialize Express
const app = express();
app.use(cors()); 

// Add Express middleware to validate JWT access tokens
// app.use(jwt({
//   secret: jwks.expressJwtSecret({
//     jwksUri: 'https://login.microsoftonline.com/' + config.auth.tenant + '/discovery/v2.0/keys'
//   }),
//   aud: config.auth.audience,
//   iss: 'https://login.microsoftonline.com/' + config.auth.tenant + '/v2.0',
//   algorithms: ['RS256']
// }));

// Verify the JWT access token is valid and contains 'Greeting.Read' for the scope to access the endpoint.
// Instruct jwtAuthz to pull scopes from the 'scp' claim, which is the claim used by Azure AD.
app.post('/token',(req, res,next) => {
  next()
}, jwt({
  secret: jwks.expressJwtSecret({
    jwksUri: 'https://login.microsoftonline.com/' + config.auth.tenant + '/discovery/v2.0/keys'
  }),
  aud: config.auth.audience,
  iss: 'https://login.microsoftonline.com/' + config.auth.tenant + '/v2.0',
  algorithms: ['RS256']
}),
// jwtAuthz(['Greeting.Read'], { customScopeKey: 'scp' }),
(req, res) => {
  res.send('Hello, world. You were able to access this because you provided a valid access token with the Greeting.Read scope as a claim.')
})

app.listen(8080, () => console.log('\nListening here:\nhttp://localhost:8080'));
