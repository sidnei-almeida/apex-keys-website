"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="bottom-center"
        theme="dark"
        expand={false}
        duration={3000}
        visibleToasts={3}
        gap={10}
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgba(22, 22, 22, 0.97)",
            border: "1px solid #2A2A2A",
            color: "#F3F4F6",
          },
        }}
      />
    </AuthProvider>
  );
}
