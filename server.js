const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables

const app = express();
app.use(bodyParser.json());

const neynarSignerUuid = process.env.NEYAR_SIGNER_UUID;
const neynarClientId = process.env.NEYAR_CLIENT_ID;
const apiKey0x = process.env.API_KEY_0X;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the single-page application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fetch token details
app.post('/fetchTokenDetails', async (req, res) => {
    const { contractAddress } = req.body;
    try {
        const tokenResponse = await axios.get(`https://api.etherscan.io/api?module=token&action=tokeninfo&contractaddress=${contractAddress}&apikey=${apiKey0x}`);
        const tokenData = tokenResponse.data.result[0];
        const tokenName = tokenData.tokenName;
        const priceResponse = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${contractAddress}&vs_currencies=usd`);
        const tokenPrice = priceResponse.data[contractAddress].usd;
        res.json({ tokenName, tokenPrice });
    } catch (error) {
        res.status(400).json({ error: 'Invalid contract address or API error' });
    }
});

// Track token
app.post('/trackToken', async (req, res) => {
    const { contractAddress, tokenName, tokenPrice, percentage, userFid } = req.body;
    const notificationText = percentage === 0 
        ? `Daily update: ${tokenName} (${contractAddress}) price is $${tokenPrice}`
        : `${tokenName} (${contractAddress}) has moved by ${percentage}% from the price $${tokenPrice}`;
    try {
        // Send notification via Neynar API
        await axios.post('https://api.neynar.com/v2/cast', {
            signer_uuid: neynarSignerUuid,
            client_id: neynarClientId,
            text: notificationText,
            embeds: [{ url: `https://etherscan.io/token/${contractAddress}` }]
        }, {
            headers: { 'api_key': apiKey0x }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Unenroll token
app.post('/unenrollToken', async (req, res) => {
    const { contractAddress, userFid } = req.body;
    try {
        // Perform unenrollment logic here (e.g., update database, notify user)
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to unenroll token' });
    }
});

// Fallback to serve index.html for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
