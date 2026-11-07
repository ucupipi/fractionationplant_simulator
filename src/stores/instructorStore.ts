import { create } from 'zustand';
import { SCENARIO_LIBRARY, ScenarioDefinition } from '../data/scenarios';
import { useSimulationStore } from './simulationStore';

export interface EvaluationTimelineEvent {
  timeSeconds: number;
  type: 'FAULT_INJECTED' | 'ALARM_TRIGGERED' | 'ALARM_ACK' | 'OPERATOR_ACTION' | 'RECOVERY_CRITERIA_MET' | 'CONSTRAINT_VIOLATED';
  description: string;
  tagId?: string;
  value?: number;
}

export interface SessionScoreSummary {
  scenarioId: string;
  alarmResponseScore: number; // 0-100
  diagnosisLatencyScore: number; // 0-100
  actionSequenceScore: number; // 0-100
  excursionPenalty: number;
  totalScore: number; // 0-100
  recovered: boolean;
  recoveryDurationSeconds?: number;
  timeline: EvaluationTimelineEvent[];
}

export interface InstructorStoreState {
  selectedScenarioId: string;
  customSeverity: number;
  customRampSeconds: number;
  customDelaySeconds: number;
  isArmed: boolean;
  activeScenarioId: string | null;
  activeScenarioStartTime: number | null;
  sessionTimeline: EvaluationTimelineEvent[];
  sessionScore: SessionScoreSummary | null;

  // Actions
  selectScenario: (id: string) => void;
  setSeverity: (val: number) => void;
  setRamp: (secs: number) => void;
  setDelay: (secs: number) => void;
  armScenario: () => void;
  disarmScenario: () => void;
  injectActiveScenario: () => void;
  stopActiveScenario: () => void;
  logTimelineEvent: (event: EvaluationTimelineEvent) => void;
  calculateScore: () => SessionScoreSummary;
}

export const useInstructorStore = create<InstructorStoreState>((set, get) => ({
  selectedScenarioId: 'S06',
  customSeverity: 70,
  customRampSeconds: 45,
  customDelaySeconds: 0,
  isArmed: false,
  activeScenarioId: null,
  activeScenarioStartTime: null,
  sessionTimeline: [],
  sessionScore: null,

  selectScenario: (id) => {
    const sc = SCENARIO_LIBRARY[id];
    set({
      selectedScenarioId: id,
      customSeverity: sc ? sc.defaultSeverity : 50,
      customRampSeconds: sc ? sc.defaultRampSeconds : 10,
      customDelaySeconds: sc ? sc.defaultDelaySeconds : 0,
      isArmed: false
    });
  },

  setSeverity: (val) => set({ customSeverity: val }),
  setRamp: (secs) => set({ customRampSeconds: secs }),
  setDelay: (secs) => set({ customDelaySeconds: secs }),
  armScenario: () => set({ isArmed: true }),
  disarmScenario: () => set({ isArmed: false }),

  injectActiveScenario: () => {
    const { selectedScenarioId, customSeverity, customRampSeconds } = get();
    const simStore = useSimulationStore.getState();
    const simTime = simStore.simTimeSeconds;

    simStore.injectFault(selectedScenarioId, customSeverity, customRampSeconds);

    const initialEvent: EvaluationTimelineEvent = {
      timeSeconds: simTime,
      type: 'FAULT_INJECTED',
      description: `Injected ${selectedScenarioId}: ${SCENARIO_LIBRARY[selectedScenarioId]?.title || ''}`
    };

    set({
      isArmed: false,
      activeScenarioId: selectedScenarioId,
      activeScenarioStartTime: simTime,
      sessionTimeline: [initialEvent],
      sessionScore: null
    });
  },

  stopActiveScenario: () => {
    const { activeScenarioId } = get();
    if (activeScenarioId) {
      useSimulationStore.getState().clearFault(activeScenarioId);
    }
    set({ activeScenarioId: null, isArmed: false });
  },

  logTimelineEvent: (event) =>
    set((state) => ({
      sessionTimeline: [...state.sessionTimeline, event]
    })),

  calculateScore: () => {
    const { activeScenarioId, sessionTimeline, activeScenarioStartTime } = get();
    const simTime = useSimulationStore.getState().simTimeSeconds;
    const duration = activeScenarioStartTime !== null ? simTime - activeScenarioStartTime : 0;

    let alarmResponseScore = 95;
    let diagnosisLatencyScore = 90;
    let actionSequenceScore = 88;
    let excursionPenalty = 0;

    // Check if recovery occurred
    const hasRecovered = sessionTimeline.some((e) => e.type === 'RECOVERY_CRITERIA_MET');
    const totalScore = Math.max(0, Math.min(100, Math.round((alarmResponseScore + diagnosisLatencyScore + actionSequenceScore) / 3 - excursionPenalty)));

    const scoreSummary: SessionScoreSummary = {
      scenarioId: activeScenarioId || 'None',
      alarmResponseScore,
      diagnosisLatencyScore,
      actionSequenceScore,
      excursionPenalty,
      totalScore,
      recovered: hasRecovered,
      recoveryDurationSeconds: duration,
      timeline: [...sessionTimeline]
    };

    set({ sessionScore: scoreSummary });
    return scoreSummary;
  }
}));
