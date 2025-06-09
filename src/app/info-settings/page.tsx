"use client";

import { useMqtt } from "@/contexts/MqttContext";
import type { DeviceStatus, DeviceInfo, TftNamesInfo, DeviceEpdInfo } from "@/contexts/MqttContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, AlertTriangleIcon, CheckCircle2, InfoIcon, SlidersHorizontalIcon, CpuIcon, ListTreeIcon, FileTextIcon, RotateCcwIcon, UploadCloudIcon, PaletteIcon, MonitorSmartphoneIcon } from "lucide-react";
import { format } from 'date-fns';
import { useMemo, useState } from "react";

// Error Code Definitions
const ERROR_CODE_MAP: Record<number, string> = {
    0x0001: "CAN_ERROR_INIT_FAILED (Bit 0)",
    0x0002: "CAN_ERROR_NULL_BUFFER (Bit 1)",
    0x0004: "CAN_ERROR_READ_FAILED (Bit 2)",
    0x0008: "CAN_ERROR_GENERIC (Bit 3)",
    0x0010: "I2C_ERROR_COMMUNICATION (Bit 4)",
    0x0020: "I2C_ERROR_TIMEOUT (Bit 5)",
    0x0040: "I2C_ERROR_RESET_FAILED (Bit 6)",
    0x0100: "WDG_ERROR_TIMEOUT (Bit 8)",
    0x0200: "WDG_ERROR_RESET (Bit 9)",
    0x1000: "SFT_ERROR_LOW_MEMORY (Bit 12)",
    0x2000: "SFT_ERROR_OVERLOAD (Bit 13)",
    0x4000: "SFT_ERROR_SEMAPHORE (Bit 14)",
    0x00010000: "ASW_ERROR_OVERLOAD (Bit 16)",
    0x00020000: "ASW_ERROR_TASK_TIMEOUT (Bit 17)",
    0x00100000: "NVM_ERROR_INIT (Bit 20)",
    0x01000000: "MQTT_ERROR_SEND (Bit 24)",
    0x02000000: "MQTT_ERROR_CONNECT (Bit 25)",
    0x04000000: "MQTT_ERROR_WIFI (Bit 26)",
    0x08000000: "MQTT_ERROR_STATE (Bit 27)",
    0x10000000: "MQTT_ERROR_AUTH (Bit 28)",
};

// Warning Code Definitions
const WARNING_CODE_MAP: Record<number, string> = {
    0x0001: "I2C_WARN_RETRY (Bit 0)",
    0x0010: "MQTT_WARN_SEND_RETRY (Bit 4)",
    0x0020: "MQTT_WARN_WIFI (Bit 5)",
    0x0040: "MQTT_WARN_INTERNET (Bit 6)",
    0x0100: "CAN_WARN_OVERFLOW (Bit 8)",
    0x0200: "CAN_WARN_READ (Bit 9)",
    0x1000: "ASW_WARN_HIGH_LOAD (Bit 12)",
    0x2000: "ASW_WARN_TASK_DELAY (Bit 13)",
};

function decodeFlags(flags: number | undefined, codeMap: Record<number, string>): string[] {
    if (flags === undefined || flags === 0) return ["No active flags."];
    const activeMessages: string[] = [];
    for (const bitValue in codeMap) {
        if ((flags & parseInt(bitValue)) === parseInt(bitValue)) {
            activeMessages.push(codeMap[bitValue]);
        }
    }
    return activeMessages.length > 0 ? activeMessages : ["No active flags."];
}

type ActiveView = 'deviceInfo' | 'sensorNames' | 'logs' | 'epdInfo';

