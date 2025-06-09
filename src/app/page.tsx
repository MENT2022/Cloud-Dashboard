"use client";

import { useMemo } from 'react';
import { DeviceDataView } from "@/components/device-data-view";
import { useMqtt } from "@/contexts/MqttContext";
import { MqttStatusIndicator } from "@/components/mqtt-status-indicator";
import type { DataPoint, MqttConnectionStatus } from '@/contexts/MqttContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MqttConnectForm } from "@/components/mqtt-connect-form";
import { cn } from '@/lib/utils';

interface GroupedDataByDevice {
  [deviceSerial: string]: DataPoint[];
}

export default function DashboardPage() {
  const {
    connectionStatus,
    dataPoints,
    maxValueMap,
    minValueMap,
    tftNamesMap,
    requestDeviceMaxValues,
    requestDeviceMinValues,
    connectMqtt,
    disconnectMqtt
  } = useMqtt();

  const status = connectionStatus as MqttConnectionStatus;

  const groupedData = useMemo(() => {
    return dataPoints.reduce((acc, point) => {
      if (!acc[point.deviceSerial]) {
        acc[point.deviceSerial] = [];
      }
      acc[point.deviceSerial].push(point);
      return acc;
    }, {} as GroupedDataByDevice);
  }, [dataPoints]);

  const connectedDevices = Object.keys(groupedData);
  const showConnectForm = connectionStatus !== "connected";

  return (
    <main className="flex-grow container mx-auto p-4 md:p-6">
      <div className="mb-4 flex justify-end">
        <MqttStatusIndicator status={status} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {showConnectForm && (
           <div className="lg:col-span-4 space-y-6">
             <MqttConnectForm
               onConnect={connectMqtt}
               isConnecting={status === "connecting"}
               isConnected={status === "connected"}
               onDisconnect={disconnectMqtt}
             />
           </div>
        )}
        <div className={cn(
          "space-y-8",
          showConnectForm ? "lg:col-span-8" : "lg:col-span-12"
        )}>
          {status === "connected" && connectedDevices.length > 0 ? (
            connectedDevices.map(deviceSerial => (
              <DeviceDataView
                key={deviceSerial}
                deviceSerial={deviceSerial}
                deviceRawData={groupedData[deviceSerial]}
                // deviceInfo={deviceInfoMap[deviceSerial]} // Removed
                maxValueInfo={maxValueMap[deviceSerial]}
                minValueInfo={minValueMap[deviceSerial]}
                tftNames={tftNamesMap[deviceSerial]}
                // onRequestDetails={requestDeviceDetails} // Removed
                onRequestMaxValues={requestDeviceMaxValues}
                onRequestMinValues={requestDeviceMinValues}
              />
            ))
          ) : status === "connected" ? (
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Waiting for Data</CardTitle>
                <CardDescription>Connected to MQTT broker. No data received yet or no devices are sending data on configured topics.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Once data is received, sensor readings and device information will appear here.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}
