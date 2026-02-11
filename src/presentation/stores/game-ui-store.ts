import { create } from "zustand";

interface GameUIStore {
  isSidebarOpen: boolean;
  activeTab: "players" | "chat";
  toggleSidebar: () => void;
  setActiveTab: (tab: "players" | "chat") => void;
}

export const useGameUIStore = create<GameUIStore>((set) => ({
  isSidebarOpen: true,
  activeTab: "players",
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setActiveTab: (activeTab) => set({ activeTab }),
}));
