const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// API endpoint to serve dynamic config
app.get('/api/config', (req, res) => {
    res.json({ apiKey: process.env.GEMINI_API_KEY });
});

// Serve static files from root
app.use(express.static(path.join(__dirname)));

// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Lighthouse Bridge live on port ${PORT}`);
});

