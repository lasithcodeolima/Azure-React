const express = require('express');
const router = express.Router();
const { findUser } = require('../controllers/userController');
const msal = require('@azure/msal-node');
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const jwtAuthz = require('express-jwt-authz');
const axios = require('axios');
require('dotenv').config();

const config = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
  }
};

const msalConfidentialClientApp = new msal.ConfidentialClientApplication(config);

const authMiddleware = jwt({
  secret: jwks.expressJwtSecret({
    jwksUri: config.auth.authority + '/discovery/v2.0/keys'
  }),
  audience: config.auth.clientId,
  issuer: config.auth.authority + '/v2.0',
  algorithms: ['RS256']
});

router.get('/me', authMiddleware, jwtAuthz(['user_impersonation'], { customScopeKey: 'scp' }), async (req, res) => {
  const authHeader = req.headers.authorization;
  const oboRequest = {
    oboAssertion: authHeader.split(' ')[1],
    scopes: ['user.read']
  };

  try {
    const response = await msalConfidentialClientApp.acquireTokenOnBehalfOf(oboRequest);

    const graphResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${response.accessToken}` }
    });

    const userData = {
      name: graphResponse.data.displayName,
      email: graphResponse.data.mail,
      azureId: graphResponse.data.id
    };

    const user = await findUser(userData);

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(404).send('User not found');
  }
});

module.exports = router;
