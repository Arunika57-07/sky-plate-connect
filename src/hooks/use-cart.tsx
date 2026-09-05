import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartLine = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  restaurant_id: string;
  restaurant_name: string;
  qty: number;
};

type CartValue = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "qty">) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartValue | null>(null);
const KEY = "buggy-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines]);

  const value: CartValue = {
    lines,
    add: (line) =>
      setLines((prev) => {
        const found = prev.find((l) => l.id === line.id);
        if (found) return prev.map((l) => (l.id === line.id ? { ...l, qty: l.qty + 1 } : l));
        return [...prev, { ...line, qty: 1 }];
      }),
    remove: (id) =>
      setLines((prev) =>
        prev.flatMap((l) => (l.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l])),
      ),
    clear: () => setLines([]),
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: lines.reduce((n, l) => n + l.qty * l.price, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
