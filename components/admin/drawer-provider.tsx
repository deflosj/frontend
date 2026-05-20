"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

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

interface DrawerEntry {
  id: string;
  content: React.ReactNode;
}

export function DrawerProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [stack, setStack] = useState<DrawerEntry[]>([]);

  const openDrawer = useCallback((content: React.ReactNode) => {
    setStack((prev) => [...prev, { id: crypto.randomUUID(), content }]);
  }, []);

  const closeDrawer = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  const ctx = useMemo(() => ({ openDrawer, closeDrawer }), [openDrawer, closeDrawer]);

  return (
    <DrawerContext.Provider value={ctx}>
      {children}
      {stack.map(({ id, content }) => (
        <div key={id}>{content}</div>
      ))}
    </DrawerContext.Provider>
  );
}
