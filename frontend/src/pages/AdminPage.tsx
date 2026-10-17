import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  FileSpreadsheet,
  QrCode,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  Calendar,
  PackageCheck,
  ShieldCheck,
  Coins,
  Check,
  Settings2,
  Briefcase,
  FileText,
  ExternalLink,
  Bell,
  AlertOctagon,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  fetchAttendanceLogs,
  createManualLog,
  updateAttendanceLog,
  deleteAttendanceLog,
  fetchMonthlyReport,
  getCsvDownloadUrl,
  adminLogout,
  fetchOrders,
  saveOrder,
  fetchOperations,
  saveOperation,
  fetchProductionLogs,
  approveProduction,
  deleteProductionLog,
  fetchDocuments,
  saveDocument,
  fetchDocumentConsents,
  fetchShifts,
  saveShift,
  deleteShift,
  fetchOrderDetail,
  fetchAdminUsers,
  changeAdminPin,
} from '../api/client';
import {
  Employee,
  AttendanceLogItem,
  MonthlyReportResult,
  EmployeeSummary,
  OrderItem,
  OperationItem,
  ProductionLogItem,
  DocumentItem,
  DocumentConsentItem,
  PlannedShiftItem,
  OrderDetailResult,
  AdminUserItem,
} from '../types';
import { GREENBERG_LOGO } from '../assets/logoBase64';
import { APP_VERSION } from '../version';

