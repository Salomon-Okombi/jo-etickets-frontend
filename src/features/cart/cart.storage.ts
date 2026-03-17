import type { CartItem } from "./cart.types";

const KEY = "jo_cart_v1";

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function clearCartStorage() {
  localStorage.removeItem(KEY);
}

export function countItems(items: CartItem[]) {
  return items.reduce((acc, it) => acc + (Number(it.quantite) || 0), 0);
}