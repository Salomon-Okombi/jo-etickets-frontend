import Button from "@/components/ui/Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmTone?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  confirmTone = "primary",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-base-100 p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>

        {description && (
          <p className="mb-4 whitespace-pre-line text-sm text-base-content/80">
            {description}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onCancel} disabled={busy}>
            {cancelText}
          </Button>

          <Button
            variant="primary"
            tone={confirmTone === "danger" ? "danger" : "default"}
            type="button"
            onClick={onConfirm}
            loading={busy}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
``