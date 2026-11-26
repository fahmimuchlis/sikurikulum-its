/**
 * Store kecil untuk status jendela Preview & Agen AI pada halaman Generator.
 * Dipakai bersama oleh RightRail (tombol) dan GeneratorRPS (panel).
 */
import { useSyncExternalStore } from 'react';

const LAYOUT_KEY = 'generator:layout';
function loadLayout() {
  try { return localStorage.getItem(LAYOUT_KEY) === 'docked' ? 'docked' : 'floating'; } catch { return 'floating'; }
}

// layout: 'floating' (window mengambang) | 'docked' (menyatu dalam satu baris)
let state = { preview: true, ai: true, layout: loadLayout() };
const listeners = new Set();

export const generatorPanels = {
  get: () => state,
  toggle(key) { state = { ...state, [key]: !state[key] }; listeners.forEach(l => l()); },
  set(key, val) { if (state[key] === val) return; state = { ...state, [key]: val }; listeners.forEach(l => l()); },
  setLayout(layout) {
    state = { ...state, layout };
    try { localStorage.setItem(LAYOUT_KEY, layout); } catch { /* abaikan */ }
    listeners.forEach(l => l());
  },
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
};

export function useGeneratorPanels() {
  return useSyncExternalStore(generatorPanels.subscribe, generatorPanels.get);
}
