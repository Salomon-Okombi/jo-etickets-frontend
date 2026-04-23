// src/app/providers/UIProvider.tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TOAST_DURATION_MS } from "@/config";

/* ------------------------------------------------------------------
   Types pour les toasts
------------------------------------------------------------------ */

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

/* ------------------------------------------------------------------
   Types pour la modale globale
------------------------------------------------------------------ */

export interface ModalState {
  open: boolean;
  title?: string;
  description?: string;
  // callback optionnel si tu veux une action "Confirmer"
  onConfirm?: (() => void) | null;
}

/* ------------------------------------------------------------------
   Shape du contexte UI
------------------------------------------------------------------ */

export interface UIContextType {
  // Toaster
  toasts: Toast[];
  showToast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  removeToast: (id: string) => void;

  // Modal globale
  modal: ModalState;
  openModal: (payload: Omit<ModalState, "open">) => void;
  closeModal: () => void;
}

/* ------------------------------------------------------------------
   Contexte + Provider
------------------------------------------------------------------ */

export const UIContext = createContext<UIContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export default function UIProvider({ children }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<ModalState>({ open: false });

  /* ---------------------- Toasts ---------------------- */

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info", durationMs?: number) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const toast: Toast = {
        id,
        message,
        variant,
        duration: durationMs ?? TOAST_DURATION_MS,
      };

      setToasts((prev) => [...prev, toast]);

      // auto-dismiss
      const delay = toast.duration ?? TOAST_DURATION_MS;
      window.setTimeout(() => {
        removeToast(id);
      }, delay);
    },
    [removeToast]
  );

  /* ---------------------- Modal ----------------------- */

  const openModal = useCallback((payload: Omit<ModalState, "open">) => {
    setModal({
      open: true,
      title: payload.title,
      description: payload.description,
      onConfirm: payload.onConfirm ?? null,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ open: false });
  }, []);

  const value = useMemo<UIContextType>(
    () => ({
      toasts,
      showToast,
      removeToast,
      modal,
      openModal,
      closeModal,
    }),
    [toasts, showToast, removeToast, modal, openModal, closeModal]
  );

  return (
    <UIContext.Provider value={value}>
      {children}

      {/* Rendu basique des toasts, à adapter si besoin */}
      <div className="fixed z-50 bottom-4 right-4 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`alert shadow-lg ${
              t.variant === "success"
                ? "alert-success"
                : t.variant === "error"
                ? "alert-error"
                : t.variant === "warning"
                ? "alert-warning"
                : "alert-info"
            }`}
          >
            <span>{t.message}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => removeToast(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Modal globale très simple */}
      {modal.open && (
        <div className="modal modal-open">
          <div className="modal-box">
            {modal.title && <h3 className="font-bold text-lg">{modal.title}</h3>}
            {modal.description && <p className="py-2">{modal.description}</p>}

            <div className="modal-action">
              {modal.onConfirm && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    modal.onConfirm?.();
                    closeModal();
                  }}
                >
                  OK
                </button>
              )}
              <button type="button" className="btn" onClick={closeModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}

/* ------------------------------------------------------------------
   Hook utilitaire pour consommer le contexte
------------------------------------------------------------------ */

export function useUI(): UIContextType {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("useUI() doit être utilisé à l’intérieur de <UIProvider>.");
  }
  return ctx;
}
