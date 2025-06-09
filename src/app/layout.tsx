
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { MqttProvider } from '@/contexts/MqttContext';
// import { AuthProvider } from '@/contexts/AuthContext'; // Removed AuthProvider
import { AppLayoutClientBoundary } from './app-layout-client-boundary';

export const metadata: Metadata = {
  title: 'MQTT Monitoring',
  description: 'Monitor and visualize real-time MQTT data with dynamic graphs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased bg-background text-foreground`}>
        {/* <AuthProvider> */} {/* Removed AuthProvider wrapper */}
          <MqttProvider>
            <AppLayoutClientBoundary>
              {children}
            </AppLayoutClientBoundary>
          </MqttProvider>
        {/* </AuthProvider> */}
        <Toaster />
      </body>
    </html>
  );
}
