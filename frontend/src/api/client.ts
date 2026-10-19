import {
  AttendanceStatusResponse,
  ClockResponse,
  Employee,
  AttendanceLogItem,
  MonthlyReportResult,
  OrderItem,
  OperationItem,
  OrderDetailResult,
  ProductionLogItem,
  DocumentItem,
  DocumentConsentItem,
  PlannedShiftItem,
  OrderMaterialItem,
  MaterialDispatchItem,
} from '../types';

const API_BASE = './api.ashx';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('kipacky_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['X-Kipacky-Auth'] = token;
  }
  return headers;
}

import {
  cacheEmployeeProfile,
  getCachedEmployeeProfile,
} from '../utils/offlineQueue';

// ==========================================
// KIOSK API
// ==========================================

export async function verifyPin(pinCode: string): Promise<AttendanceStatusResponse> {
  try {
    const res = await fetch(`${API_BASE}?action=verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Neplatný PIN');
    }
    const data: AttendanceStatusResponse = await res.json();
    cacheEmployeeProfile(pinCode, data);
    return data;
  } catch (err: any) {
    // Pokud jsme offline nebo síť selhala, zkusíme načíst z lokální cache
    if (!navigator.onLine || err.name === 'TypeError' || err.message?.includes('fetch')) {
      const cached = getCachedEmployeeProfile(pinCode);
      if (cached) {
        return cached;
      }
      if (/^\d{4}$/.test(pinCode)) {
        return {
          employeeId: 0,
          fullName: `Brigádník (PIN ${pinCode})`,
          contractType: 'DPP',
          status: 'OffSite',
          lastEventTime: null,
          canClockIn: true,
          canClockOut: true,
          canStartBreak: false,
          canEndBreak: false,
          activeOrders: [
            { id: 1, name: 'Výchozí zakázka dílny', isActive: true }
          ],
          activeOperations: [
            { id: 1, name: 'Kompletní krabička', normPerHour: 100, ratePerPiece: 1.35, isActive: true },
            { id: 2, name: 'Balení', normPerHour: 100, ratePerPiece: 1.35, isActive: true },
            { id: 3, name: 'Příprava', normPerHour: 120, ratePerPiece: 1.15, isActive: true },
            { id: 4, name: 'Kompletace a vkládání', normPerHour: 100, ratePerPiece: 1.35, isActive: true },
          ],
          upcomingShifts: [],
          openShifts: [],
          documents: [],
          todaySubmittedPieces: 0,
        };
      }
    }
    throw err;
  }
}

export async function submitClock(
  pinCode: string,
  eventType: 'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd',
  offlineTimestamp?: string
): Promise<ClockResponse> {
  const payload: any = { pinCode, eventType };
  if (offlineTimestamp) {
    payload.offlineTimestamp = offlineTimestamp;
  }

  const res = await fetch(`${API_BASE}?action=clock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status === 409) {
    const err = await res.json();
    throw new Error(err.error || 'Tato akce již byla před chvílí zaznamenána.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při záznamu docházky');
  }

  return res.json();
}

export async function submitProduction(data: {
  pinCode: string;
  orderId: number;
  operationId: number;
  submittedPieces: number;
  note?: string;
  offlineTimestamp?: string;
}): Promise<ClockResponse> {
  const res = await fetch(`${API_BASE}?action=submit-production`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při ukládání výroby');
  }
  const json = await res.json();
  return {
    ...json,
    eventType: 'Production',
  };
}

export async function confirmDocument(pinCode: string, documentId: number): Promise<{ success: boolean; agreedAt: string }> {
  const res = await fetch(`${API_BASE}?action=confirm-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinCode, documentId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při potvrzení dokumentu');
  }
  return res.json();
}

// ==========================================
// AUTH API
// ==========================================

export async function adminLogin(username: string, password: string): Promise<{ success: boolean; username: string }> {
  const res = await fetch(`${API_BASE}?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Nesprávné přihlašovací jméno nebo heslo');
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('kipacky_token', data.token);
  }
  return data;
}

export async function adminPinLogin(pin: string): Promise<{ success: boolean; username: string }> {
  const res = await fetch(`${API_BASE}?action=admin-pin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Neplatný administrátorský PIN');
  }
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('kipacky_token', data.token);
  }
  return data;
}

export async function adminLogout(): Promise<void> {
  localStorage.removeItem('kipacky_token');
  await fetch(`${API_BASE}?action=logout`, { method: 'POST', headers: getAuthHeaders() }).catch(() => {});
}

export async function checkAuth(): Promise<{ isAuthenticated: boolean; username: string | null }> {
  try {
    const res = await fetch(`${API_BASE}?action=auth-me`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return res.json();
  } catch {
    // fallback
  }
  return { isAuthenticated: false, username: null };
}

export async function fetchAdminUsers(): Promise<Array<{ id: number; username: string; fullName: string; pinCode: string; role: string }>> {
  const res = await fetch(`${API_BASE}?action=get-admin-users`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Nepodařilo se načíst administrátory');
  return res.json();
}

export async function changeAdminPin(username: string, newPin: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}?action=change-admin-pin`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, newPin }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Nepodařilo se změnit PIN');
  }
  return res.json();
}

