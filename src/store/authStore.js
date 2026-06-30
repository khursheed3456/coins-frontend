import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: true,

  init: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('coinx_token');
    const user = localStorage.getItem('coinx_user');
    if (token && user) {
      set({ token, user: JSON.parse(user), isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  setAuth: (token, user) => {
    localStorage.setItem('coinx_token', token);
    localStorage.setItem('coinx_user', JSON.stringify(user));
    set({ token, user });
  },

  updateUser: (userData) => {
    set((state) => {
      const updated = { ...state.user, ...userData };
      localStorage.setItem('coinx_user', JSON.stringify(updated));
      return { user: updated };
    });
  },

  logout: () => {
    localStorage.removeItem('coinx_token');
    localStorage.removeItem('coinx_user');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
