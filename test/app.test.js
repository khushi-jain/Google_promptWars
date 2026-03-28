import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateUI, resetUI, FileUtil, runBridge, init } from '../app.js';

// Mock Lucide icons
global.lucide = { createIcons: vi.fn() };

// Mock individual GCP orchestrator functions
vi.mock('../gcp-orchestrator.js', () => ({
    uploadToCloudStorage: vi.fn(() => Promise.resolve('gs://mock')),
    runCloudVision: vi.fn(() => Promise.resolve()),
    runSpeechToText: vi.fn(() => Promise.resolve()),
    publishToPubSub: vi.fn(() => Promise.resolve()),
    queryBigQuery: vi.fn(() => Promise.resolve()),
    analyzeWithVertexAI: vi.fn(() => Promise.resolve()),
    routeWithMapsAPI: vi.fn(() => Promise.resolve())
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

    it('FileUtil.toBase64() converts a file to pure base64 data', async () => {
        vi.useRealTimers(); // FileReader needs real event loop
        const blob = new Blob(['fake image data'], { type: 'image/png' });
        const file = new File([blob], 'test.png', { type: 'image/png' });
        
        const actual = await FileUtil.toBase64(file);
        
        expect(actual.mimeType).toBe('image/png');
        expect(actual.data).toBeDefined(); 
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
            json: () => Promise.resolve(mockResponse)
        });

        await runBridge("Help me");

        expect(global.fetch).toHaveBeenCalledWith('/api/analyze', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"manualText":"Help me"')
        }));
        
        expect(document.getElementById('resTitle').textContent).toBe("Backend Response");
    });

    it('updateUI() populates srSummary and triggers speech synthesis for blind support', () => {
        vi.useFakeTimers();
        const mockSpeech = vi.fn();
        global.speechSynthesis = {
            speak: mockSpeech,
            cancel: vi.fn(),
            getVoices: vi.fn(() => [])
        };
        global.SpeechSynthesisUtterance = vi.fn();

        const mockData = {
            title: "Emergency Found",
            reasoning: "Reasoning detail for screen reader.",
            priority: "High",
            module: "medical",
            actions: []
        };
        
        updateUI(mockData);
        
        const srSummary = document.getElementById('srSummary');
        expect(srSummary.textContent).toContain("Emergency Found");
        expect(srSummary.textContent).toContain("Reasoning detail");
        
        // Account for 300ms debounce
        vi.advanceTimersByTime(350);
        expect(mockSpeech).toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('language selector updates button text', () => {
        const langSelect = document.getElementById('langSelect');
        const btnAnalyze = document.getElementById('btnAnalyze');
        
        langSelect.value = 'hi';
        langSelect.dispatchEvent(new Event('change'));
        
        expect(btnAnalyze.textContent).toBe("परिदृश्य का विश्लेषण करें");
    });

    it('Simple UI toggle updates body class', () => {
        const toggleBtn = document.getElementById('toggleSimpleUI');
        
        toggleBtn.click();
        expect(document.body.classList.contains('simple-ui')).toBe(true);
        expect(toggleBtn.getAttribute('aria-pressed')).toBe('true');
        
        toggleBtn.click();
        expect(document.body.classList.contains('simple-ui')).toBe(false);
    });
});
