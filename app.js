import { GoogleGenerativeAI } from "@google/generative-ai";

/** 
 * LIGHTHOUSE: INTELLIGENT BRIDGE (FIXED ARCHITECTURE)
 * REASON: Re-stabilizing the SDK and adding raw error reporting to the UI.
 */


// 1. Initial Setup
let genAI = null;

const statusText = document.querySelector('#processing p');
let activeIntelligence = null;

async function getGenAI() {
    if (genAI) return genAI;
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        if (data.apiKey) {
            genAI = new GoogleGenerativeAI(data.apiKey);
            return genAI;
        }
    } catch (e) {
        console.warn("Could not fetch API key from server. Using fallback or running locally incorrectly.");
    }
    throw new Error("GEMINI_API_KEY env variable is missing on the server.");
}

// The "Discovery" Engine: Handshakes with Google's model clusters
async function discoverIntelligence() {
    if (activeIntelligence) return activeIntelligence;
    
    const aiInstance = await getGenAI();

    // 2026 Available Models (1.5 models have been deprecated!)
    const candidateModels = [
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash-lite"
    ];

    console.log("Starting Intelligence Handshake...");

    for (const name of candidateModels) {
        try {
            console.log(`📡 Linking with ${name}...`);
            const model = aiInstance.getGenerativeModel({ model: name });
            
            // Critical Connectivity Test
            await model.generateContent("ping");
            
            console.log(`✅ Authorized for: ${name}`);
            activeIntelligence = model;
            return model;
        } catch (e) {
            console.warn(`⚠️ ${name} unreachable:`, e.message);
        }
    }
    
    // If we get here, no model worked.
    throw new Error("ACCESS_DENIED: All models failed. This usually means the 'Generative Language API' is DISABLED in your Google AI Studio project.");
}

// 2. UI Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const btnAnalyze = document.getElementById('btnAnalyze');
const processing = document.getElementById('processing');
const resultView = document.getElementById('resultView');
const resTitle = document.getElementById('resTitle');
const resReasoning = document.getElementById('resReasoning');
const resBadge = document.getElementById('resBadge');
const actionGrid = document.getElementById('actionGrid');
const moduleList = document.querySelectorAll('.module-item');

let selectedFile = null;

// 3. File Processing
async function fileToGenerativePart(file) {
    const reader = new FileReader();
    return new Promise((resolve) => {
        reader.onloadend = () => {
            resolve({
                inlineData: {
                    data: reader.result.split(',')[1],
                    mimeType: file.type
                },
            });
        };
        reader.readAsDataURL(file);
    });
}

// 4. Core Logic
async function runBridge(manualText = "") {
    processing.style.display = 'flex';
    dropZone.style.display = 'none';
    resultView.style.display = 'none';

    try {
        statusText.innerText = "Discovering authorized intelligence layer...";
        const model = await discoverIntelligence();

        statusText.innerText = "Ingesting situation data...";
        let parts = [manualText || "Analyze this situation for societal benefit."];
        
        if (selectedFile) {
            const filePart = await fileToGenerativePart(selectedFile);
            parts.push(filePart);
        }

        statusText.innerText = "Gemini is reasoning...";
        
        const prompt = `Act as the Lighthouse Bridge. Output a JSON objects:
        {
            "title": "summary",
            "reasoning": "detail",
            "priority": "Critical/High/Normal",
            "badgeClass": "badge-urgent/badge-ready",
            "module": "medical/roadside/women/traffic/disaster/civic",
            "actions": [{"icon": "lucide_name", "label": "label", "desc": "detail"}]
        }`;

        const result = await model.generateContent([prompt, ...parts]);
        const responseText = result.response.text();
        
        // Strip markdown
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("INTELLIGENCE_PAYLOAD_ERROR: Invalid JSON response.");
        
        const data = JSON.parse(jsonMatch[0]);
        updateUI(data);

    } catch (err) {
        console.error("CRITICAL_BRIDGE_FAULT:", err);
        // Show raw error message to the user!
        statusText.style.color = "var(--danger)";
        statusText.innerHTML = `<b>Bridge Fault:</b><br>${err.message}<br><br>Please check console for details.`;
        
        setTimeout(() => {
            statusText.style.color = "var(--text-secondary)";
            resetUI();
        }, 8000);
    }
}

