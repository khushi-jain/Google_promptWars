import * as GCP from './gcp-orchestrator.js';

/**
 * LIGHTHOUSE: INTELLIGENT BRIDGE (CORE APP LOGIC)
 * High-efficiency, state-driven architecture for societal benefit.
 */

// --- 1. Constants & State Management ---
const TRANSLATIONS = {
    en: { analyze: "Analyze Scenario", voice: "Use Microphone", reasoning: "System Reasoning", load: "Reasoning with Gemini..." },
    hi: { analyze: "परिदृश्य का विश्लेषण करें", voice: "माइक्रोफोन का प्रयोग करें", reasoning: "सिस्टम तर्क", load: "मिथुन के साथ तर्क..." },
    es: { analyze: "Analizar escenario", voice: "Usar micrófono", reasoning: "Razonamiento del sistema", load: "Razonando con Géminis..." }
};

/**
 * DOM Elements Registry (Lazy Selection for test stability)
 */
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

/**
 * Centralized Application State with Reactive Observer
 * Automatically synchronizes state changes to the DOM where applicable.
 */
const AppState = new Proxy({
    currentLanguage: 'en',
    selectedFile: null,
    isProcessing: false,
    results: null,
    speechTimeout: null,
}, {
    set(target, key, value) {
        target[key] = value;
        // Automatic UI Reactions
        if (key === 'isProcessing') {
            const proc = EL.processing();
            const zone = EL.dropZone();
            if (proc) proc.style.display = value ? 'flex' : 'none';
            if (zone) zone.style.display = value ? 'none' : 'block';
        }
        if (key === 'currentLanguage') {
            const btnAn = EL.btnAnalyze();
            const btnVo = EL.btnVoice();
            if(btnAn) btnAn.textContent = (TRANSLATIONS[value] || TRANSLATIONS['en']).analyze;
            if(btnVo) btnVo.textContent = (TRANSLATIONS[value] || TRANSLATIONS['en']).voice;
        }
        return true;
    }
});

/**
 * High-efficiency File Utilities
 */
const FileUtil = {
    /**
     * Process evidence photos before transmission.
     * Downsamples to max 1200px to save bandwidth in disaster zones.
     */
    async processImage(file) {
        if (!file.type.startsWith('image/')) return file;
        
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.82);
            };
        });
    },

    async toBase64(file) {
        const reader = new FileReader();
        return new Promise((resolve) => {
            reader.onloadend = () => resolve({
                data: reader.result.split(',')[1],
                mimeType: file.type
            });
            reader.readAsDataURL(file);
        });
    }
};

/**
 * High-quality Speech Synthesis with debounce protection.
 * @param {string} text - The content to narrate.
 */
function speakText(text) {
    if (!window.speechSynthesis) return;
    
    // Clear existing synthesis to prevent "audio backlog"
    clearTimeout(AppState.speechTimeout);
    window.speechSynthesis.cancel();

    AppState.speechTimeout = setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = AppState.currentLanguage;
        window.speechSynthesis.speak(utterance);
    }, 300); // 300ms debounce
}

/**
 * Triggers STT (Speech-to-Text) Recording
 */
function startVoiceRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Voice recognition not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = AppState.currentLanguage;
    
    recognition.onstart = () => {
        const btn = EL.btnVoice();
        btn.innerText = "Listening...";
        btn.style.background = "var(--danger)";
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        runBridge(transcript);
    };
    
    recognition.onend = () => {
        const btn = EL.btnVoice();
        btn.innerText = (TRANSLATIONS[AppState.currentLanguage] || TRANSLATIONS['en']).voice;
        btn.style.background = "";
    };
    
    recognition.start();
}

/**
 * Unified Intelligent Bridge Execution
 * Orhcestrates GCP simulation and Gemini reasoning.
 */
