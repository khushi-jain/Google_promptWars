# 🌊 Lighthouse Bridge

**Lighthouse Bridge** is an intelligent, Gemini-powered societal benefit dashboard. It acts as a universal bridge, translating messy, multimodal real-world inputs (photos, audio transcripts, chaotic text) into structured, actionable life-saving responses across six core critical systems.

![Lighthouse Bridge](https://khushi-jain.github.io/Google_promptWars/favicon.ico) *A resilient system for parsing chaos into clarity.*

## 🚀 Live Demo
- **Google Cloud Run (Primary):** [https://lighthouse-bridge-380615613865.us-central1.run.app](https://lighthouse-bridge-380615613865.us-central1.run.app)
- **GitHub Pages (Static UI Fallback):** [https://khushi-jain.github.io/Google_promptWars/](https://khushi-jain.github.io/Google_promptWars/)

## 🎯 Prompt Wars: Core Architecture Alignment

The **Intelligence Discovery Engine** has been heavily optimized specifically to conquer the Prompt Wars problem statement.

> *"Create a functional interface that takes unstructured, messy, real-world inputs (voice, traffic, weather, news, photos, medical history) and instantly converts them into structured, verified, life-saving actions."*

### 1. 🗑️ Messy Input Simulators
The dashboard explicitly demonstrates extracting intent from the exact messy data domains requested:
1. 🏥 **Medical History PDFs:** Extracts life-saving triage actions from raw hospital records.
2. 🚨 **Voice Emergency:** Decodes panicked audio transcripts for immediate roadside or security routing.
3. 📸 **Photo Evidence:** Triage threat anomalies and civic issues from unstructured imagery.
4. 🚦 **Traffic API Dumps:** Analyzes raw gridlock JSON nodes to find smart transit reroutes.
5. 🌪️ **Weather & News:** Aggregates RSS streams to trigger disaster evacuation protocols.

### 2. ✅ "Verified Actions" Architecture
The system utilizes Google's `gemini-2.0-flash` to strictly untangle these messy inputs to output **"Structured, Verified, Life-Saving Actions."** The final UI specifically outputs dynamic `Verified Status` verification badges.

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
