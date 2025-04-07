import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from "dotenv";

dotenv.config();

// JWT authentication for Salesforce to get token.
// For setup see https://help.salesforce.com/s/articleView?id=xcloud.remoteaccess_oauth_jwt_flow.htm&type=5)

// The private key of the connected app in pkcs8 format, base64 encoded
const PRIVATE_KEY = Buffer.from(process.env.SALESFORCE_PRIVATE_KEY_BASE64!, 'base64').toString('utf-8');
// The client ID of the connected app
const CLIENT_ID = process.env.SALESFORCE_CONSUMER_KEY!;
// The Salesforce username associated with the connected app
const USERNAME = process.env.SALESFORCE_USERNAME!;
// Use the sandbox URL if you're working with a sandbox: https://test.salesforce.com
const LOGIN_URL = 'https://login.salesforce.com';

export async function authenticateWithJWT(): Promise<string> {
    const payload = {
        iss: CLIENT_ID,  // The client ID of the connected app
        sub: USERNAME,   // The username of the Salesforce user
        aud: `${LOGIN_URL}/services/oauth2/token`,
        exp: Math.floor(Date.now() / 1000) + (60 * 5),  // Token expiration (5 minutes from now)
    };

    try {
        // Sign the JWT with the private key
        const signedJWT = jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256' });

        // Make a request to Salesforce to exchange the JWT for an access token
        const response = await axios.post(`${LOGIN_URL}/services/oauth2/token`, null, {
            params: {
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: signedJWT,
            }
        });

        return response.data.access_token;
    } catch (error) {
        console.error('Error during JWT authentication:', error);
        throw error;
    }
}
