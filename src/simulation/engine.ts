import { Plant3Model } from './units/Plant3Model';
import { INITIAL_CONDITIONS } from '../data/initial-conditions';

// Master Simulation Engine Singleton instance
export const simulationEngine = new Plant3Model();

// Load default initial condition snapshot
simulationEngine.loadSnapshot(INITIAL_CONDITIONS['ScreenshotBaseline_2024-05-27']);
