# 🌊 Lighthouse Bridge

**Lighthouse Bridge** is an intelligent, Gemini-powered societal benefit dashboard. It acts as a universal bridge, translating messy, multimodal real-world inputs (photos, audio transcripts, chaotic text) into structured, actionable life-saving responses across six core critical systems.

![Lighthouse Bridge](https://khushi-jain.github.io/Google_promptWars/favicon.ico) *A resilient system for parsing chaos into clarity.*

## 🚀 Live Demo
- **Google Cloud Run (Primary):** [https://lighthouse-bridge-380615613865.us-central1.run.app](https://lighthouse-bridge-380615613865.us-central1.run.app)
- **GitHub Pages (Static UI Fallback):** [https://khushi-jain.github.io/Google_promptWars/](https://khushi-jain.github.io/Google_promptWars/)

## ✨ Key Capabilities

The **Intelligence Discovery Engine** automatically handshakes with available models (Gemini 2.0 Flash, 2.5 Flash, 2.5 Pro) to ensure a high-uptime connection. It features six primary functional models:

1. 🏥 **Medical Emergency:** Triage detection and immediate hospital routing.
2. 🚗 **Roadside Assist:** Crash detection, dispatch, and insurance protocol preparation.
3. 🚨 **Women's Helpline:** Threat anomaly detection and silent tracking alerts.
4. 🚦 **Smart Transit:** Gridlock analysis and real-time alternate safety rerouting.
5. 🌪️ **Disaster Action:** News-triggered evacuation alerts for environmental hazards.
6. 📢 **Civic Complaint:** Auto-generation of formal civic issues (potholes, waste management) to local authorities.

## 🛠️ Technology Stack

- **Frontend:** Vanilla JavaScript (ESM), HTML5, and pure CSS (Premium Glassmorphism & Dark Mode).
- **Intelligence Layer:** Google `@google/generative-ai` SDK (Dynamic Multimodal JSON schema parsing).
- **Backend (Hosting):** Node.js/Express.
- **Testing:** `Vitest` and `jsdom` (Full DOM assertion coverage without API quota drain).
- **Deployment & Cloud:** Docker, Google Cloud Run, GitHub Pages.

## 🧑‍💻 Local Development Setup

To run this application locally, you can choose between a simple static server or the Express server used for Cloud Run.

### Prerequisites
- Node.js version 20+
- An active API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Installation
Clone the repository and install the required dependencies (used for testing and local Express hosting):
```bash
git clone https://github.com/khushi-jain/Google_promptWars.git
cd Google_promptWars
npm install
```

### 2. Configure API Key
Open `app.js` and securely map your Gemini API Key in the Setup Section:
```javascript
// app.js
const API_KEY = "YOUR_GEMINI_API_KEY";
```

### 3. Run the App Locally
Start the Node.js/Express server used for production hosting:
```bash
npm start
```
*The app will be live at `http://localhost:8080/`.*

## 🧪 Running Tests

The application features comprehensive, DOM-accurate unit tests utilizing Vitest and the JSDOM testing environment to assert UI states without making live API calls to Google.

To run the unit test suite and generate a coverage report:
```bash
npm run test
# OR
npx vitest run --coverage
```

## ☁️ Deployment Architecture

Lighthouse Bridge was containerized using Docker and deployed using **Google Cloud Run** to ensure auto-scaling and backend stability. A continuous integration fallback was also established using **GitHub Pages**.

## 🛡️ License
Built for the Google Prompt Wars hackathon. Open-sourced under the MIT License.
