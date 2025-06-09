
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Updated interface for props
export interface SensorDisplayInfo {
  key: string;
  displayName: string;
  value?: number;
  unit: string;
  minValue?: number; // New: for dynamic min range
  maxValue?: number; // New: for dynamic max range
}

interface SensorChartProps {
  screenTitle: string;
  sensors: SensorDisplayInfo[];
  hasData: boolean;
}

const MAX_NAME_LENGTH = 15;

export const SensorChart: FC<SensorChartProps> = ({ screenTitle, sensors, hasData }) => {
  return (
    <Card className="w-full shadow-md flex flex-col">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">{screenTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow pt-2 pb-4 px-4 space-y-3">
        {sensors.map((sensor) => {
          let displayName = sensor.displayName;
          if (displayName.length > MAX_NAME_LENGTH) {
            displayName = displayName.substring(0, MAX_NAME_LENGTH - 3) + "...";
          }

          const minValStr = sensor.minValue !== undefined ? sensor.minValue.toFixed(2) : 'N/A';
          const maxValStr = sensor.maxValue !== undefined ? sensor.maxValue.toFixed(2) : 'N/A';
          const rangeStr = `Range: ${minValStr} - ${maxValStr}`;

          return (
            <div key={sensor.key} className="text-sm">
              <p className="font-medium text-muted-foreground" title={sensor.displayName}>
                {displayName}
              </p>
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded-md mt-1">
                <span className="text-xl font-semibold text-foreground">
                  {sensor.value !== undefined ? sensor.value.toFixed(2) : (hasData ? 'N/A' : '...')}
                </span>
                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                  {sensor.unit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{rangeStr}</p>
            </div>
          );
        })}
        {!hasData && sensors.every(s => s.value === undefined) && (
           <div className="flex items-center justify-center h-full py-4">
            <p className="text-muted-foreground text-sm">Waiting for data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
