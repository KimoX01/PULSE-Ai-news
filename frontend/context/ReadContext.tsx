"use client";

import { createContext, useContext } from "react";

interface ReadContextValue {
  readIds: Set<string>;
  markRead: (id: string) => void;
  newIds: Set<string>;       // articles that arrived in the latest refresh
  lastVisit: Date | null;    // timestamp of the user's previous session
}

export const ReadContext = createContext<ReadContextValue>({
  readIds: new Set(),
  markRead: () => {},
  newIds: new Set(),
  lastVisit: null,
});

export const useReadContext = () => useContext(ReadContext);
