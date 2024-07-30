const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const jwtDecode = require('jwt-decode');

const app = express();
const PORT = 8080;

const client = jwksClient({
    jwksUri: 'https://login.microsoftonline.com/YOUR_TENANT_ID/discovery/v2.0/keys' // Replace YOUR_TENANT_ID
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err) {
            console.error('Error getting signing key:', err);
            return callback(err);
        }
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

app.use(cors());
app.use(bodyParser.json());

app.post('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Authorization header missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send('Token missing');
    }

    try {
        console.log('Received access token:', token);

        const decodedToken = jwtDecode(token);
        console.log('Decoded token payload:', decodedToken);

        jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
            if (err) {
                console.error('Error verifying token:', err);
                return res.status(401).send('Invalid token');
            }
            console.log('Token is valid:', decoded);

            res.status(200).send('Data received successfully');
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        res.status(401).send('Invalid token');
    }
});

app.listen(PORT, () => {
    console.log(`Listening here:\nhttp://localhost:${PORT}`);
});
