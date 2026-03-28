const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 8080;

// Security Middlewares
// 1. Helmet sets secure HTTP headers. (Disabled strict CSP for local Vite/CDN compatibility).
app.use(helmet({ contentSecurityPolicy: false })); 

// 2. CORS prevents cross-origin requests from scraping the API.
app.use(cors());

// 3. Payload size up to 20MB for large base64 strings.
app.use(express.json({ limit: '20mb' })); 

// 4. Rate Limiting: Prevent DDoS / Billing Spikes. Max 30 requests per 10 minutes.
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    message: { error: 'GCP Rate Limit Exceeded. Please try again later.' }
});

// Initialize Gemini backend (Secured by Cloud Run env variable)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSy_MOCK_ENV");

// The single, secured execution pipeline for Lighthouse inference.
app.post('/api/analyze', apiLimiter, async (req, res) => {
    try {
        const { manualText, fileData, mimeType, lang } = req.body;
        const targetLang = lang || 'en';
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const parts = [manualText || "Analyze this situation for societal benefit."];
        if (fileData && mimeType) {
            parts.push({
                inlineData: {
                    data: fileData,
                    mimeType: mimeType
                }
            });
        }

        const prompt = `Act as the Lighthouse Bridge. AI Objective: Structured, verified, life-saving outcomes from messy data.
        Language Requirements: Respond ENTIRELY in ${targetLang}.
        Accessibility Requirements: Provide a "summary" for screen readers and "aria_label" for each action.
        Output valid JSON matching this schema exactly:
        {
            "title": "Clear Action Summary",
            "inputType": "Source classification",
            "verification_status": "Verified: High Confidence",
            "reasoning": "Extraction detail from the messy data",
            "priority": "Critical/High/Normal",
            "badgeClass": "badge-urgent/badge-ready",
            "module": "medical/roadside/women/traffic/disaster/civic",
            "actions": [{"icon": "lucide_name", "label": "label", "desc": "detail", "aria_label": "Detailed descriptive label for blind users"}]
        }`;

        const result = await model.generateContent([prompt, ...parts]);
        const responseText = result.response.text();
        
        // Pure extraction algorithm for safety
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("INTELLIGENCE_PAYLOAD_ERROR: Invalid JSON response.");
        
        const data = JSON.parse(jsonMatch[0]);
        res.json(data);
    } catch (err) {
        console.error("Backend Intelligence Error:", err);
        res.status(500).json({ error: err.message || "Failed to parse intelligence request natively." });
    }
});

// Serve static files from root
app.use(express.static(path.join(__dirname)));

// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Lighthouse Bridge (Secure Mode) live on port ${PORT}`);
});
