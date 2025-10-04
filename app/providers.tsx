"use client";
import { useRef } from "react";
import { AppStore, makeStore } from "@/lib/store";
import { Provider } from "react-redux";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  return (
    <>
      <Provider store={storeRef.current}>{children}</Provider>
      <Toaster />
      <SonnerToaster />
    </>
  );
}
