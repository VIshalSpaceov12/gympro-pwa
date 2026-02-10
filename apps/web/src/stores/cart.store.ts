import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        const { items } = get();
        const existing = items.find((i) => i.productId === item.productId);

        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, item.stock);
          set({
            items: items.map((i) =>
              i.productId === item.productId ? { ...i, quantity: newQty } : i
            ),
          });
        } else {
          set({
            items: [...items, { ...item, quantity: Math.min(quantity, item.stock) }],
          });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        Math.round(
          get().items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100
        ) / 100,
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    }
  )
);
