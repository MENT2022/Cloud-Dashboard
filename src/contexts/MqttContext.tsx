
"use client";

import type { MqttClient, IClientOptions, IPublishPacket } from 'mqtt';
export type MqttConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { ConnectFormValues } from "@/components/mqtt-connect-form";

const MAX_DATA_POINTS = 200;
const TFT_REQUEST_TOPIC = "/TFT/Request"; 
const TFT_RESPONSE_TOPIC = "/TFT/Response";
const CPU_REQUEST_TOPIC = "/CPU/Request";
const CPU_RESPONSE_TOPIC = "/CPU/Response";
const MAX_REQUEST_TOPIC = "/MAX/Request";
const MAX_RESPONSE_TOPIC = "/MAX/Response";
const MIN_REQUEST_TOPIC = "/MIN/Request";
const MIN_RESPONSE_TOPIC = "/MIN/Response";
const TFT_NAME_REQUEST_TOPIC = "/TFT/NAME/Request";
const TFT_NAME_RESPONSE_TOPIC = "/TFT/NAME/Response";
const ERR_REQUEST_TOPIC = "/ERR/Request";
const ERR_RESPONSE_TOPIC = "/ERR/Response";
const CLR_REQUEST_TOPIC = "/CLR/Request"; 
const FOTA_REQUEST_TOPIC = "/FOTA/Request"; 
const EPDSSM_REQUEST_TOPIC = "/EPDSSM/Request";
const EPD1_REQUEST_TOPIC = "/EPD1/Request";
const EPD1_RESPONSE_TOPIC = "/EPD1/Response";
const DATA_POLLING_INTERVAL_MS = 60000; 


export interface DataPoint {
  timestamp: number;
  deviceSerial: string;
  values: Record<string, number>;
}

export interface DeviceInfo {
  mqttUser?: string;
  firmwareVersion?: string;
  timeActive?: string;
  resetReason?: string;
  rtcTemperature?: string;
  restarts?: string;
  ramAvailable?: string;
  lastUpdate?: number;
}

interface CpuResponseMessage {
  device_serial: string;
  mqtt_user?: string;
  device_fw_version?: string;
  device_time_active?: string;
  device_reset_reason?: string;
  rtc_temperature?: string;
  device_restart?: string;
  device_ram_available?: string;
}

export interface MaxValueInfo {
  [sensorKey: string]: number;
}

interface MaxResponseMessage {
  device_serial: string;
  maxvalue: {
    [key: string]: string;
  };
}

export interface MinValueInfo {
  [sensorKey: string]: number;
}

interface MinResponseMessage {
  device_serial: string;
  minValue: { 
    [key: string]: string;
  };
  minvalue?: { 
    [key: string]: string;
  };
}


export interface TftNamesInfo {
  lastUpdate?: number;
  [sensorKey: string]: string | number | undefined;
}

interface TftNameResponseMessage {
  device_serial: string;
  tft_names: Omit<TftNamesInfo, 'lastUpdate'>;
}

export interface DeviceStatus {
  errorFlags?: number;
  warningFlags?: number;
  lastUpdate?: number;
}

interface ErrResponseMessage {
  device_serial: string;
  errorFlags: string; 
  warningFlags: string; 
}

export interface DeviceEpdInfo { 
  epd_1_restart?: string;
  epd_1_reset_reason?: string;
  epd_1_sw_reset_reason?: string;
  epd_1_time_active?: string;
  lastUpdate?: number;
}

interface Epd1ResponseMessage { 
  device_serial: string;
  epd_1_restart?: string;
  epd_1_reset_reason?: string;
  epd_1_sw_reset_reason?: string;
  epd_1_time_active?: string;
}