interface AdminPageProps {
  onLogout: () => void;
  onGoToKiosk: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onLogout, onGoToKiosk }) => {
  const [activeTab, setActiveTab] = useState<
    'employees' | 'logs' | 'production' | 'hr' | 'reports'
  >('employees');

  // ==========================================
  // STAV: ZAMĚSTNANCI
  // ==========================================
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPinCode, setNewPinCode] = useState('');
  const [newContractType, setNewContractType] = useState('DPP');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBankAccount, setNewBankAccount] = useState('');
  const [newContractStartDate, setNewContractStartDate] = useState('');
  const [newContractEndDate, setNewContractEndDate] = useState('');
  const [newSelfScheduled, setNewSelfScheduled] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // QR kód
  const [showQrModal, setShowQrModal] = useState(false);
  const currentUrl =
    typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  // Správa administrátorských Master PINů
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState<string>('admin');
  const [newAdminPinVal, setNewAdminPinVal] = useState<string>('');
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);

  // ==========================================
  // STAV: DOCHÁZKA (LOGS)
  // ==========================================
  const [logs, setLogs] = useState<AttendanceLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilterEmp, setLogFilterEmp] = useState<string>('');
  const [logFilterFrom, setLogFilterFrom] = useState<string>('');
  const [logFilterTo, setLogFilterTo] = useState<string>('');

  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [manualEmpId, setManualEmpId] = useState<number>(0);
  const [manualTimestamp, setManualTimestamp] = useState<string>('');
  const [manualEventType, setManualEventType] = useState<
    'ClockIn' | 'ClockOut' | 'BreakStart' | 'BreakEnd'
  >('ClockIn');
  const [manualNote, setManualNote] = useState<string>('');

  // ==========================================
  // STAV: FÁZE 2 – PRODUKCE, ZAKÁZKY, OPERACE
  // ==========================================
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [operations, setOperations] = useState<OperationItem[]>([]);
  const [productionLogs, setProductionLogs] = useState<ProductionLogItem[]>([]);
  const [loadingProduction, setLoadingProduction] = useState(false);
  const [prodFilterStatus, setProdFilterStatus] = useState<string>('');

  // Detail zakázky (modal + tiskový arch)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetailResult | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  // Lokální editační stav pro schvalování kusů a zmetků v tabulce
  const [prodEdits, setProdEdits] = useState<
    Record<number, { validated: number; defects: number }>
  >({});

  // Nová zakázka / operace
  const [newOrderName, setNewOrderName] = useState('');
  const [newOrderTarget, setNewOrderTarget] = useState('');
  const [newOrderStartDate, setNewOrderStartDate] = useState('');
  const [newOrderEndDate, setNewOrderEndDate] = useState('');
  const [newOrderTargetPrice, setNewOrderTargetPrice] = useState('');
  const [newOrderDesc, setNewOrderDesc] = useState('');
  const [newOrderInitialOps, setNewOrderInitialOps] = useState<
    Array<{ name: string; normPerHour: number; ratePerPiece: number }>
  >([]);
  const [initOpName, setInitOpName] = useState('');
  const [initOpNorm, setInitOpNorm] = useState('100');
  const [initOpRate, setInitOpRate] = useState('1.35');
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);

  const [newOpName, setNewOpName] = useState('');
  const [newOpOrderId, setNewOpOrderId] = useState<string>('');
  const [newOpNorm, setNewOpNorm] = useState('100');
  const [newOpRate, setNewOpRate] = useState('1.35');
  const [editingOp, setEditingOp] = useState<OperationItem | null>(null);
  const [filterOpOrderId, setFilterOpOrderId] = useState<string>('');

  // ==========================================
  // STAV: FÁZE 3 – SMĚNY A BOZP DOKUMENTY
  // ==========================================
  const [shifts, setShifts] = useState<PlannedShiftItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [consents, setConsents] = useState<DocumentConsentItem[]>([]);
  const [loadingHr, setLoadingHr] = useState(false);

  // Formulář nové směny
  const todayIso = new Date().toISOString().slice(0, 10);
  const [shiftDate, setShiftDate] = useState(todayIso);
  const [shiftStart, setShiftStart] = useState('06:00');
  const [shiftEnd, setShiftEnd] = useState('14:00');
  const [shiftEmpId, setShiftEmpId] = useState<string>('');
  const [shiftOrderId, setShiftOrderId] = useState<string>('');
  const [shiftNote, setShiftNote] = useState('');

  // Formulář nového / editovaného BOZP dokumentu
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocShortText, setNewDocShortText] = useState('');
  const [newDocFullText, setNewDocFullText] = useState('');
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  // ==========================================
  // STAV: FINÁLNÍ MĚSÍČNÍ REPORTY
  // ==========================================
  const now = new Date();
  const [reportYear, setReportYear] = useState<number>(now.getFullYear());
  const [reportMonth, setReportMonth] = useState<number>(now.getMonth() + 1);
  const [reportEmpId, setReportEmpId] = useState<string>('');
  const [reportData, setReportData] = useState<MonthlyReportResult | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [card31Employee, setCard31Employee] = useState<EmployeeSummary | null>(null);

  // Notifikace
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  // ==========================================
  // NOTIFIKAČNÍ CENTRUM PRO ADMINISTRÁTORKU
  // ==========================================
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  interface AdminAlert {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    actionTab?: 'employees' | 'logs' | 'production' | 'hr' | 'reports';
  }

  const activeNotifications = React.useMemo(() => {
    const list: AdminAlert[] = [];

    // 1. DPP limity z měsíčního reportu
    if (reportData && reportData.summaries) {
      reportData.summaries.forEach((s) => {
        if (s.contractType === 'DPP') {
          const ytd = s.yearToDateNormHours ?? s.yearToDateNetHours ?? 0;
          if (ytd >= 290) {
            list.push({
              id: `dpp_crit_${s.employeeId}`,
              title: `⛔ Kritický stav DPP: ${s.employeeName}`,
              description: `Brigádník má odpracováno ${ytd.toFixed(1)} h normočasu z limitu 300 h ročně! Je nutné okamžitě zastavit přidělování dalších směn.`,
              severity: 'critical',
              actionTab: 'reports',
            });
          } else if (ytd >= 250) {
            list.push({
              id: `dpp_warn_${s.employeeId}`,
              title: `⚠️ Blíží se limitu DPP: ${s.employeeName}`,
              description: `Odpracováno ${ytd.toFixed(1)} h normočasu z limitu 300 h ročně. Zvažte další rozvržení práce.`,
              severity: 'warning',
              actionTab: 'reports',
            });
          }
        }
      });
    }

    // 2. Neuzavřené směny (Chybí odchod)
    if (logs && logs.length > 0) {
      const nowMs = Date.now();
      const empLastLogMap: Record<number, AttendanceLogItem> = {};
      logs.forEach((l) => {
        if (!empLastLogMap[l.employeeId] || new Date(l.timestamp).getTime() > new Date(empLastLogMap[l.employeeId].timestamp).getTime()) {
          empLastLogMap[l.employeeId] = l;
        }
      });

      Object.values(empLastLogMap).forEach((lastLog) => {
        if (lastLog.eventType === 'ClockIn' || lastLog.eventType === 'BreakStart') {
          const logTimeMs = new Date(lastLog.timestamp).getTime();
          const hoursAgo = (nowMs - logTimeMs) / (1000 * 60 * 60);
          if (hoursAgo >= 12) {
            list.push({
              id: `missing_out_${lastLog.employeeId}`,
              title: `🕒 Neuzavřená směna: ${lastLog.employeeName}`,
              description: `Příchod zaznamenán ${new Date(lastLog.timestamp).toLocaleDateString('cs-CZ')} v ${new Date(lastLog.timestamp).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}, ale chybí odchod (více než ${Math.round(hoursAgo)} h).`,
              severity: 'warning',
              actionTab: 'logs',
            });
          }
        }
      });
    }

    // 3. Čekající výroba ke schválení
    const pendingProds = productionLogs.filter((p) => p.status === 'Pending');
    if (pendingProds.length > 0) {
      const totalPcs = pendingProds.reduce((sum, p) => sum + p.submittedPieces, 0);
      list.push({
        id: 'pending_production',
        title: `📦 Čekající výroba: ${pendingProds.length} ${pendingProds.length === 1 ? 'dávka' : pendingProds.length < 5 ? 'dávky' : 'dávek'} (${totalPcs} ks)`,
        description: `Brigádníci nahlásili vyrobené kusy čekající na Vaši kontrolu a schválení zmetků.`,
        severity: 'info',
        actionTab: 'production',
      });
    }

    // 4. Chybějící čísla účtů pro výplatu u aktivních brigádníků
    const noBankEmps = employees.filter((e) => e.isActive && !e.bankAccount);
    if (noBankEmps.length > 0) {
      list.push({
        id: 'missing_bank_accounts',
        title: `💳 Chybějící čísla účtů (${noBankEmps.length} pracovníků)`,
        description: `${noBankEmps.slice(0, 3).map((e) => e.fullName).join(', ')}${noBankEmps.length > 3 ? ' a další' : ''} nemají v profilu vyplněný bankovní účet pro výplatu mzdy.`,
        severity: 'info',
        actionTab: 'employees',
      });
    }

    return list;
  }, [reportData, logs, productionLogs, employees]);

  useEffect(() => {
    loadEmployees();
    loadProductionBadge();
    loadReport();
    loadLogs();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') loadLogs();
    if (activeTab === 'production') loadProductionData();
    if (activeTab === 'hr') loadHrData();
    if (activeTab === 'reports') loadReport();
  }, [activeTab]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadProductionBadge = async () => {
    try {
      const prods = await fetchProductionLogs();
      setProductionLogs(prods);
      initProdEdits(prods);
    } catch {
      // ignore initial badge error
    }
  };

  const initProdEdits = (prods: ProductionLogItem[]) => {
    const map: Record<number, { validated: number; defects: number }> = {};
    prods.forEach((p) => {
      map[p.id] = {
        validated: p.validatedPieces !== null ? p.validatedPieces : p.submittedPieces,
        defects: p.defectPieces || 0,
      };
    });
    setProdEdits(map);
  };

  // ==========================================
  // HANDLERY: ZAMĚSTNANCI
  // ==========================================
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || newPinCode.length !== 4) {
      showAlert('error', 'Vyplňte jméno a přesně 4místný PIN.');
      return;
    }
    const duplicate = employees.find((emp) => emp.pinCode === newPinCode);
    if (duplicate) {
      showAlert(
        'error',
        `PIN ${newPinCode} již používá zaměstnanec ${duplicate.fullName}. Každý pracovník musí mít unikátní PIN.`
      );
      return;
    }
    try {
      await createEmployee({
        fullName: newFullName.trim(),
        pinCode: newPinCode,
        contractType: newContractType,
        isActive: true,
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        bankAccount: newBankAccount.trim() || undefined,
        contractStartDate: newContractStartDate || undefined,
        contractEndDate: newContractEndDate || undefined,
        selfScheduled: newSelfScheduled,
      });
      setNewFullName('');
      setNewPinCode('');
      setNewContractType('DPP');
      setNewPhone('');
      setNewEmail('');
      setNewBankAccount('');
      setNewContractStartDate('');
      setNewContractEndDate('');
      setNewSelfScheduled(false);
      showAlert('success', 'Zaměstnanec byl úspěšně přidán.');
      loadEmployees();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleUpdateEmployee = async (emp: Employee) => {
    if (!emp.fullName.trim() || emp.pinCode.length !== 4) {
      showAlert('error', 'Vyplňte jméno a přesně 4místný PIN.');
      return;
    }
    const duplicate = employees.find((e) => e.pinCode === emp.pinCode && e.id !== emp.id);
    if (duplicate) {
      showAlert(
        'error',
        `PIN ${emp.pinCode} již používá zaměstnanec ${duplicate.fullName}. Každý pracovník musí mít unikátní PIN.`
      );
      return;
    }
    try {
      await updateEmployee(emp.id, {
        fullName: emp.fullName.trim(),
        pinCode: emp.pinCode,
        contractType: emp.contractType,
        isActive: emp.isActive,
        phone: emp.phone?.trim() || undefined,
        email: emp.email?.trim() || undefined,
        bankAccount: emp.bankAccount?.trim() || undefined,
        contractStartDate: emp.contractStartDate || undefined,
        contractEndDate: emp.contractEndDate || undefined,
        selfScheduled: emp.selfScheduled || false,
      });
      setEditingEmp(null);
      showAlert('success', 'Zaměstnanec byl upraven.');
      loadEmployees();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleOpenAdminPinModal = async () => {
    setLoadingAdminUsers(true);
    setShowAdminPinModal(true);
    try {
      const users = await fetchAdminUsers();
      setAdminUsers(users);
      if (users.length > 0) {
        setSelectedAdminUser(users[0].username);
        setNewAdminPinVal('');
      }
    } catch (err: any) {
      showAlert('error', err.message || 'Nepodařilo se načíst administrátory');
    } finally {
      setLoadingAdminUsers(false);
    }
  };

  const handleChangeAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPinVal || newAdminPinVal.length !== 4) {
      showAlert('error', 'PIN musí mít přesně 4 číslice.');
      return;
    }
    try {
      await changeAdminPin(selectedAdminUser, newAdminPinVal);
      showAlert('success', `PIN pro administrátora ${selectedAdminUser} byl úspěšně změněn na ${newAdminPinVal}.`);
      setNewAdminPinVal('');
      const users = await fetchAdminUsers();
      setAdminUsers(users);
      setShowAdminPinModal(false);
    } catch (err: any) {
      showAlert('error', err.message || 'Nepodařilo se změnit PIN');
    }
  };

  // ==========================================
  // HANDLERY: DOCHÁZKA
  // ==========================================
  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const empId = logFilterEmp ? parseInt(logFilterEmp) : undefined;
      const data = await fetchAttendanceLogs({
        employeeId: empId,
        fromDate: logFilterFrom || undefined,
        toDate: logFilterTo || undefined,
      });
      setLogs(data);
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  const openNewLogModal = () => {
    setEditingLogId(null);
    setManualEmpId(employees[0]?.id || 0);
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setManualTimestamp(d.toISOString().slice(0, 16));
    setManualEventType('ClockIn');
    setManualNote('Ruční zápis');
    setShowLogModal(true);
  };

  const openEditLogModal = (log: AttendanceLogItem) => {
    setEditingLogId(log.id);
    setManualEmpId(log.employeeId);
    const d = new Date(log.timestamp);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setManualTimestamp(d.toISOString().slice(0, 16));
    setManualEventType(log.eventType);
    setManualNote(log.note || '');
    setShowLogModal(true);
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLogId) {
        await updateAttendanceLog(editingLogId, {
          timestamp: manualTimestamp,
          eventType: manualEventType,
          note: manualNote,
        });
        showAlert('success', 'Záznam byl upraven (původní čas zůstává v auditu).');
      } else {
        await createManualLog({
          employeeId: manualEmpId,
          timestamp: manualTimestamp,
          eventType: manualEventType,
          note: manualNote,
        });
        showAlert('success', 'Ruční záznam byl vytvořen.');
      }
      setShowLogModal(false);
      loadLogs();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!window.confirm('Opravdu chcete smazat tento záznam docházky?')) return;
    try {
      await deleteAttendanceLog(id);
      showAlert('success', 'Záznam byl smazán.');
      loadLogs();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  // ==========================================
  // HANDLERY: FÁZE 2 – PRODUKCE, ZAKÁZKY, OPERACE
  // ==========================================
  const loadProductionData = async () => {
    setLoadingProduction(true);
    try {
      const [ords, ops, prods] = await Promise.all([
        fetchOrders(),
        fetchOperations(),
        fetchProductionLogs({ status: prodFilterStatus || undefined }),
      ]);
      setOrders(ords);
      setOperations(ops);
      setProductionLogs(prods);
      initProdEdits(prods);
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setLoadingProduction(false);
    }
  };

  const handleDefectsChange = (prod: ProductionLogItem, defectsVal: number) => {
    const def = Math.max(0, defectsVal);
    const autoValidated = Math.max(0, prod.submittedPieces - def);
    setProdEdits((prev) => ({
      ...prev,
      [prod.id]: {
        defects: def,
        validated: autoValidated,
      },
    }));
  };

  const handleValidatedChange = (prod: ProductionLogItem, validatedVal: number) => {
    const val = Math.max(0, validatedVal);
    setProdEdits((prev) => ({
      ...prev,
      [prod.id]: {
        ...(prev[prod.id] || { defects: prod.defectPieces }),
        validated: val,
      },
    }));
  };

  const handleApproveProdRow = async (prod: ProductionLogItem) => {
    const edit = prodEdits[prod.id] || {
      validated: prod.submittedPieces,
      defects: 0,
    };
    try {
      await approveProduction({
        id: prod.id,
        validatedPieces: edit.validated,
        defectPieces: edit.defects,
      });
      showAlert(
        'success',
        `Schváleno: ${prod.employeeName} (${edit.validated} ks uznáno, ${edit.defects} ks zmetky).`
      );
      loadProductionData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleDeleteProdRow = async (id: number) => {
    if (!window.confirm('Smazat tento záznam výroby?')) return;
    try {
      await deleteProductionLog(id);
      showAlert('success', 'Záznam výroby byl smazán.');
      loadProductionData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleOpenOrderDetail = async (orderId: number) => {
    setLoadingOrderDetail(true);
    try {
      const data = await fetchOrderDetail(orderId);
      setSelectedOrderDetail(data);
    } catch (err: any) {
      showAlert('error', err.message || 'Nepodařilo se načíst detail zakázky.');
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  const handleAddInitOp = () => {
    if (!initOpName.trim()) return;
    setNewOrderInitialOps((prev) => [
      ...prev,
      {
        name: initOpName.trim(),
        normPerHour: parseInt(initOpNorm, 10) || 100,
        ratePerPiece: parseFloat(initOpRate.replace(',', '.')) || 1.35,
      },
    ]);
    setInitOpName('');
    setInitOpNorm('100');
    setInitOpRate('1.35');
  };

  const handleRemoveInitOp = (index: number) => {
    setNewOrderInitialOps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderName.trim()) return;
    try {
      const targetPiecesNum = newOrderTarget ? parseInt(newOrderTarget, 10) : 0;
      const targetPriceNum = newOrderTargetPrice ? parseFloat(newOrderTargetPrice.replace(',', '.')) : 0;

      await saveOrder({
        name: newOrderName.trim(),
        isActive: true,
        targetPieces: targetPiecesNum,
        totalPiecesTarget: targetPiecesNum,
        startDate: newOrderStartDate || undefined,
        endDate: newOrderEndDate || undefined,
        deadline: newOrderEndDate || undefined,
        targetPricePerPiece: targetPriceNum,
        description: newOrderDesc.trim() || undefined,
        operations: newOrderInitialOps.length > 0 ? newOrderInitialOps : undefined,
      });

      setNewOrderName('');
      setNewOrderTarget('');
      setNewOrderStartDate('');
      setNewOrderEndDate('');
      setNewOrderTargetPrice('');
      setNewOrderDesc('');
      setNewOrderInitialOps([]);
      showAlert('success', 'Zakázka byla úspěšně přidána.');
      loadProductionData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleSaveEditOrder = async (ord: OrderItem) => {
    try {
      await saveOrder({
        id: ord.id,
        name: ord.name,
        isActive: ord.isActive,
        targetPieces: ord.totalPiecesTarget ?? ord.targetPieces ?? 0,
        totalPiecesTarget: ord.totalPiecesTarget ?? ord.targetPieces ?? 0,
        startDate: ord.startDate || undefined,
        endDate: ord.endDate || ord.deadline || undefined,
        deadline: ord.endDate || ord.deadline || undefined,
        targetPricePerPiece: ord.targetPricePerPiece ?? 0,
        description: ord.description || undefined,
      });
      setEditingOrder(null);
      showAlert('success', 'Zakázka byla upravena.');
      loadProductionData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleToggleOrder = async (ord: OrderItem) => {
    try {
      await saveOrder({
        id: ord.id,
        name: ord.name,
        isActive: !ord.isActive,
        targetPieces: ord.targetPieces,
        deadline: ord.deadline,
        description: ord.description,
      });
      loadProductionData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim()) return;
    try {
      await saveOperation({
        name: newOpName.trim(),
        orderId: newOpOrderId ? parseInt(newOpOrderId, 10) : null,
        normPerHour: parseInt(newOpNorm) || 100,
        ratePerPiece: parseFloat(newOpRate.replace(',', '.')) || 1.35,
        isActive: true,
      });
      setNewOpName('');
      showAlert('success', 'Operace a norma byla přidána.');
      loadProductionData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleSaveEditOp = async (op: OperationItem) => {
    try {
      await saveOperation({
        id: op.id,
        name: op.name,
        orderId: op.orderId ?? null,
        normPerHour: op.normPerHour,
        ratePerPiece: op.ratePerPiece,
        isActive: op.isActive ?? true,
      });
      setEditingOp(null);
      showAlert('success', 'Norma a sazba operace byla aktualizována.');
      loadProductionData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  // ==========================================
  // HANDLERY: FÁZE 3 – SMĚNY A BOZP
  // ==========================================
  const loadHrData = async () => {
    setLoadingHr(true);
    try {
      const [sh, docs, cons, ords] = await Promise.all([
        fetchShifts(),
        fetchDocuments(),
        fetchDocumentConsents(),
        fetchOrders(),
      ]);
      setShifts(sh);
      setDocuments(docs);
      setConsents(cons);
      setOrders(ords);
      if (!shiftEmpId && employees.length > 0) {
        setShiftEmpId(String(employees[0].id));
      }
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setLoadingHr(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveShift({
        shiftDate,
        startTime: shiftStart,
        endTime: shiftEnd,
        employeeId: shiftEmpId ? parseInt(shiftEmpId) : null,
        orderId: shiftOrderId ? parseInt(shiftOrderId) : null,
        note: shiftNote,
      });
      setShiftNote('');
      showAlert('success', 'Směna byla naplánována.');
      loadHrData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleDeleteShiftRow = async (id: number) => {
    try {
      await deleteShift(id);
      showAlert('success', 'Směna byla zrušena.');
      loadHrData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleSaveDocumentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    try {
      await saveDocument({
        id: editingDoc?.id,
        title: newDocTitle.trim(),
        content: newDocShortText.trim() || undefined,
        shortText: newDocShortText.trim() || undefined,
        fullText: newDocFullText.trim() || undefined,
        isActive: editingDoc ? editingDoc.isActive : true,
      });
      setNewDocTitle('');
      setNewDocShortText('');
      setNewDocFullText('');
      setEditingDoc(null);
      showAlert('success', editingDoc ? 'Směrnice byla upravena.' : 'Nová směrnice / BOZP dokument byl publikován.');
      loadHrData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  const handleStartEditDoc = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setNewDocTitle(doc.title);
    setNewDocShortText(doc.shortText || doc.content || '');
    setNewDocFullText(doc.fullText || '');
  };

  const handleCancelEditDoc = () => {
    setEditingDoc(null);
    setNewDocTitle('');
    setNewDocShortText('');
    setNewDocFullText('');
  };

  const handleToggleDocument = async (doc: DocumentItem) => {
    try {
      await saveDocument({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        shortText: doc.shortText,
        fullText: doc.fullText,
        isActive: !doc.isActive,
      });
      loadHrData();
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };

  // ==========================================
  // HANDLERY: REPORTY
  // ==========================================
  const loadReport = async () => {
    setLoadingReport(true);
    try {
      const empId = reportEmpId ? parseInt(reportEmpId) : undefined;
      const data = await fetchMonthlyReport(reportYear, reportMonth, empId);
      setReportData(data);
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleLogoutClick = async () => {
    await adminLogout();
    onLogout();
  };

  const pendingProdCount = productionLogs.filter((p) => p.status === 'Pending').length;

  return (
    <div className="relative z-10 min-h-screen bg-transparent text-[#232B28] flex flex-col font-sans">
      {/* Horní navigační lišta */}
      <header className="bg-[#193F34] border-b border-[#285446] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/95 px-2 py-1 rounded-[8px] flex items-center justify-center shadow-xs">
              <img
                src={GREENBERG_LOGO}
                alt="Greenberg"
                className="h-6 w-auto object-contain shrink-0"
              />
            </div>
            <div className="border-l border-[#285446] pl-3 py-0.5">
              <span className="font-extrabold text-sm tracking-tight font-heading text-[#F7F3E9] block leading-tight">Greenberg</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#285446] text-[#D7BE97] font-semibold tracking-wider">
                  ADMIN & VÝROBA
                </span>
              </div>
            </div>
          </div>

          {/* Přepínač záložek */}
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
              <span>Zaměstnanci</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'bg-[#D7BE97] text-[#193F34] font-bold shadow-sm'
                  : 'text-[#C9DDD0] hover:text-[#F7F3E9]'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Docházka</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('production')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'production'
                  ? 'bg-[#9B623F] text-white font-bold shadow-sm'
                  : 'text-[#C9DDD0] hover:text-[#F7F3E9]'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>Produkce & Normy</span>
              {pendingProdCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[11px] font-extrabold bg-[#D7BE97] text-[#193F34]">
                  {pendingProdCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hr')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'hr'
                  ? 'bg-[#D7BE97] text-[#193F34] font-bold shadow-sm'
                  : 'text-[#C9DDD0] hover:text-[#F7F3E9]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Směny & BOZP</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-[#16634D] text-white font-bold shadow-sm'
                  : 'text-[#C9DDD0] hover:text-[#F7F3E9]'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Měsíční výkazy & Mzdy</span>
            </button>
          </nav>

          {/* Pravé akce */}
          <div className="flex items-center gap-2">
            {/* Tlačítko Notifikací */}
            <button
              type="button"
              onClick={() => setShowNotificationsModal(!showNotificationsModal)}
              className="relative p-2 rounded-xl bg-[#285446] hover:bg-[#3E7361] text-[#F7F3E9] transition-colors cursor-pointer"
              title="Centrum provozních notifikací"
            >
              <Bell className="w-4 h-4" />
              {activeNotifications.length > 0 && (
                <span
                  className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-black text-white ${
                    activeNotifications.some((n) => n.severity === 'critical')
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                >
                  {activeNotifications.length}
                </span>
              )}
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
              onClick={handleLogoutClick}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors cursor-pointer"
              title="Odhlásit se"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Modální okno / Panel notifikací pro Martu */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#E4DDD0] rounded-2xl shadow-2xl overflow-hidden mt-10 animate-in fade-in slide-in-from-top-4">
            <div className="p-4 border-b border-[#E4DDD0] flex items-center justify-between bg-[#F7F3E9]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#835614]" />
                <h3 className="font-bold text-[#193F34] font-heading text-base">Centrum provozních upozornění</h3>
                {activeNotifications.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#D7BE97] text-[#193F34] border border-[#C2A980]">
                    {activeNotifications.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="p-1.5 rounded-lg text-[#4E6157] hover:text-[#193F34] hover:bg-[#E9E1D2] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[72vh] overflow-y-auto space-y-3">
              {activeNotifications.length === 0 ? (
                <div className="text-center py-10 text-[#4E6157]">
                  <CheckCircle2 className="w-12 h-12 text-[#16634D] mx-auto mb-2 opacity-90" />
                  <p className="font-bold text-[#193F34] text-base">Vše je v naprostém pořádku</p>
                  <p className="text-xs text-[#4E6157] mt-1">
                    Žádné překročené limity DPP, neuzavřené směny ani čekající výroba.
                  </p>
                </div>
              ) : (
                activeNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                      notif.severity === 'critical'
                        ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                        : notif.severity === 'warning'
                        ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                        : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {notif.severity === 'critical' ? (
                          <AlertOctagon className="w-4 h-4 text-[#DC2626] shrink-0" />
                        ) : notif.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-[#16A34A] shrink-0" />
                        )}
                        <span>{notif.title}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-current">
                        {notif.severity === 'critical'
                          ? 'Kritické'
                          : notif.severity === 'warning'
                          ? 'Varování'
                          : 'Info'}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{notif.description}</p>
                    {notif.actionTab && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(notif.actionTab!);
                          setShowNotificationsModal(false);
                        }}
                        className="self-end inline-flex items-center gap-1 text-xs font-bold text-[#193F34] hover:underline transition-colors pt-1 cursor-pointer"
                      >
                        <span>Přejít k řešení</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Obsah */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner kritických upozornění přímo na stránce */}
        {activeNotifications.some((n) => n.severity === 'critical') && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FEF2F2] border-2 border-[#EF4444] flex items-center justify-between gap-3 text-[#991B1B] shadow-md animate-pulse">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-6 h-6 text-[#DC2626] shrink-0" />
              <div>
                <p className="font-bold text-sm text-[#991B1B]">Pozor: Systém eviduje kritická provozní upozornění!</p>
                <p className="text-xs text-[#B91C1C]">
                  Překročení zákonného limitu 300 hodin u DPP. Zkontrolujte detaily v Centru notifikací.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNotificationsModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow"
            >
              Zobrazit ({activeNotifications.filter((n) => n.severity === 'critical').length})
            </button>
          </div>
        )}

        {alertMessage && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl border flex items-center gap-2.5 text-sm font-medium ${
              alertMessage.type === 'success'
                ? 'bg-[#EAF2ED] border-[#A8C7B5] text-[#16634D]'
                : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
            }`}
          >
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 1: ZAMĚSTNANCI                                   */}
        {/* ==================================================== */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#193F34] tracking-tight">
                  Správa zaměstnanců a PIN kódů
                </h1>
                <p className="text-sm text-[#4E6157]">
                  Přidávejte brigádníky (DPP/DPČ) a zaměstnance (HPP). Každý má svůj unikátní 4místný PIN.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenAdminPinModal}
                  className="px-4 py-2.5 rounded-xl bg-[#285446] hover:bg-[#3E7361] text-[#F7F3E9] font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  title="Správa administrátorských Master PINů pro Martu a Jána"
                >
                  <ShieldCheck className="w-4 h-4 text-[#D7BE97]" />
                  <span>Master PINy správy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  Vytisknout vchodový QR kód
                </button>
              </div>
            </div>

            {/* Formulář pro nového zaměstnance */}
            {(() => {
              const duplicateCreateEmp =
                newPinCode.length === 4
                  ? employees.find((e) => e.pinCode === newPinCode)
                  : null;

              return (
                <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold font-heading text-[#193F34]">Nový zaměstnanec</h2>
                    {duplicateCreateEmp && (
                      <span className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                        ⚠️ PIN {newPinCode} již má {duplicateCreateEmp.fullName} (
                        {duplicateCreateEmp.contractType})
                      </span>
                    )}
                  </div>
                  <form
                    onSubmit={handleCreateEmployee}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="Jméno a příjmení (např. Tereza Dvořáková)"
                          value={newFullName}
                          onChange={(e) => setNewFullName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#D6DCD3] rounded-xl text-[#232B28] placeholder-[#8B9B90] focus:border-[#193F34] text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          placeholder="PIN (4 číslice)"
                          value={newPinCode}
                          onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, ''))}
                          className={`w-full px-4 py-2.5 bg-white border border-[#D6DCD3] rounded-xl text-sm font-mono text-[#232B28] focus:outline-none focus:ring-2 ${
                            duplicateCreateEmp
                              ? 'border-rose-500 text-rose-300 focus:ring-rose-500'
                              : 'border-[#E4DDD0] text-[#232B28] placeholder-[#8B9B90] focus:ring-sky-500'
                          }`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={newContractType}
                          onChange={(e) => setNewContractType(e.target.value)}
                          className="flex-1 px-3 py-2.5 bg-white border border-[#D6DCD3] rounded-xl text-[#232B28] text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="DPP">DPP</option>
                          <option value="DPČ">DPČ</option>
                          <option value="HPP">HPP</option>
                          <option value="IČO">IČO</option>
                        </select>
                        <button
                          type="submit"
                          disabled={
                            Boolean(duplicateCreateEmp) ||
                            newPinCode.length !== 4 ||
                            !newFullName.trim()
                          }
                          className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all ${
                            Boolean(duplicateCreateEmp) ||
                            newPinCode.length !== 4 ||
                            !newFullName.trim()
                              ? 'bg-[#E9E1D2] text-[#88968F] cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-600/20'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          Přidat
                        </button>
                      </div>
                    </div>

                    {/* Fáze 5: Kontaktní a platební profil */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-[#E4DDD0]">
                      <div>
                        <input
                          type="text"
                          placeholder="Telefon (volitelné)"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-[#232B28] placeholder-[#8B9B90] focus:border-[#193F34] text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="E-mail (volitelné)"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-[#232B28] placeholder-[#8B9B90] focus:border-[#193F34] text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Číslo bankovního účtu (pro mzdy)"
                          value={newBankAccount}
                          onChange={(e) => setNewBankAccount(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-[#232B28] placeholder-[#8B9B90] focus:border-[#193F34] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    {/* Fáze 2.4: Smlouva a samorozvrhování */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E4DDD0] items-center">
                      <div>
                        <label className="block text-[11px] text-[#4E6157] mb-0.5">Začátek smlouvy</label>
                        <input
                          type="date"
                          value={newContractStartDate}
                          onChange={(e) => setNewContractStartDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-[#D6DCD3] rounded-xl text-[#232B28] text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#4E6157] mb-0.5">Konec smlouvy</label>
                        <input
                          type="date"
                          value={newContractEndDate}
                          onChange={(e) => setNewContractEndDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-[#D6DCD3] rounded-xl text-[#232B28] text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div className="pt-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#232B28] font-medium">
                          <input
                            type="checkbox"
                            checked={newSelfScheduled}
                            onChange={(e) => setNewSelfScheduled(e.target.checked)}
                            className="rounded border-[#D6DCD3] text-[#193F34] focus:ring-0"
                          />
                          <span>Samorozvrhování (bez příplatků za víkendy)</span>
                        </label>
                      </div>
                    </div>
                  </form>
                </div>
              );
            })()}

            {/* Seznam zaměstnanců */}
            <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#E4DDD0] flex items-center justify-between">
                <h2 className="text-base font-semibold font-heading text-[#193F34]">
                  Seznam pracovníků ({employees.length})
                </h2>
                {loadingEmployees && <span className="text-xs text-[#193F34]">Načítám...</span>}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#3E4F46]">
                  <thead className="bg-[#F7F3E9]/60 text-xs uppercase font-semibold text-[#4E6157] border-b border-[#E4DDD0]">
                    <tr>
                      <th className="px-5 py-3.5">Jméno a příjmení</th>
                      <th className="px-5 py-3.5">PIN</th>
                      <th className="px-5 py-3.5">Úvazek</th>
                      <th className="px-5 py-3.5">Kontakt & Účet (Výplata)</th>
                      <th className="px-5 py-3.5">Stav</th>
                      <th className="px-5 py-3.5 text-right">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {employees.map((emp) => {
                      const isEditing = editingEmp?.id === emp.id;
                      return (
                        <tr key={emp.id} className="hover:bg-[#E9E1D2] transition-colors">
                          <td className="px-5 py-4 font-bold text-[#193F34]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingEmp.fullName}
                                onChange={(e) =>
                                  setEditingEmp({ ...editingEmp, fullName: e.target.value })
                                }
                                className="px-3 py-1 bg-[#F7F3E9] border border-[#D6DCD3] rounded-lg text-sm text-[#232B28] w-full"
                              />
                            ) : (
                              emp.fullName
                            )}
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-[#193F34]">
                            {isEditing ? (
                              <div>
                                <input
                                  type="text"
                                  maxLength={4}
                                  value={editingEmp.pinCode}
                                  onChange={(e) =>
                                    setEditingEmp({
                                      ...editingEmp,
                                      pinCode: e.target.value.replace(/\D/g, ''),
                                    })
                                  }
                                  className={`px-3 py-1 bg-[#F7F3E9] border rounded-lg text-sm w-24 font-mono focus:outline-none focus:ring-2 ${
                                    employees.some(
                                      (e) =>
                                        e.pinCode === editingEmp.pinCode && e.id !== editingEmp.id
                                    )
                                      ? 'border-rose-500 text-rose-300 focus:ring-rose-500'
                                      : 'border-[#D6DCD3] text-[#193F34] focus:ring-sky-500'
                                  }`}
                                />
                                {(() => {
                                  const dup = employees.find(
                                    (e) =>
                                      e.pinCode === editingEmp.pinCode && e.id !== editingEmp.id
                                  );
                                  return dup ? (
                                    <div className="text-[10px] text-rose-400 mt-1 font-sans whitespace-nowrap font-normal">
                                      ⚠️ Má {dup.fullName}
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            ) : (
                              emp.pinCode
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {isEditing ? (
                              <select
                                value={editingEmp.contractType}
                                onChange={(e) =>
                                  setEditingEmp({ ...editingEmp, contractType: e.target.value })
                                }
                                className="px-2 py-1 bg-[#F7F3E9] border border-[#D6DCD3] rounded-lg text-sm text-[#232B28]"
                              >
                                <option value="DPP">DPP</option>
                                <option value="DPČ">DPČ</option>
                                <option value="HPP">HPP</option>
                                <option value="IČO">IČO</option>
                              </select>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E9E1D2] text-[#193F34] text-[#3E4F46]">
                                {emp.contractType}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  placeholder="Číslo účtu"
                                  value={editingEmp.bankAccount || ''}
                                  onChange={(e) =>
                                    setEditingEmp({ ...editingEmp, bankAccount: e.target.value })
                                  }
                                  className="px-2 py-1 bg-[#F7F3E9] border border-[#D6DCD3] rounded text-xs text-[#232B28] font-mono w-full"
                                />
                                <div className="grid grid-cols-2 gap-1">
                                  <input
                                    type="text"
                                    placeholder="Tel."
                                    value={editingEmp.phone || ''}
                                    onChange={(e) =>
                                      setEditingEmp({ ...editingEmp, phone: e.target.value })
                                    }
                                    className="px-2 py-0.5 bg-[#F7F3E9] border border-[#D6DCD3] rounded text-[11px] text-[#232B28] w-full"
                                  />
                                  <input
                                    type="email"
                                    placeholder="E-mail"
                                    value={editingEmp.email || ''}
                                    onChange={(e) =>
                                      setEditingEmp({ ...editingEmp, email: e.target.value })
                                    }
                                    className="px-2 py-0.5 bg-[#F7F3E9] border border-[#D6DCD3] rounded text-[11px] text-[#232B28] w-full"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-1 pt-1">
                                  <div>
                                    <label className="text-[10px] text-[#4E6157] block">Smlouva od:</label>
                                    <input
                                      type="date"
                                      value={editingEmp.contractStartDate || ''}
                                      onChange={(e) =>
                                        setEditingEmp({ ...editingEmp, contractStartDate: e.target.value })
                                      }
                                      className="px-1.5 py-0.5 bg-[#F7F3E9] border border-[#D6DCD3] rounded text-[11px] text-[#232B28] w-full"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[#4E6157] block">Smlouva do:</label>
                                    <input
                                      type="date"
                                      value={editingEmp.contractEndDate || ''}
                                      onChange={(e) =>
                                        setEditingEmp({ ...editingEmp, contractEndDate: e.target.value })
                                      }
                                      className="px-1.5 py-0.5 bg-[#F7F3E9] border border-[#D6DCD3] rounded text-[11px] text-[#232B28] w-full"
                                    />
                                  </div>
                                </div>
                                <label className="inline-flex items-center gap-1.5 pt-1 text-[11px] text-[#232B28] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingEmp.selfScheduled || false}
                                    onChange={(e) =>
                                      setEditingEmp({ ...editingEmp, selfScheduled: e.target.checked })
                                    }
                                    className="rounded border-[#D6DCD3] text-[#193F34]"
                                  />
                                  <span>Samorozvrhování</span>
                                </label>
                              </div>
                            ) : (
                              <div>
                                {emp.bankAccount ? (
                                  <div className="font-mono font-bold text-[#193F34]">
                                    {emp.bankAccount}
                                    {emp.personalDataConfirmedAt && (
                                      <span className="ml-1 text-[10px] text-[#4E6157] font-normal">
                                        (✓ ověřeno)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#A53F4E]/15 border border-[#A53F4E]/40 text-[#A53F4E] font-bold text-xs shadow-2xs">
                                    ⚠️ Chybí číslo účtu
                                  </div>
                                )}
                                {(emp.phone || emp.email) && (
                                  <div className="text-[11px] text-[#4E6157] mt-0.5">
                                    {emp.phone && <span>{emp.phone}</span>}
                                    {emp.phone && emp.email && <span> • </span>}
                                    {emp.email && <span>{emp.email}</span>}
                                  </div>
                                )}
                                {(emp.contractStartDate || emp.contractEndDate || emp.selfScheduled) && (
                                  <div className="text-[10px] text-[#4E6157] mt-1 space-x-1.5">
                                    {(emp.contractStartDate || emp.contractEndDate) && (
                                      <span>
                                        📅 {emp.contractStartDate ? new Date(emp.contractStartDate).toLocaleDateString('cs-CZ') : '...'}
                                        {' – '}
                                        {emp.contractEndDate ? new Date(emp.contractEndDate).toLocaleDateString('cs-CZ') : 'neurčito'}
                                      </span>
                                    )}
                                    {emp.selfScheduled && (
                                      <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-semibold border border-sky-300">
                                        Samorozvrh.
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {isEditing ? (
                              <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={editingEmp.isActive}
                                  onChange={(e) =>
                                    setEditingEmp({ ...editingEmp, isActive: e.target.checked })
                                  }
                                  className="rounded border-[#D6DCD3] text-sky-500 focus:ring-0"
                                />
                                <span>Aktivní</span>
                              </label>
                            ) : emp.isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                Aktivní
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs text-[#6C7E74]">
                                <span className="w-2 h-2 rounded-full bg-slate-600" />
                                Neaktivní
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    editingEmp.pinCode.length !== 4 ||
                                    !editingEmp.fullName.trim() ||
                                    employees.some(
                                      (e) =>
                                        e.pinCode === editingEmp.pinCode && e.id !== editingEmp.id
                                    )
                                  }
                                  onClick={() => handleUpdateEmployee(editingEmp)}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    editingEmp.pinCode.length !== 4 ||
                                    !editingEmp.fullName.trim() ||
                                    employees.some(
                                      (e) =>
                                        e.pinCode === editingEmp.pinCode && e.id !== editingEmp.id
                                    )
                                      ? 'bg-[#E9E1D2] text-[#88968F] cursor-not-allowed'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm'
                                  }`}
                                >
                                  Uložit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingEmp(null)}
                                  className="px-3 py-1 bg-[#E9E1D2] hover:bg-[#DDD5C5] text-[#193F34] rounded-lg text-xs cursor-pointer"
                                >
                                  Zrušit
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingEmp(emp)}
                                className="p-1.5 text-[#4E6157] hover:text-[#193F34] transition-colors cursor-pointer rounded-lg hover:bg-[#E9E1D2]"
                                title="Upravit zaměstnance / PIN"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: SPRÁVA DOCHÁZKY A AUDIT OPRAV                 */}
        {/* ==================================================== */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#193F34] tracking-tight">
                  Záznamy docházky a ruční korekce (s auditem)
                </h1>
                <p className="text-sm text-[#4E6157]">
                  Při ruční opravě času zůstává původní hodnota trvale uložena v historii záznamu.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewLogModal}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Vložit ruční záznam
              </button>
            </div>

            {/* Filtry */}
            <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-[#4E6157] mb-1">Pracovník</label>
                <select
                  value={logFilterEmp}
                  onChange={(e) => setLogFilterEmp(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-sm text-[#232B28]"
                >
                  <option value="">Všichni zaměstnanci</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#4E6157] mb-1 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#193F34]" />
                  <span>Datum od</span>
                </label>
                <input
                  type="date"
                  value={logFilterFrom}
                  onChange={(e) => setLogFilterFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-sm text-[#232B28] focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-[#4E6157] mb-1 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#193F34]" />
                  <span>Datum do</span>
                </label>
                <input
                  type="date"
                  value={logFilterTo}
                  onChange={(e) => setLogFilterTo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-sm text-[#232B28] focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={loadLogs}
                  className="w-full py-2 bg-[#E9E1D2] hover:bg-[#D7BE97] text-[#193F34] rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Filtrovat
                </button>
              </div>
            </div>

            {/* Tabulka docházky */}
            <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#E4DDD0] flex items-center justify-between">
                <h2 className="text-base font-semibold font-heading text-[#193F34]">
                  Historie docházky ({logs.length} záznamů)
                </h2>
                {loadingLogs && <span className="text-xs text-[#193F34]">Načítám...</span>}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#3E4F46]">
                  <thead className="bg-[#F7F3E9]/60 text-xs uppercase font-semibold text-[#4E6157] border-b border-[#E4DDD0]">
                    <tr>
                      <th className="px-5 py-3.5">Pracovník</th>
                      <th className="px-5 py-3.5">Datum a čas</th>
                      <th className="px-5 py-3.5">Událost</th>
                      <th className="px-5 py-3.5">Původ / Audit</th>
                      <th className="px-5 py-3.5">Poznámka</th>
                      <th className="px-5 py-3.5 text-right">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {logs.map((log) => {
                      const dateObj = new Date(log.timestamp);
                      const isClockIn = log.eventType === 'ClockIn';
                      const isBreakStart = log.eventType === 'BreakStart';
                      const isBreakEnd = log.eventType === 'BreakEnd';
                      const origDateObj = log.originalTimestamp
                        ? new Date(log.originalTimestamp)
                        : null;
                      const modDateObj = log.modifiedAt ? new Date(log.modifiedAt) : null;

                      return (
                        <tr key={log.id} className="hover:bg-[#E9E1D2] transition-colors">
                          <td className="px-5 py-3.5 font-bold text-[#193F34]">
                            {log.employeeName}
                            <span className="ml-2 text-xs font-normal text-[#4E6157]">
                              ({log.contractType})
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs">
                            <span className="inline-flex items-center gap-1.5 text-[#3E4F46]">
                              <Calendar className="w-3.5 h-3.5 text-[#193F34]" />
                              {dateObj.toLocaleDateString('cs-CZ')}
                            </span>
                            <span className="inline-flex items-center gap-1 font-bold text-[#193F34] ml-2 bg-[#E9E1D2] px-2 py-0.5 rounded border border-[#D6DCD3]/50">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {dateObj.toLocaleTimeString('cs-CZ', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {origDateObj && (
                              <div className="text-[11px] text-amber-400/90 mt-1">
                                Původní čas:{' '}
                                {origDateObj.toLocaleTimeString('cs-CZ', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                isClockIn
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : isBreakStart
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                    : isBreakEnd
                                      ? 'bg-sky-500/15 text-[#16634D] border border-[#193F34]/30'
                                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isClockIn
                                ? 'Příchod'
                                : isBreakStart
                                  ? 'Začátek přestávky'
                                  : isBreakEnd
                                    ? 'Konec přestávky'
                                    : 'Odchod'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {log.isManualEdit || log.modifiedByAdmin ? (
                              <div>
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  Upraveno ({log.modifiedBy || 'admin'})
                                </span>
                                {modDateObj && (
                                  <div className="text-[10px] text-[#4E6157] mt-1 font-mono">
                                    Kdy:{' '}
                                    {modDateObj.toLocaleDateString('cs-CZ')}{' '}
                                    {modDateObj.toLocaleTimeString('cs-CZ', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-[#6C7E74]">Systém (Kiosk)</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#3E4F46] max-w-xs">
                            {log.modifyReason || log.note || '-'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditLogModal(log)}
                                className="p-1.5 text-[#4E6157] hover:text-[#193F34] rounded-lg hover:bg-[#E9E1D2] transition-colors cursor-pointer"
                                title="Upravit čas"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-1.5 text-[#4E6157] hover:text-rose-400 rounded-lg hover:bg-[#E9E1D2] transition-colors cursor-pointer"
                                title="Smazat záznam"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: FÁZE 2 – PRODUKCE, ZAKÁZKY A NORMY            */}
        {/* ==================================================== */}
        {activeTab === 'production' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#193F34] tracking-tight">
                  Kontrola produkce, zakázky a normy
                </h1>
                <p className="text-sm text-[#4E6157]">
                  Ověřte odevzdané kusy od brigádníků, odečtěte zmetky a spravujte hodinové normy a sazby.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={prodFilterStatus}
                  onChange={(e) => {
                    setProdFilterStatus(e.target.value);
                  }}
                  className="px-3 py-2 bg-white border border-[#E4DDD0] rounded-xl text-xs text-[#232B28] font-medium"
                >
                  <option value="" className="text-[#232B28] bg-white">Všechny záznamy produkce</option>
                  <option value="Pending" className="text-[#232B28] bg-white">Pouze čekající na schválení</option>
                  <option value="Approved" className="text-[#232B28] bg-white">Pouze schválené</option>
                </select>
                <button
                  type="button"
                  onClick={loadProductionData}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Obnovit
                </button>
              </div>
            </div>

            {/* Tabulka Kontroly produkce (Dvojí ověření Marty) */}
            <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#E4DDD0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold font-heading text-[#193F34]">
                    Odevzdaná produkce brigádníků ({productionLogs.length})
                  </h2>
                </div>
                {loadingProduction && <span className="text-xs text-indigo-600">Načítám...</span>}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#3E4F46]">
                  <thead className="bg-[#F7F3E9]/60 text-xs uppercase font-semibold text-[#4E6157] border-b border-[#E4DDD0]">
                    <tr>
                      <th className="px-4 py-3.5">Kdo & Kdy</th>
                      <th className="px-4 py-3.5">Zakázka & Operace</th>
                      <th className="px-4 py-3.5 text-center">Nahlášeno</th>
                      <th className="px-4 py-3.5 text-center">Zmetky (ks)</th>
                      <th className="px-4 py-3.5 text-center">Schválené ks</th>
                      <th className="px-4 py-3.5 text-right">Normočas & Výdělek</th>
                      <th className="px-4 py-3.5 text-center">Stav</th>
                      <th className="px-4 py-3.5 text-right">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {productionLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-8 text-center text-[#6C7E74] text-xs">
                          Zatím nebyly zadány žádné výkazy produkce.
                        </td>
                      </tr>
                    ) : (
                      productionLogs.map((p) => {
                        const edit = prodEdits[p.id] || {
                          validated:
                            p.validatedPieces !== null ? p.validatedPieces : p.submittedPieces,
                          defects: p.defectPieces || 0,
                        };
                        const liveEarned = (edit.validated * p.ratePerPiece).toFixed(2);
                        const liveHours =
                          p.normPerHour > 0 ? (edit.validated / p.normPerHour).toFixed(2) : '0.00';
                        const isPending = p.status === 'Pending';

                        return (
                          <tr
                            key={p.id}
                            className={`transition-colors ${
                              isPending ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-[#E9E1D2]'
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-[#193F34]">{p.employeeName}</div>
                              <div className="text-xs text-[#4E6157] font-mono">
                                {new Date(p.date).toLocaleDateString('cs-CZ')}{' '}
                                {new Date(p.date).toLocaleTimeString('cs-CZ', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-indigo-700 text-xs">
                                {p.orderName}
                              </div>
                              <div className="text-xs text-[#3E4F46]">
                                {p.operationName}{' '}
                                <span className="text-[#6C7E74] font-mono">
                                  ({p.ratePerPiece.toFixed(2)} Kč/ks • {p.normPerHour} ks/h)
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-bold text-base text-[#232B28]">
                              {p.submittedPieces} ks
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <input
                                type="number"
                                min={0}
                                value={edit.defects}
                                onChange={(e) =>
                                  handleDefectsChange(p, parseInt(e.target.value || '0', 10))
                                }
                                className="w-20 px-2.5 py-1.5 bg-[#F7F3E9] border border-rose-500/40 rounded-lg text-center font-mono text-rose-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <input
                                type="number"
                                min={0}
                                value={edit.validated}
                                onChange={(e) =>
                                  handleValidatedChange(p, parseInt(e.target.value || '0', 10))
                                }
                                className="w-24 px-2.5 py-1.5 bg-[#F7F3E9] border border-emerald-500/50 rounded-lg text-center font-mono text-emerald-300 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono">
                              <div className="font-extrabold text-emerald-400 text-sm">
                                {liveEarned} Kč
                              </div>
                              <div className="text-xs text-[#4E6157]">{liveHours} normohod.</div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {isPending ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  Čeká na kontrolu
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <Check className="w-3.5 h-3.5" />
                                  Schváleno
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveProdRow(p)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    isPending
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                                      : 'bg-[#E9E1D2] text-[#193F34] hover:bg-slate-700 text-[#232B28]'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  {isPending ? 'Schválit' : 'Uložit změnu'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProdRow(p.id)}
                                  className="p-1.5 text-[#6C7E74] hover:text-rose-400 rounded-lg hover:bg-[#E9E1D2] cursor-pointer"
                                  title="Smazat záznam"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spodní dvou-sloupec: Zakázky + Operace a Normy */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Správa Zakázek */}
              <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card p-5 shadow-sm">
                <h3 className="text-base font-bold font-heading text-[#193F34] flex items-center gap-2 mb-4">
                  <Briefcase className="w-4 h-4 text-[#193F34]" />
                  Zakázky (Orders)
                </h3>

                <form onSubmit={handleCreateOrder} className="space-y-3 mb-4 bg-[#F7F3E9]/60 p-4 rounded-xl border border-[#E4DDD0]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#193F34] mb-1">Název zakázky *</label>
                      <input
                        type="text"
                        required
                        placeholder="Např. Dárková krabička Premium"
                        value={newOrderName}
                        onChange={(e) => setNewOrderName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] placeholder-[#8B9B90] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#193F34] mb-1">Cílový počet kusů (TotalPiecesTarget)</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="Např. 2000 ks"
                        value={newOrderTarget}
                        onChange={(e) => setNewOrderTarget(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] placeholder-[#8B9B90] font-mono font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#193F34] mb-1">Datum zahájení (StartDate)</label>
                      <input
                        type="date"
                        value={newOrderStartDate}
                        onChange={(e) => setNewOrderStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#193F34] mb-1">Termín dokončení (EndDate)</label>
                      <input
                        type="date"
                        value={newOrderEndDate}
                        onChange={(e) => setNewOrderEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#193F34] mb-1">Cílová cena / ks (Kč)</label>
                      <input
                        type="text"
                        placeholder="Např. 15.50"
                        value={newOrderTargetPrice}
                        onChange={(e) => setNewOrderTargetPrice(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] placeholder-[#8B9B90] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#193F34] mb-1">Popis / poznámka k zakázce</label>
                    <input
                      type="text"
                      placeholder="Poznámka k balení, specifikaci nebo materiálu"
                      value={newOrderDesc}
                      onChange={(e) => setNewOrderDesc(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] placeholder-[#8B9B90]"
                    />
                  </div>

                  {/* Specifické výrobní operace pro tuto zakázku (Fáze 2.1) */}
                  <div className="p-3 bg-[#EFE9DC]/70 rounded-xl border border-[#D6DCD3] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-heading font-bold text-[#193F34] flex items-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5 text-[#193F34]" />
                        Specifické operace pro tuto zakázku (normy a sazby)
                      </span>
                      <span className="text-[10px] text-[#4E6157]">
                        {newOrderInitialOps.length} přidáno
                      </span>
                    </div>

                    {newOrderInitialOps.length > 0 && (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {newOrderInitialOps.map((op, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#D6DCD3] text-xs"
                          >
                            <span className="font-semibold text-[#193F34]">{op.name}</span>
                            <div className="flex items-center gap-2 text-[11px] font-mono">
                              <span className="text-[#4E6157]">{op.normPerHour} ks/h</span>
                              <span className="text-emerald-700 font-bold">{op.ratePerPiece.toFixed(2)} Kč/ks</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveInitOp(idx)}
                                className="text-rose-600 hover:text-rose-800 font-bold px-1 text-sm cursor-pointer"
                                title="Odebrat operaci"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Název operace (např. Díl A, Kompletace)"
                        value={initOpName}
                        onChange={(e) => setInitOpName(e.target.value)}
                        className="sm:col-span-2 px-2.5 py-1 bg-white border border-[#D6DCD3] rounded-lg text-xs text-[#232B28] placeholder-[#8B9B90]"
                      />
                      <input
                        type="number"
                        placeholder="Norma ks/h"
                        value={initOpNorm}
                        onChange={(e) => setInitOpNorm(e.target.value)}
                        className="px-2 py-1 bg-white border border-[#D6DCD3] rounded-lg text-xs text-[#232B28] font-mono"
                        title="Norma kusů za hodinu"
                      />
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="Kč/ks"
                          value={initOpRate}
                          onChange={(e) => setInitOpRate(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-[#D6DCD3] rounded-lg text-xs text-[#232B28] font-mono"
                          title="Sazba za kus v Kč"
                        />
                        <button
                          type="button"
                          onClick={handleAddInitOp}
                          className="px-2 py-1 bg-[#285446] hover:bg-[#193F34] text-white rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap"
                          title="Přidat tuto operaci do zakázky"
                        >
                          + Přidat
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Vytvořit zakázku se specifickými operacemi
                  </button>
                </form>

                <div className="divide-y divide-[#E4DDD0] max-h-96 overflow-y-auto pr-1">
                  {orders.map((ord) => {
                    const isEditing = editingOrder?.id === ord.id;
                    const target = ord.totalPiecesTarget ?? ord.targetPieces ?? 0;
                    const percent = Math.min(100, ord.percentDone || 0);
                    const orderOps = operations.filter((op) => op.orderId === ord.id);

                    return (
                      <div key={ord.id} className="py-3 text-xs space-y-1.5">
                        {isEditing ? (
                          <div className="space-y-2 bg-[#F7F3E9] p-3 rounded-xl border border-[#193F34]/40">
                            <div>
                              <label className="text-[10px] font-bold text-[#193F34]">Název zakázky:</label>
                              <input
                                type="text"
                                value={editingOrder.name}
                                onChange={(e) => setEditingOrder({ ...editingOrder, name: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white border border-[#D6DCD3] rounded-lg text-[#232B28] font-bold text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-[#4E6157]">Cílové kusy:</label>
                                <input
                                  type="number"
                                  value={editingOrder.totalPiecesTarget ?? editingOrder.targetPieces ?? 0}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value || '0', 10);
                                    setEditingOrder({ ...editingOrder, totalPiecesTarget: val, targetPieces: val });
                                  }}
                                  className="w-full px-2 py-1 bg-white border border-[#D6DCD3] rounded-lg text-[#232B28] font-mono text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-[#4E6157]">Zahájení:</label>
                                <input
                                  type="date"
                                  value={editingOrder.startDate || ''}
                                  onChange={(e) => setEditingOrder({ ...editingOrder, startDate: e.target.value })}
                                  className="w-full px-2 py-1 bg-white border border-[#D6DCD3] rounded-lg text-[#232B28] text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-[#4E6157]">Termín:</label>
                                <input
                                  type="date"
                                  value={editingOrder.endDate || editingOrder.deadline || ''}
                                  onChange={(e) =>
                                    setEditingOrder({
                                      ...editingOrder,
                                      endDate: e.target.value,
                                      deadline: e.target.value,
                                    })
                                  }
                                  className="w-full px-2 py-1 bg-white border border-[#D6DCD3] rounded-lg text-[#232B28] text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-[#4E6157]">Cílová cena (Kč/ks):</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingOrder.targetPricePerPiece ?? 0}
                                  onChange={(e) =>
                                    setEditingOrder({
                                      ...editingOrder,
                                      targetPricePerPiece: parseFloat(e.target.value || '0'),
                                    })
                                  }
                                  className="w-full px-2 py-1 bg-white border border-[#D6DCD3] rounded-lg text-[#232B28] font-mono text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-[#4E6157]">Popis zakázky:</label>
                              <input
                                type="text"
                                value={editingOrder.description || ''}
                                onChange={(e) => setEditingOrder({ ...editingOrder, description: e.target.value })}
                                className="w-full px-2 py-1 bg-white border border-[#D6DCD3] rounded-lg text-[#232B28] text-xs"
                              />
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleSaveEditOrder(editingOrder)}
                                className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs cursor-pointer shadow-sm"
                              >
                                Uložit změny
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingOrder(null)}
                                className="px-3.5 py-1 bg-[#E9E1D2] hover:bg-[#DDD5C5] text-[#193F34] rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Zrušit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={ord.isActive ? 'text-[#193F34] font-bold text-sm' : 'text-[#6C7E74] line-through font-medium text-sm'}>
                                  {ord.name}
                                </span>
                                {target > 0 ? (
                                  <span className="text-[11px] text-[#193F34] font-mono font-bold bg-[#193F34]/10 px-2 py-0.5 rounded-md border border-[#193F34]/20">
                                    {ord.completedPieces || 0} / {target} ks ({percent}%)
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-[#6C7E74]">Bez cíle</span>
                                )}
                                {orderOps.length > 0 ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold" title="Počet přiřazených operací">
                                    {orderOps.length} op.
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold" title="Zatím nemá specifické operace">
                                    0 op.
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenOrderDetail(ord.id)}
                                  className="px-2.5 py-1 bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] rounded-lg text-xs font-heading font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                                  title="Zobrazit přehled plnění zakázky a účastníků"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#D7BE97]" />
                                  <span>Detail</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingOrder(ord)}
                                  className="p-1 text-[#4E6157] hover:text-[#193F34] rounded-lg hover:bg-[#E9E1D2] cursor-pointer"
                                  title="Upravit zakázku"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleOrder(ord)}
                                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                                    ord.isActive
                                      ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25'
                                      : 'bg-[#E9E1D2] text-[#4E6157] hover:bg-slate-300'
                                  }`}
                                >
                                  {ord.isActive ? 'Aktivní' : 'Skrytá'}
                                </button>
                              </div>
                            </div>

                            {target > 0 ? (
                              <div className="w-full bg-[#E9E1D2] rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    percent >= 100 ? 'bg-emerald-600' : 'bg-[#193F34]'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            ) : null}

                            <div className="flex flex-wrap items-center justify-between text-[11px] text-[#4E6157] gap-2">
                              <span>{ord.description || ''}</span>
                              <div className="flex items-center gap-2 font-mono">
                                {ord.startDate && (
                                  <span>Od: {new Date(ord.startDate).toLocaleDateString('cs-CZ')}</span>
                                )}
                                {(ord.endDate || ord.deadline) && (
                                  <span className="text-amber-800 font-semibold">
                                    Termín: {new Date(ord.endDate || ord.deadline!).toLocaleDateString('cs-CZ')}
                                  </span>
                                )}
                                {ord.targetPricePerPiece && ord.targetPricePerPiece > 0 ? (
                                  <span className="text-emerald-700 font-semibold">
                                    Cílová cena: {ord.targetPricePerPiece.toFixed(2)} Kč/ks
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Správa Operací a Norem */}
              <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card p-5 shadow-sm">
                <h3 className="text-base font-bold font-heading text-[#193F34] flex items-center gap-2 mb-4">
                  <Settings2 className="w-4 h-4 text-indigo-400" />
                  Operace, hodinové normy a sazby
                </h3>

                <form onSubmit={handleCreateOperation} className="space-y-2 mb-4 bg-[#F7F3E9]/60 p-3 rounded-xl border border-[#E4DDD0]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Název operace"
                      value={newOpName}
                      onChange={(e) => setNewOpName(e.target.value)}
                      className="px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] placeholder-[#8B9B90]"
                    />
                    <select
                      value={newOpOrderId}
                      onChange={(e) => setNewOpOrderId(e.target.value)}
                      className="px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28]"
                    >
                      <option value="">-- Společná pro všechny zakázky --</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          Zakázka: {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="number"
                      required
                      placeholder="Norma ks/h"
                      value={newOpNorm}
                      onChange={(e) => setNewOpNorm(e.target.value)}
                      className="px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] font-mono"
                      title="Norma kusů za 1 hodinu"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Kč/ks"
                      value={newOpRate}
                      onChange={(e) => setNewOpRate(e.target.value)}
                      className="px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] font-mono"
                      title="Sazba v Kč za 1 kus"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Přidat operaci
                    </button>
                  </div>
                </form>

                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#E4DDD0]">
                  <span className="text-xs font-semibold text-[#193F34]">Filtrovat zobrazené operace:</span>
                  <select
                    value={filterOpOrderId}
                    onChange={(e) => setFilterOpOrderId(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-[#D6DCD3] rounded-lg text-xs text-[#232B28] font-medium"
                  >
                    <option value="">Všechny operace ({operations.length})</option>
                    <option value="global">Pouze globální (bez zakázky)</option>
                    {orders.map((o) => (
                      <option key={o.id} value={String(o.id)}>
                        Zakázka: {o.name} ({operations.filter((op) => op.orderId === o.id).length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="divide-y divide-[#E4DDD0] max-h-96 overflow-y-auto pr-1">
                  {(() => {
                    const displayedOps = operations.filter((op) => {
                      if (!filterOpOrderId) return true;
                      if (filterOpOrderId === 'global') return !op.orderId;
                      return op.orderId === Number(filterOpOrderId);
                    });

                    if (displayedOps.length === 0) {
                      return (
                        <div className="py-6 text-center text-xs text-[#6C7E74]">
                          Žádné operace neodpovídají zvolenému filtru.
                        </div>
                      );
                    }

                    return displayedOps.map((op) => {
                      const isEd = editingOp?.id === op.id;
                      return (
                        <div key={op.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                          {isEd ? (
                            <div className="flex flex-wrap items-center gap-2 w-full bg-[#F7F3E9] p-2 rounded-xl border border-[#193F34]/30">
                              <input
                                type="text"
                                value={editingOp.name}
                                onChange={(e) => setEditingOp({ ...editingOp, name: e.target.value })}
                                className="flex-1 min-w-[120px] px-2.5 py-1 bg-white border border-[#D6DCD3] rounded-lg text-xs text-[#232B28] font-medium"
                              />
                              <select
                                value={editingOp.orderId ?? ''}
                                onChange={(e) =>
                                  setEditingOp({
                                    ...editingOp,
                                    orderId: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                                className="w-36 px-2 py-1 bg-white border border-[#D6DCD3] rounded-lg text-xs text-[#232B28]"
                              >
                                <option value="">-- Bez zakázky --</option>
                                {orders.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name}
                                  </option>
                                ))}
                              </select>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={editingOp.normPerHour}
                                  onChange={(e) =>
                                    setEditingOp({
                                      ...editingOp,
                                      normPerHour: parseInt(e.target.value || '100', 10),
                                    })
                                  }
                                  className="w-16 px-2 py-1 bg-white border border-[#D6DCD3] rounded-lg text-xs text-[#232B28] font-mono"
                                  title="Norma ks/h"
                                />
                                <span className="text-[10px] text-[#4E6157]">ks/h</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.05"
                                  value={editingOp.ratePerPiece}
                                  onChange={(e) =>
                                    setEditingOp({
                                      ...editingOp,
                                      ratePerPiece: parseFloat(e.target.value || '1.35'),
                                    })
                                  }
                                  className="w-16 px-2 py-1 bg-white border border-[#D6DCD3] rounded-lg text-xs text-emerald-700 font-mono"
                                  title="Sazba Kč/ks"
                                />
                                <span className="text-[10px] text-[#4E6157]">Kč/ks</span>
                              </div>
                              <div className="flex gap-1 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditOp(editingOp)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Uložit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingOp(null)}
                                  className="px-2 py-1 bg-[#E9E1D2] hover:bg-[#DDD5C5] text-[#193F34] rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Zrušit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <span className="font-semibold font-heading text-[#193F34]">{op.name}</span>
                                {op.orderName ? (
                                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                                    Zakázka: {op.orderName}
                                  </span>
                                ) : (
                                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                    Globální
                                  </span>
                                )}
                                <span className="ml-2 text-xs text-[#4E6157] font-mono">
                                  Norma: <strong>{op.normPerHour} ks/h</strong> • Sazba:{' '}
                                  <strong className="text-emerald-700 font-bold">
                                    {op.ratePerPiece.toFixed(2)} Kč/ks
                                  </strong>{' '}
                                  (= {(op.normPerHour * op.ratePerPiece).toFixed(0)} Kč/h)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingOp(op)}
                                className="p-1.5 text-[#4E6157] hover:text-[#193F34] rounded-lg hover:bg-[#E9E1D2] cursor-pointer"
                                title="Upravit operaci"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: FÁZE 3 – PLÁNOVÁNÍ SMĚN A BOZP DOKUMENTY      */}
        {/* ==================================================== */}
        {activeTab === 'hr' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#193F34] tracking-tight">
                Plánování směn a evidence BOZP dokumentů
              </h1>
              <p className="text-sm text-[#4E6157]">
                Zákonný rozvrh směn pro brigádníky a elektronický arch seznámení s bezpečností práce (BOZP).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Levý sloupec: Plánování směn */}
              <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card p-5 shadow-sm space-y-4">
                <h2 className="text-base font-bold font-heading text-[#193F34] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#193F34]" />
                  Naplánovat směnu brigádníkovi
                </h2>

                <form onSubmit={handleCreateShift} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F7F3E9]/60 p-4 rounded-xl border border-[#E4DDD0]">
                  <div>
                    <label className="block text-xs text-[#4E6157] mb-1">Datum směny</label>
                    <input
                      type="date"
                      required
                      value={shiftDate}
                      onChange={(e) => setShiftDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[#4E6157] mb-1">Od</label>
                      <input
                        type="time"
                        required
                        value={shiftStart}
                        onChange={(e) => setShiftStart(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] font-mono cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#4E6157] mb-1">Do</label>
                      <input
                        type="time"
                        required
                        value={shiftEnd}
                        onChange={(e) => setShiftEnd(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] font-mono cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[#4E6157] mb-1">Pracovník / Burza</label>
                    <select
                      value={shiftEmpId}
                      onChange={(e) => setShiftEmpId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28]"
                    >
                      <option value="">-- Volná směna (Burza směn) --</option>
                      {employees
                        .filter((e) => e.isActive)
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.fullName} ({e.contractType})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#4E6157] mb-1">Přiřazená zakázka</label>
                    <select
                      value={shiftOrderId}
                      onChange={(e) => setShiftOrderId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28]"
                    >
                      <option value="">-- Bez konkrétní zakázky --</option>
                      {orders
                        .filter((o) => o.isActive)
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Poznámka ke směně / funkce (např. Lepení, Sestavení)"
                      value={shiftNote}
                      onChange={(e) => setShiftNote(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] placeholder-[#8B9B90]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Uložit směnu
                    </button>
                  </div>
                </form>

                <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                  {shifts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#6C7E74]">
                      Zatím nejsou naplánovány žádné směny.
                    </div>
                  ) : (
                    shifts.map((s) => (
                      <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#193F34]">
                            {new Date(s.shiftDate).toLocaleDateString('cs-CZ', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="ml-2 font-mono font-bold text-[#193F34]">
                            {s.startTime} – {s.endTime}
                          </span>
                          {s.employeeName ? (
                            <span className="ml-2 text-[#232B28] font-semibold">
                              • {s.employeeName}
                            </span>
                          ) : (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              ⚡ Volná směna (Burza)
                            </span>
                          )}
                          {s.orderName && (
                            <span className="ml-2 text-indigo-300">({s.orderName})</span>
                          )}
                          {s.note && (
                            <span className="ml-2 text-[#4E6157] italic">[{s.note}]</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteShiftRow(s.id)}
                          className="p-1 text-[#6C7E74] hover:text-rose-400 cursor-pointer"
                          title="Zrušit směnu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pravý sloupec: Správa BOZP dokumentů */}
              <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold font-heading text-[#193F34] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Směrnice a BOZP dokumenty k podpisu
                  </h2>
                  {editingDoc && (
                    <button
                      type="button"
                      onClick={handleCancelEditDoc}
                      className="text-xs text-[#4E6157] hover:text-white underline cursor-pointer"
                    >
                      Zrušit úpravy
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveDocumentForm} className="space-y-3 bg-[#F7F3E9]/60 p-4 rounded-xl border border-[#E4DDD0]">
                  <div className="text-xs font-semibold text-[#3E4F46]">
                    {editingDoc ? `Upravit směrnici #${editingDoc.id}` : 'Přidat novou směrnici / předpis'}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#4E6157] mb-1">Název směrnice</label>
                    <input
                      type="text"
                      required
                      placeholder="např. BOZP – Bezpečnost práce a ochrana zdraví"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#4E6157] mb-1">
                      Zkrácené znění (zobrazí se na kiosku před odsouhlasením)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Stručný výtah nejdůležitějších povinností..."
                      value={newDocShortText}
                      onChange={(e) => setNewDocShortText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#4E6157] mb-1">
                      Plné právní znění dokumentu (webová čtečka / formát A4 k tisku)
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Vložte kompletní paragrafy a plné znění směrnice..."
                      value={newDocFullText}
                      onChange={(e) => setNewDocFullText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {editingDoc ? 'Uložit změny směrnice' : '+ Publikovat směrnici'}
                    </button>
                    {editingDoc && (
                      <button
                        type="button"
                        onClick={handleCancelEditDoc}
                        className="px-3 py-2 bg-[#E9E1D2] hover:bg-[#DDD5C5] text-[#193F34] rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Zrušit
                      </button>
                    )}
                  </div>
                </form>

                <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto pr-1">
                  {documents.map((d) => (
                    <div key={d.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#193F34] truncate">{d.title}</span>
                          <span className="text-[10px] text-[#6C7E74] font-mono">#{d.id}</span>
                        </div>
                        <div className="text-[#4E6157] text-[11px] line-clamp-2 mt-1">
                          {d.shortText || d.content}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <a
                            href={`./?doc=${d.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#193F34] hover:text-[#16634D]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Zobrazit plné znění (A4)</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleStartEditDoc(d)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Upravit</span>
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleDocument(d)}
                        className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 cursor-pointer ${
                          d.isActive
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-[#E9E1D2] text-[#193F34] text-[#6C7E74]'
                        }`}
                      >
                        {d.isActive ? 'Aktivní' : 'Archivován'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Arch elektronických podpisů BOZP s možností tisku pro kontrolu */}
            <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#E4DDD0] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-heading text-[#193F34]">
                    Arch potvrzených souhlasů BOZP ({consents.length})
                  </h2>
                  <p className="text-xs text-[#4E6157]">
                    Přehled časových razítek, kdy pracovníci potvrdili seznámení s provozními pravidly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const win = window.open('', '_blank');
                    if (!win) return;
                    const rowsHtml = consents.map((c, i) => `
                      <tr>
                        <td style="text-align:center;">${i + 1}</td>
                        <td><strong>${c.employeeName}</strong></td>
                        <td style="text-align:center;">${c.contractType}</td>
                        <td>${c.documentTitle}</td>
                        <td style="text-align:center; font-family:monospace;">
                          ${new Date(c.agreedAt).toLocaleDateString('cs-CZ')} ${new Date(c.agreedAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style="text-align:center; color:#15803d; font-weight:bold;">
                          ✓ Elektronicky ověřeno (PIN)
                        </td>
                      </tr>
                    `).join('');

                    win.document.write(`
                      <!DOCTYPE html>
                      <html lang="cs">
                        <head>
                          <meta charset="utf-8" />
                          <title>Protokol seznámení se směrnicemi BOZP a PO</title>
                          <style>
                            @page { size: A4 portrait; margin: 15mm; }
                            body { font-family: Arial, sans-serif; font-size: 11px; color: #111; line-height: 1.4; padding: 10px; }
                            .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
                            .title { font-size: 18px; font-weight: bold; margin: 0; color: #0f172a; }
                            .subtitle { font-size: 11px; color: #475569; margin-top: 4px; }
                            .legal-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; margin-bottom: 15px; font-size: 10.5px; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10.5px; }
                            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
                            th { background: #f1f5f9; font-weight: bold; color: #1e293b; }
                            .footer { margin-top: 40px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px dashed #94a3b8; }
                            .sig-box { width: 45%; text-align: center; }
                            .sig-line { border-bottom: 1px solid #111; margin-top: 40px; margin-bottom: 5px; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <div>
                              <h1 class="title">EVIDENČNÍ ARCH SEZNÁMENÍ S PŘEDPISY BOZP A PO</h1>
                              <div class="subtitle">Podklad dle § 101 a § 103 Zákoníku práce č. 262/2006 Sb. a zákona č. 309/2006 Sb.</div>
                            </div>
                            <div style="text-align:right; font-size:10px; color:#64748b;">
                              Generováno: ${new Date().toLocaleDateString('cs-CZ')} v ${new Date().toLocaleTimeString('cs-CZ')}<br/>
                              Systém Kípačky • Provozovna dílny
                            </div>
                          </div>

                          <div class="legal-box">
                            <strong>Potvrzení o seznámení a proškolení:</strong><br/>
                            Níže uvedení pracovníci (zaměstnanci a brigádníci) prokazatelně potvrdili seznámení s platnými provozními předpisy, směrnicemi bezpečnosti práce (BOZP), požární ochrany (PO) a technologickými postupy. Ověření totožnosti bylo provedeno osobním PIN kódem na terminálu docházky v souladu s vnitřními předpisy organizace.
                          </div>

                          <table>
                            <thead>
                              <tr>
                                <th style="width:25px; text-align:center;">#</th>
                                <th>Jméno a příjmení pracovníka</th>
                                <th style="width:60px; text-align:center;">Úvazek</th>
                                <th>Název předpisu / směrnice</th>
                                <th style="width:130px; text-align:center;">Datum a čas podpisu</th>
                                <th style="width:140px; text-align:center;">Stav ověření</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding:15px; color:#64748b;">Zatím nejsou zaevidovány žádné podpisy.</td></tr>'}
                            </tbody>
                          </table>

                          <div class="footer">
                            <div class="sig-box">
                              <div class="sig-line"></div>
                              <strong>Zpracoval / Vedoucí provozu</strong><br/>
                              (Marta Chorobiková)
                            </div>
                            <div class="sig-box">
                              <div class="sig-line"></div>
                              <strong>Statutární zástupce / Razítko organizace</strong><br/>
                              Dílna EkoBio.org
                            </div>
                          </div>

                          <script>
                            window.onload = function() { window.print(); };
                          </script>
                        </body>
                      </html>
                    `);
                    win.document.close();
                  }}
                  className="px-4 py-2 bg-[#E9E1D2] hover:bg-[#D7BE97] text-[#193F34] rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4 text-[#193F34]" />
                  Vytisknout úřední arch BOZP (A4)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#3E4F46]">
                  <thead className="bg-[#F7F3E9]/60 text-xs uppercase font-semibold text-[#4E6157] border-b border-[#E4DDD0]">
                    <tr>
                      <th className="px-5 py-3">Pracovník</th>
                      <th className="px-5 py-3">Úvazek</th>
                      <th className="px-5 py-3">Dokument / Směrnice</th>
                      <th className="px-5 py-3">Datum a čas elektronického potvrzení</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {consents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-xs text-[#6C7E74]">
                          Zatím žádné potvrzené souhlasy. Brigádníci je potvrdí po zadání PINu na kiosku.
                        </td>
                      </tr>
                    ) : (
                      consents.map((c) => (
                        <tr key={c.id} className="hover:bg-[#E9E1D2]">
                          <td className="px-5 py-3 font-bold text-[#193F34]">{c.employeeName}</td>
                          <td className="px-5 py-3 text-xs">{c.contractType}</td>
                          <td className="px-5 py-3 text-emerald-300 font-medium">
                            {c.documentTitle}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-[#3E4F46]">
                            {new Date(c.agreedAt).toLocaleDateString('cs-CZ')}{' '}
                            {new Date(c.agreedAt).toLocaleTimeString('cs-CZ', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: FINÁLNÍ MĚSÍČNÍ MASTER REPORT & VÝPOČET MEZD  */}
        {/* ==================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#193F34] tracking-tight">
                  Finální měsíční Master Report (Docházka + Produkce + Mzdy)
                </h1>
                <p className="text-sm text-[#4E6157]">
                  Spojuje odpracovaný čas (se zákonnou přestávkou -30 min nad 6h), schválenou kusovou výrobu, výdělek v Kč a hlídání limitu 300h DPP.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2.5 rounded-xl bg-[#E9E1D2] hover:bg-[#D7BE97] text-[#193F34] font-semibold text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4 text-[#193F34]" />
                  Tisk
                </button>
                <a
                  href={getCsvDownloadUrl(
                    reportYear,
                    reportMonth,
                    reportEmpId ? parseInt(reportEmpId) : undefined
                  )}
                  download
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Exportovat Master CSV (Excel)
                </a>
              </div>
            </div>

            {/* Výběr období a filtr */}
            <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-[#4E6157] mb-1 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#193F34]" />
                  <span>Měsíc</span>
                </label>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-sm text-[#232B28] focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>
                      {new Date(2026, m - 1, 1).toLocaleDateString('cs-CZ', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#4E6157] mb-1 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#193F34]" />
                  <span>Rok</span>
                </label>
                <input
                  type="number"
                  value={reportYear}
                  onChange={(e) => setReportYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-sm text-[#232B28] focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-[#4E6157] mb-1">Zaměstnanec</label>
                <select
                  value={reportEmpId}
                  onChange={(e) => setReportEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D6DCD3] rounded-xl text-sm text-[#232B28]"
                >
                  <option value="">Všichni pracovníci</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.contractType})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={loadReport}
                  className="w-full py-2 bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Přepočítat výkaz
                </button>
              </div>
            </div>

            {loadingReport ? (
              <div className="p-12 text-center text-[#193F34]">Generuji měsíční přehled...</div>
            ) : reportData && reportData.employeeSummaries.length > 0 ? (
              <div className="space-y-6">
                {reportData.employeeSummaries.map((empSum) => {
                  const ytd = empSum.yearToDateNormHours ?? empSum.yearToDateNetHours ?? 0;
                  const isDpp = empSum.contractType === 'DPP';
                  const dppDanger = isDpp && ytd >= 290;
                  const dppWarning = isDpp && ytd >= 250 && ytd < 290;

                  return (
                    <div
                      key={empSum.employeeId}
                      className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card overflow-hidden shadow-sm"
                    >
                      {/* Hlavička karty zaměstnance v reportu */}
                      <div className="px-6 py-4 bg-[#F7F3E9]/60 border-b border-[#E4DDD0] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-lg font-bold font-heading text-[#193F34]">{empSum.employeeName}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E9E1D2] text-[#193F34]">
                              {empSum.contractType}
                            </span>
                            {isDpp && (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  dppDanger
                                    ? 'bg-rose-500/20 text-rose-600 border-rose-500/40'
                                    : dppWarning
                                      ? 'bg-amber-500/20 text-amber-700 border-amber-500/40'
                                      : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                                }`}
                              >
                                {dppDanger
                                  ? `⛔ Kritický stav DPP (Normočas): ${ytd.toFixed(1)} / 300 h`
                                  : dppWarning
                                    ? `⚠️ Blíží se limitu DPP (Normočas): ${ytd.toFixed(1)} / 300 h`
                                    : `✓ Limit DPP (Normočas): ${ytd.toFixed(1)} / 300 h (zbývá ${((empSum.remainingDppHours !== undefined ? empSum.remainingDppHours : Math.max(0, 300 - ytd))).toFixed(1)} h)`}
                              </span>
                            )}
                            {empSum.incompleteShiftsCount > 0 && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                                ⚠️ {empSum.incompleteShiftsCount}× neuzavřená směna
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCard31Employee(empSum)}
                              className="px-3 py-1 rounded-xl bg-[#193F34]/20 hover:bg-[#193F34]/30 border border-[#193F34]/40 text-[#16634D] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              31denní karta (Tisk)
                            </button>
                          </div>
                          <p className="text-xs text-[#4E6157] mt-1">
                            Odpracováno směn: <strong>{empSum.totalShifts}</strong> • Fyzický hrubý čas:{' '}
                            <strong>{empSum.totalGrossHours.toFixed(2)} h</strong> • Přestávky:{' '}
                            <strong>-{empSum.totalBreakHours.toFixed(2)} h</strong>
                          </p>
                        </div>

                        {/* 4 hlavní KPI metriky (Fyzický čas + Kusy + Normočas + Výdělek v Kč) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="bg-white border border-[#E4DDD0] px-3.5 py-2 rounded-xl text-right">
                            <span className="block text-[10px] uppercase tracking-wider text-[#4E6157]">
                              Fyzický čas (BOZP)
                            </span>
                            <span className="text-base font-extrabold text-[#193F34] font-mono">
                              {empSum.totalNetHours.toFixed(2)} h
                            </span>
                          </div>

                          <div className="bg-white border border-[#E4DDD0] px-3.5 py-2 rounded-xl text-right">
                            <span className="block text-[10px] uppercase tracking-wider text-[#4E6157]">
                              Schválená výroba
                            </span>
                            <span className="text-base font-extrabold text-indigo-600 font-mono">
                              {empSum.totalApprovedPieces || 0} ks
                            </span>
                          </div>

                          <div className="bg-white border border-[#E4DDD0] px-3.5 py-2 rounded-xl text-right">
                            <span className="block text-[10px] uppercase tracking-wider text-[#4E6157]">
                              Úřední normočas (DPP)
                            </span>
                            <span className="text-base font-extrabold text-amber-600 font-mono">
                              {(empSum.totalProductiveHours || empSum.normHours || 0).toFixed(2)} h
                            </span>
                          </div>

                          <div className="bg-emerald-950/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-right">
                            <span className="block text-[10px] uppercase tracking-wider text-emerald-800 flex items-center justify-end gap-1">
                              <Coins className="w-3 h-3 text-emerald-700" />
                              Výdělek v úkole
                            </span>
                            <span className="text-base font-extrabold text-emerald-700 font-mono">
                              {(empSum.totalEarnedCzk || 0).toFixed(2)} Kč
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tabulka jednotlivých směn a produkce */}
                      {empSum.shifts.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-[#3E4F46]">
                            <thead className="bg-white text-xs uppercase text-[#4E6157] border-b border-[#E4DDD0]">
                              <tr>
                                <th className="px-4 py-3">Datum</th>
                                <th className="px-4 py-3">Příchod</th>
                                <th className="px-4 py-3">Odchod</th>
                                <th className="px-4 py-3">Hrubý čas</th>
                                <th className="px-4 py-3">Přestávka</th>
                                <th className="px-4 py-3">Fyzický čistý čas (BOZP)</th>
                                <th className="px-4 py-3 text-right">Schváleno ks</th>
                                <th className="px-4 py-3 text-right">Úřední normočas (DPP)</th>
                                <th className="px-4 py-3 text-right">Výdělek (Kč)</th>
                                <th className="px-4 py-3">Stav / Poznámka</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {empSum.shifts.map((shift, idx) => {
                                const inDate = new Date(shift.clockInTime);
                                const outDate = shift.clockOutTime
                                  ? new Date(shift.clockOutTime)
                                  : null;
                                const breakMins = Math.round((shift.breakHours || 0) * 60);

                                return (
                                  <tr
                                    key={idx}
                                    className={
                                      shift.isIncomplete
                                        ? 'bg-amber-500/5 hover:bg-amber-500/10'
                                        : 'hover:bg-[#E9E1D2]/30'
                                    }
                                  >
                                    <td className="px-4 py-3 font-medium text-[#193F34]">
                                      {inDate.toLocaleDateString('cs-CZ')}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-emerald-400">
                                      {inDate.toLocaleTimeString('cs-CZ', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-rose-400">
                                      {outDate
                                        ? outDate.toLocaleTimeString('cs-CZ', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : '—'}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[#3E4F46]">
                                      {shift.grossDuration.slice(0, 5)}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[#4E6157]">
                                      {breakMins > 0 ? `-${breakMins} min` : '0 min'}
                                    </td>
                                    <td className="px-4 py-3 font-mono font-bold text-[#193F34]">
                                      {shift.netDuration.slice(0, 5)}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-right text-indigo-300 font-bold">
                                      {shift.approvedPieces || 0} ks
                                    </td>
                                    <td className="px-4 py-3 font-mono text-right text-amber-300">
                                      {(shift.productiveHours || 0).toFixed(2)} h
                                    </td>
                                    <td className="px-4 py-3 font-mono text-right font-bold text-emerald-400">
                                      {(shift.earnedCzk || 0).toFixed(2)} Kč
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                      {shift.isIncomplete ? (
                                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                                          <AlertCircle className="w-3.5 h-3.5" />
                                          {shift.note}
                                        </span>
                                      ) : shift.isManualEdit ? (
                                        <span className="text-amber-300">Ručně upraveno</span>
                                      ) : (
                                        <span className="text-[#6C7E74]">OK</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-[#6C7E74]">
                          Žádné směny v tomto měsíci (pouze kusová výroba:{' '}
                          {empSum.totalApprovedPieces || 0} ks /{' '}
                          {(empSum.totalEarnedCzk || 0).toFixed(2)} Kč).
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-[#E4DDD0] rounded-2xl shadow-admin-card p-8 text-center text-[#4E6157]">
                Pro zadaný měsíc nebyly nalezeny žádné záznamy.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Zápatí administrace s číslem verze */}
      <footer className="mt-auto border-t border-[#E4DDD0] bg-white py-4 px-4 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#55645B]">
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-[#193F34]">Greenberg Nepomuk</span>
            <span className="text-[#A5B3A8]">•</span>
            <span>Kípačky – Administrační systém a evidence docházky & výroby</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#55645B]">Aktuální verze:</span>
            <span className="font-mono text-xs font-black text-[#193F34] bg-[#F7F3E9] border border-[#D7BE97] px-2.5 py-0.5 rounded-md shadow-2xs">
              v{APP_VERSION}
            </span>
          </div>
        </div>
      </footer>

      {/* ==================================================== */}
      {/* MODÁL PRO QR KÓD & SYMBOL DNE (TISK PRO VCHOD)       */}
      {/* ==================================================== */}
      {showQrModal &&
        (() => {
          const symbols = [
            '🌟 HVĚZDA',
            '🍀 ČTYŘLÍSTEK',
            '⚡ BLESK',
            '🔥 PLAMEN',
            '💎 DIAMANT',
            '🚀 RAKETA',
            '🌈 DUHA',
          ];
          const d = new Date();
          const daySeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
          const dailySymbol = symbols[daySeed % symbols.length];
          const dailyCode = String(1000 + ((daySeed * 73) % 8999));

          const handlePrintQrSheet = () => {
            const win = window.open('', '_blank');
            if (!win) return;

            win.document.write(`
              <!DOCTYPE html>
              <html lang="cs">
                <head>
                  <meta charset="UTF-8" />
                  <title>Vchodový QR kód – Greenberg Nepomuk</title>
                  <style>
                    @page { size: A4 portrait; margin: 15mm; }
                    body {
                      font-family: 'Segoe UI', Arial, sans-serif;
                      color: #232B28;
                      background: #fff;
                      margin: 0;
                      padding: 20px;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: space-between;
                      min-height: 92vh;
                      box-sizing: border-box;
                    }
                    .header {
                      text-align: center;
                      border-bottom: 2px solid #193F34;
                      padding-bottom: 15px;
                      width: 100%;
                    }
                    .logo {
                      height: 52px;
                      margin-bottom: 8px;
                    }
                    .title {
                      font-size: 26px;
                      font-weight: 800;
                      color: #193F34;
                      margin: 0;
                      letter-spacing: -0.5px;
                    }
                    .subtitle {
                      font-size: 13px;
                      color: #55645B;
                      margin-top: 4px;
                    }
                    .qr-container {
                      margin: 30px auto;
                      padding: 24px;
                      border: 3px solid #193F34;
                      border-radius: 24px;
                      display: inline-block;
                      background: #fff;
                      box-shadow: 0 4px 20px rgba(25, 63, 52, 0.08);
                      text-align: center;
                    }
                    .instructions {
                      width: 100%;
                      max-width: 520px;
                      background: #F7F3E9;
                      border: 1px solid #E4DDD0;
                      border-radius: 16px;
                      padding: 16px 22px;
                      margin-top: 10px;
                      box-sizing: border-box;
                    }
                    .instructions h3 {
                      margin: 0 0 10px 0;
                      font-size: 14px;
                      font-weight: 700;
                      color: #193F34;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                    }
                    .instructions ol {
                      margin: 0;
                      padding-left: 20px;
                      font-size: 12.5px;
                      color: #232B28;
                      line-height: 1.6;
                    }
                    .instructions li { margin-bottom: 4px; }
                    .url-box {
                      margin-top: 12px;
                      font-family: monospace;
                      font-size: 11px;
                      color: #55645B;
                      background: #fff;
                      border: 1px dashed #D6DCD3;
                      padding: 6px 12px;
                      border-radius: 8px;
                      display: inline-block;
                    }
                    .daily-box {
                      margin-top: 16px;
                      display: flex;
                      justify-content: center;
                      gap: 20px;
                      font-size: 12px;
                      color: #193F34;
                    }
                    .daily-item {
                      background: #EAF2ED;
                      border: 1px solid #A8C7B5;
                      padding: 6px 16px;
                      border-radius: 10px;
                      font-weight: 600;
                    }
                    .footer {
                      border-top: 1px solid #E4DDD0;
                      padding-top: 15px;
                      width: 100%;
                      text-align: center;
                      font-size: 11px;
                      color: #88968F;
                    }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <img src="${GREENBERG_LOGO}" alt="Greenberg" class="logo" />
                    <h1 class="title">EVIDENCE DOCHÁZKY A VÝROBY</h1>
                    <div class="subtitle">Greenberg s.r.o. • Provozovna Nepomuk • Systém Kípačky</div>
                  </div>

                  <div class="qr-container">
                    <div id="qrcode"></div>
                    <div class="url-box">${currentUrl}</div>
                  </div>

                  <div class="instructions">
                    <h3>Pokyny pro příchod a odchod:</h3>
                    <ol>
                      <li>Otevřete fotoaparát na svém mobilním telefonu a <strong>naskenujte QR kód</strong>.</li>
                      <li>V otevřené aplikaci zadejte svůj <strong>4místný osobní PIN</strong>.</li>
                      <li>Zvolte požadovanou akci: <strong>PŘÍCHOD</strong>, <strong>PŘESTÁVKA</strong>, <strong>ZÁPIS VÝROBY</strong> nebo <strong>ODCHOD</strong>.</li>
                      <li>Při výpadku signálu aplikace funguje i <strong>offline</strong> a odešle data po připojení.</li>
                    </ol>
                  </div>

                  <div class="daily-box">
                    <div class="daily-item">Datum: ${d.toLocaleDateString('cs-CZ')}</div>
                    <div class="daily-item">Symbol dne: ${dailySymbol}</div>
                    <div class="daily-item">Kontrolní kód: ${dailyCode}</div>
                  </div>

                  <div class="footer">
                    Vytvořeno v systému Kípačky • Platný provozní předpis dílny • Pro pomoc kontaktujte vedoucí provozu (Martu Chorobikovou)
                  </div>

                  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                  <script>
                    window.onload = function() {
                      new QRCode(document.getElementById("qrcode"), {
                        text: "${currentUrl}",
                        width: 260,
                        height: 260,
                        colorDark: "#193F34",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                      });
                      setTimeout(function() { window.print(); }, 400);
                    };
                  </script>
                </body>
              </html>
            `);
            win.document.close();
          };

          return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-[#E4DDD0] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl">
                <div className="bg-white/95 px-3 py-1.5 rounded-xl border border-[#E4DDD0] inline-block mb-3 shadow-xs">
                  <img src={GREENBERG_LOGO} alt="Greenberg" className="h-6 w-auto object-contain mx-auto" />
                </div>
                <h3 className="text-xl font-bold font-heading text-[#193F34] mb-1">
                  Vchodový QR kód
                </h3>
                <p className="text-xs text-[#4E6157] mb-4">
                  Vytiskněte tento plakát na formát A4 ke dveřím dílny v Nepomuku.
                </p>

                <div className="bg-[#EAF2ED] border border-[#A8C7B5] rounded-2xl p-3 mb-4">
                  <div className="text-[11px] uppercase tracking-wider text-[#16634D] font-semibold">
                    Symbol dne ({d.toLocaleDateString('cs-CZ')})
                  </div>
                  <div className="text-lg font-extrabold text-[#193F34] mt-0.5">{dailySymbol}</div>
                  <div className="text-xs font-mono text-[#16634D] mt-0.5">
                    Kontrolní kód dne: <strong>{dailyCode}</strong>
                  </div>
                </div>

                <div className="bg-[#F7F3E9] p-4 rounded-2xl inline-block border border-[#E4DDD0] shadow-inner mb-4">
                  <QRCodeSVG value={currentUrl} size={190} level="H" fgColor="#193F34" />
                </div>

                <p className="text-[11px] text-[#4E6157] font-mono mb-5 break-all">{currentUrl}</p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePrintQrSheet}
                    className="flex-1 py-3 bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Vytisknout A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(false)}
                    className="flex-1 py-3 bg-[#E9E1D2] hover:bg-[#DDD5C5] text-[#193F34] rounded-xl text-sm font-semibold cursor-pointer transition-colors"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ==================================================== */}
      {/* MODÁL PRO 31DENNÍ MĚSÍČNÍ DOCHÁZKOVOU KARTU (TISK)   */}
      {/* ==================================================== */}
      {card31Employee &&
        (() => {
          const daysInMonth = new Date(reportYear, reportMonth, 0).getDate();
          const dayRows = Array.from({ length: 31 }, (_, i) => i + 1);

          const handlePrint31Card = () => {
            const win = window.open('', '_blank');
            if (!win) return;

            const rowsHtml = dayRows
              .map((day) => {
                if (day > daysInMonth) {
                  return `<tr style="background:#f1f5f9;color:#94a3b8;">
                    <td>${day}. ${reportMonth}.</td>
                    <td>— (neexistující den)</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                  </tr>`;
                }
                const dt = new Date(reportYear, reportMonth - 1, day);
                const dayName = dt.toLocaleDateString('cs-CZ', { weekday: 'long' });
                const dayShifts = card31Employee.shifts.filter((s) => {
                  const sd = new Date(s.clockInTime);
                  return sd.getDate() === day;
                });

                if (dayShifts.length === 0) {
                  return `<tr>
                    <td><strong>${day}. ${reportMonth}.</strong></td>
                    <td style="text-transform:capitalize;">${dayName}</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                  </tr>`;
                }

                const firstIn = new Date(dayShifts[0].clockInTime).toLocaleTimeString('cs-CZ', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const lastShift = dayShifts[dayShifts.length - 1];
                const lastOut = lastShift.clockOutTime
                  ? new Date(lastShift.clockOutTime).toLocaleTimeString('cs-CZ', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Neuzavřeno';

                const totBreakH = dayShifts.reduce((a, b) => a + (b.breakHours || 0), 0);
                const totNetH = dayShifts.reduce((a, b) => a + (b.netHours || 0), 0);
                const totPcs = dayShifts.reduce((a, b) => a + (b.approvedPieces || 0), 0);
                const totNormH = dayShifts.reduce((a, b) => a + (b.productiveHours || 0), 0);

                const breakStr =
                  totBreakH > 0
                    ? `${Math.floor(totBreakH)}:${String(Math.round((totBreakH % 1) * 60)).padStart(2, '0')}`
                    : '0:00';
                const netStr = `${Math.floor(totNetH)}:${String(Math.round((totNetH % 1) * 60)).padStart(2, '0')}`;
                const normText =
                  totPcs > 0
                    ? `${totPcs} ks (${totNormH.toFixed(2)} h normoč.)`
                    : '—';

                return `<tr>
                  <td><strong>${day}. ${reportMonth}.</strong></td>
                  <td style="text-transform:capitalize;">${dayName}</td>
                  <td>${firstIn}</td>
                  <td>${breakStr}</td>
                  <td>${lastOut}</td>
                  <td><strong>${netStr}</strong></td>
                  <td>${normText}</td>
                </tr>`;
              })
              .join('');

            const ytdNormVal = card31Employee.yearToDateNormHours ?? 0;
            const remainingDppVal = card31Employee.remainingDppHours !== undefined 
              ? card31Employee.remainingDppHours 
              : Math.max(0, 300 - ytdNormVal);

            win.document.write(`
              <html>
                <head>
                  <title>Měsíční docházková tabulka - ${card31Employee.employeeName}</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
                    h1 { font-size: 18px; margin-bottom: 4px; }
                    p { font-size: 11.5px; color: #333; margin-top: 0; margin-bottom: 12px; line-height: 1.5; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th, td { border: 1px solid #cbd5e1; padding: 4px 8px; text-align: left; }
                    th { background: #e2e8f0; font-weight: bold; }
                    .num { text-align: right; }
                  </style>
                </head>
                <body>
                  <h1>Měsíční docházková tabulka (31 dnů) – ${card31Employee.employeeName} (${card31Employee.contractType})</h1>
                  <p>
                    Období: <strong>${reportMonth}/${reportYear}</strong> | 
                    Fyzicky na dílně (BOZP): <strong>${card31Employee.totalNetHours.toFixed(2)} h</strong> | 
                    Úřední normočas (DPP): <strong>${(card31Employee.totalProductiveHours || card31Employee.normHours || 0).toFixed(2)} h</strong> | 
                    Roční čerpání DPP (Normočas): <strong>${ytdNormVal.toFixed(1)} / 300 h</strong> (zbývá: <strong>${remainingDppVal.toFixed(1)} h</strong>) | 
                    Schváleno celkem: <strong>${card31Employee.totalApprovedPieces || 0} ks</strong> | 
                    Úkolový výdělek: <strong>${(card31Employee.totalEarnedCzk || 0).toFixed(2)} Kč</strong>
                  </p>
                  <table>
                    <thead>
                      <tr>
                        <th>Datum</th>
                        <th>Den</th>
                        <th>Příchod</th>
                        <th>Přestávka</th>
                        <th>Odchod</th>
                        <th>Fyzický čistý čas (BOZP)</th>
                        <th>Úřední hodiny (Normočas)</th>
                      </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                  </table>
                  <div style="margin-top:28px; display:flex; justify-content:space-between; font-size:12px;">
                    <div>Podpis zaměstnance: ___________________________</div>
                    <div>Schválil (Marta Chorobiková): ___________________________</div>
                  </div>
                  <script>window.onload = () => { window.print(); }</script>
                </body>
              </html>
            `);
            win.document.close();
          };

          return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-[#E4DDD0] rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-[#E4DDD0] pb-3">
                  <div>
                    <h3 className="text-lg font-bold font-heading text-[#193F34]">
                      Měsíční docházková tabulka (31 dnů) – {card31Employee.employeeName}
                    </h3>
                    <p className="text-xs text-[#4E6157]">
                      Období {reportMonth}/{reportYear} • Fyzicky na dílně (BOZP):{' '}
                      <strong>{card31Employee.totalNetHours.toFixed(2)} h</strong> • Úřední normočas (DPP):{' '}
                      <strong>{(card31Employee.totalProductiveHours || card31Employee.normHours || 0).toFixed(2)} h</strong> • Roční limit DPP:{' '}
                      <strong>{(card31Employee.yearToDateNormHours ?? 0).toFixed(1)} / 300 h</strong> • Výroba:{' '}
                      <strong>{card31Employee.totalApprovedPieces || 0} ks</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrint31Card}
                      className="px-4 py-2 rounded-xl bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Vytisknout 31denní přehled
                    </button>
                    <button
                      type="button"
                      onClick={() => setCard31Employee(null)}
                      className="px-3 py-2 rounded-xl bg-[#E9E1D2] hover:bg-[#DDD5C5] text-[#193F34] text-xs font-semibold cursor-pointer"
                    >
                      Zavřít
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 rounded-xl border border-[#E4DDD0]">
                  <table className="w-full text-left text-xs text-[#3E4F46]">
                    <thead className="bg-[#F7F3E9] text-[#4E6157] uppercase sticky top-0">
                      <tr>
                        <th className="px-3 py-2.5">Datum</th>
                        <th className="px-3 py-2.5">Den</th>
                        <th className="px-3 py-2.5">Příchod</th>
                        <th className="px-3 py-2.5">Přestávka</th>
                        <th className="px-3 py-2.5">Odchod</th>
                        <th className="px-3 py-2.5">Fyzický čas (BOZP)</th>
                        <th className="px-3 py-2.5">Úřední hodiny (Normočas)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {dayRows.map((day) => {
                        if (day > daysInMonth) {
                          return (
                            <tr key={day} className="bg-[#F7F3E9]/60 text-slate-600">
                              <td className="px-3 py-1.5 font-mono">
                                {day}. {reportMonth}.
                              </td>
                              <td className="px-3 py-1.5 italic">Neaktivní den</td>
                              <td className="px-3 py-1.5">—</td>
                              <td className="px-3 py-1.5">—</td>
                              <td className="px-3 py-1.5">—</td>
                              <td className="px-3 py-1.5">—</td>
                              <td className="px-3 py-1.5">—</td>
                            </tr>
                          );
                        }

                        const dt = new Date(reportYear, reportMonth - 1, day);
                        const dayName = dt.toLocaleDateString('cs-CZ', { weekday: 'long' });
                        const dayShifts = card31Employee.shifts.filter(
                          (s) => new Date(s.clockInTime).getDate() === day
                        );

                        if (dayShifts.length === 0) {
                          return (
                            <tr key={day} className="hover:bg-[#E9E1D2]/20 text-[#6C7E74]">
                              <td className="px-3 py-1.5 font-mono text-[#4E6157]">
                                {day}. {reportMonth}.
                              </td>
                              <td className="px-3 py-1.5 capitalize">{dayName}</td>
                              <td className="px-3 py-1.5">—</td>
                              <td className="px-3 py-1.5">—</td>
                              <td className="px-3 py-1.5">—</td>
                              <td className="px-3 py-1.5">—</td>
                              <td className="px-3 py-1.5">—</td>
                            </tr>
                          );
                        }

                        const firstIn = new Date(dayShifts[0].clockInTime).toLocaleTimeString(
                          'cs-CZ',
                          { hour: '2-digit', minute: '2-digit' }
                        );
                        const lastShift = dayShifts[dayShifts.length - 1];
                        const lastOut = lastShift.clockOutTime
                          ? new Date(lastShift.clockOutTime).toLocaleTimeString('cs-CZ', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Neuzavřeno';

                        const totBreakH = dayShifts.reduce(
                          (a, b) => a + (b.breakHours || 0),
                          0
                        );
                        const totNetH = dayShifts.reduce((a, b) => a + (b.netHours || 0), 0);
                        const totPcs = dayShifts.reduce(
                          (a, b) => a + (b.approvedPieces || 0),
                          0
                        );
                        const totNormH = dayShifts.reduce(
                          (a, b) => a + (b.productiveHours || 0),
                          0
                        );

                        const breakStr =
                          totBreakH > 0
                            ? `${Math.floor(totBreakH)}:${String(Math.round((totBreakH % 1) * 60)).padStart(2, '0')}`
                            : '0:00';
                        const netStr = `${Math.floor(totNetH)}:${String(Math.round((totNetH % 1) * 60)).padStart(2, '0')}`;

                        return (
                          <tr key={day} className="bg-[#E9E1D2] text-[#193F34]/30 hover:bg-[#E9E1D2]">
                            <td className="px-3 py-2 font-mono font-bold text-[#193F34]">
                              {day}. {reportMonth}.
                            </td>
                            <td className="px-3 py-2 capitalize text-[#232B28]">{dayName}</td>
                            <td className="px-3 py-2 font-mono text-emerald-400">{firstIn}</td>
                            <td className="px-3 py-2 font-mono text-[#4E6157]">{breakStr}</td>
                            <td className="px-3 py-2 font-mono text-rose-400">{lastOut}</td>
                            <td className="px-3 py-2 font-mono font-bold text-[#193F34]">
                              {netStr}
                            </td>
                            <td className="px-3 py-2">
                              {totPcs > 0 ? (
                                <span className="text-[#16634D] font-semibold font-mono">
                                  {totPcs} ks ({totNormH.toFixed(2)} h normoč.)
                                </span>
                              ) : (
                                <span className="text-[#6C7E74]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ==================================================== */}
      {/* MODÁL PRO RUČNÍ ZÁZNAM / OPRAVU DOCHÁZKY             */}
      {/* ==================================================== */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4DDD0] rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold font-heading text-[#193F34] mb-2">
              {editingLogId ? 'Upravit záznam docházky' : 'Ruční vložení pípnutí'}
            </h3>
            <p className="text-xs text-[#4E6157] mb-6">
              Původní čas před úpravou, autor úpravy, čas změny i důvod se automaticky ukládají do auditní stopy.
            </p>

            <form onSubmit={handleSaveLog} className="space-y-4">
              {!editingLogId && (
                <div>
                  <label className="block text-xs text-[#4E6157] mb-1">Pracovník</label>
                  <select
                    required
                    value={manualEmpId}
                    onChange={(e) => setManualEmpId(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 bg-white border border-[#D6DCD3] rounded-xl text-sm text-[#232B28]"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.contractType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-[#4E6157] mb-1 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#193F34]" />
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Datum a čas</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={manualTimestamp}
                  onChange={(e) => setManualTimestamp(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#D6DCD3] rounded-xl text-sm text-[#232B28] font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs text-[#4E6157] mb-1">Typ události</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualEventType('ClockIn')}
                    className={`py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                      manualEventType === 'ClockIn'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-[#F7F3E9] text-[#4E6157] border-[#E4DDD0]'
                    }`}
                  >
                    Příchod
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualEventType('ClockOut')}
                    className={`py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                      manualEventType === 'ClockOut'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-[#F7F3E9] text-[#4E6157] border-[#E4DDD0]'
                    }`}
                  >
                    Odchod
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualEventType('BreakStart')}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      manualEventType === 'BreakStart'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-[#F7F3E9] text-[#4E6157] border-[#E4DDD0]'
                    }`}
                  >
                    Začátek přestávky
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualEventType('BreakEnd')}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      manualEventType === 'BreakEnd'
                        ? 'bg-[#193F34] text-white border-[#193F34]'
                        : 'bg-[#F7F3E9] text-[#4E6157] border-[#E4DDD0]'
                    }`}
                  >
                    Konec přestávky
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#4E6157] mb-1">
                  Důvod opravy / Poznámka {editingLogId && '(povinné pro audit)'}
                </label>
                <input
                  type="text"
                  required={Boolean(editingLogId)}
                  placeholder="např. Zapomenutý odchod po odpolední směně"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#D6DCD3] rounded-xl text-sm text-[#232B28] placeholder-[#8B9B90]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Uložit záznam
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-3 bg-[#E9E1D2] hover:bg-[#DDD5C5] text-[#193F34] rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODÁL PRO DETAIL ZAKÁZKY (A4 TISK & PŘEHLED ÚČASTNÍKŮ) */}
      {/* ==================================================== */}
      {(selectedOrderDetail || loadingOrderDetail) && (
        <div className="fixed inset-0 z-50 bg-[#102E26]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] border border-[#E4DDD0] rounded-[24px] max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8 text-[#232B28]">
            <button
              type="button"
              onClick={() => setSelectedOrderDetail(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#F7F3E9] text-[#55645B] hover:text-[#193F34] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingOrderDetail ? (
              <div className="py-16 text-center text-[#193F34] font-heading font-bold">
                Načítám detail zakázky...
              </div>
            ) : selectedOrderDetail ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4DDD0]">
                  <div>
                    <span className="text-xs px-2.5 py-1 rounded-[6px] bg-[#285446] text-[#D7BE97] font-heading font-bold uppercase tracking-wider">
                      Zakázka č. {selectedOrderDetail.order.id}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#193F34] mt-2">
                      {selectedOrderDetail.order.name}
                    </h2>
                    {selectedOrderDetail.order.description && (
                      <p className="text-xs text-[#55645B] mt-1">
                        {selectedOrderDetail.order.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open('', '_blank');
                      if (!win) return;
                      const ord = selectedOrderDetail.order;
                      const st = selectedOrderDetail.stats;
                      const parts = selectedOrderDetail.participants;
                      const targetPcs = ord.totalPiecesTarget ?? ord.targetPieces ?? 0;
                      const approvedPcs = st.completedPieces ?? (st as any).totalApprovedPieces ?? 0;
                      const defectPcs = st.defectPieces ?? (st as any).totalDefectPieces ?? 0;
                      const pct = targetPcs > 0 ? Math.round((approvedPcs / targetPcs) * 100) : 0;

                      const rowsHtml = parts.map((p, i) => `
                        <tr>
                          <td style="text-align:center;">${i + 1}</td>
                          <td><strong>${p.employeeName || (p as any).fullName}</strong></td>
                          <td style="text-align:center;">${p.contractType}</td>
                          <td>${p.operationName}</td>
                          <td style="text-align:right; font-family:monospace;">${p.normPerHour} ks/h</td>
                          <td style="text-align:right; font-family:monospace; font-weight:bold; color:#102E26;">${p.approvedPieces} ks</td>
                          <td style="text-align:right; font-family:monospace; color:#8E4B2F;">${p.defectPieces} ks</td>
                          <td style="text-align:right; font-family:monospace;">${(p.productiveHours ?? 0).toFixed(2)} h</td>
                          <td style="text-align:right; font-family:monospace; font-weight:bold;">${(p.totalEarnedCzk ?? 0).toFixed(2)} Kč</td>
                        </tr>
                      `).join('');

                      win.document.write(`
                        <!DOCTYPE html>
                        <html lang="cs">
                          <head>
                            <meta charset="utf-8" />
                            <title>Výrobní list zakázky – ${ord.name}</title>
                            <style>
                              @page { size: A4 portrait; margin: 15mm; }
                              body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #111; line-height: 1.4; padding: 10px; }
                              .header { border-bottom: 2px solid #102E26; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
                              .title { font-size: 20px; font-weight: bold; margin: 0; color: #102E26; }
                              .subtitle { font-size: 11px; color: #55645B; margin-top: 4px; }
                              .kpi-row { display: flex; gap: 15px; margin-bottom: 20px; }
                              .kpi-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc; text-align: center; }
                              .kpi-val { font-size: 16px; font-weight: bold; color: #102E26; font-family: monospace; }
                              .kpi-lbl { font-size: 9px; text-transform: uppercase; color: #64748b; margin-top: 2px; }
                              table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 10.5px; }
                              th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
                              th { background: #f1f5f9; font-weight: bold; color: #102E26; }
                              .footer { margin-top: 40px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px dashed #94a3b8; }
                              .sig-box { width: 45%; text-align: center; }
                              .sig-line { border-bottom: 1px solid #111; margin-top: 40px; margin-bottom: 5px; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <div>
                                <h1 class="title">VÝROBNÍ A ARCHIVAČNÍ LIST ZAKÁZKY</h1>
                                <div class="subtitle">Greenberg Nepomuk • Zakázka: <strong>${ord.name}</strong>
                                  ${(ord.startDate || ord.endDate) ? ` • Termín: ${ord.startDate ? new Date(ord.startDate).toLocaleDateString('cs-CZ') : '—'} až ${ord.endDate ? new Date(ord.endDate).toLocaleDateString('cs-CZ') : '—'}` : ''}
                                  ${ord.targetPricePerPiece ? ` • Cílová cena: ${ord.targetPricePerPiece.toFixed(2)} Kč/ks` : ''}
                                </div>
                              </div>
                              <div style="text-align:right; font-size:10px; color:#64748b;">
                                Vygenerováno: ${new Date().toLocaleDateString('cs-CZ')} v ${new Date().toLocaleTimeString('cs-CZ')}<br/>
                                Stav: ${ord.isActive ? 'Aktivní' : 'Uzavřená'}
                              </div>
                            </div>

                            <div class="kpi-row">
                              <div class="kpi-card">
                                <div class="kpi-val">${targetPcs > 0 ? targetPcs + ' ks' : '—'}</div>
                                <div class="kpi-lbl">Cílový plán</div>
                              </div>
                              <div class="kpi-card">
                                <div class="kpi-val">${approvedPcs} ks (${pct}%)</div>
                                <div class="kpi-lbl">Vyrobeno schváleno</div>
                              </div>
                              <div class="kpi-card">
                                <div class="kpi-val" style="color:#8E4B2F;">${defectPcs} ks</div>
                                <div class="kpi-lbl">Zmetky</div>
                              </div>
                              <div class="kpi-card">
                                <div class="kpi-val">${(st.totalProductiveHours ?? 0).toFixed(2)} h</div>
                                <div class="kpi-lbl">Odpracovaný normočas</div>
                              </div>
                              <div class="kpi-card">
                                <div class="kpi-val">${(st.totalEarnedCzk ?? 0).toFixed(2)} Kč</div>
                                <div class="kpi-lbl">Mzdové náklady zakázky</div>
                              </div>
                            </div>

                            <h3 style="color:#102E26; margin-bottom:8px;">Jmenný přehled účastníků výroby:</h3>
                            <table>
                              <thead>
                                <tr>
                                  <th style="width:25px; text-align:center;">#</th>
                                  <th>Pracovník</th>
                                  <th style="width:50px; text-align:center;">Úvazek</th>
                                  <th>Operace</th>
                                  <th style="width:70px; text-align:right;">Norma</th>
                                  <th style="width:70px; text-align:right;">Schváleno</th>
                                  <th style="width:60px; text-align:right;">Zmetky</th>
                                  <th style="width:70px; text-align:right;">Normočas</th>
                                  <th style="width:80px; text-align:right;">Vyplaceno</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${rowsHtml || '<tr><td colspan="9" style="text-align:center; padding:15px; color:#64748b;">Zatím se na zakázce nikdo nepodílel.</td></tr>'}
                              </tbody>
                            </table>

                            <div class="footer">
                              <div class="sig-box">
                                <div class="sig-line"></div>
                                <strong>Vedoucí výroby / Zkontroloval</strong><br/>
                                (Marta Chorobiková)
                              </div>
                              <div class="sig-box">
                                <div class="sig-line"></div>
                                <strong>Předání / Archivace</strong><br/>
                                Greenberg Nepomuk
                              </div>
                            </div>
                            <script>window.onload = function() { window.print(); };</script>
                          </body>
                        </html>
                      `);
                      win.document.close();
                    }}
                    className="px-4 py-2.5 rounded-[12px] bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] font-heading font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all self-start sm:self-auto"
                  >
                    <Printer className="w-4 h-4 text-[#D7BE97]" />
                    <span>Vytisknout výrobní list (A4)</span>
                  </button>
                </div>

                {/* Progress bar plnění zakázky (Fáze 2.2) */}
                {(() => {
                  const targetPcs = selectedOrderDetail.order.totalPiecesTarget ?? selectedOrderDetail.order.targetPieces ?? 0;
                  const approvedPcs = selectedOrderDetail.stats.completedPieces ?? (selectedOrderDetail.stats as any).totalApprovedPieces ?? 0;
                  const defectPcs = selectedOrderDetail.stats.defectPieces ?? (selectedOrderDetail.stats as any).totalDefectPieces ?? 0;
                  const pct = targetPcs > 0 ? Math.min(100, Math.round((approvedPcs / targetPcs) * 100)) : 0;
                  const remainingPcs = targetPcs > 0 ? Math.max(0, targetPcs - approvedPcs) : 0;

                  return (
                    <div className="my-6 bg-[#F7F3E9] p-5 rounded-[16px] border border-[#E4DDD0]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#55645B]">
                          Plnění cíle zakázky (Celkový progres)
                        </span>
                        <span className="font-mono font-bold text-sm text-[#193F34]">
                          {approvedPcs} / {targetPcs} ks ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#E4DDD0] rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full bg-[#193F34] transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[#E4DDD0]/80">
                        <div>
                          <span className="text-[10px] text-[#55645B] block uppercase tracking-wider">Zbývá vyrobit</span>
                          <span className="font-mono font-bold text-sm text-[#193F34]">
                            {remainingPcs} ks
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#55645B] block uppercase tracking-wider">Zmetky celkem</span>
                          <span className="font-mono font-bold text-sm text-[#8E4B2F]">
                            {defectPcs} ks
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#55645B] block uppercase tracking-wider">Normočas</span>
                          <span className="font-mono font-bold text-sm text-[#193F34]">
                            {(selectedOrderDetail.stats.totalProductiveHours ?? 0).toFixed(2)} h
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#55645B] block uppercase tracking-wider">Mzdové náklady</span>
                          <span className="font-mono font-bold text-sm text-[#16634D]">
                            {(selectedOrderDetail.stats.totalEarnedCzk ?? 0).toFixed(2)} Kč
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Specifické operace zakázky */}
                {selectedOrderDetail.operations && selectedOrderDetail.operations.length > 0 && (
                  <div className="mb-6 bg-white p-4 rounded-[16px] border border-[#E4DDD0]">
                    <h3 className="text-xs font-heading font-bold text-[#193F34] uppercase tracking-wider mb-2">
                      Definované výrobní operace této zakázky ({selectedOrderDetail.operations.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrderDetail.operations.map((op) => (
                        <div
                          key={op.id}
                          className="bg-[#F7F3E9] border border-[#D6DCD3] px-3 py-1.5 rounded-lg text-xs"
                        >
                          <span className="font-bold text-[#193F34] mr-2">{op.name}</span>
                          <span className="font-mono text-[#55645B] mr-2">Norma: {op.normPerHour} ks/h</span>
                          <span className="font-mono font-bold text-emerald-700">{op.ratePerPiece.toFixed(2)} Kč/ks</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sestava lidí (Soupis účastníků dle Fáze 2.2) */}
                <h3 className="text-sm font-heading font-bold text-[#193F34] uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Sestava lidí (Soupis účastníků zakázky)</span>
                  <span className="text-xs font-normal text-[#55645B]">
                    Celkem {selectedOrderDetail.participants.length} záznamů
                  </span>
                </h3>
                <div className="border border-[#E4DDD0] rounded-[16px] overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs text-[#232B28]">
                    <thead className="bg-[#F7F3E9] text-[11px] uppercase font-heading font-bold text-[#55645B] border-b border-[#E4DDD0]">
                      <tr>
                        <th className="px-4 py-2.5">Jméno pracovníka</th>
                        <th className="px-4 py-2.5">Úvazek</th>
                        <th className="px-4 py-2.5">Operace</th>
                        <th className="px-4 py-2.5 text-right">Schválené kusy</th>
                        <th className="px-4 py-2.5 text-right">Zmetky</th>
                        <th className="px-4 py-2.5 text-right">Normočas</th>
                        <th className="px-4 py-2.5 text-right">Výdělek</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4DDD0]">
                      {selectedOrderDetail.participants.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-[#55645B] italic">
                            Zatím nebyly nahlášeny žádné schválené kusy pro tuto zakázku.
                          </td>
                        </tr>
                      ) : (
                        selectedOrderDetail.participants.map((p, idx) => (
                          <tr key={idx} className="hover:bg-[#F7F3E9]/50">
                            <td className="px-4 py-2.5 font-bold text-[#193F34]">{p.employeeName || (p as any).fullName}</td>
                            <td className="px-4 py-2.5 text-[#55645B]">{p.contractType}</td>
                            <td className="px-4 py-2.5">{p.operationName}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-[#16634D]">{p.approvedPieces} ks</td>
                            <td className="px-4 py-2.5 text-right font-mono text-[#8E4B2F]">{p.defectPieces} ks</td>
                            <td className="px-4 py-2.5 text-right font-mono">{(p.productiveHours ?? 0).toFixed(2)} h</td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-[#193F34]">{(p.totalEarnedCzk ?? 0).toFixed(2)} Kč</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODÁL PRO SPRÁVU A ZMĚNU MASTER PINŮ ADMINISTRÁTORŮ  */}
      {/* ==================================================== */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-50 bg-[#102E26]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E4DDD0] rounded-[24px] max-w-md w-full p-6 shadow-2xl relative text-[#232B28]">
            <button
              type="button"
              onClick={() => setShowAdminPinModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#F7F3E9] text-[#55645B] hover:text-[#193F34] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-[#193F34]/10 rounded-2xl text-[#193F34]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-extrabold text-[#193F34]">
                  Správa Master PINů
                </h3>
                <p className="text-xs text-[#55645B]">
                  Změna přihlašovacího PINu pro administrátory
                </p>
              </div>
            </div>

            {loadingAdminUsers ? (
              <div className="py-8 text-center text-xs text-[#55645B]">Načítám administrátory...</div>
            ) : (
              <div>
                {/* Přehled aktuálních administrátorů */}
                <div className="bg-[#F7F3E9] p-3.5 rounded-[16px] border border-[#E4DDD0] mb-5 space-y-2">
                  <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#55645B] block mb-1">
                    Aktuální administrátoři
                  </span>
                  {adminUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-[10px] border border-[#E4DDD0]"
                    >
                      <div>
                        <span className="font-heading font-bold text-[#193F34]">{u.fullName}</span>
                        <span className="text-[11px] text-[#55645B] ml-1.5 font-mono">({u.username})</span>
                      </div>
                      <span className="font-mono font-bold text-[#D7BE97] bg-[#102E26] px-2 py-0.5 rounded-[6px]">
                        PIN: {u.pinCode}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleChangeAdminPinSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#55645B] mb-1">
                      Vyberte administrátora ke změně
                    </label>
                    <select
                      value={selectedAdminUser}
                      onChange={(e) => setSelectedAdminUser(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-[#D6DCD3] rounded-xl text-xs text-[#232B28] font-medium"
                    >
                      {adminUsers.map((u) => (
                        <option key={u.id} value={u.username}>
                          {u.fullName} ({u.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold uppercase tracking-wider text-[#55645B] mb-1">
                      Nový 4místný PIN
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      placeholder="např. 1452"
                      value={newAdminPinVal}
                      onChange={(e) => setNewAdminPinVal(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2.5 bg-white border border-[#D6DCD3] rounded-xl text-sm font-mono text-center tracking-widest text-[#193F34] font-extrabold focus:outline-none focus:border-[#193F34]"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={newAdminPinVal.length !== 4}
                      className="flex-1 py-3 rounded-xl bg-[#193F34] hover:bg-[#285446] text-[#F7F3E9] font-heading font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40"
                    >
                      Uložit nový PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAdminPinModal(false)}
                      className="px-4 py-3 rounded-xl bg-[#F7F3E9] hover:bg-[#EAE4D5] text-[#55645B] font-heading font-semibold text-xs cursor-pointer"
                    >
                      Zrušit
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
