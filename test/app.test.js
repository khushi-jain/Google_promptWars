import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateUI, resetUI, FileUtil, runBridge, init, AppState, updateLiveFeed } from '../app.js';

// Mock Lucide icons
global.lucide = { createIcons: vi.fn() };

// Mock individual GCP orchestrator functions
vi.mock('../gcp-orchestrator.js', () => ({
    uploadToCloudStorage: vi.fn(() => Promise.resolve({ gsUri: 'gs://mock', signedUrl: 'https://mock.com' })),
    runCloudVision: vi.fn(() => Promise.resolve()),
    runSpeechToText: vi.fn(() => Promise.resolve()),
    publishToPubSub: vi.fn(() => Promise.resolve()),
    queryBigQuery: vi.fn(() => Promise.resolve()),
    analyzeWithVertexAI: vi.fn(() => Promise.resolve()),
    routeWithMapsAPI: vi.fn(() => Promise.resolve()),
    Firestore: {
        addDoc: vi.fn(() => Promise.resolve()),
        onSnapshot: vi.fn((cb) => cb([]))
    }
}));

import fs from 'fs';
import path from 'path';

describe('Lighthouse Bridge App (Secure Architecture)', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        
        // Refresh DOM from original index.html
        const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
        document.documentElement.innerHTML = html;

        // Setup simple fetch mock
        global.fetch = vi.fn();
        // Re-init listeners for each test's fresh JSDOM
        init();
    });

    it('resetUI() hides processing and result views, and resets state', () => {
        const dropZone = document.getElementById('dropZone');
        const processing = document.getElementById('processing');
        
        processing.style.display = 'flex';
        dropZone.style.display = 'none';
        
        resetUI();
        
        expect(processing.style.display).toBe('none');
        expect(dropZone.style.display).toBe('block');
    });

    it('updateUI() updates DOM elements correctly based on JSON payload', () => {
        const mockData = {
            title: "Test Intent Found",
            inputType: "Traffic Payload",
            verification_status: "Verified Action",
            reasoning: "Test Reasoning Analysis.",
            priority: "Critical",
            badgeClass: "badge-urgent",
            module: "medical",
            actions: [
                { icon: 'hospital', label: 'Test Action', desc: 'Detail.' }
            ]
        };
        
        updateUI(mockData);
        
        expect(document.getElementById('resTitle').textContent).toBe("Test Intent Found");
        expect(document.getElementById('resMeta').textContent).toContain("Source: Traffic Payload");
        expect(document.getElementById('resMeta').textContent).toContain("Status: Verified Action");
        expect(document.getElementById('resBadge').textContent).toBe("Priority: Critical");
        expect(document.getElementById('resultView').style.display).toBe('block');
    });

    it('AppState Proxy updates UI automatically', () => {
        const processing = document.getElementById('processing');
        const btnAnalyze = document.getElementById('btnAnalyze');

        // Testing isProcessing reaction
        AppState.isProcessing = true;
        expect(processing.style.display).toBe('flex');
        
        AppState.isProcessing = false;
        expect(processing.style.display).toBe('none');

        // Testing currentLanguage reaction
        AppState.currentLanguage = 'hi';
        expect(btnAnalyze.textContent).toBe("परिदृश्य का विश्लेषण करें");
    });

    it('FileUtil.processImage() returns same file for non-images', async () => {
        const blob = new Blob(['{}'], { type: 'application/json' });
        const file = new File([blob], 'test.json', { type: 'application/json' });
        const processed = await FileUtil.processImage(file);
        expect(processed).toBe(file);
    });

    it('runBridge() calls the secure backend /api/analyze endpoint', async () => {
        vi.useRealTimers();
        const mockResponse = {
            title: "Backend Response",
            module: "medical",
            actions: [],
            reasoning: "Reasoning",
            priority: "Normal",
            badgeClass: "badge-ready"
        };

        global.fetch.mockResolvedValue({
            ok: true,
            headers: { get: (name) => name === 'X-Lighthouse-Trace' ? 'trace-123' : null },
            json: () => Promise.resolve(mockResponse)
        });

        await runBridge("Help me");

        expect(global.fetch).toHaveBeenCalledWith('/api/analyze', expect.objectContaining({
            method: 'POST'
        }));
        
        const { Firestore } = await import('../gcp-orchestrator.js');
        expect(Firestore.addDoc).toHaveBeenCalled();
        expect(document.getElementById('resTitle').textContent).toBe("Backend Response");
    });

    it('updateUI() triggers speech synthesis for blind support', () => {
        const mockSpeech = vi.fn();
        global.speechSynthesis = {
            speak: mockSpeech,
            cancel: vi.fn(),
            getVoices: vi.fn(() => [])
        };
        global.SpeechSynthesisUtterance = vi.fn();

        const mockData = {
            title: "Emergency",
            reasoning: "Detail",
            priority: "High",
            actions: []
        };
        
        updateUI(mockData);
        vi.advanceTimersByTime(350);
        expect(mockSpeech).toHaveBeenCalled();
    });

    it('runBridge() handles critical faults and communicates them via UI', async () => {
        vi.useRealTimers();
        global.fetch.mockRejectedValue(new Error("Network Disrupted"));

        await runBridge("Help");

        const status = document.getElementById('processing').querySelector('p');
        expect(status.textContent).toContain("Critical Fault");
        expect(status.textContent).toContain("Network Disrupted");
        expect(status.style.color).toBe("var(--danger)");
    });

    it('updateLiveFeed() correctly populates the activity dashboard from Firestore', () => {
        const mockIncidents = [
            { title: "Rescue Pulse", inputType: "Voice", priority: "Critical", signedUrl: "https://gcs.com/1" }
        ];
        
        // Manual call for internal logic verification
        updateLiveFeed(mockIncidents);
        
        const feed = document.getElementById('liveFeed');
        expect(feed.innerHTML).toContain("Rescue Pulse");
        expect(feed.querySelector('a').href).toBe("https://gcs.com/1");
        expect(document.getElementById('syncStatus').textContent).toContain("Synced:");
    });

    it('language selector updates all key UI elements', () => {
        const langSelect = document.getElementById('langSelect');
        const btnAnalyze = document.getElementById('btnAnalyze');
        
        // Trigger select change
        langSelect.value = 'hi';
        langSelect.dispatchEvent(new Event('change'));
        
        expect(btnAnalyze.textContent).toBe("परिदृश्य का विश्लेषण करें");
        expect(AppState.currentLanguage).toBe('hi');
    });

    it('Simple UI toggle updates body accessibility state', () => {
        const toggle = document.getElementById('toggleSimpleUI');
        toggle.click();
        
        expect(document.body.classList.contains('simple-ui')).toBe(true);
        expect(toggle.getAttribute('aria-pressed')).toBe('true');
    });
});
