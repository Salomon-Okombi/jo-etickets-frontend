//src/hooks/useToast.ts
import { useContext } from "react";
import { UIContext } from "@/app/providers/UIProvider";

export default function useToast() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("useToast() doit être utilisé dans <UIProvider>.");
  }

  const toast = {
    success: (message: string) => ctx.showToast(message, "success"),
    error: (message: string) => ctx.showToast(message, "error"),
    info: (message: string) => ctx.showToast(message, "info"),
    warning: (message: string) => ctx.showToast(message, "warning"),
  };

  return {
    ...ctx,
    toast,
  };
}
