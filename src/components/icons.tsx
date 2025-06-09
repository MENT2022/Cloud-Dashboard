
import type { LucideProps } from 'lucide-react';
import { Wifi, WifiOff, Loader2, Palette as PaletteIcon, LineChart as LineChartIcon, Settings2, AlertTriangle, CheckCircle2, XCircle, Menu, Settings, Home, Activity, BarChart3, History as HistoryIcon, CalendarDays, DatabaseZap, Filter, Smartphone, RefreshCw, TrendingUp, TrendingDown, RotateCcw, UploadCloud, Cpu, ListTree, FileText, MonitorSmartphone, Mail as MailIcon } from 'lucide-react'; // Removed LogOutIcon

export const Icons = {
  Wifi: (props: LucideProps) => <Wifi {...props} />,
  WifiOff: (props: LucideProps) => <WifiOff {...props} />,
  Loader: (props: LucideProps) => <Loader2 {...props} className={cn("animate-spin", props.className)} />,
  Palette: (props: LucideProps) => <PaletteIcon {...props} />,
  LineChart: (props: LucideProps) => <LineChartIcon {...props} />,
  Settings: (props: LucideProps) => <Settings {...props} />,
  SettingsIcon: (props: LucideProps) => <Settings2 {...props} />,
  AlertTriangle: (props: LucideProps) => <AlertTriangle {...props} />,
  CheckCircle: (props: LucideProps) => <CheckCircle2 {...props} />,
  XCircle: (props: LucideProps) => <XCircle {...props} />,
  Menu: (props: LucideProps) => <Menu {...props} />,
  Home: (props: LucideProps) => <Home {...props} />,
  Activity: (props: LucideProps) => <Activity {...props} />,
  BarChart3: (props: LucideProps) => <BarChart3 {...props} />,
  History: (props: LucideProps) => <HistoryIcon {...props} />,
  CalendarIcon: (props: LucideProps) => <CalendarDays {...props} />,
  DatabaseZapIcon: (props: LucideProps) => <DatabaseZap {...props} />,
  FilterIcon: (props: LucideProps) => <Filter {...props} />,
  SmartphoneIcon: (props: LucideProps) => <Smartphone {...props} />,
  RefreshCwIcon: (props: LucideProps) => <RefreshCw {...props} />,
  TrendingUpIcon: (props: LucideProps) => <TrendingUp {...props} />,
  TrendingDownIcon: (props: LucideProps) => <TrendingDown {...props} />,
  RotateCcwIcon: (props: LucideProps) => <RotateCcw {...props} />,
  UploadCloudIcon: (props: LucideProps) => <UploadCloud {...props} />,
  CpuIcon: (props: LucideProps) => <Cpu {...props} />,
  ListTreeIcon: (props: LucideProps) => <ListTree {...props} />,
  FileTextIcon: (props: LucideProps) => <FileText {...props} />,
  PaletteIcon: (props: LucideProps) => <PaletteIcon {...props} />,
  MonitorSmartphoneIcon: (props: LucideProps) => <MonitorSmartphone {...props} />,
  MailIcon: (props: LucideProps) => <MailIcon {...props} />,
  // LogOutIcon: (props: LucideProps) => <LogOutIcon {...props} />, // Removed LogOutIcon
};

// Helper cn function (assuming it's from lib/utils)
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
