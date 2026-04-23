import type { ReactNode } from "react";
import { PendingIndicator } from "../PendingIndicator";
import { Button, type ButtonColors } from "./Button";
import { Message } from "./Message";
import { Overlay } from "./Overlay";
import { Text } from "./Text";

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  ariaLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: ButtonColors;
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmationDialog = ({
  open,
  title,
  description,
  ariaLabel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor = "blood",
  pending = false,
  onConfirm,
  onClose,
}: ConfirmationDialogProps): JSX.Element | null => {
  const handleClose = (): void => {
    if (pending) {
      return;
    }
    onClose();
  };

  return (
    <Overlay
      open={open}
      ariaLabel={ariaLabel ?? title}
      onClose={handleClose}
      surface="plain"
      panelClassName="confirmation-dialog max-w-xl"
    >
      <Message color="blood" className="confirmation-dialog__message">
        <div className="confirmation-dialog__body stack gap-5 rounded-sm px-4 py-4">
          <div className="stack gap-2">
            <Text variant="h3" color="iron">
              {title}
            </Text>
            <Text
              variant="body"
              color="iron-light"
              className="text-sm leading-relaxed"
            >
              {description}
            </Text>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              color="cloth"
              onClick={handleClose}
              disabled={pending}
            >
              {cancelLabel}
            </Button>
            <Button
              color={confirmColor}
              onClick={() => void onConfirm()}
              disabled={pending}
            >
              {pending ? (
                <PendingIndicator label={confirmLabel} color={confirmColor} />
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </Message>
    </Overlay>
  );
};