export default function InfoSettingsPage() {
  const { 
    deviceStatusMap, 
    deviceInfoMap,
    tftNamesMap,
    deviceEpdInfoMap,
    requestAllCpuInfo,
    requestAllTftNames,
    requestAllErrorFlags, 
    requestAllEpdInfo,
    sendClearRequest,
    sendFotaRequest,
    sendEpModeSettingRequest,
    connectionStatus 
  } = useMqtt();

  const [activeView, setActiveView] = useState<ActiveView>('deviceInfo');

  const allDeviceSerials = useMemo(() => {
    const serials = new Set<string>();
    Object.keys(deviceStatusMap).forEach(s => serials.add(s));
    Object.keys(deviceInfoMap).forEach(s => serials.add(s));
    Object.keys(tftNamesMap).forEach(s => serials.add(s));
    Object.keys(deviceEpdInfoMap).forEach(s => serials.add(s));
    return Array.from(serials).sort();
  }, [deviceStatusMap, deviceInfoMap, tftNamesMap, deviceEpdInfoMap]);

  const handleRefreshDeviceInfo = () => {
    requestAllCpuInfo();
    setActiveView('deviceInfo');
  };

  const handleRefreshSensorNames = () => {
    requestAllTftNames();
    setActiveView('sensorNames');
  };

  const handleRefreshLogs = () => {
    requestAllErrorFlags();
    setActiveView('logs');
  };

  const handleRefreshEpdInfo = () => {
    requestAllEpdInfo();
    setActiveView('epdInfo');
  };

  return (
    <main className="flex-grow container mx-auto p-4 md:p-6">
      <Card className="shadow-lg w-full mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Device Information &amp; Settings</CardTitle>
          <CardDescription>
            View information, logs, or trigger device actions. Select a category to view or an action to perform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
          {/* View Control Buttons */}
          <Button 
            onClick={handleRefreshDeviceInfo} 
            disabled={connectionStatus !== "connected"}
            className="w-full sm:w-auto"
            variant={activeView === 'deviceInfo' ? "default" : "outline"}
          >
            <CpuIcon className="mr-2 h-4 w-4" />
            Refresh Device Info
          </Button>
          <Button 
            onClick={handleRefreshSensorNames} 
            disabled={connectionStatus !== "connected"}
            className="w-full sm:w-auto"
            variant={activeView === 'sensorNames' ? "default" : "outline"}
          >
            <ListTreeIcon className="mr-2 h-4 w-4" />
            Refresh Sensor Names
          </Button>
          <Button 
            onClick={handleRefreshLogs} 
            disabled={connectionStatus !== "connected"}
            className="w-full sm:w-auto"
            variant={activeView === 'logs' ? "default" : "outline"}
          >
            <FileTextIcon className="mr-2 h-4 w-4" />
            Refresh Logs
          </Button>
          <Button 
            onClick={handleRefreshEpdInfo} 
            disabled={connectionStatus !== "connected"}
            className="w-full sm:w-auto"
            variant={activeView === 'epdInfo' ? "default" : "outline"}
          >
            <MonitorSmartphoneIcon className="mr-2 h-4 w-4" />
            Refresh EPD Info
          </Button>

          {/* Action Buttons */}
           <Button 
            onClick={sendClearRequest} 
            disabled={connectionStatus !== "connected"}
            className="w-full sm:w-auto"
            variant="outline"
          >
            <RotateCcwIcon className="mr-2 h-4 w-4" />
            Resets
          </Button>
          <Button 
            onClick={sendFotaRequest} 
            disabled={connectionStatus !== "connected"}
            className="w-full sm:w-auto"
            variant="outline"
          >
            <UploadCloudIcon className="mr-2 h-4 w-4" />
            Software Update
          </Button>
          <Button 
            onClick={sendEpModeSettingRequest} 
            disabled={connectionStatus !== "connected"}
            className="w-full sm:w-auto"
            variant="outline"
          >
            <PaletteIcon className="mr-2 h-4 w-4" />
            Setting Mode EPD
          </Button>

          {connectionStatus !== "connected" && (
            <p className="text-sm text-muted-foreground mt-2 w-full">
              Connect to MQTT broker to fetch device information or send commands.
            </p>
          )}
        </CardContent>
      </Card>

      {allDeviceSerials.length === 0 && connectionStatus === "connected" && (
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No device information received yet. Click a refresh button above to request data.
            </p>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allDeviceSerials.map((deviceSerial) => {
            const status: DeviceStatus | undefined = deviceStatusMap[deviceSerial];
            const info: DeviceInfo | undefined = deviceInfoMap[deviceSerial];
            const names: TftNamesInfo | undefined = tftNamesMap[deviceSerial];
            const epdInfo: DeviceEpdInfo | undefined = deviceEpdInfoMap[deviceSerial];

            const errors = decodeFlags(status?.errorFlags, ERROR_CODE_MAP);
            const warnings = decodeFlags(status?.warningFlags, WARNING_CODE_MAP);

            const lastUpdateTimestamp = Math.max(
              status?.lastUpdate || 0,
              info?.lastUpdate || 0,
              names?.lastUpdate || 0,
              epdInfo?.lastUpdate || 0
            );
            
            const displayableTftNames = names ? Object.fromEntries(Object.entries(names).filter(([key]) => key !== 'lastUpdate')) : {};

            const hasDataForActiveView = 
              (activeView === 'deviceInfo' && info) ||
              (activeView === 'sensorNames' && names && Object.keys(displayableTftNames).length > 0) ||
              (activeView === 'logs' && status) ||
              (activeView === 'epdInfo' && epdInfo);

            return (
              <Card key={deviceSerial} className="shadow-md flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Device: {deviceSerial}</CardTitle>
                  {lastUpdateTimestamp > 0 && (
                     <CardDescription className="text-xs">
                        Last Overall Update: {format(new Date(lastUpdateTimestamp), 'MMM d, yyyy HH:mm:ss')}
                     </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                  {activeView === 'deviceInfo' && info && (
                    <div>
                      <h4 className="font-semibold text-base mb-2 flex items-center">
                        <InfoIcon className="h-5 w-5 mr-2 text-blue-500" />
                        Device Information
                      </h4>
                      <ul className="text-sm space-y-0.5 pl-1 text-muted-foreground">
                        {info.firmwareVersion && <li>FW Version: <span className="text-foreground">{info.firmwareVersion}</span></li>}
                        {info.ramAvailable && <li>RAM Free: <span className="text-foreground">{info.ramAvailable}%</span></li>}
                        {info.rtcTemperature && <li>RTC Temp: <span className="text-foreground">{info.rtcTemperature}°C</span></li>}
                        {info.timeActive && <li>Uptime: <span className="text-foreground">{info.timeActive}</span></li>}
                        {info.restarts && <li>Restarts: <span className="text-foreground">{info.restarts}</span></li>}
                        {info.mqttUser && <li>MQTT User: <span className="text-foreground">{info.mqttUser}</span></li>}
                        {info.resetReason && <li>Reset Reason: <span className="text-foreground">{info.resetReason}</span></li>}
                        {info.lastUpdate && <li className="text-xs italic mt-1">CPU Info Updated: {format(new Date(info.lastUpdate), 'HH:mm:ss')}</li>}
                      </ul>
                    </div>
                  )}

                  {activeView === 'sensorNames' && names && Object.keys(displayableTftNames).length > 0 && (
                     <div>
                        <h4 className="font-semibold text-base mb-2 mt-3 flex items-center">
                            <SlidersHorizontalIcon className="h-5 w-5 mr-2 text-purple-500" />
                            Sensor Names (TFT)
                        </h4>
                        <ul className="text-sm space-y-0.5 pl-1 text-muted-foreground">
                            {Object.entries(displayableTftNames).map(([key, name]) => (
                                <li key={key}>{key}: <span className="text-foreground">{String(name)}</span></li>
                            ))}
                             {names.lastUpdate && <li className="text-xs italic mt-1">Names Updated: {format(new Date(names.lastUpdate), 'HH:mm:ss')}</li>}
                        </ul>
                    </div>
                  )}

                  {activeView === 'logs' && status && (
                    <>
                      <div>
                        <h4 className="font-semibold text-base mb-1 mt-3 flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                          Error Flags ({status.errorFlags ?? 0})
                        </h4>
                        {errors[0] === "No active flags." ? (
                          <p className="text-sm text-muted-foreground flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                            {errors[0]}
                          </p>
                        ) : (
                          <ul className="list-disc list-inside pl-2 space-y-0.5 text-sm text-destructive">
                            {errors.map((err, idx) => <li key={`err-${idx}`}>{err}</li>)}
                          </ul>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-base mb-1 mt-3 flex items-center">
                          <AlertTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                          Warning Flags ({status.warningFlags ?? 0})
                        </h4>
                         {warnings[0] === "No active flags." ? (
                          <p className="text-sm text-muted-foreground flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                            {warnings[0]}
                          </p>
                        ) : (
                          <ul className="list-disc list-inside pl-2 space-y-0.5 text-sm text-yellow-600 dark:text-yellow-400">
                            {warnings.map((warn, idx) => <li key={`warn-${idx}`}>{warn}</li>)}
                          </ul>
                        )}
                      </div>
                       {status.lastUpdate && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                            Logs Updated: {format(new Date(status.lastUpdate), 'HH:mm:ss')}
                        </p>
                       )}
                    </>
                  )}

                  {activeView === 'epdInfo' && epdInfo && (
                    <div>
                      <h4 className="font-semibold text-base mb-1 mt-3 flex items-center">
                        <MonitorSmartphoneIcon className="h-5 w-5 mr-2 text-teal-500" />
                        EPD Information
                      </h4>
                      {epdInfo.lastUpdate && (
                        <p className="text-xs text-muted-foreground mb-2 pl-7"> 
                          EPD Info Updated: {format(new Date(epdInfo.lastUpdate), 'HH:mm:ss')}
                        </p>
                      )}
                      <ul className="text-sm space-y-1 pl-1">
                        <li>
                          <span className="text-muted-foreground">EPD Restart Count: </span>
                          <span className="text-foreground">{epdInfo.epd_1_restart ?? 'N/A'}</span>
                        </li>
                        <li>
                          <span className="text-muted-foreground">EPD Reset Reason: </span>
                          <span className="text-foreground">{epdInfo.epd_1_reset_reason ?? 'N/A'}</span>
                        </li>
                        <li>
                          <span className="text-muted-foreground">EPD SW Reset Reason: </span>
                          <span className="text-foreground">{epdInfo.epd_1_sw_reset_reason ?? 'N/A'}</span>
                        </li>
                        <li>
                          <span className="text-muted-foreground">EPD Time Active: </span>
                          <span className="text-foreground">{epdInfo.epd_1_time_active ?? 'N/A'}</span>
                        </li>
                      </ul>
                    </div>
                  )}
                  
                  {!hasDataForActiveView && (
                     <p className="text-sm text-muted-foreground text-center py-4">
                        No {activeView === 'deviceInfo' ? 'Device Info' : 
                             activeView === 'sensorNames' ? 'Sensor Names' : 
                             activeView === 'epdInfo' ? 'EPD Info' : 
                             'Log'} data currently available for this device.
                        Click the corresponding "Refresh" button above to fetch.
                    </p>
                  )}

                </CardContent>
                <CardFooter className="text-xs text-muted-foreground pt-3">
                    Device: {deviceSerial}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </main>
  );
}
    
