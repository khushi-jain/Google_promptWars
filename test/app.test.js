import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateUI, resetUI, fileToGenerativePart } from '../app.js';
import { getByText, queryByText } from '@testing-library/dom';

// Mock the Gemini GenAI module to not consume API calls during tests
vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: class {
            constructor() {}
            getGenerativeModel() {
                return {
                    generateContent: async () => ({
                        response: { text: () => JSON.stringify({
                            title: "Mock Threat",
                            reasoning: "Mock Reasoning",
                            priority: "Normal",
                            badgeClass: "badge-ready",
                            module: "civic",
                            actions: []
                        }) }
                    })
                };
            }
        }
    };
});

describe('Lighthouse Bridge App', () => {
    
    beforeEach(() => {
        // Reset state or mock functions if needed without breaking loaded elements
        global.lucide = { createIcons: vi.fn() };
    });

    it('resetUI() hides processing and result views, and shows dropzone', () => {
        const dropZone = document.getElementById('dropZone');
        const processing = document.getElementById('processing');
        const resultView = document.getElementById('resultView');
        
        // Change state manually
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
            reasoning: "Test Reasoning Analysis provided by mock data.",
            priority: "Critical",
            badgeClass: "badge-urgent",
            module: "medical",
            actions: [
                { icon: 'hospital', label: 'Test Action', desc: 'Detail of test action.' }
            ]
        };
        
        // Execute UI update
        updateUI(mockData);
        
        // Assertions
        expect(document.getElementById('resTitle').textContent).toBe("Test Intent Found");
        expect(document.getElementById('resReasoning').textContent).toBe("Test Reasoning Analysis provided by mock data.");
        
        // Problem Statement Alignment Assertion
        const resMeta = document.getElementById('resMeta');
        expect(resMeta.textContent).toContain("Source: Traffic Payload");
        expect(resMeta.textContent).toContain("Status: Verified Action");
        
        const badge = document.getElementById('resBadge');
        expect(badge.textContent).toBe("Priority: Critical");

        expect(badge.className).toContain("badge-urgent");
        
        // Check active module
        const activeModule = document.querySelector('.module-item.active');
        expect(activeModule.dataset.module).toBe('medical');
        
        // Check action generated
        const actionGrid = document.getElementById('actionGrid');
        expect(actionGrid.children.length).toBe(1);
        expect(actionGrid.innerHTML).toContain('Test Action');
        expect(actionGrid.innerHTML).toContain('Detail of test action.');
        
        // Ensure result view is visible and processing is hidden
        expect(document.getElementById('processing').style.display).toBe('none');
        expect(document.getElementById('resultView').style.display).toBe('block');
    });

    it('fileToGenerativePart() converts a file to base64 generative part', async () => {
        // Create a fake file
        const blob = new Blob(['fake image data'], { type: 'image/png' });
        blob.name = 'test.png';
        const file = new File([blob], 'test.png', { type: 'image/png' });
        
        const actual = await fileToGenerativePart(file);
        
        expect(actual).toBeDefined();
        expect(actual.inlineData.mimeType).toBe('image/png');
        expect(actual.inlineData.data).toBeDefined(); // base64 payload
    });
});
