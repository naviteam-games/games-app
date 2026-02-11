import { create } from "zustand";

interface AuthUIStore {
  isLoggingIn: boolean;
  isRegistering: boolean;
  authError: string | null;
  setLoggingIn: (v: boolean) => void;
  setRegistering: (v: boolean) => void;
  setAuthError: (e: string | null) => void;
}

export const useAuthUIStore = create<AuthUIStore>((set) => ({
  isLoggingIn: false,
  isRegistering: false,
  authError: null,
  setLoggingIn: (isLoggingIn) => set({ isLoggingIn }),
  setRegistering: (isRegistering) => set({ isRegistering }),
  setAuthError: (authError) => set({ authError }),
}));
