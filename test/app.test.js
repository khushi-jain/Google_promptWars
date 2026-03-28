import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateUI, resetUI, fileToBase64, runBridge } from '../app.js';

// Mock Lucide icons
global.lucide = { createIcons: vi.fn() };

// Mock individual GCP orchestrator functions since they are imported as *
vi.mock('../gcp-orchestrator.js', () => ({
    uploadToCloudStorage: vi.fn(() => Promise.resolve('gs://mock')),
    runCloudVision: vi.fn(() => Promise.resolve()),
    runSpeechToText: vi.fn(() => Promise.resolve()),
    publishToPubSub: vi.fn(() => Promise.resolve()),
    queryBigQuery: vi.fn(() => Promise.resolve()),
    analyzeWithVertexAI: vi.fn(() => Promise.resolve()),
    routeWithMapsAPI: vi.fn(() => Promise.resolve())
}));

describe('Lighthouse Bridge App (Secure Architecture)', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup simple fetch mock
        global.fetch = vi.fn();
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

    it('fileToBase64() converts a file to pure base64 data', async () => {
        const blob = new Blob(['fake image data'], { type: 'image/png' });
        const file = new File([blob], 'test.png', { type: 'image/png' });
        
        const actual = await fileToBase64(file);
        
        expect(actual.mimeType).toBe('image/png');
        expect(actual.data).toBeDefined(); 
    });

    it('runBridge() calls the secure backend /api/analyze endpoint', async () => {
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
});
