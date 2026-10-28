"use client";

import { useEffect } from "react";
import { hydrateFromRemote } from "@/lib/storage/progress";

export function HydrateRemote() {
  useEffect(() => {
    void hydrateFromRemote();
  }, []);
  return null;
}