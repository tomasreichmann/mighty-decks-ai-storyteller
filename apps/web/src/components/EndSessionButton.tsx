import { Button } from "./common/Button";
import { ConfirmationDialog } from "./common/ConfirmationDialog";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";

interface EndSessionButtonProps {
  onEndSession: () => void;
}

export const EndSessionButton = ({ onEndSession }: EndSessionButtonProps): JSX.Element => {
  const { confirmation, requestConfirmation } = useConfirmationDialog();

  return (
    <>
      <Button
        variant="solid"
        color="curse"
        onClick={() => {
          requestConfirmation({
            title: "End this session now?",
            description:
              "This closes the current session immediately for everyone connected to it.",
            confirmLabel: "End Session",
            confirmColor: "curse",
            onConfirm: () => {
              onEndSession();
            },
          });
        }}
      >
        End Session
      </Button>
      {confirmation ? <ConfirmationDialog {...confirmation} /> : null}
    </>
  );
};