export async function claimShift(pinCode: string, shiftId: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}?action=claim-shift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinCode, shiftId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při přihlášení na směnu');
  }
  return res.json();
}

export async function releaseShift(pinCode: string, shiftId: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}?action=release-shift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinCode, shiftId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při odhlášení ze směny');
  }
  return res.json();
}

export async function updateProfile(data: {
  pinCode: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
}): Promise<{ success: boolean; message: string; personalDataConfirmedAt: string }> {
  const res = await fetch(`${API_BASE}?action=update-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při aktualizaci profilu');
  }
  return res.json();
}

export async function fetchEmployeeMonthlySummary(
  pinCode: string,
  year?: number,
  month?: number
): Promise<import('../types').KioskMonthlySummary> {
  const res = await fetch(`${API_BASE}?action=employee-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinCode, year, month }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při načítání měsíčního výkazu');
  }
  return res.json();
}

// ==========================================
// ADMIN: ZAMĚSTNANCI & DOCHÁZKA
// ==========================================

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch(`${API_BASE}?action=get-employees`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání zaměstnanců');
  return res.json();
}

export async function createEmployee(data: {
  fullName: string;
  pinCode: string;
  contractType: string;
  isActive: boolean;
  phone?: string;
  email?: string;
  bankAccount?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  selfScheduled?: boolean;
  employeeNumber?: string;
  street?: string;
  city?: string;
  contractHoursLimit?: number;
  employmentStatus?: string;
  defaultWorkplace?: string;
  photoUrl?: string;
}): Promise<Employee> {
  const res = await fetch(`${API_BASE}?action=create-employee`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při vytváření zaměstnance');
  }
  return res.json();
}

