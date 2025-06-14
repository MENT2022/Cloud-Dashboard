
"use client";

import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";

interface MqttConnectFormProps {
  onConnect: () => void;
  isConnecting: boolean;
  isConnected: boolean;
  onDisconnect: () => void;
}

export function MqttConnectForm({
  onConnect,
  isConnecting,
  isConnected,
  onDisconnect
}: MqttConnectFormProps) {
  const handleConnect = () => {
    onConnect();
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <div className="text-center mb-1">
          <span className="text-xs text-muted-foreground">Cloud Dashboard</span>
        </div>
        <CardTitle className="text-2xl text-center">Cloud Control</CardTitle>
        <CardDescription className="text-center">
          Connect to the predefined MQTT broker.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="pt-2">
          {isConnected ? (
            <Button type="button" onClick={onDisconnect} variant="destructive" className="w-full">
              <Icons.WifiOff className="mr-2 h-4 w-4" /> Disconnect
            </Button>
          ) : (
            <Button type="button" onClick={handleConnect} disabled={isConnecting} className="w-full">
              {isConnecting ? (
                <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.Wifi className="mr-2 h-4 w-4" />
              )}
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
