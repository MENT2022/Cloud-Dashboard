
"use client";

import type { FC } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Icons } from "@/components/icons";

const connectFormSchema = z.object({
  brokerUrl: z.string().min(1, "Broker URL is required.")
    .refine(url => {
      try {
        const parsedUrl = new URL(url);
        return ['mqtt:', 'mqtts:', 'ws:', 'wss:'].includes(parsedUrl.protocol);
      } catch (e) {
        return !url.startsWith('http://') && !url.startsWith('https://');
      }
    }, { message: "Invalid URL. Use mqtt(s)://host:port or ws(s)://host:port/path" }),
  username: z.string().optional(),
  password: z.string().optional(),
});

export type ConnectFormValues = z.infer<typeof connectFormSchema>;

interface MqttConnectFormProps {
  onConnect: (values: ConnectFormValues) => void;
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
  const form = useForm<ConnectFormValues>({
    resolver: zodResolver(connectFormSchema),
    defaultValues: {
      brokerUrl: "",
      username: "",
      password: "",
    },
  });

  const handleSubmit = (values: ConnectFormValues) => {
    onConnect(values);
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <div className="text-center mb-1">
          <span className="text-xs text-muted-foreground">Cloud</span>
        </div>
        <CardTitle className="text-2xl text-center">Login</CardTitle>
        <CardDescription className="text-center">Enter broker details and credentials to connect.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="brokerUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Broker URL</FormLabel>
                  <FormControl>
                    <Input placeholder="wss://broker.example.com:8884/mqtt" {...field} disabled={isConnected || isConnecting} className="text-card-foreground bg-card border-border focus:ring-ring" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="your-username" {...field} disabled={isConnected || isConnecting} className="text-card-foreground bg-card border-border focus:ring-ring" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="your-password" {...field} disabled={isConnected || isConnecting} className="text-card-foreground bg-card border-border focus:ring-ring" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-2">
              {isConnected ? (
                <Button type="button" onClick={onDisconnect} variant="destructive" className="w-full">
                  <Icons.WifiOff className="mr-2 h-4 w-4" /> Disconnect
                </Button>
              ) : (
                <Button type="submit" disabled={isConnecting} className="w-full">
                  {isConnecting ? (
                    <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.Wifi className="mr-2 h-4 w-4" />
                  )}
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
