"use client";

import type { FC } from 'react';
import { useMemo } from 'react';
import { format } from 'date-fns';
import type { DataPoint, MaxValueInfo, MinValueInfo, TftNamesInfo } from '@/contexts/MqttContext';
import { SensorChart, type SensorDisplayInfo } from './sensor-chart';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

interface DeviceDataViewProps {
  deviceSerial: string;
  deviceRawData: DataPoint[];
  maxValueInfo?: MaxValueInfo;
  minValueInfo?: MinValueInfo;
  tftNames?: TftNamesInfo;
  onRequestMaxValues: (deviceSerial: string) => void;
  onRequestMinValues: (deviceSerial: string) => void;
}

const SENSOR_PREFIXES: Array<"S1" | "S2" | "S3"> = ['S1', 'S2', 'S3'];

// Static details like units, as TFT/NAME/Response doesn't provide them.
const sensorStaticDetails: Record<string, { unit: string }> = {
  S1_L1: { unit: "Pa" },
  S1_L2: { unit: "Pa" },
  S1_L3: { unit: "°C" },
  S2_L1: { unit: "°C" },
  S2_L2: { unit: "%" },
  S2_L3: { unit: "V" },
  S3_L1: { unit: "V" },
  S3_L2: { unit: "V" },
  S3_L3: { unit: "V" },
  DEFAULT: { unit: ""}, // Fallback unit
};


export const DeviceDataView: FC<DeviceDataViewProps> = ({
  deviceSerial,
  deviceRawData,
  maxValueInfo,
  minValueInfo,
  tftNames,
  onRequestMaxValues,
  onRequestMinValues
}) => {
  const lastUpdateTime = useMemo(() => {
    if (deviceRawData.length === 0) return null;
    const latestPoint = deviceRawData.reduce((latest, point) =>
      point.timestamp > latest.timestamp ? point : latest
    );
    return latestPoint.timestamp;
  }, [deviceRawData]);

  const latestSensorValues = useMemo(() => {
    if (deviceRawData.length === 0) return {};
    const latestPoint = deviceRawData.reduce((latest, point) =>
        point.timestamp > latest.timestamp ? point : latest,
        deviceRawData[0]
    );
    return latestPoint.values;
  }, [deviceRawData]);

  return (
    <Card className="shadow-lg w-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl md:text-2xl">Device: {deviceSerial}</CardTitle>
            <CardDescription className="text-xs space-y-0.5 mt-1 text-muted-foreground">
              {lastUpdateTime && (
                <div>Last Update: {format(new Date(lastUpdateTime), 'HH:mm:ss')}</div>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-1 sm:mt-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRequestMaxValues(deviceSerial)}
              title="Get maximum sensor values"
            >
              <TrendingUpIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Max</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRequestMinValues(deviceSerial)}
              title="Get minimum sensor values"
            >
              <TrendingDownIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Min</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SENSOR_PREFIXES.map((prefix, index) => {
            const screenTitle = `Screen ${index + 1}`;
            const lineKeys: Array<"L1" | "L2" | "L3"> = ['L1', 'L2', 'L3'];

            const sensorsForScreen: SensorDisplayInfo[] = lineKeys.map(lineSuffix => {
              const fullSensorKey = `${prefix}_${lineSuffix}`;
              const dynamicName = tftNames?.[fullSensorKey];
              const displayName = dynamicName !== undefined ? String(dynamicName) : fullSensorKey; // Fallback to key if name not found
              
              const value = latestSensorValues[fullSensorKey];
              const staticDetail = sensorStaticDetails[fullSensorKey] || sensorStaticDetails.DEFAULT;
              
              const currentMinValue = minValueInfo?.[fullSensorKey];
              const currentMaxValue = maxValueInfo?.[fullSensorKey];

              return {
                key: fullSensorKey,
                displayName: displayName,
                value: value,
                unit: staticDetail.unit,
                minValue: currentMinValue,
                maxValue: currentMaxValue,
              };
            });

            return (
              <SensorChart
                key={prefix}
                screenTitle={screenTitle}
                sensors={sensorsForScreen}
                hasData={Object.keys(latestSensorValues).length > 0}
              />
            );
          })}
        </div>
      </CardContent>
       {(!maxValueInfo && !minValueInfo && Object.keys(latestSensorValues).length === 0 && deviceRawData.length === 0) && (
         <CardFooter className="text-sm text-muted-foreground">
            Waiting for device data and information...
         </CardFooter>
       )}
    </Card>
  );
};
