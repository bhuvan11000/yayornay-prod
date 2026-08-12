import { create } from 'zustand';

let toastCounter = 0;

export const useUIStore = create((set, get) => ({
  toasts: [],
  showLevelUpModal: false,
  levelUpData: null,
  showRankUpModal: false,
  rankUpData: null,
  modalStack: [],
  pendingAchievements: [],

  addToast: (type, data = {}) => {
    const id = ++toastCounter;
    const toast = { id, type, ...data };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    setTimeout(() => {
      get().removeToast(id);
    }, 4000);

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  triggerLevelUpModal: (levelUpData) => {
    set({ showLevelUpModal: true, levelUpData });
  },

  hideLevelUpModal: () => {
    set({ showLevelUpModal: false, levelUpData: null });
  },

  triggerRankUpModal: (rankUpData) => {
    set({ showRankUpModal: true, rankUpData });
  },

  hideRankUpModal: () => {
    set({ showRankUpModal: false, rankUpData: null });
  },

  pushModal: (modalId, props = {}) => {
    set((state) => ({
      modalStack: [...state.modalStack, { id: modalId, props }],
    }));
  },

  popModal: () => {
    set((state) => ({
      modalStack: state.modalStack.slice(0, -1),
    }));
  },

  clearModals: () => {
    set({ modalStack: [] });
  },

  addAchievement: (achievement) => {
    const id = ++toastCounter;
    set((state) => ({
      pendingAchievements: [...state.pendingAchievements, { ...achievement, _toastId: id }],
    }));

    setTimeout(() => {
      get().dismissAchievement(id);
    }, 5500);

    return id;
  },

  dismissAchievement: (toastId) => {
    set((state) => ({
      pendingAchievements: state.pendingAchievements.filter((a) => a._toastId !== toastId),
    }));
  },
}));
