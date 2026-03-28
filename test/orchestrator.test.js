import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as GCP from '../gcp-orchestrator.js';

describe('Lighthouse Cloud Orchestrator (9-Service Integration)', () => {
    
    beforeEach(() => {
        // Since gcp-orchestrator maintains internal state (_firestore), 
        // we might want to reset it or just accept it's a singleton for this mockup.
        vi.clearAllMocks();
    });

    it('GCP.uploadToCloudStorage() generating secure GCS Signed URLs', async () => {
        const file = { name: "test.png", type: "image/png" };
        const result = await GCP.uploadToCloudStorage(file);
        
        expect(result.gsUri).toContain("gs://lighthouse-intake/");
        expect(result.signedUrl).toContain("https://storage.googleapis.com/");
        expect(result.signedUrl).toContain("signed-token-xyz");
    });

    it('GCP.Firestore.onSnapshot() following the Observer pattern for real-time sync', async () => {
        const mockCallback = vi.fn();
        GCP.Firestore.onSnapshot(mockCallback);

        // Initial call on registration (likely empty array)
        expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
        const initialCallCount = mockCallback.mock.calls.length;

        // Add a document
        const mockIncident = { title: "Pulse Sync", priority: "High" };
        await GCP.Firestore.addDoc(mockIncident);

        // Verify the listener was triggered again with the new state
        expect(mockCallback).toHaveBeenCalledTimes(initialCallCount + 1);
        const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
        expect(lastCall[0].title).toBe("Pulse Sync");
    });

    it('GCP.runCloudVision() providing high-confidence heuristics', async () => {
        const res = await GCP.runCloudVision("gs://fake");
        expect(res.confidence).toBeGreaterThan(0.9);
        expect(res.labels).toContain("Emergency");
    });

    it('GCP.routeWithMapsAPI() calculating life-saving routing ETAs', async () => {
        const res = await GCP.routeWithMapsAPI("Origin", "Dest");
        expect(res.eta).toBeDefined();
    });
});
