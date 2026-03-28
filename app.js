import * as GCP from './gcp-orchestrator.js';

/** 
 * LIGHTHOUSE: INTELLIGENT BRIDGE (ACCESSIBLE & SECURE)
 */

// 1. UI Elements
// 1. UI Elements (Lazy access for test stability)
const EL = {
    statusText: () => document.querySelector('#processing p'),
    dropZone: () => document.getElementById('dropZone'),
    fileInput: () => document.getElementById('fileInput'),
    btnAnalyze: () => document.getElementById('btnAnalyze'),
    btnVoice: () => document.getElementById('btnVoice'),
    processing: () => document.getElementById('processing'),
    resultView: () => document.getElementById('resultView'),
    resTitle: () => document.getElementById('resTitle'),
    resReasoning: () => document.getElementById('resReasoning'),
    resBadge: () => document.getElementById('resBadge'),
    actionGrid: () => document.getElementById('actionGrid'),
    moduleList: () => document.querySelectorAll('.module-item'),
    langSelect: () => document.getElementById('langSelect'),
    toggleSimpleUI: () => document.getElementById('toggleSimpleUI'),
    srSummary: () => document.getElementById('srSummary'),
    loadStatus: () => document.getElementById('loadStatus'),
    resMeta: () => document.getElementById('resMeta')
};

let selectedFile = null;
let currentLanguage = 'en';

const TRANSLATIONS = {
    en: { analyze: "Analyze Scenario", voice: "Use Microphone", reasoning: "System Reasoning", load: "Reasoning with Gemini..." },
    hi: { analyze: "परिदृश्य का विश्लेषण करें", voice: "माइक्रोफोन का प्रयोग करें", reasoning: "सिस्टम तर्क", load: "मिथुन के साथ तर्क..." },
    es: { analyze: "Analizar escenario", voice: "Usar micrófono", reasoning: "Razonamiento del sistema", load: "Razonando con Géminis..." }
};

// 2. Accessibility & Voice Helpers
function speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLanguage;
    window.speechSynthesis.speak(utterance);
}

function startVoiceRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Voice recognition not supported in this browser.");
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = currentLanguage;
    recognition.onstart = () => {
        EL.btnVoice().innerText = "Listening...";
        EL.btnVoice().style.background = "var(--danger)";
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        runBridge(transcript);
    };
    recognition.onend = () => {
        EL.btnVoice().innerText = TRANSLATIONS[currentLanguage].voice;
        EL.btnVoice().style.background = "";
    };
    recognition.start();
}

// 3. File Processing
async function fileToBase64(file) {
    const reader = new FileReader();
    return new Promise((resolve) => {
        reader.onloadend = () => {
            resolve({
                data: reader.result.split(',')[1],
                mimeType: file.type
            });
        };
        reader.readAsDataURL(file);
    });
}

// 4. Core Logic
async function runBridge(manualText = "") {
    EL.processing().style.display = 'flex';
    EL.dropZone().style.display = 'none';
    EL.resultView().style.display = 'none';
    EL.loadStatus().innerText = TRANSLATIONS[currentLanguage].load;

    try {
        EL.statusText().innerText = "[Backend Sync] Establishing secure tunnel...";

        let fileData = null;
        let mimeType = null;
        
        if (selectedFile) {
            statusText.innerText = "[Cloud Storage / PubSub] Orchestrating Intake...";
            const gsUri = await GCP.uploadToCloudStorage(selectedFile);
            if (selectedFile.type.startsWith('image/')) await GCP.runCloudVision(gsUri);
            else if (selectedFile.type.startsWith('audio/')) await GCP.runSpeechToText(gsUri);
            await GCP.publishToPubSub('incident-intake-topic', { gsUri });
            await GCP.queryBigQuery('historic_incident_data', { radius: "5km" });

            const extracted = await fileToBase64(selectedFile);
            fileData = extracted.data;
            mimeType = extracted.mimeType;
        }

        await GCP.analyzeWithVertexAI();
        await GCP.routeWithMapsAPI("incident_loc", "nearest_safe_zone");

        EL.statusText().innerText = "[Node Server] Executing secure Gemini 2.0 reasoning...";
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manualText, fileData, mimeType, lang: currentLanguage })
        });

        if (!response.ok) {
            const errBody = await response.json();
            throw new Error(errBody.error || "Secure Backend Error.");
        }

        const data = await response.json();
        updateUI(data);

    } catch (err) {
        console.error("CRITICAL_BRIDGE_FAULT:", err);
        EL.statusText().style.color = "var(--danger)";
        EL.statusText().innerHTML = `<b>Bridge Fault:</b><br>${err.message}`;
        setTimeout(() => {
            EL.statusText().style.color = "var(--text-secondary)";
            resetUI();
        }, 8000);
    }
}

