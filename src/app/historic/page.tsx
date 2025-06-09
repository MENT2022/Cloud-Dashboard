
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useCallback, useMemo } from "react";
import { getHistoricDataFromRTDB, type FetchedMqttRecord } from "@/services/firebase-service";
import { format } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area"; // Keep for content if needed, or remove if chart takes full space
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, DatabaseZapIcon, FilterIcon, SmartphoneIcon, LineChartIcon as GraphIcon } from "lucide-react"; // Added GraphIcon
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartDataPoint {
  timestamp: number; // millisecond timestamp
  timeLabel: string; // Formatted time for X-axis
  [sensorKey: string]: number | string | undefined; // Sensor values
}

const availableChartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))', // Fallback, can add more chart colors to globals.css
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
];

const CustomTooltipContent: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 border rounded-lg shadow-lg bg-popover text-popover-foreground text-xs">
        <p className="font-semibold mb-1">{`Time: ${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={`item-${index}`} style={{ color: pld.stroke }}>
            {`${pld.name}: ${pld.value !== undefined && pld.value !== null ? Number(pld.value).toFixed(2) : 'N/A'}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


export default function HistoricPage() {
  const [historicData, setHistoricData] = useState<FetchedMqttRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStartDate, setCurrentStartDate] = useState<Date | undefined>(undefined);
  const [currentEndDate, setCurrentEndDate] = useState<Date | undefined>(undefined);
  const [deviceSerialFilter, setDeviceSerialFilter] = useState<string>("");

  const [chartDisplayData, setChartDisplayData] = useState<ChartDataPoint[]>([]);
  const [displayableSensorKeys, setDisplayableSensorKeys] = useState<string[]>([]);
  const [uniqueDeviceSerialsInFetchedData, setUniqueDeviceSerialsInFetchedData] = useState<string[]>([]);


  const fetchData = useCallback(async (sDate?: Date, eDate?: Date, deviceSerial?: string) => {
    try {
      setLoading(true);
      setError(null);
      setHistoricData([]); // Clear previous data
      setChartDisplayData([]);
      setDisplayableSensorKeys([]);
      setUniqueDeviceSerialsInFetchedData([]);

      const resolvedData = await getHistoricDataFromRTDB(sDate, eDate, deviceSerial);
      setHistoricData(resolvedData); // This will trigger the useEffect below

    } catch (err: any) {
      console.error("Error fetching historic data from RTDB:", err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (historicData.length > 0) {
      const uniqueSerials = Array.from(new Set(historicData.map(record => record.device_serial)));
      setUniqueDeviceSerialsInFetchedData(uniqueSerials);

      const canGraphSingleDevice = deviceSerialFilter.trim() !== "" || uniqueSerials.length === 1;

      if (canGraphSingleDevice) {
        const dataToChart = deviceSerialFilter.trim()
          ? historicData.filter(d => d.device_serial === deviceSerialFilter.trim())
          : historicData; 

        const sortedData = [...dataToChart].sort((a, b) => a.timestamp - b.timestamp);

        const keys = new Set<string>();
        const formattedForChart: ChartDataPoint[] = sortedData.map(record => {
          const chartPoint: ChartDataPoint = {
            timestamp: record.timestamp * 1000, 
            timeLabel: format(new Date(record.timestamp * 1000), 'MMM d, HH:mm'), // Updated format
          };
          Object.keys(record).forEach(key => {
            if (!['id', 'timestamp', 'device_serial', 'timeLabel'].includes(key) && typeof record[key as keyof FetchedMqttRecord] === 'number') {
              keys.add(key);
              chartPoint[key] = record[key as keyof FetchedMqttRecord] as number;
            }
          });
          return chartPoint;
        });
        setChartDisplayData(formattedForChart);
        setDisplayableSensorKeys(Array.from(keys).sort());
      } else {
        setChartDisplayData([]);
        setDisplayableSensorKeys([]);
      }
    } else {
      setChartDisplayData([]);
      setDisplayableSensorKeys([]);
      setUniqueDeviceSerialsInFetchedData([]);
    }
  }, [historicData, deviceSerialFilter]);


  const handleFetchFilteredData = () => {
    fetchData(currentStartDate, currentEndDate, deviceSerialFilter.trim() || undefined);
  };

  const handleFetchAllData = () => {
    setCurrentStartDate(undefined);
    setCurrentEndDate(undefined);
    setDeviceSerialFilter("");
    fetchData(undefined, undefined, undefined);
  };

  const canDisplayGraph = chartDisplayData.length > 0 && displayableSensorKeys.length > 0;
  const showMultiDeviceMessage = !deviceSerialFilter.trim() && uniqueDeviceSerialsInFetchedData.length > 1 && !loading && !error;

  return (
    <main className="flex-grow container mx-auto p-4 md:p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraphIcon className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Historic MQTT Data Graph (Realtime DB)</CardTitle>
          </div>
          <CardDescription>
            Visualize historic data. Filter by date range and/or device serial.
            {uniqueDeviceSerialsInFetchedData.length > 1 && !deviceSerialFilter.trim() && (
              <span className="block mt-1 text-sm text-amber-600 dark:text-amber-400">
                Data for multiple devices found. Graph will show combined data or be empty. Please filter by a specific Device Serial for a clearer individual graph.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-end flex-wrap">
            <div className="grid w-full sm:w-auto max-w-xs items-center gap-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !currentStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentStartDate ? format(currentStartDate, "PPP") : <span>Pick a start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card">
                  <Calendar
                    mode="single"
                    selected={currentStartDate}
                    onSelect={setCurrentStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid w-full sm:w-auto max-w-xs items-center gap-1.5">
              <Label htmlFor="endDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="endDate"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !currentEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentEndDate ? format(currentEndDate, "PPP") : <span>Pick an end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card">
                  <Calendar
                    mode="single"
                    selected={currentEndDate}
                    onSelect={setCurrentEndDate}
                    disabled={(date) =>
                      currentStartDate ? date < currentStartDate : false
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid w-full sm:w-auto max-w-xs items-center gap-1.5">
              <Label htmlFor="deviceSerial">Device Serial (Optional)</Label>
              <div className="relative">
                <SmartphoneIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deviceSerial"
                  type="text"
                  placeholder="Enter device serial..."
                  value={deviceSerialFilter}
                  onChange={(e) => setDeviceSerialFilter(e.target.value)}
                  className="pl-8 text-card-foreground bg-card border-border focus:ring-ring"
                />
              </div>
            </div>
            <Button onClick={handleFetchFilteredData} disabled={loading} className="w-full sm:w-auto">
              {loading ? <Icons.Loader className="mr-2" /> : <FilterIcon className="mr-2 h-4 w-4" />}
              {loading ? "Fetching..." : "Apply Filters"}
            </Button>
            <Button onClick={handleFetchAllData} disabled={loading} className="w-full sm:w-auto" variant="secondary">
              {loading ? <Icons.Loader className="mr-2" /> : <DatabaseZapIcon className="mr-2 h-4 w-4" />}
              {loading ? "Fetching All..." : "Fetch All Data"}
            </Button>
          </div>

          {loading && <p className="text-muted-foreground text-center py-4">Loading historic data...</p>}
          {error && <p className="text-destructive text-center py-4">{error}</p>}

          {!loading && !error && showMultiDeviceMessage && (
            <p className="text-muted-foreground text-center py-4">
              Data from multiple devices detected. Please filter by a specific Device Serial to display its graph.
            </p>
          )}
          
          {!loading && !error && !showMultiDeviceMessage && !canDisplayGraph && (
             <p className="text-muted-foreground text-center py-4">
              {(currentStartDate || currentEndDate || deviceSerialFilter.trim())
                ? `No historic data found for device "${deviceSerialFilter.trim() || 'any single device'}" with the selected date range. Ensure the device serial is correct (case-sensitive) and data exists.`
                : "No historic data available to graph. Check if devices are sending data or adjust filters."}
            </p>
          )}

          {!loading && !error && !showMultiDeviceMessage && canDisplayGraph && (
            <div className="h-[600px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartDisplayData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 20, 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="timeLabel"
                    stroke="hsl(var(--card-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    angle={-30} 
                    textAnchor="end" 
                    interval="preserveStartEnd" 
                  />
                  <YAxis
                    stroke="hsl(var(--card-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => typeof value === 'number' ? value.toFixed(1) : value}
                  />
                  <Tooltip content={<CustomTooltipContent />} cursor={{fill: 'hsl(var(--accent) / 0.2)'}}/>
                  <Legend wrapperStyle={{paddingTop: '20px'}}/>
                  {displayableSensorKeys.map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={key} 
                      stroke={availableChartColors[index % availableChartColors.length]}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false} 
                      connectNulls={true} 
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

    

    