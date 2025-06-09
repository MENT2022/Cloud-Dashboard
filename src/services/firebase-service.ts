
import { rtdb } from '@/lib/firebase'; 
import { ref, query, orderByChild, startAt, endAt, get, DataSnapshot, Query, type QueryConstraint } from 'firebase/database';

// Structure of data stored in Realtime Database under device_readings/$deviceSerialId/$readingId
interface RealtimeDBReadingData {
  timestamp: number; // Stored as seconds since epoch
  tftvalue: Record<string, number>; 
}

// Structure for data fetched and displayed on the historic page
export interface FetchedMqttRecord {
  id: string; 
  device_serial: string; 
  timestamp: number; // Stored and retrieved as seconds since epoch
  [sensorKey: string]: number | string | undefined; // Sensor readings like S1_L1, S2_L2 etc.
}

export async function getHistoricDataFromRTDB(sDate?: Date, eDate?: Date, deviceSerialFilter?: string): Promise<FetchedMqttRecord[]> {
  if (!rtdb) {
    console.error('[RTDB Service] FirebaseServiceError: Realtime Database instance is not available for fetching.');
    throw new Error('RealtimeDBNotInitialized: Database instance is null for fetching.');
  }
  
  const requestDetails = {
    sDate: sDate ? sDate.toISOString() : 'undefined',
    sDateTimestampSeconds: sDate ? Math.floor(sDate.getTime() / 1000) : 'undefined',
    eDate: eDate ? eDate.toISOString() : 'undefined',
    eDateTimestampSeconds: eDate ? Math.floor(new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate(), 23, 59, 59, 999).getTime() / 1000) : 'undefined',
    deviceSerialFilter: deviceSerialFilter || 'undefined',
  };
  console.log(`[RTDB Service] getHistoricDataFromRTDB called with:`, requestDetails);


  const allReadings: FetchedMqttRecord[] = [];
  
  const processDeviceReadings = async (deviceSerial: string, pSDate?: Date, pEDate?: Date) => {
    console.log(`[RTDB Service] processDeviceReadings for device: '${deviceSerial}', sDate: ${pSDate ? pSDate.toISOString() : 'undefined'}, eDate: ${pEDate ? pEDate.toISOString() : 'undefined'}`);
    const queryConstraints: QueryConstraint[] = [orderByChild('timestamp')];
    
    // Convert JS Date (milliseconds) to seconds for RTDB query
    const startTimestampSeconds = pSDate ? Math.floor(pSDate.getTime() / 1000) : null; 
    const endTimestampSeconds = pEDate ? Math.floor(new Date(pEDate.getFullYear(), pEDate.getMonth(), pEDate.getDate(), 23, 59, 59, 999).getTime() / 1000) : null;

    if (startTimestampSeconds) {
      queryConstraints.push(startAt(startTimestampSeconds));
      console.log(`[RTDB Service] Applying startAt: ${startTimestampSeconds} for device: ${deviceSerial}`);
    }
    if (endTimestampSeconds) {
      queryConstraints.push(endAt(endTimestampSeconds));
      console.log(`[RTDB Service] Applying endAt: ${endTimestampSeconds} for device: ${deviceSerial}`);
    }
    
    if (!rtdb) {
      throw new Error('Firebase Realtime Database not initialized');
    }
    const readingsQuery: Query = query(ref(rtdb, `device_readings/${deviceSerial}`), ...queryConstraints);
    
    try {
      const readingsSnapshot = await get(readingsQuery);
      if (readingsSnapshot.exists()) {
        console.log(`[RTDB Service] Data found for device: '${deviceSerial}' with current filters. Count: ${readingsSnapshot.size}`);
        readingsSnapshot.forEach((readingSnapshot: DataSnapshot) => {
          const readingId = readingSnapshot.key;
          const readingData = readingSnapshot.val() as RealtimeDBReadingData; 

          if (readingId && readingData && typeof readingData.timestamp === 'number' && readingData.tftvalue) {
            allReadings.push({
              id: readingId,
              device_serial: deviceSerial,
              timestamp: readingData.timestamp, // Store as is (seconds)
              ...readingData.tftvalue,
            });
          } else {
            // console.warn(`[RTDB Service] Invalid reading data structure for readingId: ${readingId} under device: ${deviceSerial}`, readingData);
          }
        });
      } else {
        console.log(`[RTDB Service] No data found for device: '${deviceSerial}' with current filters.`);
      }
    } catch (queryError) {
        console.error(`[RTDB Service] Error querying readings for device ${deviceSerial}:`, queryError);
        if (queryError instanceof Error && queryError.message.includes("Index not defined")) {
            throw new Error(`Database Index Error for ${deviceSerial}: ${queryError.message}. Ensure 'timestamp' is indexed under 'device_readings/${deviceSerial}/.indexOn'.`);
        }
        throw queryError;
    }
  };

  try {
    if (deviceSerialFilter && deviceSerialFilter.trim() !== "") {
      console.log(`[RTDB Service] Filtering for specific device: '${deviceSerialFilter.trim()}'`);
      await processDeviceReadings(deviceSerialFilter.trim(), sDate, eDate);
    } else {
      console.log("[RTDB Service] Fetching for all devices (date filters may apply).");
      const devicesRef = ref(rtdb, 'device_readings');
      const devicesSnapshot = await get(devicesRef);
      if (devicesSnapshot.exists()) {
        const deviceKeysFound: string[] = [];
        devicesSnapshot.forEach((ds: DataSnapshot) => { if(ds.key) deviceKeysFound.push(ds.key); });
        console.log("[RTDB Service] Device keys found under 'device_readings':", deviceKeysFound.join(', ') || "None");
        
        const fetchPromises: Promise<void>[] = [];
        devicesSnapshot.forEach((deviceSnapshot: DataSnapshot) => {
          const currentDeviceSerial = deviceSnapshot.key;
          if (currentDeviceSerial) {
            // console.log(`[RTDB Service] Adding device to process queue: '${currentDeviceSerial}' with date filters.`);
            fetchPromises.push(processDeviceReadings(currentDeviceSerial, sDate, eDate));
          }
        });
        await Promise.all(fetchPromises);
      } else {
        console.log("[RTDB Service] No devices found under 'device_readings' path.");
      }
    }
  } catch (error) {
    console.error('[RTDB Service] FirebaseServiceError: Error fetching historic data from Realtime Database:', error);
    if (error instanceof Error && error.message.includes("Index not defined")) {
        throw new Error(`Database Index Error: ${error.message}. Please ensure 'timestamp' is indexed correctly for all relevant device paths.`);
    }
    throw error; 
  }

  allReadings.sort((a, b) => b.timestamp - a.timestamp); // Sort descending by timestamp (seconds)
  console.log(`[RTDB Service] Returning ${allReadings.length} total records after processing all devices/filters.`);
  return allReadings;
}
