import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getLocalStorage = <T = unknown>(key: string): T | null => {
  const item = window.localStorage.getItem(key);
  return item ? (JSON.parse(item) as T) : null;
};
const setLocalStorage = (key: string, value: unknown): void =>
  window.localStorage.setItem(key, JSON.stringify(value));

export { getLocalStorage, setLocalStorage };
