import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ButtonColors } from "../components/common/Button";

export interface ConfirmationRequest {
  title: string;
  description: ReactNode;
  ariaLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: ButtonColors;
  onConfirm: () => void | Promise<void>;
}

export interface ManagedConfirmationDialog {
  open: true;
  title: string;
  description: ReactNode;
  ariaLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: ButtonColors;
  pending: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const useConfirmationDialog = (): {
  confirmation: ManagedConfirmationDialog | null;
  requestConfirmation: (request: ConfirmationRequest) => void;
  closeConfirmation: () => void;
} => {
  const [request, setRequest] = useState<ConfirmationRequest | null>(null);
  const [pending, setPending] = useState(false);

  const closeConfirmation = useCallback((): void => {
    if (pending) {
      return;
    }
    setRequest(null);
  }, [pending]);

  const requestConfirmation = useCallback((nextRequest: ConfirmationRequest): void => {
    setRequest(nextRequest);
  }, []);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (!request) {
      return;
    }

    setPending(true);
    try {
      await request.onConfirm();
      setRequest(null);
    } catch {
      // Keep the dialog open if the action fails so the surface can show the error.
    } finally {
      setPending(false);
    }
  }, [request]);

  const confirmation = useMemo<ManagedConfirmationDialog | null>(() => {
    if (!request) {
      return null;
    }

    return {
      open: true,
      title: request.title,
      description: request.description,
      ariaLabel: request.ariaLabel,
      confirmLabel: request.confirmLabel,
      cancelLabel: request.cancelLabel,
      confirmColor: request.confirmColor,
      pending,
      onConfirm: handleConfirm,
      onClose: closeConfirmation,
    };
  }, [closeConfirmation, handleConfirm, pending, request]);

  return {
    confirmation,
    requestConfirmation,
    closeConfirmation,
  };
};
