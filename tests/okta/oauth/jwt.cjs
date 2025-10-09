/**
 * This script generates a JWT client assertion and uses it to request an OAuth access token from Okta.
 * The access token can be used to authenticate API requests to Okta.
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../../.env') }); // Load .env file from the base of the project

// ===== CONFIG =====
const CLIENT_ID = process.env.OKTA_CLIENT_ID;
const TOKEN_URL = new URL('/oauth2/v1/token', process.env.OKTA_DOMAIN).toString();
const SCOPES = 'okta.users.read okta.groups.read okta.groups.manage okta.users.manage';

if (!CLIENT_ID || !TOKEN_URL) {
  console.error("❌ Missing required environment variables: OKTA_CLIENT_ID or OKTA_DOMAIN.");
  process.exit(1);
}

// ===== READ PRIVATE KEY =====
const privateKeyPath = path.join(__dirname, 'private.key');
if (!fs.existsSync(privateKeyPath)) {
  console.error(`❌ Private key file not found at ${privateKeyPath}.`);
  process.exit(1);
}
const privateKey = fs.readFileSync(privateKeyPath);

// ===== BUILD JWT =====
const now = Math.floor(Date.now() / 1000);
const jwtPayload = {
  iss: CLIENT_ID,
  sub: CLIENT_ID,
  aud: TOKEN_URL,
  iat: now,
  exp: now + 60 * 60, // valid for 1 hour
  jti: Math.random().toString(36).substring(2), // random token ID
};

const clientAssertion = jwt.sign(jwtPayload, privateKey, { algorithm: 'RS256' });

// ===== REQUEST TOKEN =====
async function getToken() {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('scope', SCOPES);
    params.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
    params.append('client_assertion', clientAssertion);

    const response = await axios.post(TOKEN_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    console.log(`OKTA_AUTH_TOKEN="${response.data.access_token}"`);
  } catch (error) {
    console.error('❌ Error fetching token:', error.response ? error.response.data : error);
  }
}

getToken();

