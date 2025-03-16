import React from "react";
import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/react";
import { useHref, useNavigate } from "react-router-dom";
import type { NavigateOptions } from "react-router-dom";
import { WebSocketProvider } from "./contexts/WebSocketContext";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <ToastProvider placement="top-right" toastOffset={60} />
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    </HeroUIProvider>
  );
}
