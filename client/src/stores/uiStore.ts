import { create } from 'zustand';

interface UIState {
  // Event Explorer states
  eventExplorer: {
    showRawDetails: boolean;
    expandedVersions: Set<number>;
    expandedRawVersions: Set<number>;
    expandedFieldValues: Set<string>; // uniqueId for each SmartFieldValue
  };
  
  // Actions for Event Explorer
  toggleRawDetails: () => void;
  toggleVersionExpansion: (version: number) => void;
  toggleRawVersionExpansion: (version: number) => void;
  toggleFieldValueExpansion: (uniqueId: string) => void;
  
  // Reset functions
  resetEventExplorerState: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  eventExplorer: {
    showRawDetails: false,
    expandedVersions: new Set(),
    expandedRawVersions: new Set(),
    expandedFieldValues: new Set(),
  },
  
  // Event Explorer actions
  toggleRawDetails: () => set((state) => ({
    eventExplorer: {
      ...state.eventExplorer,
      showRawDetails: !state.eventExplorer.showRawDetails
    }
  })),
  
  toggleVersionExpansion: (version: number) => set((state) => {
    const newExpanded = new Set(state.eventExplorer.expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    return {
      eventExplorer: {
        ...state.eventExplorer,
        expandedVersions: newExpanded
      }
    };
  }),
  
  toggleRawVersionExpansion: (version: number) => set((state) => {
    const newExpanded = new Set(state.eventExplorer.expandedRawVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    return {
      eventExplorer: {
        ...state.eventExplorer,
        expandedRawVersions: newExpanded
      }
    };
  }),
  
  toggleFieldValueExpansion: (uniqueId: string) => set((state) => {
    const newExpanded = new Set(state.eventExplorer.expandedFieldValues);
    if (newExpanded.has(uniqueId)) {
      newExpanded.delete(uniqueId);
    } else {
      newExpanded.add(uniqueId);
    }
    return {
      eventExplorer: {
        ...state.eventExplorer,
        expandedFieldValues: newExpanded
      }
    };
  }),
  
  // Reset function
  resetEventExplorerState: () => set({
    eventExplorer: {
      showRawDetails: false,
      expandedVersions: new Set(),
      expandedRawVersions: new Set(),
      expandedFieldValues: new Set(),
    }
  }),
}));