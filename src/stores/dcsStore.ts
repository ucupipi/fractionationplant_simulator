import { create } from 'zustand';

export type DCSScreenId =
  | 'OVERVIEW'
  | 'SCRUB'
  | 'DE_ETHANIZER'
  | 'DE_PROPANIZER'
  | 'DE_BUTANIZER'
  | 'REFRIGERATION'
  | 'TREND'
  | 'ALARMS'
  | 'ABOUT'
  | 'INSTRUCTOR';

export type ViewMode = 'LEGACY' | 'HIGH_PERFORMANCE';
export type UserRole = 'TRAINEE' | 'INSTRUCTOR';

export interface DCSStoreState {
  activeScreen: DCSScreenId;
  viewMode: ViewMode;
  userRole: UserRole;
  selectedFaceplateTag: string | null;
  selectedPumpId: string | null;
  selectedTransmitterId: string | null;
  trendTagIds: string[];
  trendTimeWindowMinutes: number; // 10, 60, or 0 (full session)
  hornSilenced: boolean;

  // Actions
  setActiveScreen: (screen: DCSScreenId) => void;
  setViewMode: (mode: ViewMode) => void;
  setUserRole: (role: UserRole) => void;
  openFaceplate: (tagId: string) => void;
  closeFaceplate: () => void;
  openPumpPopup: (pumpId: string) => void;
  closePumpPopup: () => void;
  openTransmitterPopup: (tagId: string) => void;
  closeTransmitterPopup: () => void;
  setTrendTags: (tags: string[]) => void;
  setTrendTimeWindow: (mins: number) => void;
  toggleHornSilence: () => void;
}

export const useDCSStore = create<DCSStoreState>((set) => ({
  activeScreen: 'SCRUB',
  viewMode: 'LEGACY',
  userRole: 'TRAINEE',
  selectedFaceplateTag: null,
  selectedPumpId: null,
  selectedTransmitterId: null,
  trendTagIds: ['PIC3', 'TI171', 'FIC6', '3E-5_DUTY', 'LIC4'],
  trendTimeWindowMinutes: 10,
  hornSilenced: false,

  setActiveScreen: (screen) => set({ activeScreen: screen }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setUserRole: (role) => set({ userRole: role }),
  openFaceplate: (tagId) => set({ selectedFaceplateTag: tagId }),
  closeFaceplate: () => set({ selectedFaceplateTag: null }),
  openPumpPopup: (pumpId) => set({ selectedPumpId: pumpId }),
  closePumpPopup: () => set({ selectedPumpId: null }),
  openTransmitterPopup: (tagId) => set({ selectedTransmitterId: tagId }),
  closeTransmitterPopup: () => set({ selectedTransmitterId: null }),
  setTrendTags: (tags) => set({ trendTagIds: tags }),
  setTrendTimeWindow: (mins) => set({ trendTimeWindowMinutes: mins }),
  toggleHornSilence: () => set((state) => ({ hornSilenced: !state.hornSilenced }))
}));
