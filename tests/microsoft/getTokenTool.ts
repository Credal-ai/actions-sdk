import http from 'http';
import open from 'open';
import axios from 'axios';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

// Ensure environment variables are set
if (!process.env.MICROSOFT_CLIENT_ID) {
    throw new Error('Missing required environment variable: MICROSOFT_CLIENT_ID');
}
if (!process.env.MICROSOFT_CLIENT_SECRET) {
    throw new Error('Missing required environment variable: MICROSOFT_CLIENT_SECRET');
}
if (!process.env.MICROSOFT_TENANT_ID) {
    throw new Error('Missing required environment variable: MICROSOFT_TENANT_ID');
}
if (!process.env.MICROSOFT_REDIRECT_URI) {
    throw new Error('Missing required environment variable: MICROSOFT_REDIRECT_URI');
}

// Load environment variables
const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const TENANT_ID = process.env.MICROSOFT_TENANT_ID;
const REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI;

// Extract the port from the redirect URI
const parsedUrl = new URL(REDIRECT_URI);
if (parsedUrl.hostname !== 'localhost' && parsedUrl.hostname !== '127.0.0.1') {
    throw new Error('The redirect URI must be a localhost URL for this tool to work.');
}
const AUTH_PORT = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 80; // Default to port 80 if not specified

const scope = "offline_access ChatMessage.Send ChannelMessage.Send Files.ReadWrite Sites.ReadWrite.All";  // offline_access ensures refresh token is returned

// Function to generate the Microsoft OAuth2 authorization URL
function generateAuthUrl(): string {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: scope,
        response_mode: 'query',
        state: 'randomstatevalue',
    });

    return `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

// Function to exchange authorization code for tokens
async function getTokens(authCode: string): Promise<void> {
    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: authCode,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        scope: scope,
    });

    try {
        const response = await axios.post(tokenUrl, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('Access Token:', response.data.access_token);
        console.log('\nRefresh Token:', response.data.refresh_token);
    } catch (error: any) {
        console.error('Error fetching tokens:', error.response?.data || error.message);
    }
}

// Start a temporary local server to capture the authorization code
const server = http.createServer(async (req, res) => {
    if (req.url?.startsWith('/callback')) {
        const url = new URL(req.url, `http://localhost:${AUTH_PORT}`);
        const authCode = url.searchParams.get('code');

        if (authCode) {
            console.log('\nAuthorization Code received:', authCode);
            res.end('Authorization successful! You can close this window.');
            server.close(); // Close the server after receiving the code
            await getTokens(authCode);
        } else {
            res.end('Error: No authorization code received.');
        }
    }
});

// Start the server
server.listen(AUTH_PORT, async () => {
    console.log(`Server listening on port ${AUTH_PORT}`);
    const authUrl = generateAuthUrl();
    console.log(`\nOpening the browser for authentication...\n${authUrl}`);
    await open(authUrl); // Open default web browser to authenticate
});
