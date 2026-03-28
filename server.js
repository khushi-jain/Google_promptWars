const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * LIGHTHOUSE: INTELLIGENT BRIDGE (ENTERPRISE BACKEND)
 * Secure, resilient, and optimized for societal benefit.
 */

const app = express();
const PORT = process.env.PORT || 8080;

// Performance & Security Middlewares
app.use(compression()); // Gzip compression to optimize for low-bandwidth users
app.use(helmet({ contentSecurityPolicy: false })); // Secure HTTP headers
app.use(cors()); // Cross-origin resource sharing control
app.use(express.json({ limit: '20mb' })); 

// Rate Limiting: Prevent DDoS / Billing Spikes.
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50,
    message: { error: 'GCP Rate Limit Exceeded. Please try again later.' }
});

// Initialize Gemini backend (Secured via environment)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSy_MOCK_ENV");

/**
 * Resilient content generation with retry logic.
 * Handles transient network issues in disaster/off-grid scenarios.
 */
async function generateWithRetry(model, parts, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(parts);
            return result.response.text();
        } catch (err) {
            console.warn(`Gemini API Call Attempt ${i + 1} failed. Retrying...`, err.message);
            if (i === retries - 1) throw err;
            await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i))); // Exponential backoff
        }
    }
}

/**
 * MAIN API: Unified Intelligent Bridge Analysis
 */
app.post('/api/analyze', apiLimiter, async (req, res) => {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Lighthouse-Trace', traceId);

    try {
        const { manualText, fileData, mimeType, lang } = req.body;
        const targetLang = lang || 'en';
        
        console.log(`[${traceId}] Processing request in ${targetLang}...`);

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const parts = [manualText || "Analyze this situation for societal benefit."];
        
        if (fileData && mimeType) {
            parts.push({
                inlineData: { data: fileData, mimeType: mimeType }
            });
        }

        const prompt = `Act as the Lighthouse Bridge. AI Objective: Structured, verified, life-saving outcomes from messy data.
        Language Requirements: Respond ENTIRELY in ${targetLang}.
        Accessibility Requirements: Provide a "summary" for screen readers and "aria_label" for each action.
        Output MUST be valid JSON between { and } tags:
        {
            "title": "Clear Action Summary",
            "inputType": "Source classification",
            "verification_status": "Verified: High Confidence",
            "reasoning": "Extraction detail from the messy data",
            "priority": "Critical/High/Normal",
            "badgeClass": "badge-urgent/badge-ready",
            "module": "medical/roadside/women/traffic/disaster/civic",
            "actions": [{"icon": "lucide_name", "label": "label", "desc": "detail", "aria_label": "A11y description"}]
        }`;

        const responseText = await generateWithRetry(model, [prompt, ...parts]);
        
        // Robust JSON Extraction (Near-100% Reliability)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error(`[${traceId}] AI Payload Error: No JSON block found.`);
            throw new Error("INTELLIGENCE_PAYLOAD_ERROR: AI failed to emit structured actions.");
        }
        
        const data = JSON.parse(jsonMatch[0]);
        res.json(data);
    } catch (err) {
        console.error(`[${traceId}] Backend_Fault:`, err);
        res.status(500).json({ error: "Intelligence Pipeline Anomaly.", trace: traceId });
    }
});

// Serve static files from root
app.use(express.static(path.join(__dirname)));

// Fallback to index.html (SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Auto-start only if run directly
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Lighthouse Bridge: Operational on http://localhost:${PORT}`);
    });
}

module.exports = app;
