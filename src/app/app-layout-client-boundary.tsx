
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HomeIcon, BarChart3Icon, HistoryIcon, SettingsIcon, MailIcon } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { MqttStatusIndicator } from "@/components/mqtt-status-indicator";
import { useMqtt } from '@/contexts/MqttContext';

export function AppLayoutClientBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { connectionStatus } = useMqtt();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <BarChart3Icon className="h-8 w-8 text-[hsl(var(--sidebar-primary))]" />
            <h2 className="text-xl font-semibold text-[hsl(var(--sidebar-primary-foreground))]">MQTT Vis</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton tooltip="Dashboard" isActive={pathname === '/'}>
                  <HomeIcon />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/historic">
                <SidebarMenuButton tooltip="Historic Data" isActive={pathname === '/historic'}>
                  <HistoryIcon />
                  <span>Historic</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/info-settings">
                <SidebarMenuButton tooltip="Information & Settings" isActive={pathname === '/info-settings'}>
                  <SettingsIcon />
                  <span>Info & Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <a href="mailto:mouin.freelance@gmail.com">
                <SidebarMenuButton tooltip="Contact Us">
                  <MailIcon />
                  <span>Contact</span>
                </SidebarMenuButton>
              </a>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 space-y-1 text-center">
          <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            mouin.freelance@gmail.com
          </p>
          <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            &copy; {currentYear !== null ? currentYear : '...'}
          </span>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="dark flex flex-col min-h-screen">
        <header className="p-4 md:px-6 border-b border-border shadow-sm sticky top-0 bg-[hsl(var(--app-header-background))] text-[hsl(var(--app-header-foreground))] z-40">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-[hsl(var(--app-header-foreground))] hover:bg-[hsl(var(--app-header-background))]/80">
                  <Icons.Menu className="h-6 w-6" />
                </Button>
              </SidebarTrigger>
              <SidebarTrigger className="hidden md:flex text-[hsl(var(--app-header-foreground))] hover:bg-[hsl(var(--app-header-background))]/80" />
              <h1 className="text-xl md:text-2xl font-bold">Real time Data Visualizer</h1>
            </div>
            <div className="flex items-center gap-4">
                <MqttStatusIndicator status={connectionStatus} />
            </div>
          </div>
        </header>

        {children} {/* Page content goes here */}

        <footer className="p-4 md:p-6 border-t border-border text-center bg-background text-muted-foreground"></footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
