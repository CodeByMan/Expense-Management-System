import React, { createContext, useContext, useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import toast from "react-hot-toast";
import { appConfig } from "@/config";
import { useAuth } from "./AuthContext";

type SignalRContextType = {
  connection: signalR.HubConnection | null;
  notifications: string[];
  clearNotifications: () => void;
};

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const SignalRProvider = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<string[]>([]);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setConnection(null);
      return;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(appConfig.signalRHubUrl, { accessTokenFactory: () => accessToken })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    newConnection.on("ReceiveNotification", (message: string) => {
      setNotifications((previous) => [...previous, message]);
      toast(message);
    });

    void newConnection.start()
      .then(() => setConnection(newConnection))
      .catch(() => toast.error("Live notifications are temporarily unavailable."));

    return () => {
      newConnection.off("ReceiveNotification");
      void newConnection.stop();
      setConnection((current) => current === newConnection ? null : current);
    };
  }, [isAuthenticated, accessToken]);

  return (
    <SignalRContext.Provider value={{ connection, notifications, clearNotifications: () => setNotifications([]) }}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) throw new Error("useSignalR must be used within a SignalRProvider");
  return context;
};
