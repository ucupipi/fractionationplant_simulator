import { useSimulationStore } from '../stores/simulationStore';

class SimWorkerClient {
  private worker: Worker | null = null;

  constructor() {
    // Disabled duplicate background worker to prevent race conditions with main simulation engine
    // this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return;
    }
    try {
      this.worker = new Worker(new URL('./simWorker.ts', import.meta.url), {
        type: 'module'
      });

      this.worker.onmessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        if (type === 'TELEMETRY') {
          useSimulationStore.getState().updateTelemetry(payload);
        } else if (type === 'DIAGNOSTIC_DATA') {
          // Send to custom listener if registered
          window.dispatchEvent(new CustomEvent('DIAGNOSTIC_DATA_RECEIVED', { detail: payload }));
        }
      };

      this.worker.onerror = (err) => {
        console.error('Simulation Worker Error:', err);
      };
    } catch {
      // Fallback for environments where Web Worker constructor is restricted
    }
  }

  public postMessage(msg: { type: string; payload?: any }) {
    if (this.worker) {
      this.worker.postMessage(msg);
    }
  }
}

export const simWorkerClient = new SimWorkerClient();