async function runBridge(manualText = "") {
    if (AppState.isProcessing) return;
    AppState.isProcessing = true;

    // Reset views
    const resV = EL.resultView();
    if (resV) resV.style.display = 'none';
    EL.loadStatus().textContent = TRANSLATIONS[AppState.currentLanguage].load;

    try {
        let filePayload = null;
        let storageOutcome = null;
        
        if (AppState.selectedFile) {
            EL.statusText().textContent = "[Optimization] Downsampling evidence for low-bandwidth...";
            const optimizedFile = await FileUtil.processImage(AppState.selectedFile);
            
            EL.statusText().textContent = "[Cloud Integration] Synchronizing sensors...";
            storageOutcome = await GCP.uploadToCloudStorage(optimizedFile);
            const { gsUri } = storageOutcome;

            if (optimizedFile.type.startsWith('image/')) await GCP.runCloudVision(gsUri);
            else if (optimizedFile.type.startsWith('audio/')) await GCP.runSpeechToText(gsUri);
            
            await GCP.publishToPubSub('incident-intake-topic', { gsUri });
            await GCP.queryBigQuery('historic_incident_data', { radius: "5km" });

            filePayload = await FileUtil.toBase64(optimizedFile);
        }

        await GCP.analyzeWithVertexAI();
        await GCP.routeWithMapsAPI("incident_loc", "nearest_safe_zone");

        EL.statusText().textContent = "[Cognitive Engine] Executing Gemini 2.0 Logic...";
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                manualText, 
                fileData: filePayload?.data, 
                mimeType: filePayload?.mimeType, 
                lang: AppState.currentLanguage 
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Intelligence Pipeline Fault.");
        }

        const data = await response.json();
        
        // --- NEW: Deep Service Persistance ---
        const incidentData = {
            ...data,
            traceId: (response.headers && typeof response.headers.get === 'function') 
                ? response.headers.get('X-Lighthouse-Trace') 
                : 'trace-local-sync',
            signedUrl: storageOutcome?.signedUrl || null,
            manualText: manualText || "Multimodal Input"
        };

        // Real-time Firestore Persistence
        await GCP.Firestore.addDoc(incidentData);
        
        AppState.results = incidentData;
        updateUI(incidentData);

    } catch (err) {
        console.error("Lighthouse_Fault:", err);
        const status = EL.statusText();
        status.style.color = "var(--danger)";
        status.innerHTML = `<b>Critical Fault:</b><br>${err.message}`;
        setTimeout(() => {
            status.style.color = "var(--text-secondary)";
            resetUI();
        }, 8000);
    } finally {
        AppState.isProcessing = false;
    }
}

/**
 * Updates the Live Activity Feed from Firestore Snapshots.
 * @param {Array} incidents - List of synced incident documents.
 */
function updateLiveFeed(incidents) {
    const feed = document.getElementById('liveFeed');
    if (!feed) return;

    if (incidents.length === 0) {
        feed.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.8rem; text-align: center; padding: 1rem;">Waiting for incident pulses...</p>';
        return;
    }

    feed.innerHTML = incidents.slice(0, 3).map(inc => `
        <div class="feed-item" role="article" aria-label="Incident: ${inc.title}">
            <div style="display:flex; flex-direction:column; gap:0.2rem;">
                <span style="font-size:0.75rem; font-weight:700;">${inc.title}</span>
                <span style="font-size:0.65rem; color:var(--text-secondary)">${inc.inputType} • ${inc.priority}</span>
            </div>
            ${inc.signedUrl ? `<a href="${inc.signedUrl}" target="_blank" style="font-size:0.6rem; color:var(--accent-primary);" aria-label="View Secure Evidence">FILE</a>` : ''}
        </div>
    `).join('');
    
    const syncStatus = document.getElementById('syncStatus');
    if(syncStatus) syncStatus.textContent = `Synced: ${new Date().toLocaleTimeString()}`;
}

/**
 * Updates the Dashboard with AI insights.
 * @param {object} data - The Gemini JSON response.
 */
