import { useCallback, useEffect, useRef, useState } from "react";
import { createSocketClient } from "../lib/socket";

interface UseCampaignWatchOptions {
  enabled?: boolean;
}

export const useCampaignWatch = ({
  enabled = true,
}: UseCampaignWatchOptions = {}) => {
  const socketRef = useRef(createSocketClient());
  const [connected, setConnected] = useState(socketRef.current.connected);
  const [campaignUpdatedAtIso, setCampaignUpdatedAtIso] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = socketRef.current;

    const handleConnect = (): void => {
      setConnected(true);
    };
    const handleDisconnect = (): void => {
      setConnected(false);
    };
    const handleCampaignUpdated = (payload: { updatedAtIso: string }): void => {
      setCampaignUpdatedAtIso(payload.updatedAtIso);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("campaign_updated", handleCampaignUpdated);
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("campaign_updated", handleCampaignUpdated);
      socket.disconnect();
    };
  }, [enabled]);

  const watchCampaign = useCallback((campaignSlug: string): void => {
    socketRef.current.emit("watch_campaign", { campaignSlug });
  }, []);

  const unwatchCampaign = useCallback((campaignSlug: string): void => {
    socketRef.current.emit("unwatch_campaign", { campaignSlug });
  }, []);

  return {
    connected,
    campaignUpdatedAtIso,
    watchCampaign,
    unwatchCampaign,
  };
};
