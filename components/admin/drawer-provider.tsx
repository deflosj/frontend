"use client";

import { createContext, useCallback, useContext, useState } from "react";

// ── Global drawer renderer ────────────────────────────────────────────────────
// Usage anywhere inside AdminLayout:
//   const { openDrawer } = useDrawer();
//   openDrawer(<MyDrawer />);
//
// The rendered component should call useDrawer().closeDrawer() to close itself.

interface DrawerContextValue {
  openDrawer: (content: React.ReactNode) => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue>({
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function useDrawer() {
  return useContext(DrawerContext);
}

export function DrawerProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [stack, setStack] = useState<React.ReactNode[]>([]);

  const openDrawer = useCallback((content: React.ReactNode) => {
    setStack((prev) => [...prev, content]);
  }, []);

  const closeDrawer = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer }}>
      {children}
      {stack.map((content, i) => (
        // biome-ignore lint: index key is fine for drawer stack
        <div key={i}>{content}</div>
      ))}
    </DrawerContext.Provider>
  );
}