interface MqttContextType {
  mqttClient: MqttClient | null;
  connectionStatus: MqttConnectionStatus;
  dataPoints: DataPoint[];
  deviceInfoMap: Record<string, DeviceInfo>;
  maxValueMap: Record<string, MaxValueInfo>;
  minValueMap: Record<string, MinValueInfo>;
  tftNamesMap: Record<string, TftNamesInfo>;
  deviceStatusMap: Record<string, DeviceStatus>;
  deviceEpdInfoMap: Record<string, DeviceEpdInfo>;
  connectMqtt: (values: ConnectFormValues) => Promise<void>;
  disconnectMqtt: () => void;
  requestDeviceMaxValues: (deviceSerial: string) => void;
  requestDeviceMinValues: (deviceSerial: string) => void;
  requestAllCpuInfo: () => void;
  requestAllTftNames: () => void;
  requestAllErrorFlags: () => void;
  requestAllEpdInfo: () => void;
  sendClearRequest: () => void;
  sendFotaRequest: () => void;
  sendEpModeSettingRequest: () => void;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export const MqttProvider = ({ children }: { children: ReactNode }) => {
  const [mqttClient, setMqttClient] = useState<MqttClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<MqttConnectionStatus>("disconnected");
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [deviceInfoMap, setDeviceInfoMap] = useState<Record<string, DeviceInfo>>({});
  const [maxValueMap, setMaxValueMap] = useState<Record<string, MaxValueInfo>>({});
  const [minValueMap, setMinValueMap] = useState<Record<string, MinValueInfo>>({});
  const [tftNamesMap, setTftNamesMap] = useState<Record<string, TftNamesInfo>>({});
  const [deviceStatusMap, setDeviceStatusMap] = useState<Record<string, DeviceStatus>>({});
  const [deviceEpdInfoMap, setDeviceEpdInfoMap] = useState<Record<string, DeviceEpdInfo>>({});
  const { toast } = useToast();

  const mqttModuleRef = useRef<typeof import('mqtt') | null>(null);
  const connectionStatusRef = useRef(connectionStatus);
  const isManuallyDisconnectingRef = useRef<boolean>(false);
  const dataPollingIntervalRef = useRef<NodeJS.Timeout | null>(null); 

  useEffect(() => {
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  useEffect(() => {
    let isMounted = true;
    import('mqtt')
      .then(module => {
        if (isMounted) {
          if (module && typeof module.connect === 'function') {
            mqttModuleRef.current = module;
          } else if (module && module.default && typeof (module.default as any).connect === 'function') {
            mqttModuleRef.current = module.default as typeof import('mqtt');
          } else {
            console.error("MQTT module loaded, but 'connect' function not found in expected locations.", module);
            toast({ title: "MQTT Error", description: "Could not initialize MQTT 'connect' function.", variant: "destructive" });
          }
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error("Error importing MQTT module:", err);
          toast({ title: "MQTT Error", description: `Failed to load MQTT library: ${err.message}`, variant: "destructive" });
        }
      });
    return () => { isMounted = false; };
  }, [toast]);

  const clearDataPollingInterval = useCallback(() => {
    if (dataPollingIntervalRef.current) {
      clearInterval(dataPollingIntervalRef.current);
      dataPollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (mqttClient) {
        isManuallyDisconnectingRef.current = true;
        clearDataPollingInterval(); 
        mqttClient.end(true);
      }
    };
  }, [mqttClient, clearDataPollingInterval]);

  const connectMqtt = useCallback(async ({ brokerUrl, username, password }: ConnectFormValues) => {
    if (!mqttModuleRef.current) {
      toast({ title: "MQTT Error", description: "MQTT library not loaded yet. Please wait and try again.", variant: "destructive" });
      return;
    }
    if (typeof mqttModuleRef.current.connect !== 'function') {
      toast({ title: "MQTT Error", description: "MQTT 'connect' method is not available.", variant: "destructive" });
      return;
    }

    if (mqttClient && mqttClient.connected) {
      isManuallyDisconnectingRef.current = true;
      clearDataPollingInterval();
      await new Promise<void>((resolve) => {
        mqttClient.end(true, {}, () => resolve());
      });
      isManuallyDisconnectingRef.current = false;
    }
    setMqttClient(null);

    setConnectionStatus("connecting");
    setDataPoints([]);
    setDeviceInfoMap({});
    setMaxValueMap({});
    setMinValueMap({});
    setTftNamesMap({});
    setDeviceStatusMap({});
    setDeviceEpdInfoMap({});
    isManuallyDisconnectingRef.current = false;

    console.log(`[MQTT Context] Attempting to connect with:
    Broker URL: ${brokerUrl}
    Username: ${username || "(none)"}
    Password Provided: ${password ? "Yes" : "No"}`);

    const connectOptions: IClientOptions = {
      keepalive: 60,
      reconnectPeriod: 1000,
      connectTimeout: 20 * 1000,
      clean: true,
      protocolVersion: 4,
      username: username,
      password: password,
      clientId: `mqtt_visualizer_${Math.random().toString(16).substr(2, 8)}`
    };

    try {
      const client = mqttModuleRef.current.connect(brokerUrl, connectOptions);
      setMqttClient(client);

      client.on("connect", () => {
        if (connectionStatusRef.current !== "connected") {
          setConnectionStatus("connected");
          toast({ title: "MQTT Status", description: `Connected to ${brokerUrl}` });
        }

        const topicsToSubscribe = [
            { topic: TFT_RESPONSE_TOPIC, qos: 0 },
            { topic: CPU_RESPONSE_TOPIC, qos: 0 },
            { topic: TFT_NAME_RESPONSE_TOPIC, qos: 0 },
            { topic: MAX_RESPONSE_TOPIC, qos: 0 },
            { topic: MIN_RESPONSE_TOPIC, qos: 0 },
            { topic: ERR_RESPONSE_TOPIC, qos: 0 },
            { topic: EPD1_RESPONSE_TOPIC, qos: 0 },
        ];

        topicsToSubscribe.forEach(sub => {
            client.subscribe(sub.topic, { qos: sub.qos as 0 | 1 | 2}, (err) => {
                if (err) {
                    console.error(`MQTT Subscription Error (${sub.topic}):`, err);
                    toast({ title: "Subscription Error", description: `Failed to subscribe to ${sub.topic}: ${err.message}`, variant: "destructive" });
                    if (sub.topic === TFT_RESPONSE_TOPIC) { 
                      setConnectionStatus("error");
                      client.end(true);
                    }
                }
            });
        });
        
        client.publish(CPU_REQUEST_TOPIC, JSON.stringify({ "get_info": true }), { qos: 0, retain: false }, (pubErr) => {
          if (pubErr) console.error(`Failed to publish to ${CPU_REQUEST_TOPIC}:`, pubErr);
        });
        client.publish(TFT_NAME_REQUEST_TOPIC, JSON.stringify({ "get_tft_names": true }), { qos: 0, retain: false }, (pubErr) => {
          if (pubErr) console.error(`Failed to publish to ${TFT_NAME_REQUEST_TOPIC}:`, pubErr);
        });
         client.publish(ERR_REQUEST_TOPIC, JSON.stringify({ "get_status": true }), { qos: 0, retain: false }, (pubErr) => {
            if (pubErr) console.error(`Failed to publish initial to ${ERR_REQUEST_TOPIC}:`, pubErr);
        });
        client.publish(EPD1_REQUEST_TOPIC, JSON.stringify({ "get_epd_info": true }), { qos: 0, retain: false }, (pubErr) => {
            if (pubErr) console.error(`Failed to publish initial to ${EPD1_REQUEST_TOPIC}:`, pubErr);
        });


        clearDataPollingInterval(); 
        client.publish(TFT_REQUEST_TOPIC, "1", { qos: 0, retain: false }, (pubErr) => { 
            if (pubErr) console.error(`Failed to publish initial to ${TFT_REQUEST_TOPIC}:`, pubErr);
        });
        dataPollingIntervalRef.current = setInterval(() => {
          if (client && client.connected) {
            client.publish(TFT_REQUEST_TOPIC, "1", { qos: 0, retain: false }, (pubErr) => {
              if (pubErr) console.error(`Failed to publish to ${TFT_REQUEST_TOPIC} during poll:`, pubErr);
            });
          } else {
            clearDataPollingInterval(); 
          }
        }, DATA_POLLING_INTERVAL_MS);
      });

      client.on("message", async (topic: string, payload: Buffer, _packet: IPublishPacket) => {
        const messageStr = payload.toString();
        let jsonData: any;

        try {
            switch (topic) {
                case TFT_RESPONSE_TOPIC:
                    jsonData = JSON.parse(messageStr);
                    const deviceSerial = jsonData?.device_serial;
                    if (jsonData && typeof deviceSerial === 'string' && typeof jsonData.tftvalue === 'object' && jsonData.tftvalue !== null) {
                        const sensorValues: Record<string, number> = {};
                        let hasNumericValue = false;
                        for (const key in jsonData.tftvalue) {
                            if (Object.prototype.hasOwnProperty.call(jsonData.tftvalue, key)) {
                                const numericValue = parseFloat(String(jsonData.tftvalue[key]));
                                if (!isNaN(numericValue)) {
                                    sensorValues[key] = numericValue;
                                    hasNumericValue = true;
                                }
                            }
                        }
                        if (hasNumericValue) {
                            setDataPoints((prevData) => {
                                const newDataPoint: DataPoint = {
                                    timestamp: Date.now(),
                                    deviceSerial: deviceSerial,
                                    values: sensorValues
                                };
                                const deviceSpecificData = prevData.filter(p => p.deviceSerial === deviceSerial);
                                const otherDevicesData = prevData.filter(p => p.deviceSerial !== deviceSerial);
                                const updatedDeviceData = [...deviceSpecificData, newDataPoint];
                                const finalDeviceData = updatedDeviceData.length > MAX_DATA_POINTS
                                                        ? updatedDeviceData.slice(-MAX_DATA_POINTS)
                                                        : updatedDeviceData;
                                return [...otherDevicesData, ...finalDeviceData].sort((a,b) => a.deviceSerial.localeCompare(b.deviceSerial));
                            });
                        }
                    }
                    break;
                case CPU_RESPONSE_TOPIC:
                    const cpuData = JSON.parse(messageStr) as CpuResponseMessage;
                    if (cpuData && typeof cpuData.device_serial === 'string') {
                        setDeviceInfoMap(prevMap => ({
                            ...prevMap,
                            [cpuData.device_serial]: {
                                mqttUser: cpuData.mqtt_user,
                                firmwareVersion: cpuData.device_fw_version,
                                timeActive: cpuData.device_time_active,
                                resetReason: cpuData.device_reset_reason,
                                rtcTemperature: cpuData.rtc_temperature,
                                restarts: cpuData.device_restart,
                                ramAvailable: cpuData.device_ram_available,
                                lastUpdate: Date.now()
                            }
                        }));
                    }
                    break;
                case MAX_RESPONSE_TOPIC:
                    const maxData = JSON.parse(messageStr) as MaxResponseMessage;
                    if (maxData && typeof maxData.device_serial === 'string' && typeof maxData.maxvalue === 'object') {
                        const numericMaxValues: MaxValueInfo = {};
                        for (const key in maxData.maxvalue) {
                            if (Object.prototype.hasOwnProperty.call(maxData.maxvalue, key)) {
                                const numValue = parseFloat(maxData.maxvalue[key]);
                                if (!isNaN(numValue)) numericMaxValues[key] = numValue;
                            }
                        }
                        setMaxValueMap(prevMap => ({ ...prevMap, [maxData.device_serial]: numericMaxValues }));
                    }
                    break;
                case MIN_RESPONSE_TOPIC:
                    const minData = JSON.parse(messageStr) as MinResponseMessage;
                    const valueKey = Object.keys(minData).find(k => k.toLowerCase() === 'minvalue') as keyof MinResponseMessage | undefined;
                    
                    if (minData && typeof minData.device_serial === 'string' && valueKey && typeof minData[valueKey] === 'object') {
                        const numericMinValues: MinValueInfo = {};
                        const rawMinValues = minData[valueKey] as Record<string, string>;
                        for (const key in rawMinValues) {
                            if (Object.prototype.hasOwnProperty.call(rawMinValues, key)) {
                                const numValue = parseFloat(rawMinValues[key]);
                                if (!isNaN(numValue)) numericMinValues[key] = numValue;
                            }
                        }
                        setMinValueMap(prevMap => ({ ...prevMap, [minData.device_serial]: numericMinValues }));
                    }
                    break;
                case TFT_NAME_RESPONSE_TOPIC:
                    const nameData = JSON.parse(messageStr) as TftNameResponseMessage;
                    if (nameData && typeof nameData.device_serial === 'string' && typeof nameData.tft_names === 'object') {
                        setTftNamesMap(prevMap => ({ 
                            ...prevMap, 
                            [nameData.device_serial]: {
                                ...nameData.tft_names,
                                lastUpdate: Date.now()
                            } 
                        }));
                    }
                    break;
                case ERR_RESPONSE_TOPIC:
                    const errData = JSON.parse(messageStr) as ErrResponseMessage;
                    if (errData && typeof errData.device_serial === 'string') {
                        const errorFlagsNum = parseInt(errData.errorFlags, 10);
                        const warningFlagsNum = parseInt(errData.warningFlags, 10);

                        if (!isNaN(errorFlagsNum) && !isNaN(warningFlagsNum)) {
                            setDeviceStatusMap(prevMap => ({
                                ...prevMap,
                                [errData.device_serial]: {
                                    errorFlags: errorFlagsNum,
                                    warningFlags: warningFlagsNum,
                                    lastUpdate: Date.now()
                                }
                            }));
                        } else {
                            console.warn(`${ERR_RESPONSE_TOPIC}: Invalid flag values for ${errData.device_serial}`, errData);
                        }
                    }
                    break;
                case EPD1_RESPONSE_TOPIC:
                    const epdData = JSON.parse(messageStr) as Epd1ResponseMessage;
                    if (epdData && typeof epdData.device_serial === 'string') {
                        setDeviceEpdInfoMap(prevMap => ({
                            ...prevMap,
                            [epdData.device_serial]: {
                                epd_1_restart: epdData.epd_1_restart,
                                epd_1_reset_reason: epdData.epd_1_reset_reason,
                                epd_1_sw_reset_reason: epdData.epd_1_sw_reset_reason,
                                epd_1_time_active: epdData.epd_1_time_active,
                                lastUpdate: Date.now()
                            }
                        }));
                    }
                    break;
            }
        } catch (e) {
            console.warn(`MQTT message payload for topic ${topic} is not valid JSON or parsing failed:`, messageStr, e);
        }
      });

      client.on("error", (err) => {
        if (connectionStatusRef.current !== "error" && !isManuallyDisconnectingRef.current) {
          console.error("MQTT Client Error:", err);
          setConnectionStatus("error");
          const errMessageLower = err.message.toLowerCase();
          if (errMessageLower.includes("not authorized") || errMessageLower.includes("auth") || errMessageLower.includes("credentials") || err.message.includes("connection refused: not authorized")) {
            toast({ title: "MQTT Auth Error", description: "Authorization failed. Please check the MQTT username and password.", variant: "destructive" });
          } else {
            toast({ title: "MQTT Error", description: err.message || "An unknown MQTT error occurred.", variant: "destructive" });
          }
          clearDataPollingInterval();
        }
      });

      client.on("close", () => {
        clearDataPollingInterval();
        if (isManuallyDisconnectingRef.current) {
          if (connectionStatusRef.current !== "disconnected") setConnectionStatus("disconnected");
          return;
        }
        if (connectionStatusRef.current !== "error" && connectionStatusRef.current !== "disconnected") {
          setConnectionStatus("disconnected");
          toast({ title: "MQTT Status", description: "Connection closed.", variant: "destructive" });
        }
      });

      client.on('offline', () => {
        if (connectionStatusRef.current === "connected" && !isManuallyDisconnectingRef.current) {
          setConnectionStatus("disconnected"); 
          toast({ title: "MQTT Status", description: "Broker is offline. Polling paused.", variant: "destructive" });
          clearDataPollingInterval();
        }
      });

      client.on('reconnect', () => {
        if (!isManuallyDisconnectingRef.current && connectionStatusRef.current !== "connecting") {
          setConnectionStatus("connecting");
        }
      });

    } catch (error: any) {
      console.error("MQTT Connection Setup Error:", error);
      if (connectionStatusRef.current !== "error") {
        setConnectionStatus("error");
        toast({ title: "Connection Failed", description: error.message || "Unknown error during connection setup.", variant: "destructive" });
      }
      if (mqttClient && mqttClient.end) {
        mqttClient.end(true);
      }
      setMqttClient(null);
      clearDataPollingInterval();
    }
  }, [toast, mqttClient, clearDataPollingInterval]);

  const disconnectMqtt = useCallback(async () => {
    clearDataPollingInterval(); 
    if (mqttClient) {
      isManuallyDisconnectingRef.current = true;
      await new Promise<void>((resolve) => {
        mqttClient.end(true, {}, () => {
          resolve();
        });
      });
      toast({ title: "MQTT Status", description: "Disconnected by user." });
      setConnectionStatus("disconnected");
      setMqttClient(null);
      setDataPoints([]);
      setDeviceInfoMap({});
      setMaxValueMap({});
      setMinValueMap({});
      setTftNamesMap({});
      setDeviceStatusMap({});
      setDeviceEpdInfoMap({});
      isManuallyDisconnectingRef.current = false;
    } else {
      if (connectionStatus !== "disconnected") setConnectionStatus("disconnected");
    }
  }, [mqttClient, toast, connectionStatus, clearDataPollingInterval]);

  const requestDeviceMaxValues = useCallback((deviceSerial: string) => {
    if (mqttClient && mqttClient.connected) {
      const payload = JSON.stringify({ "get_max_values": true, "device_serial": deviceSerial });
      mqttClient.publish(MAX_REQUEST_TOPIC, payload, { qos: 0, retain: false }, (err) => {
        if (err) toast({ title: "Request Error", description: `Failed to request max values for ${deviceSerial}.`, variant: "destructive"});
      });
    } else {
      toast({ title: "MQTT Not Connected", description: "Cannot request max values.", variant: "destructive"});
    }
  }, [mqttClient, toast]);

  const requestDeviceMinValues = useCallback((deviceSerial: string) => {
    if (mqttClient && mqttClient.connected) {
      const payload = JSON.stringify({ "get_min_values": true, "device_serial": deviceSerial });
      mqttClient.publish(MIN_REQUEST_TOPIC, payload, { qos: 0, retain: false }, (err) => {
        if (err) toast({ title: "Request Error", description: `Failed to request min values for ${deviceSerial}.`, variant: "destructive"});
      });
    } else {
      toast({ title: "MQTT Not Connected", description: "Cannot request min values.", variant: "destructive"});
    }
  }, [mqttClient, toast]);

  const requestAllCpuInfo = useCallback(() => {
    if (mqttClient && mqttClient.connected) {
      const genericPayloadCpu = JSON.stringify({ "get_info": true });
      mqttClient.publish(CPU_REQUEST_TOPIC, genericPayloadCpu, { qos: 0, retain: false }, (err) => {
        if (err) {
          console.error(`Failed to publish to ${CPU_REQUEST_TOPIC}:`, err);
          toast({ title: "Request Error", description: `Failed to request Device Info.`, variant: "destructive"});
        } else {
          toast({ title: "Request Sent", description: `Requesting updated Device Info for all devices.`});
        }
      });
    } else {
      toast({ title: "MQTT Not Connected", description: "Cannot request Device Info.", variant: "destructive"});
    }
  }, [mqttClient, toast]);

  const requestAllTftNames = useCallback(() => {
    if (mqttClient && mqttClient.connected) {
      const genericPayloadTftName = JSON.stringify({ "get_tft_names": true });
      mqttClient.publish(TFT_NAME_REQUEST_TOPIC, genericPayloadTftName, { qos: 0, retain: false }, (err) => {
        if (err) {
          console.error(`Failed to publish to ${TFT_NAME_REQUEST_TOPIC}:`, err);
          toast({ title: "Request Error", description: `Failed to request Sensor Names.`, variant: "destructive"});
        } else {
          toast({ title: "Request Sent", description: `Requesting updated Sensor Names for all devices.`});
        }
      });
    } else {
      toast({ title: "MQTT Not Connected", description: "Cannot request Sensor Names.", variant: "destructive"});
    }
  }, [mqttClient, toast]);

  const requestAllErrorFlags = useCallback(() => {
    if (mqttClient && mqttClient.connected) {
      const genericPayloadErr = JSON.stringify({ "get_status": true });
      mqttClient.publish(ERR_REQUEST_TOPIC, genericPayloadErr, { qos: 0, retain: false }, (err) => {
        if (err) {
          console.error(`Failed to publish to ${ERR_REQUEST_TOPIC}:`, err);
          toast({ title: "Request Error", description: `Failed to request Logs (Error/Warning flags).`, variant: "destructive"});
        } else {
          toast({ title: "Request Sent", description: `Requesting updated Logs (Error/Warning flags) for all devices.`});
        }
      });
    } else {
      toast({ title: "MQTT Not Connected", description: "Cannot request Logs.", variant: "destructive"});
    }
  }, [mqttClient, toast]);

  const requestAllEpdInfo = useCallback(() => { 
    if (mqttClient && mqttClient.connected) {
      const payload = JSON.stringify({ "get_epd_info": true });
      mqttClient.publish(EPD1_REQUEST_TOPIC, payload, { qos: 0, retain: false }, (err) => {
        if (err) {
          console.error(`Failed to publish to ${EPD1_REQUEST_TOPIC}:`, err);
          toast({ title: "Request Error", description: `Failed to request EPD Info.`, variant: "destructive"});
        } else {
          toast({ title: "Request Sent", description: `Requesting updated EPD Info for all devices.`});
        }
      });
    } else {
      toast({ title: "MQTT Not Connected", description: "Cannot request EPD Info.", variant: "destructive"});
    }
  }, [mqttClient, toast]);

  const sendClearRequest = useCallback(() => {
    if (mqttClient && mqttClient.connected) {
      const payload = JSON.stringify({ "command": "reset_device_flags" }); 
      mqttClient.publish(CLR_REQUEST_TOPIC, payload, { qos: 0, retain: false }, (err) => {
        if (err) {
          toast({ title: "Reset Request Error", description: "Failed to send reset command.", variant: "destructive" });
        } else {
          toast({ title: "Reset Request Sent", description: "Reset command sent to all devices." });
        }
      });
    } else {
      toast({ title: "MQTT Not Connected", description: "Cannot send reset command.", variant: "destructive" });
    }
  }, [mqttClient, toast]);

  const sendFotaRequest = useCallback(() => {
    if (mqttClient && mqttClient.connected) {
      const payload = JSON.stringify({ "command": "start_fota_update" });
      mqttClient.publish(FOTA_REQUEST_TOPIC, payload, { qos: 0, retain: false }, (err) => {
        if (err) {
          toast({ title: "FOTA Request Error", description: "Failed to send software update command.", variant: "destructive" });
        } else {
          toast({ title: "FOTA Request Sent", description: "Software update command sent to all devices." });
        }
      });
    } else {
      toast({ title: "MQTT Not Connected", description: "Cannot send software update command.", variant: "destructive" });
    }
  }, [mqttClient, toast]);

  const sendEpModeSettingRequest = useCallback(() => {
    if (mqttClient && mqttClient.connected) {
      const payload = JSON.stringify({ "command": "set_epd_mode" });
      mqttClient.publish(EPDSSM_REQUEST_TOPIC, payload, { qos: 0, retain: false }, (err) => {
        if (err) {
          toast({ title: "EPD Mode Request Error", description: "Failed to send EPD mode setting command.", variant: "destructive" });
        } else {
          toast({ title: "EPD Mode Request Sent", description: "EPD mode setting command sent to all devices." });
        }
      });
    } else {
      toast({ title: "MQTT Not Connected", description: "Cannot send EPD mode setting command.", variant: "destructive" });
    }
  }, [mqttClient, toast]);


  return (
    <MqttContext.Provider value={{
      mqttClient,
      connectionStatus,
      dataPoints,
      deviceInfoMap,
      maxValueMap,
      minValueMap,
      tftNamesMap,
      deviceStatusMap,
      deviceEpdInfoMap,
      connectMqtt,
      disconnectMqtt,
      requestDeviceMaxValues,
      requestDeviceMinValues,
      requestAllCpuInfo,
      requestAllTftNames,
      requestAllErrorFlags,
      requestAllEpdInfo,
      sendClearRequest,
      sendFotaRequest,
      sendEpModeSettingRequest,
    }}>
      {children}
    </MqttContext.Provider>
  );
};

export const useMqtt = (): MqttContextType => {
  const context = useContext(MqttContext);
  if (context === undefined) {
    throw new Error('useMqtt must be used within a MqttProvider');
  }
  return context;
};

