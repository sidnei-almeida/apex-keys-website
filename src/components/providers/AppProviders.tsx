"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgba(10, 17, 31, 0.95)",
            border: "1px solid rgba(0, 229, 255, 0.2)",
            color: "#e2e8f0",
          },
        }}
      />
    </AuthProvider>
  );
}
