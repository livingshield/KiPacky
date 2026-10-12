export interface Employee {
  id: number;
  fullName: string;
  pinCode: string;
  contractType: string; // DPP, DPČ, HPP, IČO
  isActive: boolean;
  createdAt: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  personalDataConfirmedAt?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  selfScheduled?: boolean;
}

export interface OrderItem {
  id: number;
  name: string;
  isActive?: boolean;
  createdAt?: string;
  targetPieces?: number;
  totalPiecesTarget?: number;
  startDate?: string | null;
  endDate?: string | null;
  deadline?: string | null;
  targetPricePerPiece?: number;
  description?: string;
  completedPieces?: number;
  remainingPieces?: number;
  percentDone?: number;
}

export interface OperationItem {
  id: number;
  name: string;
  normPerHour: number;
  ratePerPiece: number;
  isActive?: boolean;
  orderId?: number | null;
  orderName?: string;
}

export interface OrderParticipantItem {
  employeeId: number;
  employeeName: string;
  contractType: string;
  operationId: number;
  operationName: string;
  normPerHour: number;
  ratePerPiece: number;
  approvedPieces: number;
  defectPieces: number;
  totalEarnedCzk: number;
  productiveHours: number;
}

export interface OrderDetailResult {
  order: OrderItem;
  operations: OperationItem[];
  participants: OrderParticipantItem[];
  stats: {
    totalPiecesTarget: number;
    completedPieces: number;
    defectPieces: number;
    remainingPieces: number;
    percentDone: number;
    totalEarnedCzk: number;
    totalProductiveHours: number;
  };
}

export interface KioskShiftItem {
  id: number;
  shiftDate: string;
  startTime: string;
  endTime: string;
  orderName: string;
  note: string;
}

export interface KioskDocumentItem {
  id: number;
  title: string;
  content: string;
  lastAgreedAt: string | null;
  needsConsent: boolean;
}

export interface AttendanceStatusResponse {
  employeeId: number;
  fullName: string;
  contractType: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  personalDataConfirmedAt?: string | null;
  status: 'OnSite' | 'OffSite' | 'OnBreak';
  lastEventType: 'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd' | null;
  lastEventTimestamp: string | null;
  suggestedAction: 'ClockIn' | 'ClockOut';
  activeOrders?: OrderItem[];
  activeOperations?: OperationItem[];
  upcomingShifts?: KioskShiftItem[];
  openShifts?: KioskShiftItem[];
  documents?: KioskDocumentItem[];
  todaySubmittedPieces?: number;
}

export interface ClockResponse {
  success: boolean;
  employeeName: string;
  eventType?: 'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd' | 'Production';
  timestamp: string;
  formattedTime: string;
  message: string;
  submittedPieces?: number;
}

export interface AttendanceLogItem {
  id: number;
  employeeId: number;
  employeeName: string;
  contractType: string;
  timestamp: string;
  eventType: 'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd';
  isManualEdit: boolean;
  note: string | null;
  originalTimestamp?: string | null;
  modifiedByAdmin?: boolean;
  modifiedBy?: string;
  modifiedAt?: string | null;
  modifyReason?: string;
}

export interface ProductionLogItem {
  id: number;
  employeeId: number;
  employeeName: string;
  contractType: string;
  orderId: number;
  orderName: string;
  operationId: number;
  operationName: string;
  normPerHour: number;
  ratePerPiece: number;
  date: string;
  submittedPieces: number;
  validatedPieces: number | null;
  defectPieces: number;
  status: 'Pending' | 'Approved';
  modifiedBy: string;
  note: string;
  earnedCzk: number;
  productiveHours: number;
}

export interface DocumentItem {
  id: number;
  title: string;
  content: string;
  shortText?: string;
  fullText?: string;
  hasFullText?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface DocumentConsentItem {
  id: number;
  employeeId: number;
  employeeName: string;
  contractType: string;
  documentId: number;
  documentTitle: string;
  agreedAt: string;
}

export interface PlannedShiftItem {
  id: number;
  shiftDate: string;
  startTime: string;
  endTime: string;
  employeeId: number | null;
  employeeName: string;
  orderId: number | null;
  orderName: string;
  note: string;
}

export interface ShiftRecord {
  employeeId: number;
  employeeName: string;
  contractType: string;
  date: string;
  clockInTime: string;
  clockOutTime: string | null;
  grossDuration: string;
  breakDuration: string;
  netDuration: string;
  grossHours?: number;
  breakHours?: number;
  netHours?: number;
  approvedPieces?: number;
  defectPieces?: number;
  productiveHours?: number;
  normHours?: number;
  earnedCzk?: number;
  isWeekend?: boolean;
  eligibleWeekendOvertime?: boolean;
  weekendHours?: number;
  isManualEdit: boolean;
  isIncomplete: boolean;
  note: string;
}

export interface EmployeeSummary {
  employeeId: number;
  employeeName: string;
  contractType: string;
  selfScheduled?: boolean;
  totalShifts: number;
  totalGrossHours: number;
  totalBreakHours: number;
  totalNetHours: number;
  totalWeekendHours?: number;
  incompleteShiftsCount: number;
  yearToDateNetHours?: number;
  yearToDateNormHours?: number;
  remainingDppHours?: number;
  totalApprovedPieces?: number;
  totalPendingPieces?: number;
  totalDefectPieces?: number;
  totalProductiveHours?: number;
  normHours?: number;
  totalEarnedCzk?: number;
  shifts: ShiftRecord[];
}

export interface MonthlyReportResult {
  year: number;
  month: number;
  employeeSummaries: EmployeeSummary[];
}

export interface KioskMonthlySummary {
  employeeId: number;
  employeeName: string;
  contractType: string;
  year: number;
  month: number;
  shifts: ShiftRecord[];
  totalNetHours: number;
  totalNormHours?: number;
  totalProductiveHours?: number;
  totalEarnedCzk: number;
  totalApprovedPieces: number;
  yearToDateNetHours: number;
  yearToDateNormHours?: number;
  remainingDppHours?: number;
  dppLimitHours: number;
}
