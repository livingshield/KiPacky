import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Layers,
  Clock,
  PackageCheck,
  FileText,
  FileSpreadsheet,
  Plus,
  Search,
  Camera,
  Upload,
  UserCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Clock4,
  ExternalLink,
  ChevronRight,
  LogOut,
  RefreshCw,
  Bell,
  Eye,
  Edit2,
  Printer,
  Archive,
  Check,
  Trash2,
  Settings,
  FolderOpen,
  Send,
  Boxes,
  FileCheck,
  CheckCheck,
  AlertCircle,
  FileWarning,
  Calculator,
  Info,
  CalendarRange,
  Clock3,
  X
} from 'lucide-react';
import {
  Employee,
  OrderItem,
  OperationItem,
  OrderAssignmentItem,
  OrderDetailResult,
  OrderMaterialItem,
  MaterialDispatchItem,
  AttendanceLogItem,
  ProductionLogItem
} from '../types';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  fetchOrders,
  saveOrder,
  fetchOperations,
  saveOperation,
  fetchOrderAssignments,
  saveOrderAssignment,
  deleteOrderAssignment,
  fetchOrderDetail,
  fetchOrderMaterials,
  saveOrderMaterial,
  deleteOrderMaterial,
  fetchMaterialDispatches,
  saveMaterialDispatch,
  deleteMaterialDispatch,
  fetchAttendanceLogs,
  createManualLog,
  updateAttendanceLog,
  deleteAttendanceLog,
  fetchProductionLogs,
  approveProduction,
  approveAllProduction,
  deleteProductionLog
} from '../api/client';
import { GREENBERG_LOGO } from '../assets/logoBase64';
import { APP_VERSION } from '../version';

interface AdminV2PageProps {
  onLogout: () => void;
  onGoToKiosk: () => void;
  onSwitchToV1: () => void;
}

