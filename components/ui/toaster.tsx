"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import type { ToasterToast } from "@/hooks/use-toast"; 

import { XCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  const getVariantIcon = (variant?: string) => {
    switch (variant) {
      case "destructive":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map((toast: ToasterToast) => {
        const { id, title, description, action, variant, ...props } = toast;
        const icon = getVariantIcon(variant ?? undefined);

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <div className="grid gap-1">
                {title && (
                  <ToastTitle className="flex items-center gap-2">
                    {icon} {title}
                  </ToastTitle>
                )}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}