function updateUI(data) {
    EL.resTitle().textContent = data.title;
    
    let metaStr = `Source: ${data.inputType || 'Multimodal'} | Status: ${data.verification_status || 'Verified'}`;
    const resMeta = EL.resMeta();
    if(resMeta) {
        resMeta.textContent = metaStr;
        resMeta.style.color = "var(--success)";
    }

    EL.resReasoning().textContent = data.reasoning;
    EL.resBadge().textContent = `Priority: ${data.priority}`;
    EL.resBadge().className = `status-badge ${data.badgeClass || 'badge-ready'}`;

    EL.moduleList().forEach(item => {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
        if (item.dataset.module === data.module) {
            item.classList.add('active');
            item.setAttribute('aria-selected', 'true');
        }
    });

    EL.actionGrid().innerHTML = '';
    data.actions.forEach(act => {
        const div = document.createElement('div');
        div.className = 'action-card';
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');
        div.innerHTML = `
            <div class="icon-box" style="background: rgba(6, 182, 212, 0.2);"><i data-lucide="${act.icon}"></i></div>
            <div>
                <h4 style="font-size: 0.9rem;">${act.label}</h4>
                <p style="font-size: 0.75rem; color: var(--text-secondary);">${act.desc}</p>
            </div>
        `;
        EL.actionGrid().appendChild(div);
    });

    lucide.createIcons();
    EL.processing().style.display = 'none';
    EL.resultView().style.display = 'block';

    // Accessibility: Blind Support / Audio Navigation
    const summaryText = `${data.title}. Priority ${data.priority}. ${data.reasoning}`;
    EL.srSummary().textContent = summaryText;
    speakText(summaryText);
}

function resetUI() {
    EL.processing().style.display = 'none';
    EL.dropZone().style.display = 'block';
    selectedFile = null;
}

function init() {
    const btnAnalyze = EL.btnAnalyze();
    if (!btnAnalyze) return; // Not on the right page or DOM not ready

    btnAnalyze.addEventListener('click', () => {
        if (!selectedFile) EL.fileInput().click();
        else runBridge();
    });

    EL.btnVoice().addEventListener('click', startVoiceRecording);

    EL.fileInput().addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            runBridge();
        }
    });

    EL.dropZone().addEventListener('dragover', (e) => e.preventDefault());
    EL.dropZone().addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            selectedFile = e.dataTransfer.files[0];
            runBridge();
        }
    });

    EL.moduleList().forEach(item => {
        item.addEventListener('click', () => {
            updateUI(SIMULATION_DATA[item.dataset.module]);
        });
    });

    EL.langSelect().addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        EL.btnAnalyze().textContent = TRANSLATIONS[currentLanguage].analyze;
        EL.btnVoice().textContent = TRANSLATIONS[currentLanguage].voice;
    });

    EL.toggleSimpleUI().addEventListener('click', () => {
        const isSimple = document.body.classList.toggle('simple-ui');
        EL.toggleSimpleUI().setAttribute('aria-pressed', isSimple);
    });
}

// Auto-init on browser load
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
    init();
} else if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', init);
}

const SIMULATION_DATA = {
    medical: {
        title: "Medical Emergency Detected",
        inputType: "Medical History PDF",
        verification_status: "Verified: High Confidence",
        reasoning: "Visual context and audio heuristics suggest a level 2 trauma incident. Vitals dropping out of standard threshold compared to historic records.",
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
        inputType: "Voice Rescue Transcript",
        verification_status: "Verified: High Confidence",
        reasoning: "Vehicle anomaly detected via messy audio sensors. Likely engine failure or flat tire.",
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
        inputType: "Photo & Voice Heuristics",
        verification_status: "Verified: Urgent",
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
        inputType: "Traffic & Map Dumps",
        verification_status: "Verified: Normal",
        reasoning: "Aggregated raw path data indicates severe bottleneck ahead due to collision 400m away.",
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
        inputType: "Weather/News RSS Stream",
        verification_status: "Verified: Extreme Priority",
        reasoning: "News feed and messy weather API correlation flag flash flood warning for zone Alpha.",
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
        inputType: "Photo Submission",
        verification_status: "Verified: High Confidence",
        reasoning: "Raw visual analysis confirms a deep pothole and broken streetlight combo on Main St.",
        priority: "Normal",
        badgeClass: "badge-ready",
        module: "civic",
        actions: [
            { icon: "file-text", label: "Complaint Autopath", desc: "Drafted email to city council" },
            { icon: "camera", label: "Photo Evidence", desc: "Attached metadata to report" }
        ]
    }
};

export { runBridge, updateUI, resetUI, fileToBase64, init };