export const AdminV2Page: React.FC<AdminV2PageProps> = ({ onLogout, onGoToKiosk, onSwitchToV1 }) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'orders' | 'inventory' | 'attendance' | 'production' | 'admin' | 'reports'>('employees');

  // Zaměstnanci
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Troublemaker' | 'Terminated'>('All');

  // Formulář nového zaměstnance (sbalený pod tlačítkem)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmployeeNumber, setNewEmployeeNumber] = useState('');
  const [newPinCode, setNewPinCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBankAccount, setNewBankAccount] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newContractType, setNewContractType] = useState('DPP (300 hodin)');
  const [newContractStartDate, setNewContractStartDate] = useState('');
  const [newContractEndDate, setNewContractEndDate] = useState('');
  const [newWorkRegime, setNewWorkRegime] = useState<'self' | 'scheduled'>('self');
  const [newEmploymentStatus, setNewEmploymentStatus] = useState<'Active' | 'Troublemaker' | 'Terminated'>('Active');
  const [newDefaultWorkplace, setNewDefaultWorkplace] = useState<'Doma' | 'Na dílně'>('Na dílně');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Vybraný zaměstnanec pro zobrazení detailní Personální karty
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [modalEditEmp, setModalEditEmp] = useState<Employee | null>(null);

  // Zakázky a operace pro náhled
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [operations, setOperations] = useState<OperationItem[]>([]);
  const [orderAssignments, setOrderAssignments] = useState<OrderAssignmentItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fáze 2: Stav zakázek (Aktivní vs Archiv)
  const [orderArchiveView, setOrderArchiveView] = useState<'active' | 'archive'>('active');

  // Fáze 2: Sbalené formuláře (Pouze nadpis/tlačítko, rozbalí se po kliku)
  const [openOrderForm, setOpenOrderForm] = useState<'none' | 'newOrder' | 'newOp' | 'assignWorker'>('none');

  // Formulář 1: Nová zakázka
  const [orderName, setOrderName] = useState('');
  const [orderStatus, setOrderStatus] = useState<boolean>(true);
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');
  const [orderMinPieces, setOrderMinPieces] = useState<string>('');
  const [orderMaxPieces, setOrderMaxPieces] = useState<string>('');
  const [orderDesc, setOrderDesc] = useState('');
  const [orderPackagingDesc, setOrderPackagingDesc] = useState('');
  const [orderLogisticsDesc, setOrderLogisticsDesc] = useState('');
  const [orderCoordinatorContact, setOrderCoordinatorContact] = useState('');
  const [orderCustomerContact, setOrderCustomerContact] = useState('');
  const [orderWorkplaceMode, setOrderWorkplaceMode] = useState<'Na dílně' | 'Doma'>('Na dílně');

  // Formulář 2: Operace, normy a sazby
  const [opName, setOpName] = useState('');
  const [opNormPerHour, setOpNormPerHour] = useState<number>(100);
  const [opRatePerPiece, setOpRatePerPiece] = useState<string>('1.35');
  const [opOrderId, setOpOrderId] = useState<string>('');
  const [opStage, setOpStage] = useState<'Auxiliary' | 'Final'>('Final');

  // Formulář 3: Přiřadit brigádníky na zakázku
  const [assignWorkerEmpId, setAssignWorkerEmpId] = useState<string>('');
  const [assignWorkerOrderId, setAssignWorkerOrderId] = useState<string>('');
  const [assignWorkerOpId, setAssignWorkerOpId] = useState<string>('');
  const [assignWorkerPieces, setAssignWorkerPieces] = useState<number>(500);
  const [assignWorkerDeadline, setAssignWorkerDeadline] = useState<string>('');
  const [assignWorkerWorkplace, setAssignWorkerWorkplace] = useState<'Na dílně' | 'Doma'>('Na dílně');
  const [assignWorkerNote, setAssignWorkerNote] = useState('');

  // Tisk / Detail Zakázkového listu
  const [selectedOrderSheet, setSelectedOrderSheet] = useState<OrderItem | null>(null);
  const [orderSheetDetail, setOrderSheetDetail] = useState<OrderDetailResult | null>(null);
  const [loadingOrderSheet, setLoadingOrderSheet] = useState(false);

  // FÁZE 3: Sklad materiálu & Výdejky
  const [materials, setMaterials] = useState<OrderMaterialItem[]>([]);
  const [dispatches, setDispatches] = useState<MaterialDispatchItem[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [inventorySubTab, setInventorySubTab] = useState<'stock' | 'dispatches'>('stock');
  const [selectedMaterialOrderId, setSelectedMaterialOrderId] = useState<string>('all');
  const [openMaterialForm, setOpenMaterialForm] = useState<'none' | 'receive' | 'dispatch'>('none');

  // Formulář 1: Příjem materiálu k zakázce
  const [matOrderId, setMatOrderId] = useState<string>('');
  const [matName, setMatName] = useState('');
  const [matDeliveredQty, setMatDeliveredQty] = useState<number>(1000);
  const [matUnit, setMatUnit] = useState('ks');
  const [matConsumption, setMatConsumption] = useState<number>(1);
  const [matMatchesTarget, setMatMatchesTarget] = useState<boolean>(true);
  const [matNote, setMatNote] = useState('');
  const [matReceivedAt, setMatReceivedAt] = useState<string>(new Date().toISOString().substring(0, 10));

  // Formulář 2: Výdej materiálu brigádníkovi
  const [dispOrderId, setDispOrderId] = useState<string>('');
  const [dispEmployeeId, setDispEmployeeId] = useState<string>('');
  const [dispPlannedPieces, setDispPlannedPieces] = useState<number>(200);
  const [dispDispatchedBy, setDispDispatchedBy] = useState<string>('Admin');
  const [dispNote, setDispNote] = useState('');
  const [dispCreateDoc, setDispCreateDoc] = useState<boolean>(true);
  const [dispCustomQuantities, setDispCustomQuantities] = useState<Record<number, number>>({});

  // Modály pro tisk A4 sestav:
  const [selectedPrintReceiptOrder, setSelectedPrintReceiptOrder] = useState<OrderItem | null>(null);
  const [selectedPrintDispatch, setSelectedPrintDispatch] = useState<MaterialDispatchItem | null>(null);

  // FÁZE 4: DOCHÁZKA (Reálná vs. Normovaná)
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLogItem[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceSubTab, setAttendanceSubTab] = useState<'real' | 'normed'>('real');
  const [attendanceMonth, setAttendanceMonth] = useState<number>(new Date().getMonth() + 1);
  const [attendanceYear, setAttendanceYear] = useState<number>(new Date().getFullYear());
  const [attendanceEmpFilter, setAttendanceEmpFilter] = useState<string>('all');
  const [attendanceEventFilter, setAttendanceEventFilter] = useState<string>('all');

  // Ruční záznam / korekce docházky
  const [showManualLogModal, setShowManualLogModal] = useState(false);
  const [editingLogItem, setEditingLogItem] = useState<AttendanceLogItem | null>(null);
  const [manualLogEmpId, setManualLogEmpId] = useState<string>('');
  const [manualLogDate, setManualLogDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [manualLogTime, setManualLogTime] = useState<string>('08:00');
  const [manualLogEventType, setManualLogEventType] = useState<'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd'>('ClockIn');
  const [manualLogNote, setManualLogNote] = useState<string>('');

  // Tisk normované docházky A4
  const [selectedPrintNormedEmp, setSelectedPrintNormedEmp] = useState<Employee | null>(null);

  // FÁZE 4: PRODUKCE & SCHVALOVÁNÍ KUSŮ
  const [productionLogs, setProductionLogs] = useState<ProductionLogItem[]>([]);
  const [loadingProduction, setLoadingProduction] = useState(false);
  const [prodStatusFilter, setProdStatusFilter] = useState<'all' | 'Pending' | 'Approved'>('all');
  const [prodOrderFilter, setProdOrderFilter] = useState<string>('all');
  const [prodEmpFilter, setProdEmpFilter] = useState<string>('all');
  const [approvingProdId, setApprovingProdId] = useState<number | null>(null);
  const [prodInlineEdits, setProdInlineEdits] = useState<Record<number, { val: number; def: number; note: string }>>({});

  // Tisk Zmetkového protokolu A4
  const [selectedDefectLog, setSelectedDefectLog] = useState<ProductionLogItem | null>(null);

  // Notifikace / zpětná vazba
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => {
      setStatusMsg(null);
    }, 4500);
  };

  const loadAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const data = await fetchAttendanceLogs();
      setAttendanceLogs(data);
    } catch {
      showNotification('Nepodařilo se načíst docházku', 'error');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const loadProduction = async () => {
    setLoadingProduction(true);
    try {
      const data = await fetchProductionLogs();
      setProductionLogs(data);
    } catch {
      showNotification('Nepodařilo se načíst produkci', 'error');
    } finally {
      setLoadingProduction(false);
    }
  };

  const loadData = async () => {
    setLoadingEmployees(true);
    setLoadingOrders(true);
    setLoadingMaterials(true);
    setLoadingAttendance(true);
    setLoadingProduction(true);
    try {
      const [empData, ordData, opData, assignData, matData, dispData, attData, prodData] = await Promise.all([
        fetchEmployees().catch(() => []),
        fetchOrders().catch(() => []),
        fetchOperations().catch(() => []),
        fetchOrderAssignments().catch(() => []),
        fetchOrderMaterials().catch(() => []),
        fetchMaterialDispatches().catch(() => []),
        fetchAttendanceLogs().catch(() => []),
        fetchProductionLogs().catch(() => [])
      ]);
      setEmployees(empData);
      setOrders(ordData);
      setOperations(opData);
      setOrderAssignments(assignData);
      setMaterials(matData);
      setDispatches(dispData);
      setAttendanceLogs(attData);
      setProductionLogs(prodData);
    } catch {
      showNotification('Nepodařilo se načíst data ze serveru', 'error');
    } finally {
      setLoadingEmployees(false);
      setLoadingOrders(false);
      setLoadingMaterials(false);
      setLoadingAttendance(false);
      setLoadingProduction(false);
    }
  };

  // Handlery pro docházku
  const handleOpenNewManualLog = () => {
    setEditingLogItem(null);
    setManualLogEmpId(employees.length > 0 ? employees[0].id.toString() : '');
    setManualLogDate(new Date().toISOString().substring(0, 10));
    setManualLogTime('08:00');
    setManualLogEventType('ClockIn');
    setManualLogNote('');
    setShowManualLogModal(true);
  };

  const handleOpenEditLog = (item: AttendanceLogItem) => {
    setEditingLogItem(item);
    setManualLogEmpId(item.employeeId.toString());
    const dt = new Date(item.timestamp);
    const dateStr = dt.toISOString().substring(0, 10);
    const hours = String(dt.getHours()).padStart(2, '0');
    const mins = String(dt.getMinutes()).padStart(2, '0');
    setManualLogDate(dateStr);
    setManualLogTime(`${hours}:${mins}`);
    setManualLogEventType(item.eventType);
    setManualLogNote(item.note || '');
    setShowManualLogModal(true);
  };

  const handleSaveManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLogEmpId) {
      showNotification('Vyberte prosím zaměstnance', 'error');
      return;
    }
    const fullTimestamp = `${manualLogDate}T${manualLogTime}:00`;
    try {
      if (editingLogItem) {
        await updateAttendanceLog(editingLogItem.id, {
          timestamp: fullTimestamp,
          eventType: manualLogEventType,
          note: manualLogNote
        });
        showNotification('Záznam docházky byl upraven (s auditem).');
      } else {
        await createManualLog({
          employeeId: parseInt(manualLogEmpId, 10),
          timestamp: fullTimestamp,
          eventType: manualLogEventType,
          note: manualLogNote
        });
        showNotification('Nový záznam docházky byl vytvořen.');
      }
      setShowManualLogModal(false);
      setEditingLogItem(null);
      setManualLogNote('');
      loadAttendance();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při ukládání docházky', 'error');
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!window.confirm('Opravdu chcete smazat tento záznam docházky?')) return;
    try {
      await deleteAttendanceLog(id);
      showNotification('Záznam docházky byl smazán.');
      loadAttendance();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při mazání záznamu', 'error');
    }
  };

  // Handlery pro produkci
  const handleApproveProdItem = async (log: ProductionLogItem) => {
    const edit = prodInlineEdits[log.id] || {
      val: log.status === 'Approved' ? log.validatedPieces : log.submittedPieces,
      def: log.defectPieces || 0,
      note: log.note || ''
    };
    setApprovingProdId(log.id);
    try {
      await approveProduction({
        id: log.id,
        validatedPieces: Number(edit.val),
        defectPieces: Number(edit.def),
        note: edit.note
      });
      showNotification(`Záznam #${log.id} byl úspěšně schválen.`);
      loadProduction();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při schvalování produkce', 'error');
    } finally {
      setApprovingProdId(null);
    }
  };

  const handleApproveAllProd = async () => {
    const pendingCount = productionLogs.filter(p => p.status === 'Pending').length;
    if (pendingCount === 0) {
      showNotification('Nejsou žádné čekající záznamy ke schválení.');
      return;
    }
    if (!window.confirm(`Opravdu chcete hromadně schválit všech ${pendingCount} čekajících záznamů bez vad?`)) {
      return;
    }
    try {
      const res = await approveAllProduction();
      showNotification(`Hromadně schváleno: ${res.approvedCount} záznamů.`);
      loadProduction();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při hromadném schvalování', 'error');
    }
  };

  const handleDeleteProdItem = async (id: number) => {
    if (!window.confirm('Opravdu chcete smazat tento výkaz produkce?')) return;
    try {
      await deleteProductionLog(id);
      showNotification('Výkaz produkce byl smazán.');
      loadProduction();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při mazání záznamu', 'error');
    }
  };

  // Pomocné funkce pro Normovanou docházku pro účetní (135 Kč / h norma)
  const computeNormedShiftsForEmployee = (empId: number, targetYear: number, targetMonth: number) => {
    const approvedMonthLogs = productionLogs.filter(p => {
      if (p.employeeId !== empId || p.status !== 'Approved') return false;
      const d = new Date(p.date);
      return d.getFullYear() === targetYear && (d.getMonth() + 1) === targetMonth;
    });

    const totalPieces = approvedMonthLogs.reduce((acc, p) => acc + (p.validatedPieces || 0), 0);
    const totalDefects = approvedMonthLogs.reduce((acc, p) => acc + (p.defectPieces || 0), 0);
    const totalEarned = approvedMonthLogs.reduce((acc, p) => acc + (p.earnedCzk || 0), 0);
    const totalNormHours = totalEarned > 0 ? (totalEarned / 135.0) : 0;

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const weekdays: Date[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dt = new Date(targetYear, targetMonth - 1, day);
      const dow = dt.getDay();
      if (dow >= 1 && dow <= 5) {
        weekdays.push(dt);
      }
    }

    let remainingHours = totalNormHours;
    const shifts: Array<{
      date: Date;
      dateStr: string;
      dayName: string;
      hours: number;
      startTime: string;
      lunchStart: string | null;
      lunchEnd: string | null;
      endTime: string;
      presenceHours: number;
    }> = [];

    const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

    for (const wd of weekdays) {
      if (remainingHours <= 0.001) break;
      const dayHours = Math.min(8.0, remainingHours);
      remainingHours -= dayHours;

      let startTime = '08:00';
      let lunchStart: string | null = null;
      let lunchEnd: string | null = null;
      let endTime = '';
      let presenceHours = dayHours;

      if (dayHours <= 4.0) {
        const endMins = 8 * 60 + Math.round(dayHours * 60);
        const endH = Math.floor(endMins / 60);
        const endM = endMins % 60;
        endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      } else {
        lunchStart = '12:00';
        lunchEnd = '12:30';
        const afterLunchMins = Math.round((dayHours - 4.0) * 60);
        const endMins = (12 * 60 + 30) + afterLunchMins;
        const endH = Math.floor(endMins / 60);
        const endM = endMins % 60;
        endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        presenceHours = dayHours + 0.5;
      }

      shifts.push({
        date: wd,
        dateStr: wd.toLocaleDateString('cs-CZ'),
        dayName: dayNames[wd.getDay()],
        hours: Math.round(dayHours * 100) / 100,
        startTime,
        lunchStart,
        lunchEnd,
        endTime,
        presenceHours: Math.round(presenceHours * 100) / 100,
      });
    }

    const overflowHours = remainingHours > 0.001 ? Math.round(remainingHours * 100) / 100 : 0;

    return {
      approvedMonthLogs,
      totalPieces,
      totalDefects,
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalNormHours: Math.round(totalNormHours * 100) / 100,
      shifts,
      overflowHours,
      workingDaysCount: weekdays.length,
      maxStandardHours: weekdays.length * 8
    };
  };

  const getAnnualHoursForEmployee = (empId: number, targetYear: number) => {
    const yearLogs = productionLogs.filter(p => {
      if (p.employeeId !== empId || p.status !== 'Approved') return false;
      const d = new Date(p.date);
      return d.getFullYear() === targetYear;
    });
    const yearEarned = yearLogs.reduce((acc, p) => acc + (p.earnedCzk || 0), 0);
    const yearNormHours = yearEarned > 0 ? (yearEarned / 135.0) : 0;
    return Math.round(yearNormHours * 10) / 10;
  };

  // Výpočet zbývajících dní zakázky
  const getRemainingDays = (endDateStr?: string | null) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Vytvoření / uložení zakázky
  const handleSaveOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderName.trim()) {
      showNotification('Vyplňte prosím název zakázky', 'error');
      return;
    }

    try {
      const minP = orderMinPieces ? parseInt(orderMinPieces, 10) : null;
      const maxP = orderMaxPieces ? parseInt(orderMaxPieces, 10) : null;
      const targetPcs = maxP || minP || 0;

      await saveOrder({
        name: orderName.trim(),
        isActive: orderStatus,
        startDate: orderStartDate || undefined,
        endDate: orderEndDate || undefined,
        minTargetPieces: minP,
        maxTargetPieces: maxP,
        totalPiecesTarget: targetPcs,
        targetPieces: targetPcs,
        description: orderDesc.trim(),
        packagingDesc: orderPackagingDesc.trim(),
        logisticsDesc: orderLogisticsDesc.trim(),
        coordinatorContact: orderCoordinatorContact.trim(),
        customerContact: orderCustomerContact.trim(),
        workplaceMode: orderWorkplaceMode
      });

      showNotification(`Zakázka "${orderName}" byla úspěšně uložena.`);
      setOpenOrderForm('none');
      // Reset formuláře
      setOrderName('');
      setOrderStartDate('');
      setOrderEndDate('');
      setOrderMinPieces('');
      setOrderMaxPieces('');
      setOrderDesc('');
      setOrderPackagingDesc('');
      setOrderLogisticsDesc('');
      setOrderCoordinatorContact('');
      setOrderCustomerContact('');
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při ukládání zakázky', 'error');
    }
  };

  // Vytvoření / uložení operace
  const handleSaveOperationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName.trim()) {
      showNotification('Vyplňte prosím název operace', 'error');
      return;
    }

    try {
      const rate = parseFloat(opRatePerPiece.replace(',', '.')) || 1.35;
      const ordId = opOrderId ? parseInt(opOrderId, 10) : null;

      await saveOperation({
        name: opName.trim(),
        normPerHour: opNormPerHour,
        ratePerPiece: rate,
        isActive: true,
        orderId: ordId,
        operationStage: opStage
      });

      showNotification(`Operace "${opName}" (${opStage === 'Final' ? 'Finální fáze' : 'Pomocné práce'}) byla uložena.`);
      setOpenOrderForm('none');
      setOpName('');
      setOpNormPerHour(100);
      setOpRatePerPiece('1.35');
      setOpOrderId('');
      setOpStage('Final');
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při ukládání operace', 'error');
    }
  };

  // Přiřazení brigádníka na zakázku
  const handleAssignWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignWorkerEmpId || !assignWorkerOrderId) {
      showNotification('Vyberte prosím brigádníka i zakázku', 'error');
      return;
    }

    try {
      const empId = parseInt(assignWorkerEmpId, 10);
      const ordId = parseInt(assignWorkerOrderId, 10);
      const opId = assignWorkerOpId ? parseInt(assignWorkerOpId, 10) : null;

      await saveOrderAssignment({
        orderId: ordId,
        employeeId: empId,
        operationId: opId,
        assignedPieces: assignWorkerPieces,
        deadlineDate: assignWorkerDeadline || undefined,
        workplace: assignWorkerWorkplace,
        note: assignWorkerNote.trim()
      });

      showNotification('Brigádník byl úspěšně přiřazen na zakázku.');
      setOpenOrderForm('none');
      setAssignWorkerEmpId('');
      setAssignWorkerOrderId('');
      setAssignWorkerOpId('');
      setAssignWorkerPieces(500);
      setAssignWorkerDeadline('');
      setAssignWorkerNote('');
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při přiřazování brigádníka', 'error');
    }
  };

  // Otevření Zakázkového listu
  const handleOpenOrderSheet = async (order: OrderItem) => {
    setSelectedOrderSheet(order);
    setLoadingOrderSheet(true);
    try {
      const detail = await fetchOrderDetail(order.id);
      setOrderSheetDetail(detail);
    } catch {
      showNotification('Nepodařilo se načíst detail zakázkového listu', 'error');
    } finally {
      setLoadingOrderSheet(false);
    }
  };

  // Smazání přiřazení brigádníka
  const handleDeleteAssignment = async (assignId: number) => {
    if (!window.confirm('Opravdu chcete odebrat toto přiřazení brigádníka?')) return;
    try {
      await deleteOrderAssignment(assignId);
      setOrderAssignments(orderAssignments.filter(a => a.id !== assignId));
      showNotification('Přiřazení bylo odebráno.');
    } catch (err: any) {
      showNotification(err.message || 'Chyba při odebírání přiřazení', 'error');
    }
  };

  // FÁZE 3: Uložení příjmu materiálu k zakázce
  const handleSaveMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matOrderId || !matName.trim()) {
      showNotification('Vyberte prosím zakázku a zadejte název materiálu', 'error');
      return;
    }
    try {
      await saveOrderMaterial({
        orderId: parseInt(matOrderId, 10),
        name: matName.trim(),
        deliveredQuantity: matDeliveredQty,
        unit: matUnit.trim(),
        consumptionPerPiece: matConsumption,
        matchesTargetPieces: matMatchesTarget,
        note: matNote.trim(),
        receivedAt: matReceivedAt
      });
      showNotification(`Materiál "${matName}" byl úspěšně zaevidován do skladu.`);
      setOpenMaterialForm('none');
      setMatName('');
      setMatDeliveredQty(1000);
      setMatConsumption(1);
      setMatMatchesTarget(true);
      setMatNote('');
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při ukládání materiálu', 'error');
    }
  };

  // Smazání materiálu
  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm('Opravdu chcete smazat tento materiál ze skladu? Smažou se i vazby ve výdejkách.')) return;
    try {
      await deleteOrderMaterial(id);
      showNotification('Materiál byl smazán.');
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při mazání materiálu', 'error');
    }
  };

  // FÁZE 3: Uložení výdejky materiálu brigádníkovi
  const handleSaveDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispOrderId || !dispEmployeeId || dispPlannedPieces <= 0) {
      showNotification('Vyberte prosím zakázku, brigádníka a zadejte plánovaný počet kusů', 'error');
      return;
    }

    const ordId = parseInt(dispOrderId, 10);
    const empId = parseInt(dispEmployeeId, 10);
    const orderMats = materials.filter(m => m.orderId === ordId);

    if (orderMats.length === 0) {
      showNotification('Vybraná zakázka nemá v systému naskladněný žádný materiál. Nejprve proveďte příjem materiálu.', 'error');
      return;
    }

    // Připravit položky k výdeji
    const items = orderMats.map(m => {
      const customQty = dispCustomQuantities[m.id];
      const qty = (customQty !== undefined && customQty >= 0) ? customQty : (dispPlannedPieces * m.consumptionPerPiece);
      return {
        materialId: m.id,
        materialName: m.name,
        quantity: qty,
        unit: m.unit
      };
    });

    try {
      await saveMaterialDispatch({
        orderId: ordId,
        employeeId: empId,
        plannedPieces: dispPlannedPieces,
        dispatchedBy: dispDispatchedBy.trim() || 'Admin',
        note: dispNote.trim(),
        createDocument: dispCreateDoc,
        items
      });

      showNotification(`Výdejka pro brigádníka na ${dispPlannedPieces} ks byla úspěšně vystavena${dispCreateDoc ? ' a odeslána k elektronickému potvrzení do jeho profilu' : ''}.`);
      setOpenMaterialForm('none');
      setDispOrderId('');
      setDispEmployeeId('');
      setDispPlannedPieces(200);
      setDispNote('');
      setDispCustomQuantities({});
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při vystavování výdejky', 'error');
    }
  };

  // Smazání výdejky
  const handleDeleteDispatch = async (id: number) => {
    if (!window.confirm('Opravdu chcete smazat tuto výdejku materiálu? Vrátí se naskladněný stav a zruší se případný předávací protokol.')) return;
    try {
      await deleteMaterialDispatch(id);
      showNotification('Výdejka byla smazána.');
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Chyba při mazání výdejky', 'error');
    }
  };

  // Komprese a výřez obrázku v prohlížeči (max 350x350px JPEG)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isModal: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 350;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          if (isModal && modalEditEmp) {
            setModalEditEmp({ ...modalEditEmp, photoUrl: dataUrl });
          } else {
            setNewPhotoUrl(dataUrl);
          }
          showNotification('Fotografie byla úspěšně zpracována');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Určení limitu hodin ze smlouvy
  const getContractLimit = (contractType: string): number => {
    if (contractType.includes('300')) return 300;
    if (contractType.includes('160')) return 160;
    if (contractType.includes('80')) return 80;
    if (contractType.includes('40')) return 40;
    if (contractType.includes('32')) return 32;
    return 300;
  };

  // Vytvoření nového zaměstnance
  const handleCreateEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) {
      showNotification('Zadejte prosím jméno a příjmení', 'error');
      return;
    }
    if (newPinCode.length !== 4) {
      showNotification('PIN musí mít přesně 4 číslice', 'error');
      return;
    }

    try {
      const limit = getContractLimit(newContractType);
      const created = await createEmployee({
        fullName: newFullName.trim(),
        pinCode: newPinCode.trim(),
        contractType: newContractType,
        isActive: newEmploymentStatus !== 'Terminated',
        phone: newPhone.trim(),
        email: newEmail.trim(),
        bankAccount: newBankAccount.trim(),
        contractStartDate: newContractStartDate || undefined,
        contractEndDate: newContractEndDate || undefined,
        selfScheduled: newWorkRegime === 'self',
        employeeNumber: newEmployeeNumber.trim(),
        street: newStreet.trim(),
        city: newCity.trim(),
        contractHoursLimit: limit,
        employmentStatus: newEmploymentStatus,
        defaultWorkplace: newDefaultWorkplace,
        photoUrl: newPhotoUrl,
      });

      setEmployees([created, ...employees]);
      setShowAddForm(false);
      // Reset formuláře
      setNewFullName('');
      setNewEmployeeNumber('');
      setNewPinCode('');
      setNewPhone('');
      setNewEmail('');
      setNewBankAccount('');
      setNewStreet('');
      setNewCity('');
      setNewPhotoUrl('');
      setNewContractStartDate('');
      setNewContractEndDate('');
      showNotification(`Pracovník ${created.fullName} byl úspěšně zaevidován.`);
    } catch (err: any) {
      showNotification(err.message || 'Chyba při vytváření zaměstnance', 'error');
    }
  };

  // Uložení úprav v modálním okně
  const handleSaveModalEdit = async () => {
    if (!modalEditEmp) return;
    try {
      const limit = getContractLimit(modalEditEmp.contractType);
      await updateEmployee(modalEditEmp.id, {
        fullName: modalEditEmp.fullName,
        pinCode: modalEditEmp.pinCode,
        contractType: modalEditEmp.contractType,
        isActive: modalEditEmp.employmentStatus !== 'Terminated',
        phone: modalEditEmp.phone,
        email: modalEditEmp.email,
        bankAccount: modalEditEmp.bankAccount,
        contractStartDate: modalEditEmp.contractStartDate || undefined,
        contractEndDate: modalEditEmp.contractEndDate || undefined,
        selfScheduled: modalEditEmp.selfScheduled,
        employeeNumber: modalEditEmp.employeeNumber,
        street: modalEditEmp.street,
        city: modalEditEmp.city,
        contractHoursLimit: limit,
        employmentStatus: modalEditEmp.employmentStatus,
        defaultWorkplace: modalEditEmp.defaultWorkplace,
        photoUrl: modalEditEmp.photoUrl,
      });

      setEmployees(employees.map(e => e.id === modalEditEmp.id ? modalEditEmp : e));
      setSelectedEmp(modalEditEmp);
      setIsEditingInModal(false);
      showNotification('Údaje pracovníka byly úspěšně uloženy.');
    } catch (err: any) {
      showNotification(err.message || 'Chyba při ukládání změn', 'error');
    }
  };

  // Filtrování zaměstnanců
  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      emp.fullName.toLowerCase().includes(q) ||
      (emp.employeeNumber && emp.employeeNumber.toLowerCase().includes(q)) ||
      (emp.city && emp.city.toLowerCase().includes(q)) ||
      (emp.phone && emp.phone.includes(q));

    const status = emp.employmentStatus || (emp.isActive ? 'Active' : 'Terminated');
    const matchStatus = statusFilter === 'All' || status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="relative z-10 min-h-screen bg-transparent text-[#232B28] flex flex-col font-sans">
      {/* Horní navigační lišta Nového Adminu (v2) */}
      <header className="bg-[#193F34] border-b border-[#285446] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo Greenberg & V2 Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-white/95 px-2 py-1 rounded-[8px] flex items-center justify-center shadow-xs">
              <img
                src={GREENBERG_LOGO}
                alt="Greenberg"
                className="h-6 w-auto object-contain shrink-0"
              />
            </div>
            <div className="border-l border-[#285446] pl-3 py-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight font-heading text-[#F7F3E9] block leading-tight">Greenberg</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  ADMIN v2
                </span>
              </div>
              <span className="text-[11px] text-[#A3B899] block mt-0.5 font-medium">
                Moderní provozní správa
              </span>
            </div>
          </div>

          {/* Přepínač záložek (7 sekcí dle docházka.docx) */}
          <nav className="flex items-center gap-1 bg-[#102E26] p-1 rounded-xl border border-[#285446] overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'employees'
                  ? 'bg-[#D7BE97] text-[#193F34] font-bold shadow-sm'
                  : 'text-[#C9DDD0] hover:text-[#F7F3E9]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1. Zaměstnanci</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-[#D7BE97] text-[#193F34] font-bold shadow-sm'
                  : 'text-[#C9DDD0] hover:text-[#F7F3E9]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>2. Zakázky</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-[#D7BE97] text-[#193F34] font-bold shadow-sm'
                  : 'text-[#C9DDD0] hover:text-[#F7F3E9]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3. Sklad materiálu</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'bg-[#D7BE97] text-[#193F34] font-bold shadow-sm'
                  : 'text-[#C9DDD0] hover:text-[#F7F3E9]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>4. Docházka</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('production')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'production'
                  ? 'bg-[#D7BE97] text-[#193F34] font-bold shadow-sm'
                  : 'text-[#C9DDD0] hover:text-[#F7F3E9]'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>5. Produkce</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-[#D7BE97] text-[#193F34] font-bold shadow-sm'
                  : 'text-[#C9DDD0] hover:text-[#F7F3E9]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>6. Nástěnka</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-[#D7BE97] text-[#193F34] font-bold shadow-sm'
                  : 'text-[#C9DDD0] hover:text-[#F7F3E9]'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>7. Výkazy & Pásky</span>
            </button>
          </nav>

          {/* Pravá část: Přepínač na Původní Admin v1 + Kiosk + Odhlásit */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchToV1}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Přepnout zpět do původní administrace"
            >
              <span>Klasický Admin (v1)</span>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onGoToKiosk}
              className="px-3 py-1.5 rounded-xl bg-[#285446] hover:bg-[#3E7361] text-[#F7F3E9] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Kiosk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors cursor-pointer"
              title="Odhlásit se"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Stavová notifikace */}
      {statusMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`p-3 rounded-xl flex items-center gap-2.5 text-sm font-medium shadow-md ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        </div>
      )}

      {/* HLAVNÍ OBSAH */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {activeTab === 'employees' && (
          <div className="space-y-6">
            {/* Horní řada: Tlačítko pro nový formulář + Vyhledávání a Filtry */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddForm ? 'Zavřít formulář' : 'Nový zaměstnanec / brigádník'}</span>
                  {showAddForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Hledat jméno, č.p., obec, tel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white/90 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white/90 border border-stone-300 rounded-xl p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('All')}
                    className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      statusFilter === 'All' ? 'bg-[#193F34] text-white' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Všichni ({employees.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('Active')}
                    className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      statusFilter === 'Active' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:text-emerald-900'
                    }`}
                  >
                    Aktivní
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('Troublemaker')}
                    className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      statusFilter === 'Troublemaker' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:text-amber-900'
                    }`}
                  >
                    ⚠️ Potížista
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('Terminated')}
                    className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      statusFilter === 'Terminated' ? 'bg-stone-500 text-white' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Ukončen
                  </button>
                </div>
              </div>
            </div>

            {/* Sbalený formulář "Nový zaměstnanec" (dle bodu 1 zadání) */}
            {showAddForm && (
              <div className="bg-white/95 backdrop-blur-sm border border-stone-300 rounded-2xl p-6 shadow-md transition-all">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-5">
                  <h3 className="font-heading font-bold text-lg text-[#193F34] flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <span>Zadání nového pracovníka do systému</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateEmployeeSubmit} className="space-y-5">
                  {/* Řada 1: Avatar / Foto + Základní identifikace */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {/* Foto / Avatar upload (pouze pro admina) */}
                    <div className="flex items-center gap-3 md:col-span-1">
                      <div className="w-16 h-16 rounded-full bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
                        {newPhotoUrl ? (
                          <img src={newPhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-6 h-6 text-stone-400" />
                        )}
                        <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, false)}
                          />
                        </label>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-stone-700 block">Avatar / Foto</span>
                        <span className="text-[11px] text-stone-500 block leading-tight">Pouze pro vizuální orientaci mistra</span>
                        <label className="inline-block mt-1 text-xs font-semibold text-[#193F34] hover:underline cursor-pointer">
                          Nahrát / vyfotit
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, false)}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Jméno a příjmení (placeholder Barbar Konan) */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Jméno a příjmení *
                      </label>
                      <input
                        type="text"
                        placeholder="např. Barbar Konan"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                      />
                    </div>

                    {/* Evidenční / Personální číslo */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Personální (evidenční) číslo *
                      </label>
                      <input
                        type="text"
                        placeholder="např. 104"
                        value={newEmployeeNumber}
                        onChange={(e) => setNewEmployeeNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                      />
                      <span className="text-[10px] text-stone-500">Klíč pro výplatnice a pásky z účtárny</span>
                    </div>

                    {/* 4místný PIN pro kiosek */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Přístupový PIN (4 číslice) *
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="např. 1234"
                        value={newPinCode}
                        onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-mono font-bold text-stone-900 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                      />
                    </div>
                  </div>

                  {/* Řada 2: Adresa (Ulice a Obec samostatně) + Telefon & Banka */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Ulice č.p.</label>
                      <input
                        type="text"
                        placeholder="např. Polní 12"
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Obec / Město</label>
                      <input
                        type="text"
                        placeholder="např. Brno"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                      />
                      <span className="text-[10px] text-stone-500">Zobrazuje se v hlavní tabulce</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Telefon</label>
                      <input
                        type="text"
                        placeholder="xxx xxx xxx"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Bankovní účet (výplata)</label>
                      <input
                        type="text"
                        placeholder="123456789/0100"
                        value={newBankAccount}
                        onChange={(e) => setNewBankAccount(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                      />
                    </div>
                  </div>

                  {/* Řada 3: Smlouva a fond hodin + Režim + Stav smlouvy */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Typ smlouvy dle zadání */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Typ smlouvy (fond)</label>
                      <select
                        value={newContractType}
                        onChange={(e) => setNewContractType(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                      >
                        <option value="DPP (300 hodin)">DPP (300 hodin / rok)</option>
                        <option value="DPČ 32 hodin">DPČ 32 hodin / měsíc</option>
                        <option value="DPČ 80 hodin">DPČ 80 hodin / měsíc</option>
                        <option value="HPP 40 hodin">HPP 40 hodin / měsíc</option>
                        <option value="HPP 80 hodin">HPP 80 hodin / měsíc</option>
                        <option value="HPP 160 hodin">HPP 160 hodin / měsíc</option>
                      </select>
                    </div>

                    {/* Pracovní režim */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Pracovní režim</label>
                      <select
                        value={newWorkRegime}
                        onChange={(e) => setNewWorkRegime(e.target.value as 'self' | 'scheduled')}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                      >
                        <option value="self">Samorozvrhování (bez příplatků)</option>
                        <option value="scheduled">Plánované směny na dílně</option>
                      </select>
                    </div>

                    {/* Místo realizace */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Místo realizace</label>
                      <select
                        value={newDefaultWorkplace}
                        onChange={(e) => setNewDefaultWorkplace(e.target.value as 'Doma' | 'Na dílně')}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                      >
                        <option value="Na dílně">Na dílně</option>
                        <option value="Doma">Doma</option>
                      </select>
                    </div>

                    {/* Stav smlouvy (včetně stavu Potížista) */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Stav smlouvy</label>
                      <select
                        value={newEmploymentStatus}
                        onChange={(e) => setNewEmploymentStatus(e.target.value as any)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#193F34] ${
                          newEmploymentStatus === 'Troublemaker'
                            ? 'bg-amber-50 border-amber-400 text-amber-900'
                            : newEmploymentStatus === 'Terminated'
                            ? 'bg-stone-100 border-stone-400 text-stone-700'
                            : 'bg-emerald-50 border-emerald-400 text-emerald-900'
                        }`}
                      >
                        <option value="Active">Aktivní</option>
                        <option value="Troublemaker">⚠️ Potížista (varovná značka)</option>
                        <option value="Terminated">Ukončen</option>
                      </select>
                    </div>
                  </div>

                  {/* Tlačítko uložení */}
                  <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                    >
                      Zrušit
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Uložit nového zaměstnance</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PŘEHLEDOVÁ TABULKA ZAMĚSTNANCŮ (6 POŽADOVANÝCH SLOUPCŮ DLE DOKUMENTU) */}
            <div className="bg-white/95 backdrop-blur-sm border border-stone-300 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#193F34]">
                    Evidence pracovníků ({filteredEmployees.length})
                  </h3>
                  <span className="text-xs text-stone-500">
                    Kliknutím na jméno pracovníka otevřete kompletní Personální list k editaci a tisku
                  </span>
                </div>
                {loadingEmployees && (
                  <span className="text-xs font-semibold text-emerald-700 animate-pulse">
                    Aktualizuji data...
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-800">
                  <thead className="bg-stone-100/90 text-xs uppercase font-bold text-stone-600 border-b border-stone-200">
                    <tr>
                      <th className="px-5 py-3.5">1. Jméno a příjmení</th>
                      <th className="px-5 py-3.5">2. Telefon</th>
                      <th className="px-5 py-3.5">3. Obec</th>
                      <th className="px-5 py-3.5">4. Typ smlouvy / Zbytek hodin</th>
                      <th className="px-5 py-3.5">5. Stav smlouvy</th>
                      <th className="px-5 py-3.5">6. Přidělená zakázka + úkon / Režim / Místo</th>
                      <th className="px-4 py-3.5 text-right">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {filteredEmployees.map((emp) => {
                      const status = emp.employmentStatus || (emp.isActive ? 'Active' : 'Terminated');
                      const limit = emp.contractHoursLimit || getContractLimit(emp.contractType);
                      const worked = emp.workedHours || 0;
                      const remaining = Math.max(0, limit - worked);

                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-amber-50/50 transition-colors cursor-pointer group"
                          onClick={() => {
                            setSelectedEmp(emp);
                            setModalEditEmp({ ...emp });
                            setIsEditingInModal(false);
                          }}
                        >
                          {/* 1. Jméno a příjmení s avatarem (pouze pro admina) a osobním číslem */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center overflow-hidden shrink-0">
                                {emp.photoUrl ? (
                                  <img src={emp.photoUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-stone-600">
                                    {emp.fullName.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-[#193F34] group-hover:text-emerald-700 block transition-colors">
                                  {emp.fullName}
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-mono">
                                  {emp.employeeNumber ? (
                                    <span className="font-semibold text-emerald-800">
                                      #{emp.employeeNumber}
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 italic">Bez č.p.</span>
                                  )}
                                  <span>• PIN: {emp.pinCode}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Telefon */}
                          <td className="px-5 py-3.5 text-xs font-medium text-stone-700">
                            {emp.phone ? (
                              <a
                                href={`tel:${emp.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3.5 h-3.5 text-stone-400" />
                                <span>{emp.phone}</span>
                              </a>
                            ) : (
                              <span className="text-stone-400 italic">Neuvedeno</span>
                            )}
                          </td>

                          {/* 3. Obec */}
                          <td className="px-5 py-3.5 text-xs text-stone-700">
                            {emp.city ? (
                              <span className="font-medium flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                                {emp.city}
                              </span>
                            ) : (
                              <span className="text-stone-400 italic">—</span>
                            )}
                          </td>

                          {/* 4. Typ smlouvy / Zbytek hodin */}
                          <td className="px-5 py-3.5 text-xs">
                            <span className="font-semibold text-stone-900 block">
                              {emp.contractType || 'DPP (300 hodin)'}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px]">
                              <span className="text-emerald-700 font-bold">{remaining} h zbývá</span>
                              <span className="text-stone-400">/ {limit} h</span>
                            </div>
                          </td>

                          {/* 5. Stav smlouvy (Aktivní, Ukončen, Potížista) */}
                          <td className="px-5 py-3.5">
                            {status === 'Troublemaker' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-amber-700" />
                                <span>POTÍŽISTA</span>
                              </span>
                            ) : status === 'Terminated' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200 text-stone-700">
                                Ukončen
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                Aktivní
                              </span>
                            )}
                          </td>

                          {/* 6. Přidělená zakázka + úkon / Pracovní režim / Místo realizace */}
                          <td className="px-5 py-3.5 text-xs text-stone-700">
                            <span className="font-semibold text-stone-900 block truncate max-w-[220px]">
                              {emp.assignedOrderInfo || 'Krabice 500ks – Lepení pásky'}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                              <span className="px-1.5 py-0.2 rounded bg-stone-100 border border-stone-200">
                                {emp.selfScheduled ? 'Samorozvrhování' : 'Plánované směny'}
                              </span>
                              <span className="font-medium text-stone-600">
                                📍 {emp.defaultWorkplace || 'Na dílně'}
                              </span>
                            </div>
                          </td>

                          {/* Akce: Otevřít */}
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEmp(emp);
                                setModalEditEmp({ ...emp });
                                setIsEditingInModal(false);
                              }}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-[#193F34] hover:bg-stone-200/60 transition-colors cursor-pointer"
                              title="Otevřít personální kartu"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-stone-500">
                          Nenalezen žádný pracovník odpovídající filtru.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FÁZE 2: ZAKÁZKY (ZAKÁZKOVÝ LIST & ARCHIV & OPERACE & PŘIŘAZENÍ BRIGÁDNÍKŮ) */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Horní řada: Tlačítka pro 3 sbalené formuláře + Přepínač Aktivní / Archiv */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Tři sbalená tlačítka formulářů dle požadavku dokumentu */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenOrderForm(openOrderForm === 'newOrder' ? 'none' : 'newOrder')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                    openOrderForm === 'newOrder'
                      ? 'bg-[#193F34] text-white ring-2 ring-emerald-500'
                      : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300'
                  }`}
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>1. Nová zakázka</span>
                  {openOrderForm === 'newOrder' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setOpenOrderForm(openOrderForm === 'newOp' ? 'none' : 'newOp')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                    openOrderForm === 'newOp'
                      ? 'bg-[#193F34] text-white ring-2 ring-emerald-500'
                      : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300'
                  }`}
                >
                  <Settings className="w-4 h-4 text-amber-600" />
                  <span>2. Operace, normy & sazby</span>
                  {openOrderForm === 'newOp' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setOpenOrderForm(openOrderForm === 'assignWorker' ? 'none' : 'assignWorker')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                    openOrderForm === 'assignWorker'
                      ? 'bg-[#193F34] text-white ring-2 ring-emerald-500'
                      : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-300'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  <span>3. Přiřadit brigádníky na zakázku</span>
                  {openOrderForm === 'assignWorker' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Přepínač Aktivní zakázky / Archiv */}
              <div className="flex items-center gap-1 bg-white/90 border border-stone-300 rounded-xl p-1 text-xs font-semibold self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setOrderArchiveView('active')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    orderArchiveView === 'active'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aktivní zakázky ({orders.filter(o => o.isActive !== false).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderArchiveView('archive')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    orderArchiveView === 'archive'
                      ? 'bg-stone-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archiv ukončených ({orders.filter(o => o.isActive === false).length})</span>
                </button>
              </div>
            </div>

            {/* FORMULÁŘ 1: NOVÁ ZAKÁZKA (Sbalený, rozbalí se po kliknutí) */}
            {openOrderForm === 'newOrder' && (
              <div className="bg-white/95 border border-stone-300 rounded-2xl p-6 shadow-md transition-all">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-5">
                  <h3 className="font-heading font-bold text-base text-[#193F34] flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-600" />
                    <span>Formulář 1: Založení nové zakázky do výroby</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpenOrderForm('none')}
                    className="text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveOrderSubmit} className="space-y-4 text-xs">
                  {/* Řada 1: Název, Stav, Termíny (od-do) + výpočet zbývá dní */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block font-bold text-stone-700 mb-1">Název zakázky *</label>
                      <input
                        type="text"
                        placeholder="např. Výroba dárkových krabic s mašlí"
                        value={orderName}
                        onChange={(e) => setOrderName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#193F34]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Stav zakázky</label>
                      <select
                        value={orderStatus ? 'active' : 'inactive'}
                        onChange={(e) => setOrderStatus(e.target.value === 'active')}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-900"
                      >
                        <option value="active">Aktivní zakázka</option>
                        <option value="inactive">Ukončeno (do archivu)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Místo realizace</label>
                      <select
                        value={orderWorkplaceMode}
                        onChange={(e) => setOrderWorkplaceMode(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-semibold text-stone-900"
                      >
                        <option value="Na dílně">Na dílně</option>
                        <option value="Doma">Doma</option>
                      </select>
                    </div>
                  </div>

                  {/* Řada 2: Termín zahájení a ukončení + Min a Max kusy */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Zahájení (od)</label>
                      <input
                        type="date"
                        value={orderStartDate}
                        onChange={(e) => setOrderStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Ukončení (do)
                        {orderEndDate && (
                          <span className="ml-1 text-[11px] font-bold text-emerald-700">
                            ({getRemainingDays(orderEndDate)} dní zbývá)
                          </span>
                        )}
                      </label>
                      <input
                        type="date"
                        value={orderEndDate}
                        onChange={(e) => setOrderEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-medium text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Cílový počet kusů: MIN</label>
                      <input
                        type="number"
                        placeholder="např. 500"
                        value={orderMinPieces}
                        onChange={(e) => setOrderMinPieces(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Cílový počet kusů: MAX</label>
                      <input
                        type="number"
                        placeholder="např. 1000"
                        value={orderMaxPieces}
                        onChange={(e) => setOrderMaxPieces(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                      />
                    </div>
                  </div>

                  {/* Řada 3: Kontakty na koordinátora a zákazníka */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Kontakt na koordinátora zakázky (Jméno + telefon)
                      </label>
                      <input
                        type="text"
                        placeholder="např. Marta Chorobiková (+420 777 000 111)"
                        value={orderCoordinatorContact}
                        onChange={(e) => setOrderCoordinatorContact(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Kontaktní údaj na zákazníka
                      </label>
                      <input
                        type="text"
                        placeholder="např. Alza a.s. – pan Novák (zakazky@alza.cz)"
                        value={orderCustomerContact}
                        onChange={(e) => setOrderCustomerContact(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900"
                      />
                    </div>
                  </div>

                  {/* Řada 4: Popis zakázky, Popis balení a Expedice */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Popis zakázky</label>
                      <textarea
                        rows={2}
                        placeholder="Detailní postup práce, specifika výroby..."
                        value={orderDesc}
                        onChange={(e) => setOrderDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Popis balení</label>
                      <textarea
                        rows={2}
                        placeholder="Do krabic po 50 ks, proložit hedvábným papírem..."
                        value={orderPackagingDesc}
                        onChange={(e) => setOrderPackagingDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Expedice / logistika</label>
                      <textarea
                        rows={2}
                        placeholder="Vyzvednutí kurýrem v pátek ve 14:00, paletová přeprava..."
                        value={orderLogisticsDesc}
                        onChange={(e) => setOrderLogisticsDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => setOpenOrderForm('none')}
                      className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer font-semibold"
                    >
                      Zrušit
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Uložit zakázku do systému</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* FORMULÁŘ 2: OPERACE, HODINOVÉ NORMY A SAZBY (Sbalený) */}
            {openOrderForm === 'newOp' && (
              <div className="bg-white/95 border border-stone-300 rounded-2xl p-6 shadow-md transition-all">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-5">
                  <h3 className="font-heading font-bold text-base text-[#193F34] flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-600" />
                    <span>Formulář 2: Definice operace, hodinové normy a sazby</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpenOrderForm('none')}
                    className="text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveOperationSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Přiřadit k zakázce</label>
                      <select
                        value={opOrderId}
                        onChange={(e) => setOpOrderId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 font-semibold"
                      >
                        <option value="">-- Společná pro všechny zakázky --</option>
                        {orders.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Název operace *</label>
                      <input
                        type="text"
                        placeholder="např. Lepení magnetů, Kompletace krabiček"
                        value={opName}
                        onChange={(e) => setOpName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 font-semibold"
                      />
                    </div>

                    {/* Status operace dle zadání (Pomocné práce vs Finální fáze) */}
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Typ a status operace *</label>
                      <select
                        value={opStage}
                        onChange={(e) => setOpStage(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-900"
                      >
                        <option value="Final">Finální fáze (produkuje hotové kusy do soupisu zakázky)</option>
                        <option value="Auxiliary">Pomocné práce (rozpracovanost / příprava)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Hodinová norma (ks/hod) *
                      </label>
                      <input
                        type="number"
                        value={opNormPerHour}
                        onChange={(e) => setOpNormPerHour(parseInt(e.target.value, 10) || 100)}
                        required
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                      />
                      <span className="text-[10px] text-stone-500">Předpokládaný výkon za hodinu pro normočas</span>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Cena za 1 ks (Kč/ks) *
                      </label>
                      <input
                        type="text"
                        value={opRatePerPiece}
                        onChange={(e) => setOpRatePerPiece(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-emerald-800"
                      />
                      <span className="text-[10px] text-stone-500">Sazba pro výpočet odměny a normohodin</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => setOpenOrderForm('none')}
                      className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer font-semibold"
                    >
                      Zrušit
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Uložit operaci</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* FORMULÁŘ 3: PŘIŘADIT BRIGÁDNÍKY NA ZAKÁZKU (Sbalený) */}
            {openOrderForm === 'assignWorker' && (
              <div className="bg-white/95 border border-stone-300 rounded-2xl p-6 shadow-md transition-all">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-5">
                  <h3 className="font-heading font-bold text-base text-[#193F34] flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-sky-600" />
                    <span>Formulář 3: Přiřazení brigádníka na zakázku a úkon</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpenOrderForm('none')}
                    className="text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAssignWorkerSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Výběr brigádníka *</label>
                      <select
                        value={assignWorkerEmpId}
                        onChange={(e) => setAssignWorkerEmpId(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-900"
                      >
                        <option value="">-- Vyberte pracovníka --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.fullName} {emp.employeeNumber ? `(#${emp.employeeNumber})` : ''} {emp.employmentStatus === 'Troublemaker' ? '⚠️' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Výběr zakázky *</label>
                      <select
                        value={assignWorkerOrderId}
                        onChange={(e) => setAssignWorkerOrderId(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-900"
                      >
                        <option value="">-- Vyberte zakázku --</option>
                        {orders.filter(o => o.isActive !== false).map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Přiřazená operace</label>
                      <select
                        value={assignWorkerOpId}
                        onChange={(e) => setAssignWorkerOpId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-semibold text-stone-900"
                      >
                        <option value="">-- Všechny operace / Celá zakázka --</option>
                        {operations.filter(op => !assignWorkerOrderId || !op.orderId || op.orderId === parseInt(assignWorkerOrderId, 10)).map(op => (
                          <option key={op.id} value={op.id}>
                            {op.name} ({op.ratePerPiece} Kč/ks, {op.operationStage === 'Auxiliary' ? 'Pomocné' : 'Finální'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Množství kusů ke zpracování *</label>
                      <input
                        type="number"
                        value={assignWorkerPieces}
                        onChange={(e) => setAssignWorkerPieces(parseInt(e.target.value, 10) || 0)}
                        required
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono font-bold text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Termín předání hotových kusů</label>
                      <input
                        type="date"
                        value={assignWorkerDeadline}
                        onChange={(e) => setAssignWorkerDeadline(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Místo realizace</label>
                      <select
                        value={assignWorkerWorkplace}
                        onChange={(e) => setAssignWorkerWorkplace(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-semibold text-stone-900"
                      >
                        <option value="Na dílně">Na dílně</option>
                        <option value="Doma">Doma</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Poznámka / instrukce pro brigádníka</label>
                    <input
                      type="text"
                      placeholder="např. Převzal materiál v úterý v 9:00, vrácení do pátku..."
                      value={assignWorkerNote}
                      onChange={(e) => setAssignWorkerNote(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => setOpenOrderForm('none')}
                      className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer font-semibold"
                    >
                      Zrušit
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl font-bold text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Přiřadit brigádníka na zakázku</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PŘEHLEDOVÁ TABULKA ZAKÁZEK (+ TISK ZAKÁZKOVÉHO LISTU PO KLIKU NA NÁZEV) */}
            <div className="bg-white/95 backdrop-blur-sm border border-stone-300 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#193F34]">
                    {orderArchiveView === 'active' ? 'Aktivní výrobní zakázky' : 'Archiv ukončených zakázek'}
                  </h3>
                  <span className="text-xs text-stone-500">
                    Kliknutím na název zakázky otevřete a vytisknete kompletní <strong>Zakázkový list</strong>
                  </span>
                </div>
                {loadingOrders && (
                  <span className="text-xs font-semibold text-emerald-700 animate-pulse">
                    Aktualizuji data...
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-800">
                  <thead className="bg-stone-100/90 text-xs uppercase font-bold text-stone-600 border-b border-stone-200">
                    <tr>
                      <th className="px-5 py-3.5">Název zakázky (Zakázkový list)</th>
                      <th className="px-5 py-3.5">Termín & Dny</th>
                      <th className="px-5 py-3.5">Plnění (Hotovo / Požadavek)</th>
                      <th className="px-5 py-3.5">Místo realizace</th>
                      <th className="px-5 py-3.5">Přiřazení brigádníci</th>
                      <th className="px-4 py-3.5 text-right">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {orders
                      .filter(ord => orderArchiveView === 'active' ? ord.isActive !== false : ord.isActive === false)
                      .map((ord) => {
                        const target = ord.totalPiecesTarget || ord.targetPieces || 0;
                        const completed = ord.completedPieces || 0;
                        const pct = ord.percentDone || (target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0);
                        const daysLeft = getRemainingDays(ord.endDate || ord.deadline);
                        const assignedForThisOrder = orderAssignments.filter(a => a.orderId === ord.id);

                        return (
                          <tr
                            key={ord.id}
                            className="hover:bg-amber-50/50 transition-colors cursor-pointer group"
                            onClick={() => handleOpenOrderSheet(ord)}
                          >
                            {/* Název zakázky - klikací pro Zakázkový list */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-700 shrink-0 group-hover:scale-110 transition-transform" />
                                <div>
                                  <span className="font-bold text-[#193F34] group-hover:underline text-sm block">
                                    {ord.name}
                                  </span>
                                  {ord.description && (
                                    <span className="text-[11px] text-stone-500 block truncate max-w-xs">
                                      {ord.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Termín & Zbývá dní */}
                            <td className="px-5 py-3.5 text-xs">
                              <span className="font-medium text-stone-800 block">
                                {ord.startDate ? `${ord.startDate} → ` : ''}{ord.endDate || ord.deadline || 'Bez termínu'}
                              </span>
                              {daysLeft !== null && (
                                <span className={`text-[11px] font-bold ${daysLeft < 0 ? 'text-rose-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-emerald-700'}`}>
                                  {daysLeft < 0 ? `Zpožděno o ${Math.abs(daysLeft)} dní` : `Zbývá ${daysLeft} dní`}
                                </span>
                              )}
                            </td>

                            {/* Plnění ks (Min/Max a Progres) */}
                            <td className="px-5 py-3.5 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-stone-900 text-sm">
                                  {completed} ks
                                </span>
                                <span className="text-stone-500">
                                  / {target ? `${target} ks` : (ord.minTargetPieces ? `min ${ord.minTargetPieces} ks` : '—')}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  {pct}%
                                </span>
                              </div>
                              <div className="w-36 bg-stone-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </td>

                            {/* Místo realizace */}
                            <td className="px-5 py-3.5 text-xs text-stone-700">
                              <span className="inline-flex items-center gap-1 font-semibold">
                                📍 {ord.workplaceMode || 'Na dílně'}
                              </span>
                            </td>

                            {/* Přiřazení brigádníci */}
                            <td className="px-5 py-3.5 text-xs text-stone-700">
                              {assignedForThisOrder.length > 0 ? (
                                <div className="space-y-1">
                                  {assignedForThisOrder.slice(0, 2).map(a => (
                                    <div key={a.id} className="flex items-center gap-1 text-[11px]">
                                      <span className="font-bold text-stone-900">{a.employeeName}</span>
                                      <span className="text-stone-500 font-mono">({a.assignedPieces} ks)</span>
                                    </div>
                                  ))}
                                  {assignedForThisOrder.length > 2 && (
                                    <span className="text-[10px] text-stone-400 italic">
                                      + dalších {assignedForThisOrder.length - 2} brigádníků
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-stone-400 italic">Zatím nepřiřazeni</span>
                              )}
                            </td>

                            {/* Akce: Zakázkový list */}
                            <td className="px-4 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenOrderSheet(ord);
                                }}
                                className="px-3 py-1.5 bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] rounded-xl text-xs font-bold flex items-center gap-1 ml-auto cursor-pointer shadow-xs transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5 text-[#D7BE97]" />
                                <span>Zakázkový list</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                    {orders.filter(ord => orderArchiveView === 'active' ? ord.isActive !== false : ord.isActive === false).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                          {orderArchiveView === 'active' ? 'Žádné aktivní zakázky v systému.' : 'Archiv je prázdný.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PŘEHLED DEFINOVANÝCH OPERACÍ A PŘIŘAZENÝCH BRIGÁDNÍKŮ NA ZAKÁZKY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Soupis operací s rozlišením Finální fáze vs Pomocné práce */}
              <div className="bg-white/95 border border-stone-300 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <h4 className="font-heading font-bold text-sm text-[#193F34] flex items-center gap-2">
                    <Settings className="w-4 h-4 text-amber-600" />
                    <span>Číselník výrobních operací ({operations.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setOpenOrderForm('newOp')}
                    className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Přidat</span>
                  </button>
                </div>

                <div className="divide-y divide-stone-200 max-h-80 overflow-y-auto pr-1">
                  {operations.map(op => (
                    <div key={op.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-stone-900 block text-sm">{op.name}</span>
                        <div className="flex items-center gap-2 text-stone-500 mt-0.5 font-mono">
                          <span>Norma: {op.normPerHour} ks/h</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-800">{op.ratePerPiece.toFixed(2)} Kč/ks</span>
                          {op.orderName && (
                            <span className="px-1.5 py-0.2 rounded bg-stone-100 text-[10px] font-sans">
                              {op.orderName}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        op.operationStage === 'Auxiliary'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {op.operationStage === 'Auxiliary' ? 'Pomocné práce' : 'Finální fáze'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seznam přiřazených brigádníků na zakázky */}
              <div className="bg-white/95 border border-stone-300 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <h4 className="font-heading font-bold text-sm text-[#193F34] flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-sky-600" />
                    <span>Aktivní přiřazení brigádníků ({orderAssignments.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setOpenOrderForm('assignWorker')}
                    className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Přiřadit</span>
                  </button>
                </div>

                <div className="divide-y divide-stone-200 max-h-80 overflow-y-auto pr-1">
                  {orderAssignments.map(a => (
                    <div key={a.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900">{a.employeeName}</span>
                          <span className="text-stone-400">→</span>
                          <span className="font-semibold text-emerald-900">{a.orderName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-500 mt-0.5 text-[11px]">
                          <span>Úkon: {a.operationName}</span>
                          <span>•</span>
                          <span className="font-mono font-bold text-stone-800">Přiděleno: {a.assignedPieces} ks</span>
                          <span>•</span>
                          <span>Místo: {a.workplace}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {a.deadlineDate && (
                          <span className="text-[10px] text-stone-500 font-mono">
                            do {a.deadlineDate}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                          title="Odebrat přiřazení"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {orderAssignments.length === 0 && (
                    <div className="py-8 text-center text-xs text-stone-400">
                      Zatím nebyl k žádné zakázce přiřazen žádný brigádník.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODÁLNÍ OKNO / TISKOVÁ SESTAVA: ZAKÁZKOVÝ LIST */}
        {selectedOrderSheet && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              {/* Tlačítka horní lišty zakázkového listu */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <div className="bg-[#193F34] text-white p-2 rounded-xl">
                    <FileText className="w-5 h-5 text-[#D7BE97]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-bold text-[#193F34]">
                      Zakázkový list (Výrobní příkaz)
                    </h2>
                    <span className="text-xs text-stone-500">
                      Dokumentace zakázky, operací a přiřazených pracovníků
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#D7BE97]" />
                    <span>Vytisknout Zakázkový list (A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrderSheet(null);
                      setOrderSheetDetail(null);
                    }}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Tělo Zakázkového listu */}
              <div className="space-y-6 text-stone-900">
                {/* Hlavička zakázky */}
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-stone-400 block">Zakázka</span>
                    <span className="text-base font-bold text-[#193F34] block">{selectedOrderSheet.name}</span>
                    <span className="text-xs text-stone-600 mt-1 block">{selectedOrderSheet.description || 'Bez popisu'}</span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase text-stone-400 block">Termíny & Místo</span>
                    <span className="text-xs font-medium text-stone-800 block mt-0.5">
                      Zahájení: {selectedOrderSheet.startDate || '—'}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 block">
                      Ukončení: {selectedOrderSheet.endDate || selectedOrderSheet.deadline || '—'}
                    </span>
                    <span className="text-xs font-semibold text-stone-700 block mt-1">
                      Místo realizace: {selectedOrderSheet.workplaceMode || 'Na dílně'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase text-stone-400 block">Cílové kusy & Kontakty</span>
                    <span className="text-xs font-mono font-bold text-stone-900 block mt-0.5">
                      Min: {selectedOrderSheet.minTargetPieces || '—'} ks | Max: {selectedOrderSheet.maxTargetPieces || selectedOrderSheet.totalPiecesTarget || '—'} ks
                    </span>
                    <span className="text-xs text-stone-600 block mt-1">
                      Koordinátor: {selectedOrderSheet.coordinatorContact || 'Marta Chorobiková'}
                    </span>
                    <span className="text-xs text-stone-600 block">
                      Zákazník: {selectedOrderSheet.customerContact || '—'}
                    </span>
                  </div>
                </div>

                {/* Popis balení a Expedice */}
                {(selectedOrderSheet.packagingDesc || selectedOrderSheet.logisticsDesc) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedOrderSheet.packagingDesc && (
                      <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                        <span className="font-bold text-xs uppercase text-amber-900 block mb-1">Popis balení</span>
                        <p className="text-xs text-stone-800">{selectedOrderSheet.packagingDesc}</p>
                      </div>
                    )}
                    {selectedOrderSheet.logisticsDesc && (
                      <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200">
                        <span className="font-bold text-xs uppercase text-sky-900 block mb-1">Expedice & Logistika</span>
                        <p className="text-xs text-stone-800">{selectedOrderSheet.logisticsDesc}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Výrobní operace zakázky */}
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#193F34] uppercase tracking-wider mb-2">
                    Výrobní operace a normy
                  </h4>
                  <table className="w-full text-left text-xs border border-stone-200 rounded-xl overflow-hidden">
                    <thead className="bg-stone-100 font-bold text-stone-600">
                      <tr>
                        <th className="px-3 py-2">Operace</th>
                        <th className="px-3 py-2">Fáze</th>
                        <th className="px-3 py-2">Norma ks/h</th>
                        <th className="px-3 py-2">Sazba Kč/ks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {operations.filter(op => !op.orderId || op.orderId === selectedOrderSheet.id).map(op => (
                        <tr key={op.id}>
                          <td className="px-3 py-2 font-bold text-stone-900">{op.name}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              op.operationStage === 'Auxiliary' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {op.operationStage === 'Auxiliary' ? 'Pomocné práce' : 'Finální fáze'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono">{op.normPerHour} ks/h</td>
                          <td className="px-3 py-2 font-mono font-bold text-emerald-800">{op.ratePerPiece.toFixed(2)} Kč</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Soupis přiřazených brigádníků a plnění */}
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#193F34] uppercase tracking-wider mb-2">
                    Přiřazení brigádníci a stav plnění
                  </h4>
                  <table className="w-full text-left text-xs border border-stone-200 rounded-xl overflow-hidden">
                    <thead className="bg-stone-100 font-bold text-stone-600">
                      <tr>
                        <th className="px-3 py-2">Pracovník</th>
                        <th className="px-3 py-2">Operace</th>
                        <th className="px-3 py-2">Přiděleno</th>
                        <th className="px-3 py-2">Hotovo</th>
                        <th className="px-3 py-2">Místo</th>
                        <th className="px-3 py-2">Termín předání</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {orderAssignments.filter(a => a.orderId === selectedOrderSheet.id).map(a => (
                        <tr key={a.id}>
                          <td className="px-3 py-2 font-bold text-stone-900">{a.employeeName}</td>
                          <td className="px-3 py-2">{a.operationName}</td>
                          <td className="px-3 py-2 font-mono font-bold">{a.assignedPieces} ks</td>
                          <td className="px-3 py-2 font-mono text-emerald-700 font-bold">{a.donePieces || 0} ks</td>
                          <td className="px-3 py-2">{a.workplace}</td>
                          <td className="px-3 py-2 font-mono">{a.deadlineDate || '—'}</td>
                        </tr>
                      ))}
                      {orderAssignments.filter(a => a.orderId === selectedOrderSheet.id).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-stone-400 italic">
                            K této zakázce zatím nejsou přiřazeni žádní brigádníci.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Spodní akce */}
              <div className="pt-4 border-t border-stone-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrderSheet(null);
                    setOrderSheetDetail(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
                >
                  Zavřít
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FÁZE 3: SKLAD MATERIÁLU (PŘÍJEM OD ZÁKAZNÍKA, VÝDEJ BRIGÁDNÍKŮM & PŘEBÍRACÍ/PŘEDÁVACÍ PROTOKOLY) */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Horní řada: Tlačítka sbalených formulářů + Filtr zakázky + Přepínač pohledů */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Tlačítka pro rozbalení 2 formulářů */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenMaterialForm(openMaterialForm === 'receive' ? 'none' : 'receive')}
                  className={`px-4 py-2.5 rounded-xl font-heading font-bold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                    openMaterialForm === 'receive'
                      ? 'bg-[#193F34] text-[#F7F3E9] ring-2 ring-[#D7BE97]'
                      : 'bg-[#D7BE97] text-[#193F34] hover:bg-[#c9b28a]'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>1. Příjem materiálu od zákazníka</span>
                  {openMaterialForm === 'receive' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </button>

                <button
                  type="button"
                  onClick={() => setOpenMaterialForm(openMaterialForm === 'dispatch' ? 'none' : 'dispatch')}
                  className={`px-4 py-2.5 rounded-xl font-heading font-bold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                    openMaterialForm === 'dispatch'
                      ? 'bg-[#193F34] text-[#F7F3E9] ring-2 ring-[#D7BE97]'
                      : 'bg-white border-2 border-[#193F34] text-[#193F34] hover:bg-stone-50'
                  }`}
                >
                  <Send className="w-4 h-4 text-emerald-700" />
                  <span>2. Výdej materiálu brigádníkovi</span>
                  {openMaterialForm === 'dispatch' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </button>
              </div>

              {/* Přepínač: Stav zásob vs Historie výdejek + Filtr zakázky */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-600 uppercase">Zakázka:</span>
                  <select
                    value={selectedMaterialOrderId}
                    onChange={(e) => setSelectedMaterialOrderId(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-800 shadow-sm focus:ring-2 focus:ring-[#193F34]"
                  >
                    <option value="all">📦 Všechny zakázky (celý sklad)</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id.toString()}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div className="inline-flex bg-stone-200 p-1 rounded-xl shadow-inner">
                  <button
                    type="button"
                    onClick={() => setInventorySubTab('stock')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      inventorySubTab === 'stock'
                        ? 'bg-white text-[#193F34] shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Stav zásob materiálu ({materials.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventorySubTab('dispatches')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      inventorySubTab === 'dispatches'
                        ? 'bg-white text-[#193F34] shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Výdejky brigádníkům ({dispatches.length})
                  </button>
                </div>
              </div>
            </div>

            {/* SBALENÝ FORMULÁŘ 1: Příjem materiálu od zákazníka */}
            {openMaterialForm === 'receive' && (
              <div className="bg-white/95 border-2 border-[#D7BE97] rounded-2xl p-6 shadow-xl space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
                      📦
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-[#193F34]">Příjem materiálu od zákazníka k projektu</h3>
                      <p className="text-xs text-stone-500">Přiřazení dodaných komponent a surovin k zakázce s kontrolou pokrytí cílového počtu kusů</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenMaterialForm('none')}
                    className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveMaterialSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Výběr zakázky */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Přiřadit k zakázce *
                      </label>
                      <select
                        value={matOrderId}
                        onChange={(e) => {
                          setMatOrderId(e.target.value);
                          const ord = orders.find(o => o.id === parseInt(e.target.value, 10));
                          if (ord && ord.totalPiecesTarget > 0) {
                            setMatDeliveredQty(ord.totalPiecesTarget * matConsumption);
                          }
                        }}
                        required
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-[#193F34] focus:ring-2 focus:ring-[#193F34]"
                      >
                        <option value="">-- Vyberte zakázku --</option>
                        {orders.map(o => (
                          <option key={o.id} value={o.id.toString()}>
                            {o.name} {o.totalPiecesTarget > 0 ? `(Cíl: ${o.totalPiecesTarget} ks)` : ''}
                          </option>
                        ))}
                      </select>
                      {matOrderId && (() => {
                        const ord = orders.find(o => o.id === parseInt(matOrderId, 10));
                        if (!ord) return null;
                        return (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                            <span>Plánovaný cíl: <strong className="font-mono text-[#193F34]">{ord.totalPiecesTarget} ks</strong></span>
                            {ord.customerContact && <span>| Zákazník: <strong>{ord.customerContact}</strong></span>}
                            {ord.deadline && <span>| Termín expedice: <strong className="font-mono">{ord.deadline}</strong></span>}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Datum příjmu */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Datum převzetí
                      </label>
                      <input
                        type="date"
                        value={matReceivedAt}
                        onChange={(e) => setMatReceivedAt(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#193F34]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Název komponenty */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Název materiálu / komponenty *
                      </label>
                      <input
                        type="text"
                        value={matName}
                        onChange={(e) => setMatName(e.target.value)}
                        placeholder="např. Vnější krabička s ražbou, Červená stuha 25mm, Brožurka..."
                        required
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#193F34]"
                      />
                      {/* Rychlé štítky */}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {['Krabice / obal', 'Výplň / vložka', 'Stuha / mašle', 'Brožura / manuál', 'Etiketa / přelep', 'Výsek'].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setMatName(tag)}
                            className="text-[10px] px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded cursor-pointer"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dodané množství */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Dodané množství *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={matDeliveredQty}
                        onChange={(e) => setMatDeliveredQty(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-[#193F34]"
                      />
                    </div>

                    {/* Měrná jednotka */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Měrná jednotka
                      </label>
                      <select
                        value={matUnit}
                        onChange={(e) => setMatUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#193F34]"
                      >
                        <option value="ks">ks (kusy)</option>
                        <option value="m">m (metry)</option>
                        <option value="kg">kg (kilogramy)</option>
                        <option value="arch">arch (archů)</option>
                        <option value="balení">balení (bal.)</option>
                        <option value="role">role</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    {/* Spotřeba na 1 ks finálního výrobku */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Spotřeba na 1 ks finálu *
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0.0001"
                          step="any"
                          value={matConsumption}
                          onChange={(e) => setMatConsumption(parseFloat(e.target.value) || 1)}
                          required
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-[#193F34]"
                        />
                        <span className="text-xs font-bold text-stone-500">{matUnit} / ks</span>
                      </div>
                    </div>

                    {/* Automatická kontrola pokrytí */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Kontrola shody s cílem zakázky
                      </label>
                      {(() => {
                        const ord = orders.find(o => o.id === parseInt(matOrderId, 10));
                        const targetPcs = ord ? ord.totalPiecesTarget : 0;
                        const neededQty = targetPcs * matConsumption;
                        const isCovered = targetPcs > 0 ? (matDeliveredQty >= neededQty) : true;
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={matMatchesTarget}
                                  onChange={(e) => setMatMatchesTarget(e.target.checked)}
                                  className="w-4 h-4 text-[#193F34] rounded focus:ring-[#193F34]"
                                />
                                <span className="text-xs font-medium text-stone-800">
                                  Odpovídá počtu kusů (shoda s dodacím listem)
                                </span>
                              </label>
                            </div>
                            {targetPcs > 0 && (
                              <div className={`text-xs p-2 rounded-lg flex items-center gap-2 ${
                                isCovered ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {isCovered ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                                <span>
                                  Pro zakázku na <strong>{targetPcs} ks</strong> je při spotřebě {matConsumption} {matUnit}/ks potřeba <strong>{neededQty} {matUnit}</strong>.
                                  {isCovered
                                    ? ` Dodané množství plně pokrývá cíl (přebytek: +${(matDeliveredQty - neededQty).toFixed(1)} ${matUnit}).`
                                    : ` Pozor: Dodáno je o ${(neededQty - matDeliveredQty).toFixed(1)} ${matUnit} méně, než je potřeba!`}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Poznámka k příjmu */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Poznámka k příjmu (číslo dodacího listu, stav balení)
                    </label>
                    <input
                      type="text"
                      value={matNote}
                      onChange={(e) => setMatNote(e.target.value)}
                      placeholder="např. Dodací list č. 2026/099, paleta 1 z 2, bez zjevných vad..."
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#193F34]"
                    />
                  </div>

                  {/* Akční tlačítka */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-200 gap-3">
                    <div className="text-xs text-stone-500">
                      * Povinné položky pro evidenci skladu
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenMaterialForm('none')}
                        className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                      >
                        Zrušit
                      </button>
                      {matOrderId && (
                        <button
                          type="button"
                          onClick={() => {
                            const ord = orders.find(o => o.id === parseInt(matOrderId, 10));
                            if (ord) setSelectedPrintReceiptOrder(ord);
                          }}
                          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-stone-600" />
                          <span>Přebírací dokument k zakázce (A4)</span>
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#193F34] hover:bg-[#133229] text-[#F7F3E9] rounded-xl text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Uložit příjem materiálu</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* SBALENÝ FORMULÁŘ 2: Výdej materiálu brigádníkovi */}
            {openMaterialForm === 'dispatch' && (
              <div className="bg-white/95 border-2 border-emerald-600 rounded-2xl p-6 shadow-xl space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                      📤
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-[#193F34]">Výdej materiálu konkrétnímu brigádníkovi</h3>
                      <p className="text-xs text-stone-500">Automatický propočet potřebných komponent dle počtu kusů a vytvoření předávacího protokolu k elektronickému podpisu</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenMaterialForm('none')}
                    className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveDispatchSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Výběr zakázky */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        1. Vyberte zakázku *
                      </label>
                      <select
                        value={dispOrderId}
                        onChange={(e) => {
                          setDispOrderId(e.target.value);
                          setDispCustomQuantities({});
                        }}
                        required
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-[#193F34] focus:ring-2 focus:ring-[#193F34]"
                      >
                        <option value="">-- Vyberte zakázku --</option>
                        {orders.map(o => (
                          <option key={o.id} value={o.id.toString()}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Výběr brigádníka */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        2. Vyberte brigádníka *
                      </label>
                      <select
                        value={dispEmployeeId}
                        onChange={(e) => setDispEmployeeId(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-[#193F34] focus:ring-2 focus:ring-[#193F34]"
                      >
                        <option value="">-- Vyberte brigádníka --</option>
                        {dispOrderId && orderAssignments.filter(a => a.orderId === parseInt(dispOrderId, 10)).map(a => (
                          <option key={`assigned-${a.employeeId}`} value={a.employeeId.toString()}>
                            ⭐ {a.employeeName} (přiřazeno {a.assignedPieces} ks na zakázce)
                          </option>
                        ))}
                        <option disabled>────────── Ostatní pracovníci ──────────</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id.toString()}>
                            {e.fullName} {e.employeeNumber ? `(os. č. ${e.employeeNumber})` : ''} [{e.contractType}]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Počet kusů k výrobě */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        3. Plánovaný počet kusů k výrobě *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={dispPlannedPieces}
                        onChange={(e) => {
                          setDispPlannedPieces(parseInt(e.target.value, 10) || 0);
                          setDispCustomQuantities({});
                        }}
                        required
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-[#193F34]"
                      />
                    </div>
                  </div>

                  {/* Rozpis komponent k výdeji */}
                  {dispOrderId && (() => {
                    const ordId = parseInt(dispOrderId, 10);
                    const orderMats = materials.filter(m => m.orderId === ordId);
                    if (orderMats.length === 0) {
                      return (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                          <span>
                            Tato zakázka nemá v systému naskladněný žádný materiál. Nejprve nahoře klikněte na <strong>1. Příjem materiálu od zákazníka</strong> a naskladněte komponenty.
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                            Automaticky propočítaný materiál k výdeji ({dispPlannedPieces} ks finálu):
                          </h4>
                          <span className="text-xs text-stone-500">Množství můžete v tabulce ručně upravit</span>
                        </div>
                        <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-stone-100 font-bold text-stone-700">
                              <tr>
                                <th className="px-3 py-2">Komponenta / Materiál</th>
                                <th className="px-3 py-2">Norma na 1 ks</th>
                                <th className="px-3 py-2">Skladem zbývá</th>
                                <th className="px-3 py-2">Vydat brigádníkovi</th>
                                <th className="px-3 py-2">Stav dostupnosti</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                              {orderMats.map(m => {
                                const defaultQty = dispPlannedPieces * m.consumptionPerPiece;
                                const currentQty = dispCustomQuantities[m.id] !== undefined ? dispCustomQuantities[m.id] : defaultQty;
                                const isAvailable = m.remainingQuantity >= currentQty;
                                return (
                                  <tr key={m.id} className="hover:bg-stone-50">
                                    <td className="px-3 py-2 font-bold text-[#193F34]">{m.name}</td>
                                    <td className="px-3 py-2 font-mono">{m.consumptionPerPiece} {m.unit} / ks</td>
                                    <td className="px-3 py-2 font-mono font-bold text-stone-700">
                                      {m.remainingQuantity} {m.unit}
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          min="0"
                                          step="any"
                                          value={currentQty}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setDispCustomQuantities({ ...dispCustomQuantities, [m.id]: val });
                                          }}
                                          className="w-24 px-2 py-1 bg-white border border-stone-300 rounded font-mono font-bold text-xs"
                                        />
                                        <span className="text-stone-500 font-medium">{m.unit}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2">
                                      {isAvailable ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                          <CheckCircle2 className="w-3.5 h-3.5" /> Skladem dostatek
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                                          <AlertTriangle className="w-3.5 h-3.5" /> Chybí {(currentQty - m.remainingQuantity).toFixed(1)} {m.unit}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Kdo vydal */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Předal koordinátor / skladník
                      </label>
                      <input
                        type="text"
                        value={dispDispatchedBy}
                        onChange={(e) => setDispDispatchedBy(e.target.value)}
                        placeholder="Admin (Marta)"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#193F34]"
                      />
                    </div>

                    {/* Poznámka k výdeji */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Poznámka k výdeji
                      </label>
                      <input
                        type="text"
                        value={dispNote}
                        onChange={(e) => setDispNote(e.target.value)}
                        placeholder="např. Převzato na domácí kompletaci, termín pondělí 10:00..."
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-[#193F34]"
                      />
                    </div>
                  </div>

                  {/* Klíčový požadavek ze specifikace: odeslat ke schválení do dokumentů brigádníka */}
                  <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="dispCreateDocCheckbox"
                      checked={dispCreateDoc}
                      onChange={(e) => setDispCreateDoc(e.target.checked)}
                      className="w-5 h-5 text-emerald-700 rounded mt-0.5 focus:ring-emerald-600 cursor-pointer"
                    />
                    <label htmlFor="dispCreateDocCheckbox" className="cursor-pointer">
                      <span className="text-sm font-bold text-emerald-950 block">
                        Vytvořit předávací dokument a zaslat ho ke schválení do profilu brigádníka
                      </span>
                      <span className="text-xs text-emerald-800">
                        Brigádníkovi se po přihlášení na mobilu nebo kiosku zobrazí notifikace se zvonečkem a novým protokolem o převzetí materiálu, který jedním kliknutím elektronicky potvrdí.
                      </span>
                    </label>
                  </div>

                  {/* Akční tlačítka */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-200 gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenMaterialForm('none')}
                      className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                    >
                      Zrušit
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Vydat materiál a vystavit předávací protokol</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* POHLED 1: STAV ZÁSOB MATERIÁLU (BILANCE SKLADU) */}
            {inventorySubTab === 'stock' && (
              <div className="bg-white/95 border border-stone-300 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#193F34] flex items-center gap-2">
                      <Boxes className="w-5 h-5 text-amber-700" />
                      <span>Stav zásob materiálu k zakázkám</span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      Celkový přehled přijatého materiálu od zákazníků, množství vydaného brigádníkům a aktuální zůstatek na skladě
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadData}
                    className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-stone-900 shadow-sm cursor-pointer"
                    title="Obnovit sklad"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingMaterials ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/75 border-b border-stone-200 font-bold text-stone-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Zakázka</th>
                        <th className="px-4 py-3">Materiál / Komponenta</th>
                        <th className="px-4 py-3">Spotřeba na 1 ks</th>
                        <th className="px-4 py-3 text-right">Přijato celkem</th>
                        <th className="px-4 py-3 text-right">Vydáno brigádníkům</th>
                        <th className="px-4 py-3 text-right">Zůstatek na skladě</th>
                        <th className="px-4 py-3 text-center">Status zásoby</th>
                        <th className="px-4 py-3 text-right">Akce</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {materials
                        .filter(m => selectedMaterialOrderId === 'all' || m.orderId === parseInt(selectedMaterialOrderId, 10))
                        .map(m => {
                          const isLow = m.remainingQuantity > 0 && m.remainingQuantity < (m.deliveredQuantity * 0.2);
                          const isOut = m.remainingQuantity <= 0;
                          return (
                            <tr key={m.id} className="hover:bg-amber-50/40 transition-colors">
                              <td className="px-4 py-3">
                                <span className="font-bold text-[#193F34] block">{m.orderName}</span>
                                {m.targetPieces ? (
                                  <span className="text-[11px] text-stone-500 font-mono">Cíl: {m.targetPieces} ks</span>
                                ) : null}
                              </td>
                              <td className="px-4 py-3 font-medium text-stone-900">
                                <span className="font-bold">{m.name}</span>
                                {m.note && <span className="text-[11px] text-stone-500 block">📝 {m.note}</span>}
                                {m.receivedAt && <span className="text-[10px] text-stone-400 block font-mono">Přijato: {m.receivedAt}</span>}
                              </td>
                              <td className="px-4 py-3 font-mono">
                                <strong>{m.consumptionPerPiece}</strong> {m.unit}/ks
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-stone-800">
                                {m.deliveredQuantity} {m.unit}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-emerald-700 font-bold">
                                {m.dispatchedQuantity} {m.unit}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                                <span className={isOut ? 'text-rose-600' : (isLow ? 'text-amber-600' : 'text-[#193F34]')}>
                                  {m.remainingQuantity} {m.unit}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isOut ? (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    Vyčerpáno
                                  </span>
                                ) : isLow ? (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Nízký stav
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Dostatek
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const ord = orders.find(o => o.id === m.orderId);
                                      if (ord) setSelectedPrintReceiptOrder(ord);
                                    }}
                                    className="p-1.5 text-stone-600 hover:text-[#193F34] hover:bg-stone-100 rounded-lg cursor-pointer"
                                    title="Tisk Přebíracího dokumentu k zakázce"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMaterial(m.id)}
                                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                    title="Smazat materiál ze skladu"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {materials.filter(m => selectedMaterialOrderId === 'all' || m.orderId === parseInt(selectedMaterialOrderId, 10)).length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-stone-500">
                            Zatím zde není zaevidován žádný materiál. Klikněte nahoře na tlačítko <strong>1. Příjem materiálu od zákazníka</strong>.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* POHLED 2: HISTORIE VÝDEJEK BRIGÁDNÍKŮM */}
            {inventorySubTab === 'dispatches' && (
              <div className="bg-white/95 border border-stone-300 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#193F34] flex items-center gap-2">
                      <Send className="w-5 h-5 text-emerald-700" />
                      <span>Historie výdejek materiálu brigádníkům</span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      Evidované výdejky materiálu a komponent k výrobě s online stavem potvrzení v profilech brigádníků
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadData}
                    className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-stone-900 shadow-sm cursor-pointer"
                    title="Obnovit výdejky"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingMaterials ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/75 border-b border-stone-200 font-bold text-stone-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Výdejka & Datum</th>
                        <th className="px-4 py-3">Zakázka</th>
                        <th className="px-4 py-3">Brigádník</th>
                        <th className="px-4 py-3">Závazek ks</th>
                        <th className="px-4 py-3">Vydané položky</th>
                        <th className="px-4 py-3">Předal</th>
                        <th className="px-4 py-3 text-center">Stav schválení</th>
                        <th className="px-4 py-3 text-right">Akce</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {dispatches
                        .filter(d => selectedMaterialOrderId === 'all' || d.orderId === parseInt(selectedMaterialOrderId, 10))
                        .map(d => (
                          <tr key={d.id} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-[#193F34] block">VYD-{d.id}</span>
                              <span className="text-[10px] text-stone-400 font-mono">{d.dispatchedAt}</span>
                            </td>
                            <td className="px-4 py-3 font-bold text-stone-900">
                              {d.orderName}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-stone-900 block">{d.employeeName}</span>
                              {d.employeeNumber && <span className="text-[10px] text-stone-500 font-mono">Os. č.: {d.employeeNumber}</span>}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-[#193F34]">
                              {d.plannedPieces} ks
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-0.5">
                                {d.items.map((itm, idx) => (
                                  <div key={idx} className="text-[11px] text-stone-700">
                                    • {itm.materialName}: <strong className="font-mono">{itm.quantity} {itm.unit}</strong>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-stone-600">
                              {d.dispatchedBy || 'Admin'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {d.confirmedAt ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Potvrzeno {d.confirmedAt}</span>
                                </span>
                              ) : d.documentId ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                  <Clock4 className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Čeká na potvrzení</span>
                                </span>
                              ) : (
                                <span className="text-stone-400 text-[11px]">
                                  Fyzický výdej
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPrintDispatch(d)}
                                  className="p-1.5 text-stone-600 hover:text-emerald-800 hover:bg-stone-100 rounded-lg cursor-pointer"
                                  title="Zobrazit a vytisknout Předávací protokol A4"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDispatch(d.id)}
                                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Smazat výdejku"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {dispatches.filter(d => selectedMaterialOrderId === 'all' || d.orderId === parseInt(selectedMaterialOrderId, 10)).length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-stone-500">
                            Zatím nebyla vystavena žádná výdejka materiálu. Klikněte nahoře na <strong>2. Výdej materiálu brigádníkovi</strong>.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TISKOVÝ MODÁL: PŘEBÍRACÍ DOKUMENT MATERIÁLU K ZAKÁZCE (A4) */}
        {selectedPrintReceiptOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto print:p-0 print:shadow-none print:max-w-none print:w-full">
              {/* Hlavička tiskopisu */}
              <div className="flex items-start justify-between border-b-2 border-[#193F34] pb-4">
                <div className="flex items-center gap-4">
                  <img src={GREENBERG_LOGO} alt="Greenberg" className="h-12 w-auto object-contain" />
                  <div>
                    <h2 className="font-heading font-black text-xl text-[#193F34] uppercase tracking-wide">
                      Greenberg & KiPacky s.r.o.
                    </h2>
                    <p className="text-xs text-stone-500">Chráněná dílna a zakázková kompletace</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-xs uppercase font-mono">
                    Skladový doklad: PŘEJÍMKA
                  </span>
                  <p className="text-xs text-stone-500 mt-1 font-mono">
                    Datum: {new Date().toLocaleDateString('cs-CZ')}
                  </p>
                </div>
              </div>

              {/* Titul */}
              <div className="text-center py-2">
                <h1 className="font-heading font-black text-2xl text-[#193F34] uppercase tracking-wider">
                  PŘEBÍRACÍ DOKUMENT MATERIÁLU K ZAKÁZCE
                </h1>
                <p className="text-sm font-bold text-stone-700">
                  Zakázka: <span className="text-[#193F34]">{selectedPrintReceiptOrder.name}</span>
                </p>
              </div>

              {/* Informace o zakázce a zákazníkovi */}
              <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl text-xs border border-stone-200">
                <div>
                  <span className="text-stone-500 block uppercase font-bold text-[10px]">Předávající (Zákazník / Dodavatel):</span>
                  <span className="font-bold text-sm text-stone-900 block">
                    {selectedPrintReceiptOrder.customerContact || 'Neuvedeno'}
                  </span>
                  <span className="text-stone-600 block mt-1">
                    Místo realizace: <strong>{selectedPrintReceiptOrder.workplaceMode || 'Na dílně'}</strong>
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block uppercase font-bold text-[10px]">Příjemce (Sklad / Zhotovitel):</span>
                  <span className="font-bold text-sm text-[#193F34] block">Greenberg & KiPacky s.r.o.</span>
                  <span className="text-stone-600 block mt-1">
                    Cílový objem zakázky: <strong className="font-mono text-emerald-800">{selectedPrintReceiptOrder.totalPiecesTarget} ks</strong>
                  </span>
                  {selectedPrintReceiptOrder.coordinatorContact && (
                    <span className="text-stone-600 block">
                      Koordinátor dílny: <strong>{selectedPrintReceiptOrder.coordinatorContact}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Tabulka přijatých komponent */}
              <div>
                <h3 className="font-heading font-bold text-sm text-[#193F34] uppercase tracking-wider mb-2">
                  Soupis přijatého materiálu a komponent
                </h3>
                <table className="w-full text-left text-xs border border-stone-300 rounded-xl overflow-hidden">
                  <thead className="bg-[#193F34] text-[#F7F3E9] font-bold">
                    <tr>
                      <th className="px-3 py-2">Položka / Materiál</th>
                      <th className="px-3 py-2 text-right">Dodané množství</th>
                      <th className="px-3 py-2">Jednotka</th>
                      <th className="px-3 py-2">Norma na 1 ks</th>
                      <th className="px-3 py-2 text-center">Shoda s cílem</th>
                      <th className="px-3 py-2">Poznámka / DL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {materials
                      .filter(m => m.orderId === selectedPrintReceiptOrder.id)
                      .map(m => (
                        <tr key={m.id}>
                          <td className="px-3 py-2 font-bold text-stone-900">{m.name}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold">{m.deliveredQuantity}</td>
                          <td className="px-3 py-2 font-medium">{m.unit}</td>
                          <td className="px-3 py-2 font-mono">{m.consumptionPerPiece} {m.unit}/ks</td>
                          <td className="px-3 py-2 text-center">
                            {m.matchesTargetPieces ? (
                              <span className="font-bold text-emerald-700">ANO</span>
                            ) : (
                              <span className="font-bold text-rose-700">NE (rozdíl)</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-stone-600">{m.note || '—'}</td>
                        </tr>
                      ))}
                    {materials.filter(m => m.orderId === selectedPrintReceiptOrder.id).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-stone-500">
                          K této zakázce zatím není v systému zaevidován žádný materiál.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Prohlášení a podpisy */}
              <div className="pt-6 border-t border-stone-200 text-xs text-stone-600 space-y-8">
                <p>
                  Přebírající potvrzuje fyzické převzetí výše specifikovaného materiálu ve vykazovaném množství a stavu.
                </p>
                <div className="grid grid-cols-2 gap-12 pt-6">
                  <div className="text-center border-t border-stone-400 pt-2">
                    <p className="font-bold text-stone-800">Předal za zákazníka / přepravce</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">(jméno, podpis, razítko)</p>
                  </div>
                  <div className="text-center border-t border-stone-400 pt-2">
                    <p className="font-bold text-stone-800">Převzal za sklad Greenberg & KiPacky</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">(jméno, podpis, razítko)</p>
                  </div>
                </div>
              </div>

              {/* Tlačítka modálu */}
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedPrintReceiptOrder(null)}
                  className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
                >
                  Zavřít
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-[#193F34] hover:bg-[#133229] text-[#F7F3E9] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Vytisknout dokument (A4)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TISKOVÝ MODÁL: PŘEDÁVACÍ PROTOKOL MATERIÁLU BRIGÁDNÍKOVI (A4) */}
        {selectedPrintDispatch && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto print:p-0 print:shadow-none print:max-w-none print:w-full">
              {/* Hlavička */}
              <div className="flex items-start justify-between border-b-2 border-[#193F34] pb-4">
                <div className="flex items-center gap-4">
                  <img src={GREENBERG_LOGO} alt="Greenberg" className="h-12 w-auto object-contain" />
                  <div>
                    <h2 className="font-heading font-black text-xl text-[#193F34] uppercase tracking-wide">
                      Greenberg & KiPacky s.r.o.
                    </h2>
                    <p className="text-xs text-stone-500">Zakázková kompletace a chráněná dílna</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold rounded-lg text-xs uppercase font-mono">
                    Výdejka: VYD-{selectedPrintDispatch.id}
                  </span>
                  <p className="text-xs text-stone-500 mt-1 font-mono">
                    Datum výdeje: {selectedPrintDispatch.dispatchedAt}
                  </p>
                </div>
              </div>

              {/* Titul */}
              <div className="text-center py-2">
                <h1 className="font-heading font-black text-2xl text-[#193F34] uppercase tracking-wider">
                  PŘEDÁVACÍ PROTOKOL MATERIÁLU BRIGÁDNÍKOVI
                </h1>
                <p className="text-sm font-bold text-stone-700">
                  Zakázka: <span className="text-[#193F34]">{selectedPrintDispatch.orderName}</span>
                </p>
              </div>

              {/* Údaje o příjemci a předávajícím */}
              <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl text-xs border border-stone-200">
                <div>
                  <span className="text-stone-500 block uppercase font-bold text-[10px]">Příjemce materiálu (Pracovník / Brigádník):</span>
                  <span className="font-bold text-base text-stone-900 block mt-0.5">
                    {selectedPrintDispatch.employeeName}
                  </span>
                  {selectedPrintDispatch.employeeNumber && (
                    <span className="text-stone-600 block font-mono text-xs">
                      Osobní číslo: <strong>{selectedPrintDispatch.employeeNumber}</strong>
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-stone-500 block uppercase font-bold text-[10px]">Předávající a závazek výroby:</span>
                  <span className="text-stone-700 block mt-0.5">
                    Předal koordinátor: <strong>{selectedPrintDispatch.dispatchedBy || 'Admin'}</strong>
                  </span>
                  <span className="text-stone-800 block font-bold text-sm mt-1">
                    Závazek ke zhotovení: <span className="font-mono text-emerald-800">{selectedPrintDispatch.plannedPieces} ks</span>
                  </span>
                  {selectedPrintDispatch.note && (
                    <span className="text-stone-600 block text-[11px] mt-1">
                      Poznámka: {selectedPrintDispatch.note}
                    </span>
                  )}
                </div>
              </div>

              {/* Tabulka vydaného materiálu */}
              <div>
                <h3 className="font-heading font-bold text-sm text-[#193F34] uppercase tracking-wider mb-2">
                  Soupis vydaného materiálu a komponent
                </h3>
                <table className="w-full text-left text-xs border border-stone-300 rounded-xl overflow-hidden">
                  <thead className="bg-[#193F34] text-[#F7F3E9] font-bold">
                    <tr>
                      <th className="px-3 py-2">Materiál / Komponenta</th>
                      <th className="px-3 py-2 text-right">Vydané množství</th>
                      <th className="px-3 py-2">Měrná jednotka</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {selectedPrintDispatch.items.map((itm, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-bold text-stone-900">{itm.materialName}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800 text-sm">{itm.quantity}</td>
                        <td className="px-3 py-2 font-medium">{itm.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Čestné prohlášení a stav potvrzení */}
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <strong>Čestné prohlášení:</strong> Svým potvrzením stvrzuji fyzické převzetí výše uvedeného materiálu v deklarovaném množství a bez zjevných vad. Zavazuji se materiál využít výhradně ke kompletaci uvedené zakázky, chránit jej před poškozením a zbylé či vadné kusy vrátit koordinátorovi.
                </div>

                {selectedPrintDispatch.confirmedAt ? (
                  <div className="p-4 bg-emerald-100 border-2 border-emerald-600 rounded-xl text-center">
                    <span className="font-mono font-bold text-emerald-950 uppercase tracking-wider block text-xs">
                      ✅ ELEKTRONICKY POTVRZENO V SYSTÉMU KÍPAČKY
                    </span>
                    <span className="text-sm font-bold text-emerald-900 block mt-1">
                      {selectedPrintDispatch.employeeName} dne {selectedPrintDispatch.confirmedAt}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-12 pt-8 text-xs text-stone-600">
                    <div className="text-center border-t border-stone-400 pt-2">
                      <p className="font-bold text-stone-800">Předal koordinátor</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">(podpis)</p>
                    </div>
                    <div className="text-center border-t border-stone-400 pt-2">
                      <p className="font-bold text-stone-800">Převzal brigádník</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">(podpis)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tlačítka modálu */}
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedPrintDispatch(null)}
                  className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
                >
                  Zavřít
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Vytisknout předávací protokol (A4)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FÁZE 4: ZÁLOŽKA DOCHÁZKA (Reálná vs. Normovaná) */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Horní lišta: Přepínač pod-pohledů + Filtry období a pracovníka */}
            <div className="bg-white/95 border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Přepínač Reálná vs Normovaná docházka */}
              <div className="flex bg-stone-100 p-1 rounded-xl self-start">
                <button
                  type="button"
                  onClick={() => setAttendanceSubTab('real')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    attendanceSubTab === 'real'
                      ? 'bg-sky-700 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Reálná docházka (Kiosk)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceSubTab('normed')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    attendanceSubTab === 'normed'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Normovaná docházka (Pro účetní)</span>
                </button>
              </div>

              {/* Filtry */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Měsíc a Rok */}
                <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                  <CalendarRange className="w-3.5 h-3.5 text-stone-500" />
                  <select
                    value={attendanceMonth}
                    onChange={(e) => setAttendanceMonth(parseInt(e.target.value, 10))}
                    className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
                  >
                    {[
                      { m: 1, n: 'Leden' },
                      { m: 2, n: 'Únor' },
                      { m: 3, n: 'Březen' },
                      { m: 4, n: 'Duben' },
                      { m: 5, n: 'Květen' },
                      { m: 6, n: 'Červen' },
                      { m: 7, n: 'Červenec' },
                      { m: 8, n: 'Srpen' },
                      { m: 9, n: 'Září' },
                      { m: 10, n: 'Říjen' },
                      { m: 11, n: 'Listopad' },
                      { m: 12, n: 'Prosinec' }
                    ].map((item) => (
                      <option key={item.m} value={item.m}>{item.n}</option>
                    ))}
                  </select>
                  <select
                    value={attendanceYear}
                    onChange={(e) => setAttendanceYear(parseInt(e.target.value, 10))}
                    className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer border-l border-stone-200 pl-1.5 ml-1"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>

                {/* Pracovník filtr */}
                <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                  <Users className="w-3.5 h-3.5 text-stone-500" />
                  <select
                    value={attendanceEmpFilter}
                    onChange={(e) => setAttendanceEmpFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer max-w-[200px]"
                  >
                    <option value="all">Všichni pracovníci ({employees.length})</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id.toString()}>
                        {emp.fullName} {emp.employeeNumber ? `(#${emp.employeeNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Extra filtry pro reálnou docházku */}
                {attendanceSubTab === 'real' && (
                  <>
                    <select
                      value={attendanceEventFilter}
                      onChange={(e) => setAttendanceEventFilter(e.target.value)}
                      className="bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Všechny typy událostí</option>
                      <option value="ClockIn">Pouze příchody</option>
                      <option value="ClockOut">Pouze odchody</option>
                      <option value="BreakStart">Začátky pauzy</option>
                      <option value="BreakEnd">Konce pauzy</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleOpenNewManualLog}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer ml-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ručně zapsat docházku</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* POHLED 1: REÁLNÁ DOCHÁZKA (PÍCHAČKY Z KIOSKU) */}
            {attendanceSubTab === 'real' && (
              <div className="space-y-6">
                {/* KPI Přehled reálné docházky */}
                {(() => {
                  const filtered = attendanceLogs.filter((log) => {
                    const dt = new Date(log.timestamp);
                    if (dt.getFullYear() !== attendanceYear || (dt.getMonth() + 1) !== attendanceMonth) return false;
                    if (attendanceEmpFilter !== 'all' && log.employeeId.toString() !== attendanceEmpFilter) return false;
                    if (attendanceEventFilter !== 'all' && log.eventType !== attendanceEventFilter) return false;
                    return true;
                  });
                  const ins = filtered.filter((l) => l.eventType === 'ClockIn').length;
                  const outs = filtered.filter((l) => l.eventType === 'ClockOut').length;
                  const manualEdits = filtered.filter((l) => l.isManualEdit || l.originalTimestamp).length;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white/95 border border-stone-200 p-4 rounded-2xl shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Záznamů celkem</span>
                        <span className="text-2xl font-extrabold text-stone-800 font-mono mt-1 block">{filtered.length}</span>
                        <span className="text-xs text-stone-500 mt-0.5 block">{attendanceMonth}/{attendanceYear}</span>
                      </div>
                      <div className="bg-white/95 border border-stone-200 p-4 rounded-2xl shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Zaznamenané příchody</span>
                        <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">{ins}</span>
                        <span className="text-xs text-stone-500 mt-0.5 block">Zahájení směn na dílně</span>
                      </div>
                      <div className="bg-white/95 border border-stone-200 p-4 rounded-2xl shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">Zaznamenané odchody</span>
                        <span className="text-2xl font-extrabold text-stone-700 font-mono mt-1 block">{outs}</span>
                        <span className="text-xs text-stone-500 mt-0.5 block">Ukončení směn</span>
                      </div>
                      <div className="bg-white/95 border border-amber-200 p-4 rounded-2xl shadow-sm bg-amber-50/40">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">Ruční korekce (Audit)</span>
                        <span className="text-2xl font-extrabold text-amber-900 font-mono mt-1 block">{manualEdits}</span>
                        <span className="text-xs text-amber-700 mt-0.5 block">Změny s historií původního času</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Tabulka docházky */}
                <div className="bg-white/95 border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm text-[#193F34] uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-700" />
                      <span>Provozní záznamy píchaček z kiosku</span>
                    </h3>
                    <button
                      type="button"
                      onClick={loadAttendance}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
                      title="Obnovit záznamy"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingAttendance ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#193F34] text-[#F7F3E9] font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="px-4 py-3">Pracovník</th>
                          <th className="px-4 py-3">Datum a čas</th>
                          <th className="px-4 py-3">Typ události</th>
                          <th className="px-4 py-3">Poznámka / Auditní stopa</th>
                          <th className="px-4 py-3 text-right">Akce</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {(() => {
                          const filtered = attendanceLogs.filter((log) => {
                            const dt = new Date(log.timestamp);
                            if (dt.getFullYear() !== attendanceYear || (dt.getMonth() + 1) !== attendanceMonth) return false;
                            if (attendanceEmpFilter !== 'all' && log.employeeId.toString() !== attendanceEmpFilter) return false;
                            if (attendanceEventFilter !== 'all' && log.eventType !== attendanceEventFilter) return false;
                            return true;
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-stone-500 italic">
                                  Pro vybrané období a filtry nebyly nalezeny žádné záznamy docházky.
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((log) => {
                            const dt = new Date(log.timestamp);
                            return (
                              <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center overflow-hidden shrink-0">
                                      {log.photoUrl ? (
                                        <img src={log.photoUrl} alt={log.employeeName} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-[11px] font-bold text-stone-600">
                                          {log.employeeName.slice(0, 2).toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="font-bold text-stone-900 block">{log.employeeName}</span>
                                      <span className="text-[10px] text-stone-500 font-mono">
                                        {log.employeeNumber ? `#${log.employeeNumber} • ` : ''}{log.contractType}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-mono font-medium text-stone-800">
                                  {dt.toLocaleDateString('cs-CZ')} {dt.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                                <td className="px-4 py-3">
                                  {log.eventType === 'ClockIn' && (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                                      🟢 Příchod
                                    </span>
                                  )}
                                  {log.eventType === 'ClockOut' && (
                                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200">
                                      🔴 Odchod
                                    </span>
                                  )}
                                  {log.eventType === 'BreakStart' && (
                                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                                      ☕ Začátek pauzy
                                    </span>
                                  )}
                                  {log.eventType === 'BreakEnd' && (
                                    <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-bold border border-sky-200">
                                      🔵 Konec pauzy
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-stone-600">
                                  {log.originalTimestamp ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                        ⚠️ Upraveno adminem ({log.modifiedBy || 'Admin'})
                                      </span>
                                      <div className="text-[10px] text-stone-500 font-mono">
                                        Původní čas: {new Date(log.originalTimestamp).toLocaleString('cs-CZ')}
                                      </div>
                                      {log.note && <div className="text-xs text-stone-700 italic">Důvod: {log.note}</div>}
                                    </div>
                                  ) : (
                                    <span>{log.note || '—'}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditLog(log)}
                                      className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-700 cursor-pointer"
                                      title="Upravit čas docházky"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLog(log.id)}
                                      className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer"
                                      title="Smazat záznam"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* POHLED 2: NORMOVANÁ DOCHÁZKA (PRO ÚČETNÍ) */}
            {attendanceSubTab === 'normed' && (
              <div className="space-y-6">
                {/* Banner metodiky */}
                <div className="bg-gradient-to-r from-emerald-900 to-[#193F34] text-[#F7F3E9] p-5 rounded-2xl shadow-md space-y-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#D7BE97]" />
                    <h3 className="font-heading font-bold text-base text-[#D7BE97] uppercase tracking-wider">
                      Zákonná metodika propočtu normohodin pro účetní
                    </h3>
                  </div>
                  <p className="text-xs text-stone-200 leading-relaxed max-w-4xl">
                    Normovaná docházka slouží jako oficiální podklad pro mzdovou účetní pro brigádníky na DPP/DPČ a práci z domova.
                    Propočet odpracovaných hodin je striktně dán vzorcem: <strong className="text-white bg-black/30 px-2 py-0.5 rounded font-mono">Normohodiny = (Schválené kusy × Sazba Kč/ks) / 135 Kč</strong>.
                    Odpracovaná doba je automaticky rozvržena do pracovních dnů od <strong>08:00</strong> (max <strong>8 hod./den</strong>).
                    Po 4 hodinách práce je ze zákona vložena <strong>30minutová přestávka na oběd (12:00–12:30)</strong>, odpolední blok končí nejpozději v <strong>16:30</strong>.
                  </p>
                </div>

                {/* Seznam zaměstnanců a jejich normovaných výkazů */}
                {(() => {
                  const targetEmployees = employees.filter((emp) => {
                    if (attendanceEmpFilter !== 'all' && emp.id.toString() !== attendanceEmpFilter) return false;
                    return true;
                  });

                  if (targetEmployees.length === 0) {
                    return (
                      <div className="bg-white/95 border border-stone-200 rounded-2xl p-12 text-center text-stone-500 italic">
                        Nebyl nalezen žádný zaměstnanec odpovídající filtrům.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {targetEmployees.map((emp) => {
                        const normed = computeNormedShiftsForEmployee(emp.id, attendanceYear, attendanceMonth);
                        const annualHours = getAnnualHoursForEmployee(emp.id, attendanceYear);
                        const annualLimit = emp.contractHoursLimit || 300;
                        const annualPct = Math.min(100, Math.round((annualHours / annualLimit) * 100));

                        return (
                          <div key={emp.id} className="bg-white/95 border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                            {/* Hlavička karty zaměstnance */}
                            <div className="p-5 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/60">
                              <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-full bg-stone-100 border-2 border-stone-300 flex items-center justify-center overflow-hidden shrink-0">
                                  {emp.photoUrl ? (
                                    <img src={emp.photoUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-bold text-stone-600">
                                      {emp.fullName.slice(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-heading font-bold text-base text-stone-900">{emp.fullName}</h4>
                                    {emp.employmentStatus === 'Troublemaker' && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                                        ⚠️ Potížista
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-0.5">
                                    <span>Os. č.: <strong className="font-mono text-stone-800">#{emp.employeeNumber || 'neuvedeno'}</strong></span>
                                    <span>•</span>
                                    <span>Smlouva: <strong className="text-stone-800">{emp.contractType}</strong></span>
                                    <span>•</span>
                                    <span>Účet: <strong className="font-mono text-stone-800">{emp.bankAccount || '⚠️ Chybí účet'}</strong></span>
                                  </div>
                                </div>
                              </div>

                              {/* Akční tlačítko pro tisk A4 */}
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPrintNormedEmp(emp)}
                                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                                >
                                  <Printer className="w-4 h-4" />
                                  <span>Vytisknout Normovaný výkaz (A4)</span>
                                </button>
                              </div>
                            </div>

                            {/* Tělo karty: KPI + DPP limit + Kalendář směn */}
                            <div className="p-5 space-y-5">
                              {/* KPI řádek pro daný měsíc */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                                  <span className="text-[11px] font-bold uppercase text-stone-500 block">Schválená produkce</span>
                                  <span className="text-xl font-extrabold text-stone-900 font-mono mt-0.5 block">{normed.totalPieces} ks</span>
                                  <span className="text-[11px] text-stone-500 block">bez vad v měsíci</span>
                                </div>
                                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                                  <span className="text-[11px] font-bold uppercase text-stone-500 block">Vadné kusy (Zmetky)</span>
                                  <span className={`text-xl font-extrabold font-mono mt-0.5 block ${normed.totalDefects > 0 ? 'text-rose-700' : 'text-stone-600'}`}>
                                    {normed.totalDefects} ks
                                  </span>
                                  <span className="text-[11px] text-stone-500 block">vyřazeno bez nároku na mzdu</span>
                                </div>
                                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                                  <span className="text-[11px] font-bold uppercase text-emerald-800 block">Hrubá odměna</span>
                                  <span className="text-xl font-extrabold text-emerald-900 font-mono mt-0.5 block">
                                    {normed.totalEarned.toLocaleString('cs-CZ')} Kč
                                  </span>
                                  <span className="text-[11px] text-emerald-700 block">k vyplacení na účet</span>
                                </div>
                                <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200">
                                  <span className="text-[11px] font-bold uppercase text-sky-800 block">Normohodiny pro účetní</span>
                                  <span className="text-xl font-extrabold text-sky-900 font-mono mt-0.5 block">
                                    {normed.totalNormHours.toFixed(2)} h
                                  </span>
                                  <span className="text-[11px] text-sky-700 block">při sazbě 135 Kč / h</span>
                                </div>
                              </div>

                              {/* Sledování limitu smlouvy (např. DPP 300 hodin ročně) */}
                              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-stone-700">
                                    Roční fond pracovní doby ({attendanceYear}) – Limit {annualLimit} h:
                                  </span>
                                  <span className={`font-mono font-bold ${annualHours > annualLimit ? 'text-rose-700' : annualHours >= 250 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {annualHours} h / {annualLimit} h ({annualPct} %)
                                  </span>
                                </div>
                                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      annualHours > annualLimit ? 'bg-rose-600' : annualHours >= 250 ? 'bg-amber-500' : 'bg-emerald-600'
                                    }`}
                                    style={{ width: `${Math.min(100, annualPct)}%` }}
                                  />
                                </div>
                                {annualHours > annualLimit && (
                                  <div className="text-[11px] text-rose-700 font-bold flex items-center gap-1 mt-1">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>POZOR: Překročen zákonný limit 300 hodin pro DPP! Nutno řešit DPČ nebo HPP.</span>
                                  </div>
                                )}
                              </div>

                              {/* Upozornění na přetečení měsíčního fondu pracovních dnů */}
                              {normed.overflowHours > 0 && (
                                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                                  <span>
                                    <strong>Upozornění pro účetní:</strong> Objem normohodin ({normed.totalNormHours} h) přesáhl standardní fond {normed.workingDaysCount} pracovních dnů v měsíci ({normed.maxStandardHours} h). Nevyčerpaný přebytek {normed.overflowHours} h doporučujeme převést do následujícího měsíce.
                                  </span>
                                </div>
                              )}

                              {/* Tabulka rozpočtených směn pro účetní */}
                              <div>
                                <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-stone-700 mb-2">
                                  Rozpis pracovních dnů a časů (podklad pro mzdový list)
                                </h5>

                                {normed.shifts.length === 0 ? (
                                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-center text-xs text-stone-500 italic">
                                    V měsíci {attendanceMonth}/{attendanceYear} nemá pracovník žádnou schválenou produkci.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto border border-stone-200 rounded-xl">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                                        <tr>
                                          <th className="px-3 py-2">Datum</th>
                                          <th className="px-3 py-2">Den</th>
                                          <th className="px-3 py-2">Začátek</th>
                                          <th className="px-3 py-2">Zákonná pauza (oběd)</th>
                                          <th className="px-3 py-2">Konec směny</th>
                                          <th className="px-3 py-2 text-right">Čisté normohodiny</th>
                                          <th className="px-3 py-2 text-right">Mzda (135 Kč/h)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-stone-200">
                                        {normed.shifts.map((s, idx) => (
                                          <tr key={idx} className="hover:bg-stone-50">
                                            <td className="px-3 py-2 font-mono font-medium text-stone-900">{s.dateStr}</td>
                                            <td className="px-3 py-2 font-medium text-stone-700">{s.dayName}</td>
                                            <td className="px-3 py-2 font-mono text-emerald-800 font-bold">{s.startTime}</td>
                                            <td className="px-3 py-2 text-stone-600">
                                              {s.lunchStart ? (
                                                <span className="font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                                                  {s.lunchStart} – {s.lunchEnd} (30 min)
                                                </span>
                                              ) : (
                                                <span className="text-stone-400">— (směna do 4h)</span>
                                              )}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-stone-800 font-bold">{s.endTime}</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-sky-900">{s.hours.toFixed(2)} h</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-stone-900">
                                              {Math.round(s.hours * 135).toLocaleString('cs-CZ')} Kč
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot className="bg-stone-100 font-bold border-t border-stone-200">
                                        <tr>
                                          <td colSpan={5} className="px-3 py-2 text-right text-stone-800">
                                            Celkem za {attendanceMonth}/{attendanceYear}:
                                          </td>
                                          <td className="px-3 py-2 text-right font-mono text-sky-900 text-sm">
                                            {normed.totalNormHours.toFixed(2)} h
                                          </td>
                                          <td className="px-3 py-2 text-right font-mono text-emerald-900 text-sm">
                                            {normed.totalEarned.toLocaleString('cs-CZ')} Kč
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* FÁZE 4: ZÁLOŽKA PRODUKCE & SCHVALOVÁNÍ KUSŮ */}
        {activeTab === 'production' && (
          <div className="space-y-6">
            {/* KPI Souhrnné karty produkce */}
            {(() => {
              const totalSubmitted = productionLogs.reduce((acc, p) => acc + (p.submittedPieces || 0), 0);
              const approvedLogs = productionLogs.filter((p) => p.status === 'Approved');
              const totalApproved = approvedLogs.reduce((acc, p) => acc + (p.validatedPieces || 0), 0);
              const totalDefects = productionLogs.reduce((acc, p) => acc + (p.defectPieces || 0), 0);
              const totalMoney = approvedLogs.reduce((acc, p) => acc + (p.earnedCzk || 0), 0);
              const totalNormH = totalMoney > 0 ? (totalMoney / 135.0) : 0;
              const pendingCount = productionLogs.filter((p) => p.status === 'Pending').length;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-white/95 border border-stone-200 p-4 rounded-2xl shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">Nahlášeno celkem</span>
                    <span className="text-2xl font-extrabold text-stone-900 font-mono mt-1 block">{totalSubmitted}</span>
                    <span className="text-xs text-stone-500 mt-0.5 block">odevzdaných kusů</span>
                  </div>
                  <div className="bg-white/95 border border-stone-200 p-4 rounded-2xl shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Schváleno k proplacení</span>
                    <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">{totalApproved}</span>
                    <span className="text-xs text-emerald-700 mt-0.5 block">bezvadných kusů</span>
                  </div>
                  <div className="bg-white/95 border border-rose-200 p-4 rounded-2xl shadow-sm bg-rose-50/30">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">Vadné kusy (Zmetky)</span>
                    <span className="text-2xl font-extrabold text-rose-800 font-mono mt-1 block">{totalDefects}</span>
                    <span className="text-xs text-rose-600 mt-0.5 block">vyřazeno bez mzdy</span>
                  </div>
                  <div className="bg-white/95 border border-stone-200 p-4 rounded-2xl shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9B623F] block">Finanční odměna</span>
                    <span className="text-2xl font-extrabold text-[#9B623F] font-mono mt-1 block">
                      {totalMoney.toLocaleString('cs-CZ')} Kč
                    </span>
                    <span className="text-xs text-stone-500 mt-0.5 block">ze schválených kusů</span>
                  </div>
                  <div className="bg-white/95 border border-stone-200 p-4 rounded-2xl shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 block">Normohodiny celkem</span>
                    <span className="text-2xl font-extrabold text-sky-900 font-mono mt-1 block">{totalNormH.toFixed(1)} h</span>
                    <span className="text-xs text-stone-500 mt-0.5 block">při normě 135 Kč / h</span>
                  </div>
                </div>
              );
            })()}

            {/* Horní lišta s filtry a hromadným schválením */}
            <div className="bg-white/95 border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Přepínač stavu */}
                <div className="flex bg-stone-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setProdStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      prodStatusFilter === 'all'
                        ? 'bg-[#193F34] text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Vše ({productionLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdStatusFilter('Pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      prodStatusFilter === 'Pending'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>Čeká na schválení</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                      {productionLogs.filter((p) => p.status === 'Pending').length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdStatusFilter('Approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      prodStatusFilter === 'Approved'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Schváleno ({productionLogs.filter((p) => p.status === 'Approved').length})
                  </button>
                </div>

                {/* Filtr zakázky */}
                <select
                  value={prodOrderFilter}
                  onChange={(e) => setProdOrderFilter(e.target.value)}
                  className="bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer max-w-[200px]"
                >
                  <option value="all">Všechny zakázky ({orders.length})</option>
                  {orders.map((ord) => (
                    <option key={ord.id} value={ord.id.toString()}>{ord.name}</option>
                  ))}
                </select>

                {/* Filtr pracovníka */}
                <select
                  value={prodEmpFilter}
                  onChange={(e) => setProdEmpFilter(e.target.value)}
                  className="bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer max-w-[200px]"
                >
                  <option value="all">Všichni pracovníci ({employees.length})</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id.toString()}>
                      {emp.fullName} {emp.employeeNumber ? `(#${emp.employeeNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tlačítko pro hromadné schválení */}
              <button
                type="button"
                onClick={handleApproveAllProd}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer ml-auto"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Schválit vše čekající bez vad</span>
              </button>
            </div>

            {/* Tabulka produkce */}
            <div className="bg-white/95 border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#193F34] uppercase tracking-wider flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-[#9B623F]" />
                  <span>Výkazy produkce, kontrola vad a schvalování odměn</span>
                </h3>
                <button
                  type="button"
                  onClick={loadProduction}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
                  title="Obnovit data"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingProduction ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#193F34] text-[#F7F3E9] font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Pracovník</th>
                      <th className="px-4 py-3">Zakázka & Operace</th>
                      <th className="px-4 py-3">Datum</th>
                      <th className="px-4 py-3 text-right">Nahlášeno</th>
                      <th className="px-4 py-3 text-right">K proplacení</th>
                      <th className="px-4 py-3 text-right">Zmetky</th>
                      <th className="px-4 py-3 text-right">Odměna / Norma</th>
                      <th className="px-4 py-3">Stav</th>
                      <th className="px-4 py-3 text-right">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {(() => {
                      const filtered = productionLogs.filter((p) => {
                        if (prodStatusFilter !== 'all' && p.status !== prodStatusFilter) return false;
                        if (prodOrderFilter !== 'all' && p.orderId.toString() !== prodOrderFilter) return false;
                        if (prodEmpFilter !== 'all' && p.employeeId.toString() !== prodEmpFilter) return false;
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} className="px-4 py-12 text-center text-stone-500 italic">
                              Nebyly nalezeny žádné záznamy odevzdané produkce.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((log) => {
                        const currentEdit = prodInlineEdits[log.id] || {
                          val: log.status === 'Approved' ? log.validatedPieces : log.submittedPieces,
                          def: log.defectPieces || 0,
                          note: log.note || ''
                        };

                        return (
                          <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                            {/* Pracovník */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center overflow-hidden shrink-0">
                                  {log.photoUrl ? (
                                    <img src={log.photoUrl} alt={log.employeeName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[11px] font-bold text-stone-600">
                                      {log.employeeName.slice(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-stone-900 block">{log.employeeName}</span>
                                  <span className="text-[10px] text-stone-500 font-mono">
                                    {log.employeeNumber ? `#${log.employeeNumber} • ` : ''}{log.contractType}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Zakázka & Operace */}
                            <td className="px-4 py-3">
                              <span className="font-bold text-stone-900 block">{log.orderName}</span>
                              <span className="text-stone-600 text-[11px]">
                                {log.operationName} <strong className="text-emerald-800">({log.ratePerPiece} Kč/ks)</strong>
                              </span>
                            </td>

                            {/* Datum výroby */}
                            <td className="px-4 py-3 font-mono text-stone-700">
                              {new Date(log.date).toLocaleDateString('cs-CZ')}
                            </td>

                            {/* Nahlášeno */}
                            <td className="px-4 py-3 text-right font-mono font-bold text-stone-800 text-sm">
                              {log.submittedPieces} ks
                            </td>

                            {/* K proplacení (Validováno) */}
                            <td className="px-4 py-3 text-right">
                              {log.status === 'Pending' ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={currentEdit.val}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    setProdInlineEdits({
                                      ...prodInlineEdits,
                                      [log.id]: { ...currentEdit, val }
                                    });
                                  }}
                                  className="w-20 px-2 py-1 border border-stone-300 rounded-lg text-right font-mono font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                />
                              ) : (
                                <span className="font-mono font-bold text-emerald-800 text-sm">
                                  {log.validatedPieces} ks
                                </span>
                              )}
                            </td>

                            {/* Zmetky */}
                            <td className="px-4 py-3 text-right">
                              {log.status === 'Pending' ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={currentEdit.def}
                                  onChange={(e) => {
                                    const def = parseInt(e.target.value, 10) || 0;
                                    setProdInlineEdits({
                                      ...prodInlineEdits,
                                      [log.id]: { ...currentEdit, def }
                                    });
                                  }}
                                  className="w-16 px-2 py-1 border border-rose-300 rounded-lg text-right font-mono font-bold text-rose-800 focus:outline-none focus:ring-1 focus:ring-rose-600 bg-rose-50/50"
                                />
                              ) : (
                                <span className={`font-mono font-bold text-sm ${log.defectPieces > 0 ? 'text-rose-700' : 'text-stone-400'}`}>
                                  {log.defectPieces || 0} ks
                                </span>
                              )}
                            </td>

                            {/* Odměna & Normohodiny */}
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono font-bold text-stone-900 block">
                                {log.earnedCzk.toLocaleString('cs-CZ')} Kč
                              </span>
                              <span className="text-[10px] text-sky-800 font-mono font-semibold block">
                                {((log.normHours || (log.earnedCzk / 135.0))).toFixed(2)} h
                              </span>
                            </td>

                            {/* Stav */}
                            <td className="px-4 py-3">
                              {log.status === 'Approved' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                                  <Check className="w-3 h-3" />
                                  <span>Schváleno</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200 animate-pulse">
                                  <Clock className="w-3 h-3" />
                                  <span>Čeká na kontrolu</span>
                                </span>
                              )}
                              {log.note && (
                                <div className="text-[10px] text-stone-500 italic mt-0.5 max-w-[140px] truncate" title={log.note}>
                                  {log.note}
                                </div>
                              )}
                            </td>

                            {/* Akce */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {log.status === 'Pending' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveProdItem(log)}
                                    disabled={approvingProdId === log.id}
                                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer shadow-sm text-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Schválit</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveProdItem(log)}
                                    className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                                    title="Pře-schválit / upravit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Pokud má záznam zmetky, nabídneme Zmetkový protokol A4 */}
                                {(log.defectPieces || 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDefectLog(log)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold flex items-center gap-1 cursor-pointer border border-rose-300 text-[11px]"
                                    title="Zobrazit / vytisknout Zmetkový protokol"
                                  >
                                    <FileWarning className="w-3.5 h-3.5 text-rose-700" />
                                    <span>ZM-{log.id}</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteProdItem(log.id)}
                                  className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer"
                                  title="Smazat záznam"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="bg-white/95 border border-stone-300 rounded-2xl p-8 text-center space-y-3">
            <Bell className="w-12 h-12 text-indigo-600 mx-auto" />
            <h3 className="font-heading font-bold text-xl text-[#193F34]">Fáze 5: Administrativa & Nástěnka (🔔)</h3>
            <p className="text-sm text-stone-600 max-w-lg mx-auto">
              Vkládání směrnic a oznámení se zvonečkem pro brigádníky na kiosku.
            </p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white/95 border border-stone-300 rounded-2xl p-8 text-center space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-emerald-700 mx-auto" />
            <h3 className="font-heading font-bold text-xl text-[#193F34]">Fáze 5: Měsíční výkazy & Automatické párování výplatních pásek</h3>
            <p className="text-sm text-stone-600 max-w-lg mx-auto">
              Hromadný import PDF výplatních pásek od účetní ve formátu <code>personalnicislo_RR_MM.pdf</code> s automatickým přiřazením k zaměstnanci.
            </p>
          </div>
        )}
      </main>

      {/* DETAILNÍ PERSONÁLNÍ KARTA ZAMĚSTNANCE (MODAL) */}
      {selectedEmp && modalEditEmp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Hlavička modálu */}
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 border-2 border-stone-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {modalEditEmp.photoUrl ? (
                    <img src={modalEditEmp.photoUrl} alt={modalEditEmp.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-stone-600">
                      {modalEditEmp.fullName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  {isEditingInModal && (
                    <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, true)}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-[#193F34] flex items-center gap-2">
                    <span>{modalEditEmp.fullName}</span>
                    {modalEditEmp.employmentStatus === 'Troublemaker' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                        ⚠️ Potížista
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-stone-500 font-mono mt-0.5">
                    <span>Personální č.: #{modalEditEmp.employeeNumber || 'neuvedeno'}</span>
                    <span>•</span>
                    <span>Kiosk PIN: {modalEditEmp.pinCode}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditingInModal ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingInModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Upravit údaje</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveModalEdit}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Uložit změny
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedEmp(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Obsah karty: Editace nebo Přehled */}
            {isEditingInModal ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Jméno a příjmení</label>
                    <input
                      type="text"
                      value={modalEditEmp.fullName}
                      onChange={(e) => setModalEditEmp({ ...modalEditEmp, fullName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Personální číslo</label>
                    <input
                      type="text"
                      value={modalEditEmp.employeeNumber || ''}
                      onChange={(e) => setModalEditEmp({ ...modalEditEmp, employeeNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Kiosk PIN (4 číslice)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={modalEditEmp.pinCode}
                      onChange={(e) => setModalEditEmp({ ...modalEditEmp, pinCode: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 border rounded-xl font-mono font-bold tracking-widest text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Typ smlouvy</label>
                    <select
                      value={modalEditEmp.contractType}
                      onChange={(e) => setModalEditEmp({ ...modalEditEmp, contractType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl font-semibold"
                    >
                      <option value="DPP (300 hodin)">DPP (300 hodin / rok)</option>
                      <option value="DPČ 32 hodin">DPČ 32 hodin / měsíc</option>
                      <option value="DPČ 80 hodin">DPČ 80 hodin / měsíc</option>
                      <option value="HPP 40 hodin">HPP 40 hodin / měsíc</option>
                      <option value="HPP 80 hodin">HPP 80 hodin / měsíc</option>
                      <option value="HPP 160 hodin">HPP 160 hodin / měsíc</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Ulice č.p.</label>
                    <input
                      type="text"
                      value={modalEditEmp.street || ''}
                      onChange={(e) => setModalEditEmp({ ...modalEditEmp, street: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Obec</label>
                    <input
                      type="text"
                      value={modalEditEmp.city || ''}
                      onChange={(e) => setModalEditEmp({ ...modalEditEmp, city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={modalEditEmp.phone || ''}
                      onChange={(e) => setModalEditEmp({ ...modalEditEmp, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Bankovní účet</label>
                    <input
                      type="text"
                      value={modalEditEmp.bankAccount || ''}
                      onChange={(e) => setModalEditEmp({ ...modalEditEmp, bankAccount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Stav smlouvy</label>
                    <select
                      value={modalEditEmp.employmentStatus || 'Active'}
                      onChange={(e) => setModalEditEmp({ ...modalEditEmp, employmentStatus: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-xl font-bold"
                    >
                      <option value="Active">Aktivní</option>
                      <option value="Troublemaker">⚠️ Potížista (varovná značka)</option>
                      <option value="Terminated">Ukončen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Místo realizace</label>
                    <select
                      value={modalEditEmp.defaultWorkplace || 'Na dílně'}
                      onChange={(e) => setModalEditEmp({ ...modalEditEmp, defaultWorkplace: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-xl font-semibold"
                    >
                      <option value="Na dílně">Na dílně</option>
                      <option value="Doma">Doma</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Přehledové karty */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-xs text-stone-500 block">Smlouva & Fond</span>
                    <span className="font-bold text-stone-900 text-sm mt-0.5 block">{modalEditEmp.contractType}</span>
                    <span className="text-xs text-emerald-700 font-semibold block mt-1">
                      Zbývá: {Math.max(0, (modalEditEmp.contractHoursLimit || 300) - (modalEditEmp.workedHours || 0))} h
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-xs text-stone-500 block">Bydliště & Místo práce</span>
                    <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                      {modalEditEmp.street ? `${modalEditEmp.street}, ` : ''}{modalEditEmp.city || 'Neuvedeno'}
                    </span>
                    <span className="text-xs text-stone-600 font-medium block mt-1">
                      Místo: {modalEditEmp.defaultWorkplace || 'Na dílně'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-xs text-stone-500 block">Výplata mzdy</span>
                    <span className="font-mono font-bold text-stone-900 text-sm mt-0.5 block">
                      {modalEditEmp.bankAccount || '⚠️ Chybí účet'}
                    </span>
                    <span className="text-xs text-stone-600 block mt-1">
                      Režim: {modalEditEmp.selfScheduled ? 'Samorozvrhování' : 'Plánované směny'}
                    </span>
                  </div>
                </div>

                {/* Sekce přiřazené zakázky & historie docházky */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <h4 className="font-bold text-xs uppercase text-emerald-900 mb-2">
                    Aktuálně přiřazená zakázka a úkon
                  </h4>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-900">
                      {modalEditEmp.assignedOrderInfo || 'Krabice 500ks – Lepení pásky (Termín: do pátku)'}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold">
                      Rozpracováno
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Patička modálu */}
            <div className="pt-4 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEmp(null)}
                className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
              >
                Zavřít kartu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: RUČNÍ ZÁPIS / EDITACE DOCHÁZKY (S AUDITEM) */}
      {showManualLogModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-heading font-bold text-lg text-[#193F34] flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-700" />
                <span>{editingLogItem ? 'Úprava záznamu docházky (s auditem)' : 'Nový ruční záznam docházky'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowManualLogModal(false);
                  setEditingLogItem(null);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Pracovník / Brigádník</label>
                <select
                  value={manualLogEmpId}
                  onChange={(e) => setManualLogEmpId(e.target.value)}
                  disabled={!!editingLogItem}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold bg-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id.toString()}>
                      {emp.fullName} {emp.employeeNumber ? `(#${emp.employeeNumber})` : ''} ({emp.contractType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Datum</label>
                  <input
                    type="date"
                    value={manualLogDate}
                    onChange={(e) => setManualLogDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Čas (HH:mm)</label>
                  <input
                    type="time"
                    value={manualLogTime}
                    onChange={(e) => setManualLogTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Typ docházkové události</label>
                <select
                  value={manualLogEventType}
                  onChange={(e) => setManualLogEventType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold bg-white"
                >
                  <option value="ClockIn">🟢 Příchod do práce</option>
                  <option value="ClockOut">🔴 Odchod z práce</option>
                  <option value="BreakStart">☕ Začátek pauzy</option>
                  <option value="BreakEnd">🔵 Konec pauzy</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Důvod ručního zápisu / opravy <span className="text-stone-400 font-normal">(auditní stopa)</span>
                </label>
                <input
                  type="text"
                  placeholder="např. Zapomenuté odpíchnutí při odchodu ze směny"
                  value={manualLogNote}
                  onChange={(e) => setManualLogNote(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                ℹ️ <strong>Upozornění:</strong> Všechny ruční změny v docházce jsou trvale zaznamenávány do auditního logu včetně jména administrátora a původního strojového času.
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualLogModal(false);
                    setEditingLogItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold cursor-pointer shadow-sm"
                >
                  {editingLogItem ? 'Uložit opravu času' : 'Zapsat do docházky'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NORMOVANÝ VÝKAZ DOCHÁZKY PRO ÚČETNÍ (A4 TISK) */}
      {selectedPrintNormedEmp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:shadow-none print:p-0 print:border-none">
            {/* Hlavička tiskopisu */}
            <div className="flex items-start justify-between border-b-2 border-[#193F34] pb-4">
              <div className="flex items-center gap-3">
                <img src={GREENBERG_LOGO} alt="Greenberg" className="w-12 h-12 object-contain" />
                <div>
                  <h1 className="font-heading font-extrabold text-xl text-[#193F34] tracking-tight">
                    MĚSÍČNÍ VÝKAZ NORMOVANÉ DOCHÁZKY
                  </h1>
                  <p className="text-xs text-stone-600 font-medium">
                    Greenberg s.r.o. • Podklad pro mzdové účetnictví • Kípačky Attendance System
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-stone-500 uppercase font-bold">Zúčtovací období</div>
                <div className="text-xl font-heading font-black text-emerald-800 font-mono">
                  {String(attendanceMonth).padStart(2, '0')} / {attendanceYear}
                </div>
              </div>
            </div>

            {/* Identifikace zaměstnance */}
            {(() => {
              const normed = computeNormedShiftsForEmployee(selectedPrintNormedEmp.id, attendanceYear, attendanceMonth);
              const annualHours = getAnnualHoursForEmployee(selectedPrintNormedEmp.id, attendanceYear);
              const annualLimit = selectedPrintNormedEmp.contractHoursLimit || 300;

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                    <div>
                      <span className="text-stone-500 block uppercase font-bold text-[10px]">Jméno a příjmení:</span>
                      <strong className="text-sm text-stone-900 block mt-0.5">{selectedPrintNormedEmp.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block uppercase font-bold text-[10px]">Osobní číslo & PIN:</span>
                      <strong className="text-sm font-mono text-stone-800 block mt-0.5">
                        #{selectedPrintNormedEmp.employeeNumber || 'neuvedeno'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block uppercase font-bold text-[10px]">Smlouva / Fond:</span>
                      <strong className="text-sm text-stone-900 block mt-0.5">{selectedPrintNormedEmp.contractType}</strong>
                      <span className="text-[10px] text-stone-500">Max {annualLimit} h/rok</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block uppercase font-bold text-[10px]">Výplata mzdy:</span>
                      <strong className="text-xs font-mono text-stone-900 block mt-0.5">
                        {selectedPrintNormedEmp.bankAccount || 'V hotovosti'}
                      </strong>
                    </div>
                  </div>

                  {/* Souhrnné údaje výkazu */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Celkem schválená výroba</span>
                      <span className="text-lg font-extrabold text-emerald-950 font-mono mt-0.5 block">{normed.totalPieces} ks</span>
                    </div>
                    <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-center">
                      <span className="text-[10px] uppercase font-bold text-sky-800 block">Celkem odpracováno normohodin</span>
                      <span className="text-lg font-extrabold text-sky-950 font-mono mt-0.5 block">{normed.totalNormHours.toFixed(2)} h</span>
                    </div>
                    <div className="p-3 bg-stone-100 rounded-xl border border-stone-300 text-center">
                      <span className="text-[10px] uppercase font-bold text-stone-700 block">Celková hrubá odměna (135 Kč/h)</span>
                      <span className="text-lg font-extrabold text-stone-950 font-mono mt-0.5 block">
                        {normed.totalEarned.toLocaleString('cs-CZ')} Kč
                      </span>
                    </div>
                  </div>

                  {/* Tabulka rozepsaných pracovních směn */}
                  <div>
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#193F34] mb-2">
                      Rozpis odpracovaných směn a povinných přestávek
                    </h4>
                    <table className="w-full text-left text-xs border border-stone-300 rounded-xl overflow-hidden">
                      <thead className="bg-[#193F34] text-[#F7F3E9] font-bold text-[11px]">
                        <tr>
                          <th className="px-3 py-2">Datum</th>
                          <th className="px-3 py-2">Den</th>
                          <th className="px-3 py-2">Začátek směny</th>
                          <th className="px-3 py-2">Přestávka na oběd (30 min)</th>
                          <th className="px-3 py-2">Konec směny</th>
                          <th className="px-3 py-2 text-right">Čistá doba</th>
                          <th className="px-3 py-2 text-right">Odměna</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {normed.shifts.map((s, idx) => (
                          <tr key={idx} className="hover:bg-stone-50">
                            <td className="px-3 py-1.5 font-mono font-medium">{s.dateStr}</td>
                            <td className="px-3 py-1.5">{s.dayName}</td>
                            <td className="px-3 py-1.5 font-mono font-bold text-emerald-800">{s.startTime}</td>
                            <td className="px-3 py-1.5 text-stone-600">
                              {s.lunchStart ? `${s.lunchStart} – ${s.lunchEnd}` : '— (do 4 hod.)'}
                            </td>
                            <td className="px-3 py-1.5 font-mono font-bold">{s.endTime}</td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold text-sky-900">{s.hours.toFixed(2)} h</td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold">
                              {Math.round(s.hours * 135).toLocaleString('cs-CZ')} Kč
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-stone-100 font-bold border-t border-stone-300">
                        <tr>
                          <td colSpan={5} className="px-3 py-2 text-right">Celkem:</td>
                          <td className="px-3 py-2 text-right font-mono text-sky-950 text-sm">
                            {normed.totalNormHours.toFixed(2)} h
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-emerald-950 text-sm">
                            {normed.totalEarned.toLocaleString('cs-CZ')} Kč
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Sledování kumulativního limitu DPP */}
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-stone-700">
                      <span>Stav čerpání ročního zákonného limitu smlouvy ({attendanceYear}):</span>
                      <span className="font-mono">{annualHours} h z {annualLimit} h</span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Zbývá do vyčerpání zákonného limitu: <strong>{Math.max(0, annualLimit - annualHours).toFixed(1)} h</strong>.
                    </div>
                  </div>

                  {/* Podpisová pole pro A4 tisk */}
                  <div className="grid grid-cols-2 gap-12 pt-8 text-xs text-stone-700">
                    <div className="text-center border-t border-stone-400 pt-2">
                      <p className="font-bold text-stone-900">Podpis zaměstnance / brigádníka</p>
                      <p className="text-[10px] text-stone-500 mt-0.5">Stvrzuji správnost vykázaných údajů</p>
                    </div>
                    <div className="text-center border-t border-stone-400 pt-2">
                      <p className="font-bold text-stone-900">Mzdová účetní / Odpovědný vedoucí</p>
                      <p className="text-[10px] text-stone-500 mt-0.5">Greenberg s.r.o. • Schváleno k výplatě</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tlačítka modálu */}
            <div className="pt-4 border-t border-stone-200 flex justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedPrintNormedEmp(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
              >
                Zavřít
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Vytisknout výkaz pro účetní (A4)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ZMETKOVÝ PROTOKOL – VADNÉ KUSY (A4 TISK) */}
      {selectedDefectLog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:shadow-none print:p-0 print:border-none">
            {/* Hlavička Zmetkového protokolu */}
            <div className="flex items-start justify-between border-b-2 border-rose-800 pb-4">
              <div className="flex items-center gap-3">
                <img src={GREENBERG_LOGO} alt="Greenberg" className="w-12 h-12 object-contain" />
                <div>
                  <h1 className="font-heading font-extrabold text-xl text-rose-900 tracking-tight">
                    ZMETKOVÝ PROTOKOL – ZÁPIS O VADNÝCH KUSECH
                  </h1>
                  <p className="text-xs text-stone-600 font-medium">
                    Greenberg s.r.o. • Kontrola jakosti a podklad pro krácení mezd
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-stone-500 uppercase font-bold">Číslo protokolu</div>
                <div className="text-xl font-heading font-black text-rose-800 font-mono">
                  ZM-{selectedDefectLog.id}
                </div>
              </div>
            </div>

            {/* Údaje o zmetkovitosti */}
            <div className="space-y-6 text-xs text-stone-800">
              <div className="grid grid-cols-2 gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-500 block uppercase font-bold text-[10px]">Pracovník / Brigádník:</span>
                  <strong className="text-sm text-stone-900 block mt-0.5">{selectedDefectLog.employeeName}</strong>
                  {selectedDefectLog.employeeNumber && (
                    <span className="text-stone-600 block font-mono text-[11px]">
                      Osobní číslo: #{selectedDefectLog.employeeNumber}
                    </span>
                  )}
                  <span className="text-stone-600 block text-[11px]">Smlouva: {selectedDefectLog.contractType}</span>
                </div>
                <div>
                  <span className="text-stone-500 block uppercase font-bold text-[10px]">Zakázka a operace:</span>
                  <strong className="text-sm text-stone-900 block mt-0.5">{selectedDefectLog.orderName}</strong>
                  <span className="text-stone-700 block text-[11px]">
                    Operace: <strong>{selectedDefectLog.operationName}</strong>
                  </span>
                  <span className="text-stone-600 block text-[11px]">
                    Datum výroby: <strong>{new Date(selectedDefectLog.date).toLocaleDateString('cs-CZ')}</strong>
                  </span>
                </div>
              </div>

              {/* Bilance kusů a finanční dopad */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-stone-100 rounded-xl border border-stone-300 text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-600 block">Nahlášeno celkem</span>
                  <span className="text-lg font-extrabold text-stone-900 font-mono mt-0.5 block">
                    {selectedDefectLog.submittedPieces} ks
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Schváleno bez vad</span>
                  <span className="text-lg font-extrabold text-emerald-950 font-mono mt-0.5 block">
                    {selectedDefectLog.validatedPieces} ks
                  </span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">k proplacení ({selectedDefectLog.earnedCzk} Kč)</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border-2 border-rose-400 text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-800 block">Vyřazeno vadných kusů</span>
                  <span className="text-xl font-black text-rose-900 font-mono mt-0.5 block">
                    {selectedDefectLog.defectPieces} ks
                  </span>
                  <span className="text-[10px] text-rose-700 font-bold block mt-0.5">neplaceno</span>
                </div>
              </div>

              {/* Popis vady */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                <span className="font-bold text-stone-700 block uppercase text-[10px]">Popis a důvod vyřazení vady:</span>
                <p className="text-stone-900 italic">
                  {selectedDefectLog.note || 'Při vstupní / výstupní kontrole bylo zjištěno nesplnění technologického postupu a tolerancí.'}
                </p>
              </div>

              {/* Právní poučení dle zákoníku práce */}
              <div className="p-3.5 bg-rose-50/70 border-l-4 border-rose-600 rounded-r-xl text-[11px] text-rose-950 leading-relaxed">
                <strong>Právní doložka a poučení:</strong> Dle § 208 a násl. zákoníku práce nevzniká zaměstnanci ani brigádníkovi nárok na odměnu za práci na kusech, které byly zhotoveny vadně vinou pracovníka. Brigádník svým podpisem níže potvrzuje seznámení se se zjištěnými vadami a bere výsledek kontroly na vědomí.
              </div>

              {/* Podpisová pole */}
              <div className="grid grid-cols-2 gap-12 pt-8 text-xs text-stone-700">
                <div className="text-center border-t border-stone-400 pt-2">
                  <p className="font-bold text-stone-900">Kontrolu provedl (Greenberg)</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Odpovědný vedoucí provozu</p>
                </div>
                <div className="text-center border-t border-stone-400 pt-2">
                  <p className="font-bold text-stone-900">Pracovník / Brigádník</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Podpis – převzal a bere na vědomí</p>
                </div>
              </div>
            </div>

            {/* Tlačítka modálu */}
            <div className="pt-4 border-t border-stone-200 flex justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedDefectLog(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
              >
                Zavřít
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Vytisknout zmetkový protokol (A4)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patička s verzí */}
      <footer className="mt-auto py-3 border-t border-[#D6DCD3]/60 bg-[#F7F3E9]/80 text-center text-xs text-[#4E6157]">
        <span>Kípačky v{APP_VERSION} (v2 Provozní administrace) • Greenberg © 2026</span>
      </footer>
    </div>
  );
};