function updateUI(data) {
    resTitle.textContent = data.title;
    resReasoning.textContent = data.reasoning;
    resBadge.textContent = `Priority: ${data.priority}`;
    resBadge.className = `status-badge ${data.badgeClass}`;

    moduleList.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.module === data.module) item.classList.add('active');
    });

    actionGrid.innerHTML = '';
    data.actions.forEach(act => {
        const div = document.createElement('div');
        div.className = 'action-card';
        div.innerHTML = `
            <div class="icon-box" style="background: rgba(6, 182, 212, 0.2);"><i data-lucide="${act.icon}"></i></div>
            <div>
                <h4 style="font-size: 0.9rem;">${act.label}</h4>
                <p style="font-size: 0.75rem; color: var(--text-secondary);">${act.desc}</p>
            </div>
        `;
        actionGrid.appendChild(div);
    });

    lucide.createIcons();
    processing.style.display = 'none';
    resultView.style.display = 'block';
}

function resetUI() {
    processing.style.display = 'none';
    dropZone.style.display = 'block';
    selectedFile = null;
}

// 5. Interaction
btnAnalyze.addEventListener('click', () => {
    if (!selectedFile) fileInput.click();
    else runBridge();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        runBridge();
    }
});

dropZone.addEventListener('dragover', (e) => e.preventDefault());
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
        selectedFile = e.dataTransfer.files[0];
        runBridge();
    }
});

const SIMULATION_DATA = {
    medical: {
        title: "Medical Emergency Detected",
        reasoning: "Visual context and audio heuristics suggest a level 2 trauma incident. Vitals dropping out of standard threshold.",
        priority: "Critical",
        badgeClass: "badge-urgent",
        module: "medical",
        actions: [
            { icon: "heart-pulse", label: "Dispatch EMTs", desc: "Routing unit to current geoloc" },
            { icon: "phone", label: "Alert Hospital", desc: "Pre-arrival notification sent" }
        ]
    },
    roadside: {
        title: "Roadside Assist Ready",
        reasoning: "Vehicle anomaly detected via audio sensors. Likely engine failure or flat tire.",
        priority: "High",
        badgeClass: "badge-urgent",
        module: "roadside",
        actions: [
            { icon: "car", label: "Tow Truck", desc: "Dispatching from nearest hub" },
            { icon: "shield-alert", label: "Insurance", desc: "Auto-filing claim payload" }
        ]
    },
    women: {
        title: "Security Threat Anomaly",
        reasoning: "Threat detected based on rapid audio fluctuation and geofence deviation at late hour.",
        priority: "Critical",
        badgeClass: "badge-urgent",
        module: "women",
        actions: [
            { icon: "shield", label: "Silent Alarm", desc: "Local authorities pinged" },
            { icon: "user-check", label: "Trusted Contact", desc: "Live-location shared" }
        ]
    },
    traffic: {
        title: "Smart Transit Reroute",
        reasoning: "Aggregated path data indicates severe bottleneck ahead due to collision 400m away.",
        priority: "Normal",
        badgeClass: "badge-ready",
        module: "traffic",
        actions: [
            { icon: "map-pin", label: "Alternative Route", desc: "ETA updated to -15 mins" },
            { icon: "car", label: "Notify Meeting", desc: "Auto-send delayed status" }
        ]
    },
    disaster: {
        title: "Disaster Alert: Flooding",
        reasoning: "News feed and weather API correlation flag flash flood warning for zone Alpha.",
        priority: "Critical",
        badgeClass: "badge-urgent",
        module: "disaster",
        actions: [
            { icon: "wind", label: "Evacuation Protocol", desc: "Broadcast to all local devices" },
            { icon: "cloud-lightning", label: "Grid Shutoff", desc: "Power lines isolated" }
        ]
    },
    civic: {
        title: "Civic Issue Logged",
        reasoning: "Visual analysis confirms a deep pothole and broken streetlight combo on Main St.",
        priority: "Normal",
        badgeClass: "badge-ready",
        module: "civic",
        actions: [
            { icon: "file-text", label: "Complaint Autopath", desc: "Drafted email to city council" },
            { icon: "camera", label: "Photo Evidence", desc: "Attached metadata to report" }
        ]
    }
};

moduleList.forEach(item => {
    item.addEventListener('click', () => {
        // Instant simulated update—no loading screen!
        updateUI(SIMULATION_DATA[item.dataset.module]);
    });
});


export { runBridge, updateUI, resetUI, fileToGenerativePart, discoverIntelligence };
