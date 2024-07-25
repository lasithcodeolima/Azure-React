require('dotenv').config();
const msal = require('@azure/msal-node')
const express = require('express');
const https = require('http');
const socketIo = require('socket.io');
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const jwtAuthz = require('express-jwt-authz');

const config = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    // audience: process.env.AZURE_CLIENT_ID
  }
};

const msalConfidentialClientApp = new msal.ConfidentialClientApplication(config)

const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

app.use((req, res, next) => {
  console.log('Headers:', req.headers);
  next();
});

app.use(jwt({
  secret: jwks.expressJwtSecret({
    // jwksUri: 'https://login.microsoftonline.com/' + config.auth.tenant + '/discovery/v2.0/keys'
    jwksUri: config.auth.authority + '/discovery/v2.0/keys'
  }),
  // audience: config.auth.audience,
  // issuer: 'https://login.microsoftonline.com/' + config.auth.tenant + '/v2.0',
  audience: config.auth.clientId,
  issuer: config.auth.authority + '/v2.0',
  algorithms: ['RS256']
}));

app.get('/me', jwtAuthz(['user_impersonation'], { customScopeKey: 'scp' }), (req, res) => {
 // Get the user's access token for *this* web API
  // res.send('Hello, world. You were able to access this because you provided a valid access token with the Greeting.Read scope as a claim.');
  const authHeader = req.headers.authorization
  // Required for the on-behalf-of request (access token and scope(s)) to the downstream web API (Microsoft Graph, in this case)
  const oboRequest = {
    oboAssertion: authHeader.split(' ')[1],
    scopes: ['user.read']
  }

  // Obtain an access token for Graph on-behalf-of the user.
  // This access token comes from MSAL Node which maintains an in-memory token cache by default.
  msalConfidentialClientApp.acquireTokenOnBehalfOf(oboRequest).then((response) => {
    const options = {
      headers: { Authorization: `Bearer ${response.accessToken}` }
    }

    // Perform an HTTP GET request against the Graph endpoint with the access token issued by
    // Azure AD on behalf of the user.
    https.get('https://graph.microsoft.com/v1.0/me', options, (graphResponse) => {
       // Upon receiving the response from Microsoft Graph, deliver the output
       graphResponse.on('data', function (chunk) {
          res.send(chunk)
       })
    }).end()
  })
});

// io.on('connection', (socket) => {
//   console.log('New client connected');
  
//   // Emit a message to the client
//   socket.emit('message', 'Hello from server');
  
//   socket.on('message', (data) => {
//     console.log('Message from client:', data);
//   });
  
//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//   });
// });

app.listen(8080, () => console.log('\nListening here:\nhttp://localhost:8080'));
