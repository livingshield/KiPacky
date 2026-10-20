export interface Employee {
  id: number;
  fullName: string;
  pinCode: string;
  contractType: string; // DPP (300 hodin), DPČ 32 hodin, DPČ 80 hodin, HPP 40 hodin, HPP 80 hodin, HPP 160 hodin, etc.
  isActive: boolean;
  createdAt: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  personalDataConfirmedAt?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  selfScheduled?: boolean;
  // Nová pole pro Fázi 1 (dle docházka.docx):
  employeeNumber?: string; // Evidenční/personální číslo (např. 104)
  street?: string; // Ulice č.p.
  city?: string; // Obec
  contractHoursLimit?: number; // Fond hodin (např. 300, 32, 80, 40, 80, 160)
  employmentStatus?: 'Active' | 'Terminated' | 'Troublemaker'; // Aktivní, Ukončen, Potížista
  defaultWorkplace?: 'Doma' | 'Na dílně'; // Místo realizace
  photoUrl?: string; // Avatar / foto (pouze pro admina)
  assignedOrderInfo?: string; // Přidělená zakázka + úkon
  workedHours?: number; // Vypočtené odpracované normohodiny
  remainingHours?: number; // Vypočtený zbytek hodin
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
  // Fáze 2 rozšíření (docházka.docx):
  minTargetPieces?: number | null;
  maxTargetPieces?: number | null;
  packagingDesc?: string;
  logisticsDesc?: string;
  coordinatorContact?: string;
  customerContact?: string;
  workplaceMode?: 'Na dílně' | 'Doma';
}

export interface OperationItem {
  id: number;
  name: string;
  normPerHour: number;
  ratePerPiece: number;
  isActive?: boolean;
  orderId?: number | null;
  orderName?: string;
  operationStage?: 'Auxiliary' | 'Final'; // Pomocné práce vs Finální fáze
}

export interface OrderAssignmentItem {
  id: number;
  orderId: number;
  orderName?: string;
  employeeId: number;
  employeeName?: string;
  employeeNumber?: string;
  operationId?: number | null;
  operationName?: string;
  assignedPieces: number;
  assignedAt: string;
  deadlineDate?: string | null;
  workplace: 'Na dílně' | 'Doma';
  status: string;
  note?: string;
  donePieces?: number;
  remainingPieces?: number;
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

export interface VideoItem {
  id: number;
  title: string;
  url: string;
  videoId: string;
  category: string;
  description: string;
  author: string;
  thumbnailUrl: string;
  duration?: string;
  isActive: boolean;
  createdAt?: string;
  viewsCount?: number;
  isWatched?: boolean;
  watchedAt?: string | null;
}

export interface VideoViewItem {
  id: number;
  videoId: number;
  videoTitle: string;
  employeeId: number;
  employeeName: string;
  contractType: string;
  viewedAt: string;
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
  videos?: VideoItem[];
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
  employeeNumber?: string;
  photoUrl?: string;
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
  employeeNumber?: string;
  photoUrl?: string;
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
  normHours?: number;
  defectProtocolDocId?: number | null;
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
  targetEmployeeId?: number | null;
  targetEmployeeName?: string;
  targetEmployeeNumber?: string;
  documentType?: 'General' | 'Directive' | 'Notice' | 'Payslip' | 'MaterialHandover' | 'DefectProtocol';
  periodYear?: number | null;
  periodMonth?: number | null;
  fileName?: string | null;
  hasFile?: boolean;
  requiresSignature?: boolean;
  priority?: 'Normal' | 'High' | 'Urgent';
  consentCount?: number;
  confirmedAt?: string | null;
}

export interface PayslipBatchResultItem {
  fileName: string;
  success: boolean;
  employeeId?: number;
  employeeName?: string;
  employeeNumber?: string;
  year?: number;
  month?: number;
  error?: string;
}

export interface PayslipBatchResponse {
  success: boolean;
  totalCount: number;
  successCount: number;
  failCount: number;
  results: PayslipBatchResultItem[];
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

export interface AdminUserItem {
  id: number;
  username: string;
  fullName: string;
  pinCode: string;
  role: string;
}

// --- FÁZE 3: Sklad materiálu & výdejky ---

export interface OrderMaterialItem {
  id: number;
  orderId: number;
  orderName?: string;
  targetPieces?: number;
  name: string;
  deliveredQuantity: number;
  unit: string;
  consumptionPerPiece: number;
  matchesTargetPieces: boolean;
  note?: string;
  receivedAt?: string;
  createdBy?: string;
  dispatchedQuantity: number;
  remainingQuantity: number;
}

export interface MaterialDispatchItemDetail {
  id: number;
  materialId: number;
  materialName: string;
  quantity: number;
  returnedQuantity: number;
  unit: string;
}

export interface MaterialDispatchItem {
  id: number;
  orderId: number;
  orderName: string;
  employeeId: number;
  employeeName: string;
  employeeNumber?: string;
  plannedPieces: number;
  dispatchedAt: string;
  dispatchedBy?: string;
  documentId?: number | null;
  confirmedAt?: string | null;
  status: string;
  note?: string;
  items: MaterialDispatchItemDetail[];
}