export async function updateEmployee(
  id: number,
  data: {
    fullName?: string;
    pinCode?: string;
    contractType?: string;
    isActive: boolean;
    phone?: string;
    email?: string;
    bankAccount?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    selfScheduled?: boolean;
    employeeNumber?: string;
    street?: string;
    city?: string;
    contractHoursLimit?: number;
    employmentStatus?: string;
    defaultWorkplace?: string;
    photoUrl?: string;
  }
): Promise<Employee> {
  const res = await fetch(`${API_BASE}?action=update-employee&id=${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při úpravě zaměstnance');
  }
  return res.json();
}

export async function fetchAttendanceLogs(params?: {
  employeeId?: number;
  fromDate?: string;
  toDate?: string;
}): Promise<AttendanceLogItem[]> {
  const query = new URLSearchParams({ action: 'get-logs' });
  if (params?.employeeId) query.append('employeeId', params.employeeId.toString());
  if (params?.fromDate) query.append('fromDate', params.fromDate);
  if (params?.toDate) query.append('toDate', params.toDate);

  const res = await fetch(`${API_BASE}?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání záznamů docházky');
  return res.json();
}

export async function createManualLog(data: {
  employeeId: number;
  timestamp: string;
  eventType: 'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd';
  note?: string;
}): Promise<AttendanceLogItem> {
  const res = await fetch(`${API_BASE}?action=create-log`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při ukládání záznamu');
  }
  return res.json();
}

export async function updateAttendanceLog(
  id: number,
  data: {
    timestamp: string;
    eventType: 'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd';
    note?: string;
  }
): Promise<AttendanceLogItem> {
  const res = await fetch(`${API_BASE}?action=update-log&id=${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při úpravě záznamu');
  }
  return res.json();
}

export async function deleteAttendanceLog(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}?action=delete-log&id=${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při mazání záznamu');
}

// ==========================================
// ADMIN: FÁZE 2 – PRODUKCE, ZAKÁZKY, OPERACE
// ==========================================

export async function fetchOrders(): Promise<OrderItem[]> {
  const res = await fetch(`${API_BASE}?action=get-orders`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání zakázek');
  return res.json();
}

export async function fetchOrderDetail(orderId: number): Promise<OrderDetailResult> {
  const res = await fetch(`${API_BASE}?action=get-order-detail&orderId=${orderId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání detailu zakázky');
  return res.json();
}

export async function saveOrder(data: {
  id?: number;
  name: string;
  isActive: boolean;
  totalPiecesTarget?: number;
  targetPieces?: number;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  targetPricePerPiece?: number;
  description?: string;
  minTargetPieces?: number | null;
  maxTargetPieces?: number | null;
  packagingDesc?: string;
  logisticsDesc?: string;
  coordinatorContact?: string;
  customerContact?: string;
  workplaceMode?: string;
  operations?: Array<{ name: string; normPerHour: number; ratePerPiece: number; operationStage?: string }>;
}): Promise<{ success: boolean; id: number }> {
  const res = await fetch(`${API_BASE}?action=save-order`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při ukládání zakázky');
  }
  return res.json();
}

export async function fetchOperations(orderId?: number): Promise<OperationItem[]> {
  const query = new URLSearchParams({ action: 'get-operations' });
  if (orderId) query.append('orderId', orderId.toString());
  const res = await fetch(`${API_BASE}?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání operací');
  return res.json();
}

export async function saveOperation(data: {
  id?: number;
  name: string;
  normPerHour: number;
  ratePerPiece: number;
  isActive: boolean;
  orderId?: number | null;
  operationStage?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}?action=save-operation`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při ukládání operace');
  }
}

export async function fetchOrderAssignments(params?: {
  orderId?: number;
  employeeId?: number;
}): Promise<import('../types').OrderAssignmentItem[]> {
  const query = new URLSearchParams({ action: 'get-order-assignments' });
  if (params?.orderId) query.append('orderId', params.orderId.toString());
  if (params?.employeeId) query.append('employeeId', params.employeeId.toString());
  const res = await fetch(`${API_BASE}?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání přiřazení brigádníků');
  return res.json();
}

export async function saveOrderAssignment(data: {
  id?: number;
  orderId: number;
  employeeId: number;
  operationId?: number | null;
  assignedPieces: number;
  deadlineDate?: string;
  workplace: string;
  note?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}?action=save-order-assignment`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při přiřazování brigádníka');
  }
}

export async function deleteOrderAssignment(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}?action=delete-order-assignment&id=${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při odebírání přiřazení');
}

// --- FÁZE 3: Sklad materiálu & výdejky ---

export async function fetchOrderMaterials(orderId?: number): Promise<OrderMaterialItem[]> {
  const query = new URLSearchParams({ action: 'get-order-materials' });
  if (orderId) query.append('orderId', orderId.toString());
  const res = await fetch(`${API_BASE}?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání materiálu');
  return res.json();
}

export async function saveOrderMaterial(data: Partial<OrderMaterialItem>): Promise<void> {
  const res = await fetch(`${API_BASE}?action=save-order-material`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při ukládání materiálu');
  }
}

export async function deleteOrderMaterial(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}?action=delete-order-material&id=${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při mazání materiálu');
}

export async function fetchMaterialDispatches(params?: {
  orderId?: number;
  employeeId?: number;
}): Promise<MaterialDispatchItem[]> {
  const query = new URLSearchParams({ action: 'get-material-dispatches' });
  if (params?.orderId) query.append('orderId', params.orderId.toString());
  if (params?.employeeId) query.append('employeeId', params.employeeId.toString());
  const res = await fetch(`${API_BASE}?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání výdejek materiálu');
  return res.json();
}

export async function saveMaterialDispatch(data: {
  id?: number;
  orderId: number;
  employeeId: number;
  plannedPieces: number;
  dispatchedBy?: string;
  note?: string;
  status?: string;
  createDocument?: boolean;
  items: Array<{ materialId: number; materialName?: string; quantity: number; unit?: string }>;
}): Promise<void> {
  const res = await fetch(`${API_BASE}?action=save-material-dispatch`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při ukládání výdejky materiálu');
  }
}

export async function deleteMaterialDispatch(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}?action=delete-material-dispatch&id=${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při mazání výdejky materiálu');
}


export async function fetchProductionLogs(params?: {
  status?: string;
  employeeId?: number;
}): Promise<ProductionLogItem[]> {
  const query = new URLSearchParams({ action: 'get-production' });
  if (params?.status) query.append('status', params.status);
  if (params?.employeeId) query.append('employeeId', params.employeeId.toString());

  const res = await fetch(`${API_BASE}?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání produkce');
  return res.json();
}

export async function approveProduction(data: {
  id: number;
  validatedPieces: number;
  defectPieces: number;
  note?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}?action=approve-production`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při schvalování produkce');
  }
}

export async function deleteProductionLog(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}?action=delete-production&id=${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při mazání výkazu produkce');
}

// ==========================================
// ADMIN: FÁZE 3 – DOKUMENTY BOZP & PLÁNOVÁNÍ SMĚN
// ==========================================

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}?action=get-documents`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání dokumentů');
  return res.json();
}

export async function fetchDocumentDetail(id: number): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}?action=get-document&id=${id}`);
  if (!res.ok) throw new Error('Dokument nebyl nalezen');
  return res.json();
}

export async function saveDocument(data: {
  id?: number;
  title: string;
  content?: string;
  shortText?: string;
  fullText?: string;
  isActive: boolean;
}): Promise<void> {
  const res = await fetch(`${API_BASE}?action=save-document`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při ukládání dokumentu');
  }
}

export async function fetchDocumentConsents(): Promise<DocumentConsentItem[]> {
  const res = await fetch(`${API_BASE}?action=get-consents`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání souhlasů BOZP');
  return res.json();
}

export async function fetchShifts(): Promise<PlannedShiftItem[]> {
  const res = await fetch(`${API_BASE}?action=get-shifts`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při načítání plánu směn');
  return res.json();
}

export async function saveShift(data: {
  id?: number;
  shiftDate: string;
  startTime: string;
  endTime: string;
  employeeId?: number | null;
  orderId?: number | null;
  note?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}?action=save-shift`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chyba při ukládání směny');
  }
}

export async function deleteShift(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}?action=delete-shift&id=${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při mazání směny');
}

// ==========================================
// ADMIN: FINÁLNÍ MĚSÍČNÍ REPORT A CSV
// ==========================================

export async function fetchMonthlyReport(
  year: number,
  month: number,
  employeeId?: number
): Promise<MonthlyReportResult> {
  const query = new URLSearchParams({
    action: 'monthly-report',
    year: year.toString(),
    month: month.toString(),
  });
  if (employeeId) query.append('employeeId', employeeId.toString());

  const res = await fetch(`${API_BASE}?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Chyba při generování měsíčního výkazu');
  return res.json();
}

export function getCsvDownloadUrl(year: number, month: number, employeeId?: number): string {
  const token = localStorage.getItem('kipacky_token') || '';
  const query = new URLSearchParams({
    action: 'monthly-report-csv',
    year: year.toString(),
    month: month.toString(),
    token,
  });
  if (employeeId) query.append('employeeId', employeeId.toString());
  return `${API_BASE}?${query.toString()}`;
}
