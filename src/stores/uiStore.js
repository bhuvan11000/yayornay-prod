import { create } from 'zustand';

let toastCounter = 0;

/**
 * UI state store for toasts, modals, and level-up notifications.
 */
export const useUIStore = create((set, get) => ({
  toasts: [],
  showLevelUpModal: false,
  levelUpData: null,
  modalStack: [],

  /**
   * Add a toast notification.
   * @param {'success'|'error'|'achievement'|'prediction'} type
   * @param {object} data - Toast data (title, message, etc.)
   */
  addToast: (type, data = {}) => {
    const id = ++toastCounter;
    const toast = { id, type, ...data };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);

    return id;
  },

  /**
   * Remove a toast by ID.
   * @param {number} id
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  /**
   * Show the level-up modal with data.
   * @param {object} levelUpData - { oldLevel, newLevel, unlocks, ... }
   */
  showLevelUpModal: (levelUpData) => {
    set({ showLevelUpModal: true, levelUpData });
  },

  /**
   * Hide the level-up modal.
   */
  hideLevelUpModal: () => {
    set({ showLevelUpModal: false, levelUpData: null });
  },

  /**
   * Push a modal onto the stack.
   * @param {string} modalId
   * @param {object} props
   */
  pushModal: (modalId, props = {}) => {
    set((state) => ({
      modalStack: [...state.modalStack, { id: modalId, props }],
    }));
  },

  /**
   * Pop the top modal off the stack.
   */
  popModal: () => {
    set((state) => ({
      modalStack: state.modalStack.slice(0, -1),
    }));
  },

  /**
   * Clear all modals.
   */
  clearModals: () => {
    set({ modalStack: [] });
  },
}));