function updateUI(data) {
    EL.resTitle().textContent = data.title;
    
    // Logic for GCS Evidence link
    let metaStr = `Source: ${data.inputType || 'Multimodal'} | Status: ${data.verification_status || 'Verified'}`;
    const resMeta = EL.resMeta();
    if(resMeta) {
        resMeta.innerHTML = metaStr;
        if (data.signedUrl) {
            resMeta.innerHTML += ` | <a href="${data.signedUrl}" target="_blank" style="color:var(--accent-primary); text-decoration: underline;">Secure Evidence</a>`;
        }
        resMeta.style.color = "var(--success)";
    }

    EL.resReasoning().textContent = data.reasoning;
    EL.resBadge().textContent = `Priority: ${data.priority}`;
    EL.resBadge().className = `status-badge ${data.badgeClass || 'badge-ready'}`;

    // Mark active modules
    EL.moduleList().forEach(item => {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
        if (item.dataset.module === data.module) {
            item.classList.add('active');
            item.setAttribute('aria-selected', 'true');
        }
    });

    // Action Grid Rendering
    const grid = EL.actionGrid();
    grid.innerHTML = '';
    data.actions.forEach(act => {
        const div = document.createElement('div');
        div.className = 'action-card';
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', act.aria_label || act.label);
        div.innerHTML = `
            <div class="icon-box" style="background: rgba(6, 182, 212, 0.2);"><i data-lucide="${act.icon}"></i></div>
            <div>
                <h4 style="font-size: 0.9rem;">${act.label}</h4>
                <p style="font-size: 0.75rem; color: var(--text-secondary);">${act.desc}</p>
            </div>
        `;
        grid.appendChild(div);
    });

    lucide.createIcons();
    EL.processing().style.display = 'none';
    EL.resultView().style.display = 'block';

    // Accessibility Narration
    const summary = `${data.title}. Priority ${data.priority}. ${data.reasoning}`;
    EL.srSummary().textContent = summary;
    speakText(summary);
}

/**
 * Resets the UI back to intake mode.
 */
function resetUI() {
    EL.processing().style.display = 'none';
    EL.dropZone().style.display = 'block';
    EL.resultView().style.display = 'none';
    AppState.selectedFile = null;
}

/**
 * Application Bootstrapper
 */
function init() {
    const btnA = EL.btnAnalyze();
    if (!btnA) return;

    btnA.addEventListener('click', () => {
        if (!AppState.selectedFile) EL.fileInput().click();
        else runBridge();
    });

    EL.btnVoice().addEventListener('click', startVoiceRecording);

    EL.fileInput().addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            AppState.selectedFile = e.target.files[0];
            runBridge();
        }
    });

    // Drag & Drop
    const zone = EL.dropZone();
    zone.addEventListener('dragover', (e) => e.preventDefault());
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            AppState.selectedFile = e.dataTransfer.files[0];
            runBridge();
        }
    });

    // Module simulation buttons
    EL.moduleList().forEach(item => {
        item.addEventListener('click', () => {
            updateUI(SIMULATION_DATA[item.dataset.module]);
        });
    });

    // i18n
    EL.langSelect().addEventListener('change', (e) => {
        AppState.currentLanguage = e.target.value;
        const btnAn = EL.btnAnalyze();
        const btnVo = EL.btnVoice();
        btnAn.textContent = TRANSLATIONS[AppState.currentLanguage].analyze;
        btnVo.textContent = TRANSLATIONS[AppState.currentLanguage].voice;
    });

    // High Contrast / Simple UI
    EL.toggleSimpleUI().addEventListener('click', () => {
        const isSimple = document.body.classList.toggle('simple-ui');
        EL.toggleSimpleUI().setAttribute('aria-pressed', isSimple);
    });

    // Cloud Real-time Persistence (Firestore)
    GCP.Firestore.onSnapshot(updateLiveFeed);
}

// Auto-init logic
if (typeof window !== 'undefined') {
    if (document.readyState !== 'loading') init();
    else document.addEventListener('DOMContentLoaded', init);
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

export { runBridge, updateUI, resetUI, init, FileUtil, AppState };
