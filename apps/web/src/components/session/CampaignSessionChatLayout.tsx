import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { ButtonRadioGroup } from "../common/ButtonRadioGroup";

type MobilePane = "table" | "chat";

interface CampaignSessionChatLayoutProps {
  tablePane: ReactNode;
  chatPane: ReactNode;
  defaultMobilePane?: MobilePane;
  className?: string;
}

export const CampaignSessionChatLayout = ({
  tablePane,
  chatPane,
  defaultMobilePane = "chat",
  className,
}: CampaignSessionChatLayoutProps): JSX.Element => {
  const [activeMobilePane, setActiveMobilePane] =
    useState<MobilePane>(defaultMobilePane);

  useEffect(() => {
    setActiveMobilePane(defaultMobilePane);
  }, [defaultMobilePane]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="mb-2 lg:hidden">
        <ButtonRadioGroup
          ariaLabel="Session chat mobile pane"
          color="cloth"
          value={activeMobilePane}
          onValueChange={setActiveMobilePane}
          options={[
            { label: "Table", value: "table" },
            { label: "Chat", value: "chat" },
          ]}
        />
      </div>

      <div className="hidden min-h-0 flex-1 overflow-hidden lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-4">
        <div className="flex min-h-0 min-w-0 flex-col">{tablePane}</div>
        <div className="flex min-h-0 min-w-0 flex-col">{chatPane}</div>
      </div>

      <div className="flex min-h-0 flex-1 lg:hidden">
        {activeMobilePane === "table" ? (
          <div className="flex min-h-0 w-full flex-1 flex-col">{tablePane}</div>
        ) : null}
        {activeMobilePane === "chat" ? (
          <div className="flex min-h-0 w-full flex-1 flex-col">{chatPane}</div>
        ) : null}
      </div>
    </div>
  );
};
