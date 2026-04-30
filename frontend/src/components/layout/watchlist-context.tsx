"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface WatchItem {
  name_norm: string;
  name: string;
  added: string; // ISO date
}

interface WatchlistState {
  items: WatchItem[];
  add: (name_norm: string, name: string) => void;
  remove: (name_norm: string) => void;
  isWatched: (name_norm: string) => boolean;
}

const WatchlistContext = createContext<WatchlistState>({
  items: [],
  add: () => {},
  remove: () => {},
  isWatched: () => false,
});

function getStoredWatchlist(): WatchItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem("carbontrail-watchlist");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WatchItem[]>(getStoredWatchlist);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("carbontrail-watchlist", JSON.stringify(items));
  }, [items]);

  const add = (name_norm: string, name: string) => {
    setItems(prev => {
      if (prev.some(i => i.name_norm === name_norm)) return prev;
      return [...prev, { name_norm, name, added: new Date().toISOString() }];
    });
  };

  const remove = (name_norm: string) => {
    setItems(prev => prev.filter(i => i.name_norm !== name_norm));
  };

  const isWatched = (name_norm: string) => items.some(i => i.name_norm === name_norm);

  return (
    <WatchlistContext.Provider value={{ items, add, remove, isWatched }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export const useWatchlist = () => useContext(WatchlistContext);
