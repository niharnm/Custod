"use client";

import { useEffect } from "react";
import { ensureDeviceRegistered } from "@/lib/device";

/** Mounted once in the root layout; registers the anonymous device on first load. */
export function DeviceInit() {
  useEffect(() => {
    void ensureDeviceRegistered();
  }, []);
  return null;
}
