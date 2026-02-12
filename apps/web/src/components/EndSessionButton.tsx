import { Button } from "./common/Button";

interface EndSessionButtonProps {
  onEndSession: () => void;
}

export const EndSessionButton = ({ onEndSession }: EndSessionButtonProps): JSX.Element => {
  return (
    <Button
      variant="solid"
      color="curse"
      onClick={() => {
        if (window.confirm("End this session now?")) {
          onEndSession();
        }
      }}
    >
      End Session
    </Button>
  );
};
