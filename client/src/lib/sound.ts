import { useSyncExternalStore } from "react";

const KEY = "4miem-sound";
const listeners = new Set<() => void>();

function read(): boolean {
  try { return window.localStorage.getItem(KEY) !== "off"; } catch { return true; }
}

let enabled = typeof window === "undefined" ? true : read();

export function soundEnabled() { return enabled; }

export function setSoundEnabled(value: boolean) {
  enabled = value;
  try { window.localStorage.setItem(KEY, value ? "on" : "off"); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => enabled,
    () => true,
  );
}

/** Play a sound effect only if the visitor has not muted the site. */
export function playSfx(audio: HTMLAudioElement | null | undefined) {
  if (!enabled || !audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
