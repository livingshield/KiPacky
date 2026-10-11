import { AttendanceStatusResponse, ClockResponse } from '../types';

export interface OfflineQueueItem {
  id: string;
  type: 'clock' | 'production';
  pinCode: string;
  employeeName?: string;
  offlineTimestamp: string; // ISO string
  eventType?: 'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd';
  orderId?: number;
  operationId?: number;
  submittedPieces?: number;
  note?: string;
  createdAt: number;
}

const QUEUE_KEY = 'kipacky_offline_queue_v1';
const CACHE_KEY = 'kipacky_cached_profiles_v1';

// Odběratelé změn fronty pro živý update UI
type QueueListener = (items: OfflineQueueItem[]) => void;
const listeners: Set<QueueListener> = new Set();

export function subscribeOfflineQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  listener(getOfflineQueue());
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  const current = getOfflineQueue();
  listeners.forEach((l) => l(current));
}

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Chyba při čtení offline fronty z localStorage:', err);
    return [];
  }
}

export function addToOfflineQueue(
  item: Omit<OfflineQueueItem, 'id' | 'createdAt'>
): OfflineQueueItem {
  const queue = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    ...item,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
  };
  queue.push(newItem);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Chyba při ukládání do offline fronty:', err);
  }
  notifyListeners();
  return newItem;
}

export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Chyba při odstraňování z offline fronty:', err);
  }
  notifyListeners();
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (err) {
    console.error('Chyba při mazání offline fronty:', err);
  }
  notifyListeners();
}

// ==========================================
// CACHE PROFILŮ ZAMĚSTNANCŮ PRO OFFLINE KIOSK
// ==========================================

export function cacheEmployeeProfile(
  pinCode: string,
  profile: AttendanceStatusResponse
): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const map: Record<string, AttendanceStatusResponse> = raw ? JSON.parse(raw) : {};
    map[pinCode] = profile;
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Chyba při ukládání profilu do cache:', err);
  }
}

export function getCachedEmployeeProfile(
  pinCode: string
): AttendanceStatusResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const map: Record<string, AttendanceStatusResponse> = JSON.parse(raw);
    return map[pinCode] || null;
  } catch (err) {
    console.error('Chyba při čtení profilu z cache:', err);
    return null;
  }
}

// ==========================================
// SYNCHRONIZACE OFFLINE FRONTY NA SERVER
// ==========================================

export async function processOfflineQueue(
  clockFn: (
    pinCode: string,
    eventType: 'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd',
    offlineTimestamp?: string
  ) => Promise<ClockResponse>,
  prodFn: (data: {
    pinCode: string;
    orderId: number;
    operationId: number;
    submittedPieces: number;
    offlineTimestamp?: string;
  }) => Promise<ClockResponse>
): Promise<{ syncedCount: number; errors: string[] }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'clock' && item.eventType) {
        await clockFn(item.pinCode, item.eventType, item.offlineTimestamp);
        removeFromOfflineQueue(item.id);
        syncedCount++;
      } else if (item.type === 'production' && item.orderId && item.operationId && item.submittedPieces) {
        await prodFn({
          pinCode: item.pinCode,
          orderId: item.orderId,
          operationId: item.operationId,
          submittedPieces: item.submittedPieces,
          offlineTimestamp: item.offlineTimestamp,
        });
        removeFromOfflineQueue(item.id);
        syncedCount++;
      }
    } catch (err: any) {
      console.warn(`Nepodařilo se synchronizovat položku ${item.id}:`, err);
      // Pokud server vrátil duplikát (např. 409), považujeme za vyřešeno a odstraníme z fronty
      if (err.message && err.message.includes('již byl zaznamenán')) {
        removeFromOfflineQueue(item.id);
        syncedCount++;
      } else {
        errors.push(err.message || 'Chyba při odesílání');
      }
    }
  }

  return { syncedCount, errors };
}
