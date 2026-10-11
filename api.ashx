<%@ WebHandler Language="C#" Class="KipackyApiHandler" %>
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.IO;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;

public class KipackyApiHandler : IHttpHandler
{
    private const string CONN_STR = "Server=YOUR_SERVER;Database=YOUR_DATABASE;User Id=YOUR_USER;Password=YOUR_PASSWORD;Encrypt=False";
    private const string ADMIN_USER = "admin";
    private const string ADMIN_PASS = "Kipacky2026!";
    private const string COOKIE_NAME = "Kipacky_Admin_Session";

    private readonly JavaScriptSerializer _json = new JavaScriptSerializer();

    public void ProcessRequest(HttpContext context)
    {
        context.Response.TrySkipIisCustomErrors = true;
        context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
        context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, X-Kipacky-Auth");
        context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

        if (context.Request.HttpMethod == "OPTIONS")
        {
            context.Response.StatusCode = 200;
            return;
        }

        string action = context.Request.QueryString["action"] ?? "";

        try
        {
            switch (action.ToLowerInvariant())
            {
                // --- KIOSK ENDPOINTY ---
                case "verify-pin":
                    HandleVerifyPin(context);
                    break;
                case "clock":
                    HandleClock(context);
                    break;
                case "submit-production":
                    HandleSubmitProduction(context);
                    break;
                case "confirm-document":
                    HandleConfirmDocument(context);
                    break;
                case "claim-shift":
                    HandleClaimShift(context);
                    break;
                case "release-shift":
                    HandleReleaseShift(context);
                    break;
                case "update-profile":
                    HandleUpdateProfile(context);
                    break;
                case "employee-summary":
                    HandleEmployeeSummary(context);
                    break;
                case "get-document":
                    HandleGetDocumentDetail(context);
                    break;

                // --- AUTH ENDPOINTY ---
                case "login":
                    HandleLogin(context);
                    break;
                case "logout":
                    HandleLogout(context);
                    break;
                case "auth-me":
                    HandleAuthMe(context);
                    break;

                // --- ADMIN: ZAMĚSTNANCI ---
                case "get-employees":
                    RequireAuth(context);
                    HandleGetEmployees(context);
                    break;
                case "get-contract-types":
                    HandleGetContractTypes(context);
                    break;
                case "create-employee":
                    RequireAuth(context);
                    HandleCreateEmployee(context);
                    break;
                case "update-employee":
                    RequireAuth(context);
                    HandleUpdateEmployee(context);
                    break;

                // --- ADMIN: DOCHÁZKA A AUDIT ---
                case "get-logs":
                    RequireAuth(context);
                    HandleGetLogs(context);
                    break;
                case "create-log":
                    RequireAuth(context);
                    HandleCreateLog(context);
                    break;
                case "update-log":
                    RequireAuth(context);
                    HandleUpdateLog(context);
                    break;
                case "delete-log":
                    RequireAuth(context);
                    HandleDeleteLog(context);
                    break;

                // --- ADMIN: FÁZE 2 – PRODUKCE, ZAKÁZKY, OPERACE ---
                case "get-orders":
                    RequireAuth(context);
                    HandleGetOrders(context);
                    break;
                case "save-order":
                    RequireAuth(context);
                    HandleSaveOrder(context);
                    break;
                case "get-operations":
                    RequireAuth(context);
                    HandleGetOperations(context);
                    break;
                case "save-operation":
                    RequireAuth(context);
                    HandleSaveOperation(context);
                    break;
                case "get-production":
                    RequireAuth(context);
                    HandleGetProduction(context);
                    break;
                case "approve-production":
                    RequireAuth(context);
                    HandleApproveProduction(context);
                    break;
                case "delete-production":
                    RequireAuth(context);
                    HandleDeleteProduction(context);
                    break;

                // --- ADMIN: FÁZE 3 – BOZP DOKUMENTY A PLÁNOVÁNÍ SMĚN ---
                case "get-documents":
                    RequireAuth(context);
                    HandleGetDocuments(context);
                    break;
                case "save-document":
                    RequireAuth(context);
                    HandleSaveDocument(context);
                    break;
                case "get-consents":
                    RequireAuth(context);
                    HandleGetConsents(context);
                    break;
                case "get-shifts":
                    RequireAuth(context);
                    HandleGetShifts(context);
                    break;
                case "save-shift":
                    RequireAuth(context);
                    HandleSaveShift(context);
                    break;
                case "delete-shift":
                    RequireAuth(context);
                    HandleDeleteShift(context);
                    break;

                // --- ADMIN: FINÁLNÍ MĚSÍČNÍ REPORT A CSV ---
                case "monthly-report":
                    RequireAuth(context);
                    HandleMonthlyReport(context, false);
                    break;
                case "monthly-report-csv":
                    RequireAuth(context);
                    HandleMonthlyReport(context, true);
                    break;

                default:
                    SendError(context, 400, "Nezn\u00E1m\u00E1 akce: " + action);
                    break;
            }
        }
        catch (UnauthorizedAccessException)
        {
            SendError(context, 401, "Neautorizovan\u00FD p\u0159\u00EDstup.");
        }
        catch (Exception ex)
        {
            SendError(context, 500, "Chyba serveru: " + ex.Message);
        }
    }

    private bool IsAuthenticated(HttpContext context)
    {
        var cookie = context.Request.Cookies[COOKIE_NAME];
        if (cookie != null && !string.IsNullOrEmpty(cookie.Value))
        {
            return cookie.Value.StartsWith("kipacky_admin_ok");
        }
        var authHeader = context.Request.Headers["X-Kipacky-Auth"];
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("kipacky_admin_ok"))
        {
            return true;
        }
        var tokenQuery = context.Request.QueryString["token"];
        if (!string.IsNullOrEmpty(tokenQuery) && tokenQuery.StartsWith("kipacky_admin_ok"))
        {
            return true;
        }
        return false;
    }

    private void RequireAuth(HttpContext context)
    {
        if (!IsAuthenticated(context))
        {
            throw new UnauthorizedAccessException();
        }
    }

    private Dictionary<string, object> ReadJsonBody(HttpContext context)
    {
        using (var reader = new StreamReader(context.Request.InputStream, Encoding.UTF8))
        {
            string body = reader.ReadToEnd();
            if (string.IsNullOrWhiteSpace(body)) return new Dictionary<string, object>();
            return _json.Deserialize<Dictionary<string, object>>(body) ?? new Dictionary<string, object>();
        }
    }

    private void HandleLogin(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string user = data.ContainsKey("Username") ? Convert.ToString(data["Username"]) : (data.ContainsKey("username") ? Convert.ToString(data["username"]) : "");
        string pass = data.ContainsKey("Password") ? Convert.ToString(data["Password"]) : (data.ContainsKey("password") ? Convert.ToString(data["password"]) : "");

        if (user == ADMIN_USER && pass == ADMIN_PASS)
        {
            string token = "kipacky_admin_ok_" + Guid.NewGuid().ToString("N");
            var cookie = new HttpCookie(COOKIE_NAME, token)
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(7),
                Path = "/"
            };
            context.Response.Cookies.Add(cookie);

            SendJson(context, new Dictionary<string, object>
            {
                { "success", true },
                { "username", ADMIN_USER },
                { "token", token }
            });
        }
        else
        {
            SendError(context, 401, "Nespr\u00E1vn\u00E9 p\u0159ihla\u0161ovac\u00ED jm\u00E9no nebo heslo.");
        }
    }

    private void HandleLogout(HttpContext context)
    {
        var cookie = new HttpCookie(COOKIE_NAME, "")
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(-1),
            Path = "/"
        };
        context.Response.Cookies.Add(cookie);
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleAuthMe(HttpContext context)
    {
        bool auth = IsAuthenticated(context);
        SendJson(context, new Dictionary<string, object>
        {
            { "isAuthenticated", auth },
            { "username", auth ? ADMIN_USER : null }
        });
    }

    // ==========================================
    // KIOSK: OVĚŘENÍ PINU + DATA PRO FÁZI 2 A 3
    // ==========================================

    private void HandleVerifyPin(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string pin = data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]) : "";
        if (string.IsNullOrWhiteSpace(pin) || pin.Length != 4)
        {
            SendError(context, 400, "PIN mus\u00ED m\u00EDt p\u0159esn\u011B 4 \u010D\u00EDslice.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            int empId = 0;
            string fullName = "";
            string contractType = "";
            string phone = "";
            string email = "";
            string bankAccount = "";
            DateTime? personalDataConfirmedAt = null;

            using (var cmd = new SqlCommand("SELECT Id, FullName, ContractType, Phone, Email, BankAccount, PersonalDataConfirmedAt FROM [Kipacky].[kipa_Employees] WHERE PinCode = @pin AND IsActive = 1", conn))
            {
                cmd.Parameters.AddWithValue("@pin", pin);
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        empId = reader.GetInt32(0);
                        fullName = reader.GetString(1);
                        contractType = reader.GetString(2);
                        phone = reader.IsDBNull(3) ? "" : reader.GetString(3);
                        email = reader.IsDBNull(4) ? "" : reader.GetString(4);
                        bankAccount = reader.IsDBNull(5) ? "" : reader.GetString(5);
                        personalDataConfirmedAt = reader.IsDBNull(6) ? (DateTime?)null : reader.GetDateTime(6);
                    }
                }
            }

            if (empId == 0)
            {
                SendError(context, 404, "Neplatn\u00FD PIN nebo neaktivn\u00ED zam\u011Bstnanec.");
                return;
            }

            string lastEventType = null;
            DateTime? lastEventTimestamp = null;

            using (var cmd = new SqlCommand("SELECT TOP 1 EventType, Timestamp FROM [Kipacky].[kipa_AttendanceLogs] WHERE EmployeeId = @empId ORDER BY Timestamp DESC", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        lastEventType = reader.GetString(0);
                        lastEventTimestamp = reader.GetDateTime(1);
                    }
                }
            }

            string currentStatus = "OffSite";
            if (lastEventType == "ClockIn" || lastEventType == "BreakEnd") currentStatus = "OnSite";
            else if (lastEventType == "BreakStart") currentStatus = "OnBreak";

            string suggestedAction = (currentStatus == "OffSite") ? "ClockIn" : "ClockOut";

            // 1. Aktivní zakázky s rozpracovaností a cílovým počtem kusů (Fáze 2 & 5)
            var activeOrders = new List<Dictionary<string, object>>();
            string orderSql = @"
SELECT o.Id, o.Name, ISNULL(o.TargetPieces, 0), o.Deadline, o.Description,
       ISNULL((SELECT SUM(ISNULL(p.ValidatedPieces, p.SubmittedPieces)) FROM [Kipacky].[kipa_ProductionLogs] p WHERE p.OrderId = o.Id AND p.Status = 'Approved'), 0) AS CompletedPieces
FROM [Kipacky].[kipa_Orders] o
WHERE o.IsActive = 1
ORDER BY o.Name ASC";
            using (var cmd = new SqlCommand(orderSql, conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        int targetPcs = reader.GetInt32(2);
                        int compPcs = Convert.ToInt32(reader.GetValue(5));
                        DateTime? dline = reader.IsDBNull(3) ? (DateTime?)null : reader.GetDateTime(3);

                        activeOrders.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "name", reader.GetString(1) },
                            { "targetPieces", targetPcs },
                            { "deadline", dline.HasValue ? dline.Value.ToString("yyyy-MM-dd") : null },
                            { "description", reader.IsDBNull(4) ? "" : reader.GetString(4) },
                            { "completedPieces", compPcs },
                            { "remainingPieces", (targetPcs > 0 && targetPcs > compPcs) ? (targetPcs - compPcs) : 0 },
                            { "percentDone", (targetPcs > 0) ? Math.Min(100, Math.Round(((double)compPcs / targetPcs) * 100, 1)) : 0 }
                        });
                    }
                }
            }

            // 2. Aktivní operace (Fáze 2)
            var activeOperations = new List<Dictionary<string, object>>();
            using (var cmd = new SqlCommand("SELECT Id, Name, NormPerHour, RatePerPiece FROM [Kipacky].[kipa_Operations] WHERE IsActive = 1 ORDER BY Name ASC", conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        activeOperations.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "name", reader.GetString(1) },
                            { "normPerHour", reader.GetInt32(2) },
                            { "ratePerPiece", Convert.ToDouble(reader.GetDecimal(3)) }
                        });
                    }
                }
            }

            // 3. Nejbližší naplánované směny pro tohoto brigádníka (Fáze 3)
            var upcomingShifts = new List<Dictionary<string, object>>();
            string shiftSql = @"
SELECT TOP 5 s.Id, s.ShiftDate, s.StartTime, s.EndTime, o.Name AS OrderName, s.Note
FROM [Kipacky].[kipa_Shifts] s
LEFT JOIN [Kipacky].[kipa_Orders] o ON s.OrderId = o.Id
WHERE s.EmployeeId = @empId AND s.ShiftDate >= CAST(GETDATE() AS DATE)
ORDER BY s.ShiftDate ASC, s.StartTime ASC";
            using (var cmd = new SqlCommand(shiftSql, conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        upcomingShifts.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "shiftDate", reader.GetDateTime(1).ToString("yyyy-MM-dd") },
                            { "startTime", reader.GetString(2) },
                            { "endTime", reader.GetString(3) },
                            { "orderName", reader.IsDBNull(4) ? "" : reader.GetString(4) },
                            { "note", reader.IsDBNull(5) ? "" : reader.GetString(5) }
                        });
                    }
                }
            }

            // 3b. Otevřené volné směny k přihlášení (Fáze 5 - Samoobslužná burza směn)
            var openShifts = new List<Dictionary<string, object>>();
            string openShiftSql = @"
SELECT TOP 10 s.Id, s.ShiftDate, s.StartTime, s.EndTime, o.Name AS OrderName, s.Note
FROM [Kipacky].[kipa_Shifts] s
LEFT JOIN [Kipacky].[kipa_Orders] o ON s.OrderId = o.Id
WHERE s.EmployeeId IS NULL AND s.ShiftDate >= CAST(GETDATE() AS DATE)
ORDER BY s.ShiftDate ASC, s.StartTime ASC";
            using (var cmd = new SqlCommand(openShiftSql, conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        openShifts.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "shiftDate", reader.GetDateTime(1).ToString("yyyy-MM-dd") },
                            { "startTime", reader.GetString(2) },
                            { "endTime", reader.GetString(3) },
                            { "orderName", reader.IsDBNull(4) ? "" : reader.GetString(4) },
                            { "note", reader.IsDBNull(5) ? "" : reader.GetString(5) }
                        });
                    }
                }
            }

            // 4. Dokumenty BOZP a stav potvrzení (Fáze 3 – 1x měsíčně nebo nepodepsané)
            var documentsStatus = new List<Dictionary<string, object>>();
            string docSql = @"
SELECT d.Id, d.Title, ISNULL(d.ShortText, d.Content) AS ShortText, ISNULL(d.FullText, '') AS FullText,
       (SELECT MAX(c.AgreedAt) FROM [Kipacky].[kipa_DocumentConsents] c WHERE c.EmployeeId = @empId AND c.DocumentId = d.Id) AS LastAgreedAt
FROM [Kipacky].[kipa_Documents] d
WHERE d.IsActive = 1
ORDER BY d.Id ASC";
            using (var cmd = new SqlCommand(docSql, conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        DateTime? lastAgreed = reader.IsDBNull(4) ? (DateTime?)null : reader.GetDateTime(4);
                        bool needsConsent = !lastAgreed.HasValue || (DateTime.Now - lastAgreed.Value).TotalDays >= 30;
                        string shortTxt = reader.IsDBNull(2) ? "" : reader.GetString(2);
                        string fullTxt = reader.IsDBNull(3) ? "" : reader.GetString(3);
                        documentsStatus.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "title", reader.GetString(1) },
                            { "content", shortTxt },
                            { "shortText", shortTxt },
                            { "hasFullText", !string.IsNullOrWhiteSpace(fullTxt) },
                            { "lastAgreedAt", lastAgreed.HasValue ? lastAgreed.Value.ToString("s") : null },
                            { "needsConsent", needsConsent }
                        });
                    }
                }
            }

            // 5. Dnešní nahlášené kusy brigádníka
            int todaySubmittedPieces = 0;
            using (var cmd = new SqlCommand("SELECT ISNULL(SUM(SubmittedPieces), 0) FROM [Kipacky].[kipa_ProductionLogs] WHERE EmployeeId = @empId AND CAST([Date] AS DATE) = CAST(GETDATE() AS DATE)", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                todaySubmittedPieces = Convert.ToInt32(cmd.ExecuteScalar());
            }

            SendJson(context, new Dictionary<string, object>
            {
                { "employeeId", empId },
                { "fullName", fullName },
                { "contractType", contractType },
                { "phone", phone },
                { "email", email },
                { "bankAccount", bankAccount },
                { "personalDataConfirmedAt", personalDataConfirmedAt.HasValue ? personalDataConfirmedAt.Value.ToString("s") : null },
                { "status", currentStatus },
                { "lastEventType", lastEventType },
                { "lastEventTimestamp", lastEventTimestamp.HasValue ? lastEventTimestamp.Value.ToString("s") : null },
                { "suggestedAction", suggestedAction },
                { "activeOrders", activeOrders },
                { "activeOperations", activeOperations },
                { "upcomingShifts", upcomingShifts },
                { "openShifts", openShifts },
                { "documents", documentsStatus },
                { "todaySubmittedPieces", todaySubmittedPieces }
            });
        }
    }

    private void HandleClock(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string pin = data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]) : "";
        string eventType = data.ContainsKey("eventType") ? Convert.ToString(data["eventType"]) : "";
        string note = data.ContainsKey("note") ? Convert.ToString(data["note"]) : null;

        if (string.IsNullOrWhiteSpace(pin) || pin.Length != 4)
        {
            SendError(context, 400, "PIN mus\u00ED m\u00EDt p\u0159esn\u011B 4 \u010D\u00EDslice.");
            return;
        }

        if (eventType != "ClockIn" && eventType != "ClockOut" && eventType != "BreakStart" && eventType != "BreakEnd")
        {
            SendError(context, 400, "Neplatn\u00FD typ ud\u00E1losti (ClockIn/ClockOut/BreakStart/BreakEnd).");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            int empId = 0;
            string fullName = "";

            using (var cmd = new SqlCommand("SELECT Id, FullName FROM [Kipacky].[kipa_Employees] WHERE PinCode = @pin AND IsActive = 1", conn))
            {
                cmd.Parameters.AddWithValue("@pin", pin);
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        empId = reader.GetInt32(0);
                        fullName = reader.GetString(1);
                    }
                }
            }

            if (empId == 0)
            {
                SendError(context, 404, "Neplatn\u00FD PIN nebo neaktivn\u00ED zam\u011Bstnanec.");
                return;
            }

            DateTime recordTime = DateTime.Now;
            bool isOfflineSync = false;
            if (data.ContainsKey("offlineTimestamp") && !string.IsNullOrEmpty(Convert.ToString(data["offlineTimestamp"])))
            {
                DateTime parsed;
                if (DateTime.TryParse(Convert.ToString(data["offlineTimestamp"]), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out parsed))
                {
                    recordTime = parsed.ToLocalTime();
                    isOfflineSync = true;
                    if (string.IsNullOrEmpty(note))
                        note = "(Offline synchronizováno)";
                    else if (!note.Contains("Offline"))
                        note += " (Offline synchronizováno)";
                }
            }

            // Kontrola Anti-Double-Click do 5 minut pro stejnou akci (pokud nejde o offline synchronizaci)
            if (!isOfflineSync)
            {
                using (var cmd = new SqlCommand("SELECT TOP 1 EventType, Timestamp FROM [Kipacky].[kipa_AttendanceLogs] WHERE EmployeeId = @empId ORDER BY Timestamp DESC", conn))
                {
                    cmd.Parameters.AddWithValue("@empId", empId);
                    using (var reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            string lastType = reader.GetString(0);
                            DateTime lastTime = reader.GetDateTime(1);
                            if (lastType == eventType)
                            {
                                TimeSpan diff = recordTime - lastTime;
                                if (diff.TotalMinutes < 5 && diff.TotalMinutes >= 0)
                                {
                                    string czechAction = (eventType == "ClockIn") ? "p\u0159\u00EDchod" : (eventType == "ClockOut" ? "odchod" : "z\u00E1znam p\u0159est\u00E1vky");
                                    SendJson(context, new Dictionary<string, object>
                                    {
                                        { "error", "Tento " + czechAction + " ji\u017E byl zaznamen\u00E1n p\u0159ed m\u00E9n\u011B ne\u017E 5 minutami (" + lastTime.ToString("HH:mm") + ")." },
                                        { "duplicate", true }
                                    }, 409);
                                    return;
                                }
                            }
                        }
                    }
                }
            }

            // Zápis záznamu
            using (var cmd = new SqlCommand("INSERT INTO [Kipacky].[kipa_AttendanceLogs] (EmployeeId, Timestamp, EventType, IsManualEdit, ModifiedByAdmin, Note) VALUES (@empId, @ts, @evt, 0, 0, @note)", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                cmd.Parameters.AddWithValue("@ts", recordTime);
                cmd.Parameters.AddWithValue("@evt", eventType);
                cmd.Parameters.AddWithValue("@note", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                cmd.ExecuteNonQuery();
            }

            string actionText = "Odchod";
            if (eventType == "ClockIn") actionText = "P\u0159\u00EDchod";
            else if (eventType == "BreakStart") actionText = "Za\u010D\u00E1tek p\u0159est\u00E1vky";
            else if (eventType == "BreakEnd") actionText = "Konec p\u0159est\u00E1vky";

            string message = actionText + " zaznamen\u00E1n v " + recordTime.ToString("HH:mm") + (isOfflineSync ? " (offline synchronizov\u00E1no)" : "");

            SendJson(context, new Dictionary<string, object>
            {
                { "success", true },
                { "employeeName", fullName },
                { "eventType", eventType },
                { "timestamp", recordTime.ToString("s") },
                { "formattedTime", recordTime.ToString("HH:mm") },
                { "message", message }
            });
        }
    }

    // ==========================================
    // KIOSK: ZÁPIS VÝROBY A POTVRZENÍ BOZP
    // ==========================================

    private void HandleSubmitProduction(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string pin = data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]) : "";
        int orderId = data.ContainsKey("orderId") ? Convert.ToInt32(data["orderId"]) : 0;
        int operationId = data.ContainsKey("operationId") ? Convert.ToInt32(data["operationId"]) : 0;
        int pieces = data.ContainsKey("submittedPieces") ? Convert.ToInt32(data["submittedPieces"]) : 0;
        string note = data.ContainsKey("note") ? Convert.ToString(data["note"]) : "";

        if (string.IsNullOrWhiteSpace(pin) || pin.Length != 4)
        {
            SendError(context, 400, "Neplatn\u00FD PIN.");
            return;
        }
        if (orderId <= 0 || operationId <= 0)
        {
            SendError(context, 400, "Vyberte zak\u00E1zku a operaci.");
            return;
        }
        if (pieces <= 0)
        {
            SendError(context, 400, "Po\u010Det kus\u016F mus\u00ED b\u00FDt v\u011Bt\u0161\u00ED ne\u017E 0.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            int empId = 0;
            string fullName = "";

            using (var cmd = new SqlCommand("SELECT Id, FullName FROM [Kipacky].[kipa_Employees] WHERE PinCode = @pin AND IsActive = 1", conn))
            {
                cmd.Parameters.AddWithValue("@pin", pin);
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        empId = reader.GetInt32(0);
                        fullName = reader.GetString(1);
                    }
                }
            }

            if (empId == 0)
            {
                SendError(context, 404, "Neplatn\u00FD PIN nebo neaktivn\u00ED zam\u011Bstnanec.");
                return;
            }

            DateTime prodDate = DateTime.Now;
            bool isOfflineSync = false;
            if (data.ContainsKey("offlineTimestamp") && !string.IsNullOrEmpty(Convert.ToString(data["offlineTimestamp"])))
            {
                DateTime parsed;
                if (DateTime.TryParse(Convert.ToString(data["offlineTimestamp"]), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out parsed))
                {
                    prodDate = parsed.ToLocalTime();
                    isOfflineSync = true;
                    if (string.IsNullOrEmpty(note))
                        note = "(Offline synchronizováno)";
                    else if (!note.Contains("Offline"))
                        note += " (Offline synchronizováno)";
                }
            }

            using (var cmd = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_ProductionLogs] (EmployeeId, OrderId, OperationId, [Date], SubmittedPieces, DefectPieces, [Status], Note)
VALUES (@empId, @ordId, @opId, @dt, @pcs, 0, 'Pending', @note)", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                cmd.Parameters.AddWithValue("@ordId", orderId);
                cmd.Parameters.AddWithValue("@opId", operationId);
                cmd.Parameters.AddWithValue("@dt", prodDate);
                cmd.Parameters.AddWithValue("@pcs", pieces);
                cmd.Parameters.AddWithValue("@note", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                cmd.ExecuteNonQuery();
            }

            SendJson(context, new Dictionary<string, object>
            {
                { "success", true },
                { "employeeName", fullName },
                { "submittedPieces", pieces },
                { "timestamp", prodDate.ToString("s") },
                { "formattedTime", prodDate.ToString("HH:mm") },
                { "message", "Ulo\u017Eeno (" + pieces + " ks). \u010Cek\u00E1 na kontrolu a schv\u00E1len\u00ED." + (isOfflineSync ? " (offline synchronizov\u00E1no)" : "") }
            });
        }
    }

    private void HandleConfirmDocument(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string pin = data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]) : "";
        int docId = data.ContainsKey("documentId") ? Convert.ToInt32(data["documentId"]) : 0;

        if (string.IsNullOrWhiteSpace(pin) || pin.Length != 4 || docId <= 0)
        {
            SendError(context, 400, "Neplatn\u00FD po\u017Eadavek.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            int empId = 0;
            using (var cmd = new SqlCommand("SELECT Id FROM [Kipacky].[kipa_Employees] WHERE PinCode = @pin AND IsActive = 1", conn))
            {
                cmd.Parameters.AddWithValue("@pin", pin);
                object res = cmd.ExecuteScalar();
                if (res != null) empId = Convert.ToInt32(res);
            }

            if (empId == 0)
            {
                SendError(context, 404, "Zam\u011Bstnanec nenalezen.");
                return;
            }

            DateTime now = DateTime.Now;
            using (var cmd = new SqlCommand("INSERT INTO [Kipacky].[kipa_DocumentConsents] (EmployeeId, DocumentId, AgreedAt) VALUES (@empId, @docId, @dt)", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                cmd.Parameters.AddWithValue("@docId", docId);
                cmd.Parameters.AddWithValue("@dt", now);
                cmd.ExecuteNonQuery();
            }

            SendJson(context, new Dictionary<string, object>
            {
                { "success", true },
                { "documentId", docId },
                { "agreedAt", now.ToString("s") }
            });
        }
    }

    // ==========================================
    // KIOSK: SAMOOBSLUHA SMĚN A PROFILU (FÁZE 5)
    // ==========================================

    private void HandleClaimShift(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string pin = data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]) : "";
        int shiftId = data.ContainsKey("shiftId") ? Convert.ToInt32(data["shiftId"]) : 0;

        if (string.IsNullOrWhiteSpace(pin) || pin.Length != 4 || shiftId <= 0)
        {
            SendError(context, 400, "Neplatn\u00FD po\u017Eadavek.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            int empId = 0;
            using (var cmd = new SqlCommand("SELECT Id FROM [Kipacky].[kipa_Employees] WHERE PinCode = @pin AND IsActive = 1", conn))
            {
                cmd.Parameters.AddWithValue("@pin", pin);
                object res = cmd.ExecuteScalar();
                if (res != null) empId = Convert.ToInt32(res);
            }

            if (empId == 0)
            {
                SendError(context, 404, "Zam\u011Bstnanec nenalezen.");
                return;
            }

            using (var cmd = new SqlCommand("UPDATE [Kipacky].[kipa_Shifts] SET EmployeeId = @empId WHERE Id = @shiftId AND EmployeeId IS NULL", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                cmd.Parameters.AddWithValue("@shiftId", shiftId);
                int rows = cmd.ExecuteNonQuery();
                if (rows == 0)
                {
                    SendError(context, 409, "Tuto sm\u011Bnu ji\u017E obsadil jin\u00FD brig\u00E1dn\u00EDk.");
                    return;
                }
            }

            SendJson(context, new Dictionary<string, object>
            {
                { "success", true },
                { "message", "Sm\u011Bna byla \u00FAsp\u011B\u0161n\u011B p\u0159i\u0159azena do va\u0161eho kalend\u00E1\u0159e." }
            });
        }
    }

    private void HandleReleaseShift(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string pin = data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]) : "";
        int shiftId = data.ContainsKey("shiftId") ? Convert.ToInt32(data["shiftId"]) : 0;

        if (string.IsNullOrWhiteSpace(pin) || pin.Length != 4 || shiftId <= 0)
        {
            SendError(context, 400, "Neplatn\u00FD po\u017Eadavek.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            int empId = 0;
            using (var cmd = new SqlCommand("SELECT Id FROM [Kipacky].[kipa_Employees] WHERE PinCode = @pin AND IsActive = 1", conn))
            {
                cmd.Parameters.AddWithValue("@pin", pin);
                object res = cmd.ExecuteScalar();
                if (res != null) empId = Convert.ToInt32(res);
            }

            if (empId == 0)
            {
                SendError(context, 404, "Zam\u011Bstnanec nenalezen.");
                return;
            }

            using (var cmd = new SqlCommand("UPDATE [Kipacky].[kipa_Shifts] SET EmployeeId = NULL WHERE Id = @shiftId AND EmployeeId = @empId", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                cmd.Parameters.AddWithValue("@shiftId", shiftId);
                cmd.ExecuteNonQuery();
            }

            SendJson(context, new Dictionary<string, object>
            {
                { "success", true },
                { "message", "Sm\u011Bna byla uvoln\u011Bna pro ostatn\u00ED brig\u00E1dn\u00EDky." }
            });
        }
    }

    private void HandleUpdateProfile(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string pin = data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]) : "";
        string phone = data.ContainsKey("phone") ? Convert.ToString(data["phone"]).Trim() : null;
        string email = data.ContainsKey("email") ? Convert.ToString(data["email"]).Trim() : null;
        string bankAccount = data.ContainsKey("bankAccount") ? Convert.ToString(data["bankAccount"]).Trim() : null;

        if (string.IsNullOrWhiteSpace(pin) || pin.Length != 4)
        {
            SendError(context, 400, "Neplatn\u00FD PIN.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            int empId = 0;
            using (var cmd = new SqlCommand("SELECT Id FROM [Kipacky].[kipa_Employees] WHERE PinCode = @pin AND IsActive = 1", conn))
            {
                cmd.Parameters.AddWithValue("@pin", pin);
                object res = cmd.ExecuteScalar();
                if (res != null) empId = Convert.ToInt32(res);
            }

            if (empId == 0)
            {
                SendError(context, 404, "Zam\u011Bstnanec nenalezen.");
                return;
            }

            DateTime now = DateTime.Now;
            using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_Employees]
SET Phone = ISNULL(@p, Phone),
    Email = ISNULL(@e, Email),
    BankAccount = ISNULL(@b, BankAccount),
    PersonalDataConfirmedAt = @dt
WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@p", string.IsNullOrEmpty(phone) ? (object)DBNull.Value : phone);
                cmd.Parameters.AddWithValue("@e", string.IsNullOrEmpty(email) ? (object)DBNull.Value : email);
                cmd.Parameters.AddWithValue("@b", string.IsNullOrEmpty(bankAccount) ? (object)DBNull.Value : bankAccount);
                cmd.Parameters.AddWithValue("@dt", now);
                cmd.Parameters.AddWithValue("@id", empId);
                cmd.ExecuteNonQuery();
            }

            SendJson(context, new Dictionary<string, object>
            {
                { "success", true },
                { "phone", phone },
                { "email", email },
                { "bankAccount", bankAccount },
                { "confirmedAt", now.ToString("s") },
                { "message", "\u00DAdaje \u00FAsp\u011B\u0161n\u011B ulo\u017Eeny a potvrzeny." }
            });
        }
    }

    // ==========================================
    // KIOSK: MĚSÍČNÍ VÝKAZ PRO BRIGÁDNÍKA (ZADÁNÍ 04)
    // ==========================================

    private void HandleEmployeeSummary(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string pin = data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]) : "";
        int year = data.ContainsKey("year") ? Convert.ToInt32(data["year"]) : (context.Request.QueryString["year"] != null ? Convert.ToInt32(context.Request.QueryString["year"]) : DateTime.Now.Year);
        int month = data.ContainsKey("month") ? Convert.ToInt32(data["month"]) : (context.Request.QueryString["month"] != null ? Convert.ToInt32(context.Request.QueryString["month"]) : DateTime.Now.Month);

        if (string.IsNullOrWhiteSpace(pin) || pin.Length != 4)
        {
            SendError(context, 400, "Neplatn\u00FD PIN.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            int empId = 0;
            string fullName = "";
            string contractType = "";

            using (var cmd = new SqlCommand("SELECT Id, FullName, ContractType FROM [Kipacky].[kipa_Employees] WHERE PinCode = @pin AND IsActive = 1", conn))
            {
                cmd.Parameters.AddWithValue("@pin", pin);
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        empId = reader.GetInt32(0);
                        fullName = reader.GetString(1);
                        contractType = reader.GetString(2);
                    }
                }
            }

            if (empId == 0)
            {
                SendError(context, 404, "Zam\u011Bstnanec nenalezen.");
                return;
            }

            DateTime start = new DateTime(year, month, 1);
            DateTime end = start.AddMonths(1);
            DateTime yearStart = new DateTime(year, 1, 1);
            DateTime yearEnd = yearStart.AddYears(1);

            // 1. Získání docházky za měsíc
            var empLogs = new List<Dictionary<string, object>>();
            using (var cmd = new SqlCommand(@"
SELECT Timestamp, EventType, IsManualEdit, Note 
FROM [Kipacky].[kipa_AttendanceLogs] 
WHERE EmployeeId = @empId AND Timestamp >= @start AND Timestamp < @end 
ORDER BY Timestamp ASC", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                cmd.Parameters.AddWithValue("@start", start);
                cmd.Parameters.AddWithValue("@end", end);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        empLogs.Add(new Dictionary<string, object>
                        {
                            { "ts", reader.GetDateTime(0) },
                            { "event", reader.GetString(1) },
                            { "manual", reader.GetBoolean(2) },
                            { "note", reader.IsDBNull(3) ? "" : reader.GetString(3) }
                        });
                    }
                }
            }

            // 2. Celoroční docházka pro DPP limit (300h)
            double ytdNetHours = 0;
            DateTime? yIn = null;
            using (var cmd = new SqlCommand(@"
SELECT Timestamp, EventType 
FROM [Kipacky].[kipa_AttendanceLogs] 
WHERE EmployeeId = @empId AND Timestamp >= @yStart AND Timestamp < @yEnd 
ORDER BY Timestamp ASC", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                cmd.Parameters.AddWithValue("@yStart", yearStart);
                cmd.Parameters.AddWithValue("@yEnd", yearEnd);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        DateTime ts = reader.GetDateTime(0);
                        string evt = reader.GetString(1);
                        if (evt == "ClockIn") yIn = ts;
                        else if (evt == "ClockOut" && yIn.HasValue)
                        {
                            TimeSpan g = ts - yIn.Value;
                            if (g > TimeSpan.Zero)
                            {
                                TimeSpan b = (g > TimeSpan.FromHours(6)) ? TimeSpan.FromMinutes(30) : TimeSpan.Zero;
                                TimeSpan n = (g > b) ? (g - b) : TimeSpan.Zero;
                                ytdNetHours += n.TotalHours;
                            }
                            yIn = null;
                        }
                    }
                }
            }

            // 3. Výroba za měsíc
            var empProd = new List<Dictionary<string, object>>();
            using (var cmd = new SqlCommand(@"
SELECT p.[Date], p.SubmittedPieces, p.ValidatedPieces, p.DefectPieces, p.[Status], op.NormPerHour, op.RatePerPiece, o.Name AS OrderName, op.Name AS OpName
FROM [Kipacky].[kipa_ProductionLogs] p
JOIN [Kipacky].[kipa_Orders] o ON p.OrderId = o.Id
JOIN [Kipacky].[kipa_Operations] op ON p.OperationId = op.Id
WHERE p.EmployeeId = @empId AND p.[Date] >= @start AND p.[Date] < @end", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                cmd.Parameters.AddWithValue("@start", start);
                cmd.Parameters.AddWithValue("@end", end);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        empProd.Add(new Dictionary<string, object>
                        {
                            { "date", reader.GetDateTime(0) },
                            { "submitted", reader.GetInt32(1) },
                            { "validated", reader.IsDBNull(2) ? (int?)null : reader.GetInt32(2) },
                            { "defects", reader.GetInt32(3) },
                            { "status", reader.GetString(4) },
                            { "norm", reader.GetInt32(5) },
                            { "rate", Convert.ToDouble(reader.GetDecimal(6)) },
                            { "orderName", reader.GetString(7) },
                            { "opName", reader.GetString(8) }
                        });
                    }
                }
            }

            // 4. Párování docházky
            var shifts = new List<Dictionary<string, object>>();
            Dictionary<string, object> currentIn = null;
            DateTime? currentBreakStart = null;
            TimeSpan accumulatedBreak = TimeSpan.Zero;

            foreach (var l in empLogs)
            {
                string evt = Convert.ToString(l["event"]);
                DateTime ts = (DateTime)l["ts"];
                bool man = (bool)l["manual"];

                if (evt == "ClockIn")
                {
                    if (currentIn != null)
                    {
                        shifts.Add(CreateIncompleteShift(empId, fullName, contractType, (DateTime)currentIn["ts"], true));
                    }
                    currentIn = l;
                    currentBreakStart = null;
                    accumulatedBreak = TimeSpan.Zero;
                }
                else if (evt == "BreakStart")
                {
                    if (currentIn != null && !currentBreakStart.HasValue)
                    {
                        currentBreakStart = ts;
                    }
                }
                else if (evt == "BreakEnd")
                {
                    if (currentIn != null && currentBreakStart.HasValue)
                    {
                        TimeSpan bDiff = ts - currentBreakStart.Value;
                        if (bDiff > TimeSpan.Zero) accumulatedBreak += bDiff;
                        currentBreakStart = null;
                    }
                }
                else if (evt == "ClockOut")
                {
                    if (currentIn != null)
                    {
                        if (currentBreakStart.HasValue)
                        {
                            TimeSpan bDiff = ts - currentBreakStart.Value;
                            if (bDiff > TimeSpan.Zero) accumulatedBreak += bDiff;
                            currentBreakStart = null;
                        }

                        DateTime inTs = (DateTime)currentIn["ts"];
                        TimeSpan gross = ts - inTs;
                        if (gross < TimeSpan.Zero) gross = TimeSpan.Zero;

                        TimeSpan minStatutoryBreak = (gross > TimeSpan.FromHours(6)) ? TimeSpan.FromMinutes(30) : TimeSpan.Zero;
                        TimeSpan breakSpan = (accumulatedBreak > minStatutoryBreak) ? accumulatedBreak : minStatutoryBreak;
                        TimeSpan netSpan = (gross > breakSpan) ? (gross - breakSpan) : TimeSpan.Zero;
                        bool isMan = (bool)currentIn["manual"] || man;

                        shifts.Add(new Dictionary<string, object>
                        {
                            { "employeeId", empId },
                            { "employeeName", fullName },
                            { "contractType", contractType },
                            { "date", inTs.ToString("s") },
                            { "clockInTime", inTs.ToString("s") },
                            { "clockOutTime", ts.ToString("s") },
                            { "grossDuration", FormatTimeSpan(gross) },
                            { "breakDuration", FormatTimeSpan(breakSpan) },
                            { "netDuration", FormatTimeSpan(netSpan) },
                            { "grossHours", gross.TotalHours },
                            { "breakHours", breakSpan.TotalHours },
                            { "netHours", netSpan.TotalHours },
                            { "isManualEdit", isMan },
                            { "isIncomplete", false },
                            { "note", isMan ? "Ru\u010Dn\u00ED \u00FAprava" : "" }
                        });

                        currentIn = null;
                        currentBreakStart = null;
                        accumulatedBreak = TimeSpan.Zero;
                    }
                    else
                    {
                        shifts.Add(CreateIncompleteShift(empId, fullName, contractType, ts, false));
                    }
                }
            }

            if (currentIn != null)
            {
                shifts.Add(CreateIncompleteShift(empId, fullName, contractType, (DateTime)currentIn["ts"], true));
            }

            // Agregace dnů
            double totalNetHours = 0;
            double totalEarnedCzk = 0;
            int totalApprovedPieces = 0;

            foreach (var s in shifts)
            {
                DateTime shiftDay = DateTime.Parse(Convert.ToString(s["clockInTime"])).Date;
                int dayApprovedPcs = 0;
                int dayDefectPcs = 0;
                double dayEarned = 0;
                double dayNormHours = 0;

                foreach (var p in empProd)
                {
                    DateTime pDate = ((DateTime)p["date"]).Date;
                    if (pDate == shiftDay)
                    {
                        string st = Convert.ToString(p["status"]);
                        int val = p["validated"] != null ? Convert.ToInt32(p["validated"]) : Convert.ToInt32(p["submitted"]);
                        int def = Convert.ToInt32(p["defects"]);
                        double r = Convert.ToDouble(p["rate"]);
                        int n = Convert.ToInt32(p["norm"]);

                        if (st == "Approved")
                        {
                            dayApprovedPcs += val;
                            dayDefectPcs += def;
                            dayEarned += (val * r);
                            if (n > 0) dayNormHours += ((double)val / n);
                        }
                    }
                }

                s["approvedPieces"] = dayApprovedPcs;
                s["defectPieces"] = dayDefectPcs;
                s["earnedCzk"] = Math.Round(dayEarned, 2);
                s["productiveHours"] = Math.Round(dayNormHours, 2);

                if (!(bool)s["isIncomplete"])
                {
                    totalNetHours += Convert.ToDouble(s["netHours"]);
                    totalEarnedCzk += dayEarned;
                    totalApprovedPieces += dayApprovedPcs;
                }
            }

            SendJson(context, new Dictionary<string, object>
            {
                { "employeeId", empId },
                { "employeeName", fullName },
                { "contractType", contractType },
                { "year", year },
                { "month", month },
                { "shifts", shifts },
                { "totalNetHours", Math.Round(totalNetHours, 2) },
                { "totalEarnedCzk", Math.Round(totalEarnedCzk, 2) },
                { "totalApprovedPieces", totalApprovedPieces },
                { "yearToDateNetHours", Math.Round(ytdNetHours, 2) },
                { "dppLimitHours", 300 }
            });
        }
    }

    // ==========================================
    // ADMIN: ZAMĚSTNANCI
    // ==========================================

    private void HandleGetEmployees(HttpContext context)
    {
        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("SELECT Id, FullName, PinCode, ContractType, IsActive, CreatedAt, Phone, Email, BankAccount, PersonalDataConfirmedAt FROM [Kipacky].[kipa_Employees] ORDER BY IsActive DESC, FullName ASC", conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        DateTime? confAt = reader.IsDBNull(9) ? (DateTime?)null : reader.GetDateTime(9);
                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "fullName", reader.GetString(1) },
                            { "pinCode", reader.GetString(2) },
                            { "contractType", reader.GetString(3) },
                            { "isActive", reader.GetBoolean(4) },
                            { "createdAt", reader.GetDateTime(5).ToString("s") },
                            { "phone", reader.IsDBNull(6) ? "" : reader.GetString(6) },
                            { "email", reader.IsDBNull(7) ? "" : reader.GetString(7) },
                            { "bankAccount", reader.IsDBNull(8) ? "" : reader.GetString(8) },
                            { "personalDataConfirmedAt", confAt.HasValue ? confAt.Value.ToString("s") : null }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleGetContractTypes(HttpContext context)
    {
        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("SELECT Code, Name, Description, IsActive FROM [Kipacky].[kipa_ContractTypes] WHERE IsActive = 1 ORDER BY Code ASC", conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        list.Add(new Dictionary<string, object>
                        {
                            { "code", reader.GetString(0) },
                            { "name", reader.GetString(1) },
                            { "description", reader.IsDBNull(2) ? "" : reader.GetString(2) },
                            { "isActive", reader.GetBoolean(3) }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleCreateEmployee(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string name = data.ContainsKey("fullName") ? Convert.ToString(data["fullName"]).Trim() : "";
        string pin = data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]).Trim() : "";
        string contract = data.ContainsKey("contractType") ? Convert.ToString(data["contractType"]).Trim() : "DPP";
        string phone = data.ContainsKey("phone") ? Convert.ToString(data["phone"]).Trim() : "";
        string email = data.ContainsKey("email") ? Convert.ToString(data["email"]).Trim() : "";
        string bankAccount = data.ContainsKey("bankAccount") ? Convert.ToString(data["bankAccount"]).Trim() : "";
        bool isActive = data.ContainsKey("isActive") ? Convert.ToBoolean(data["isActive"]) : true;

        if (string.IsNullOrWhiteSpace(name)) { SendError(context, 400, "Jm\u00E9no je povinn\u00E9."); return; }
        if (pin.Length != 4) { SendError(context, 400, "PIN mus\u00ED m\u00EDt p\u0159esn\u011B 4 \u010D\u00EDslice."); return; }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var chk = new SqlCommand("SELECT TOP 1 FullName, IsActive FROM [Kipacky].[kipa_Employees] WHERE PinCode = @pin", conn))
            {
                chk.Parameters.AddWithValue("@pin", pin);
                using (var reader = chk.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        string existingName = reader.GetString(0);
                        bool isAct = reader.GetBoolean(1);
                        string statusText = isAct ? "aktivn\u00ED" : "neaktivn\u00ED";
                        SendError(context, 400, "Tento PIN (" + pin + ") ji\u017E m\u00E1 p\u0159i\u0159azen jin\u00FD " + statusText + " zam\u011Bstnanec (" + existingName + "). PIN mus\u00ED b\u00FDt unik\u00E1tn\u00ED.");
                        return;
                    }
                }
            }

            using (var cmd = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_Employees] (FullName, PinCode, ContractType, IsActive, CreatedAt, Phone, Email, BankAccount)
OUTPUT INSERTED.Id
VALUES (@n, @p, @c, @a, GETUTCDATE(), @ph, @em, @ba)", conn))
            {
                cmd.Parameters.AddWithValue("@n", name);
                cmd.Parameters.AddWithValue("@p", pin);
                cmd.Parameters.AddWithValue("@c", string.IsNullOrEmpty(contract) ? "DPP" : contract.ToUpperInvariant());
                cmd.Parameters.AddWithValue("@a", isActive);
                cmd.Parameters.AddWithValue("@ph", string.IsNullOrEmpty(phone) ? (object)DBNull.Value : phone);
                cmd.Parameters.AddWithValue("@em", string.IsNullOrEmpty(email) ? (object)DBNull.Value : email);
                cmd.Parameters.AddWithValue("@ba", string.IsNullOrEmpty(bankAccount) ? (object)DBNull.Value : bankAccount);
                int newId = Convert.ToInt32(cmd.ExecuteScalar());

                SendJson(context, new Dictionary<string, object>
                {
                    { "id", newId },
                    { "fullName", name },
                    { "pinCode", pin },
                    { "contractType", contract },
                    { "isActive", isActive },
                    { "phone", phone },
                    { "email", email },
                    { "bankAccount", bankAccount }
                });
            }
        }
    }

    private void HandleUpdateEmployee(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = Convert.ToInt32(context.Request.QueryString["id"] ?? (data.ContainsKey("id") ? data["id"] : 0));
        if (id <= 0) { SendError(context, 400, "Neplatn\u00E9 ID zam\u011Bstnance."); return; }

        string name = data.ContainsKey("fullName") ? Convert.ToString(data["fullName"]).Trim() : null;
        string pin = data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]).Trim() : null;
        string contract = data.ContainsKey("contractType") ? Convert.ToString(data["contractType"]).Trim() : null;
        string phone = data.ContainsKey("phone") ? Convert.ToString(data["phone"]).Trim() : null;
        string email = data.ContainsKey("email") ? Convert.ToString(data["email"]).Trim() : null;
        string bankAccount = data.ContainsKey("bankAccount") ? Convert.ToString(data["bankAccount"]).Trim() : null;
        bool isActive = data.ContainsKey("isActive") ? Convert.ToBoolean(data["isActive"]) : true;

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            if (!string.IsNullOrEmpty(pin))
            {
                if (pin.Length != 4) { SendError(context, 400, "PIN mus\u00ED m\u00EDt p\u0159esn\u011B 4 \u010D\u00EDslice."); return; }

                using (var chk = new SqlCommand("SELECT TOP 1 FullName, IsActive FROM [Kipacky].[kipa_Employees] WHERE PinCode = @pin AND Id != @id", conn))
                {
                    chk.Parameters.AddWithValue("@pin", pin);
                    chk.Parameters.AddWithValue("@id", id);
                    using (var reader = chk.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            string existingName = reader.GetString(0);
                            bool isAct = reader.GetBoolean(1);
                            string statusText = isAct ? "aktivn\u00ED" : "neaktivn\u00ED";
                            SendError(context, 400, "Tento PIN (" + pin + ") ji\u017E m\u00E1 p\u0159i\u0159azen jin\u00FD " + statusText + " zam\u011Bstnanec (" + existingName + "). PIN mus\u00ED b\u00FDt unik\u00E1tn\u00ED.");
                            return;
                        }
                    }
                }
            }

            using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_Employees]
SET FullName = ISNULL(@n, FullName),
    PinCode = ISNULL(@p, PinCode),
    ContractType = ISNULL(@c, ContractType),
    IsActive = @a,
    Phone = ISNULL(@ph, Phone),
    Email = ISNULL(@em, Email),
    BankAccount = ISNULL(@ba, BankAccount)
WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@n", (object)name ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@p", (object)pin ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@c", (object)contract ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@a", isActive);
                cmd.Parameters.AddWithValue("@ph", (object)phone ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@em", (object)email ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ba", (object)bankAccount ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }

        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    // ==========================================
    // ADMIN: DOCHÁZKA A AUDIT PŮVODNÍCH ČASŮ
    // ==========================================

    private void HandleGetLogs(HttpContext context)
    {
        string empIdStr = context.Request.QueryString["employeeId"];
        string fromStr = context.Request.QueryString["fromDate"];
        string toStr = context.Request.QueryString["toDate"];

        var list = new List<Dictionary<string, object>>();

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            string sql = @"
SELECT TOP 500 l.Id, l.EmployeeId, e.FullName, e.ContractType, l.Timestamp, l.EventType, l.IsManualEdit, l.Note, l.OriginalTimestamp, l.ModifiedByAdmin, l.ModifiedBy, l.ModifiedAt, l.ModifyReason
FROM [Kipacky].[kipa_AttendanceLogs] l
JOIN [Kipacky].[kipa_Employees] e ON l.EmployeeId = e.Id
WHERE 1=1 ";

            if (!string.IsNullOrEmpty(empIdStr)) sql += " AND l.EmployeeId = @empId ";
            if (!string.IsNullOrEmpty(fromStr)) sql += " AND l.Timestamp >= @from ";
            if (!string.IsNullOrEmpty(toStr)) sql += " AND l.Timestamp <= @to ";

            sql += " ORDER BY l.Timestamp DESC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                if (!string.IsNullOrEmpty(empIdStr)) cmd.Parameters.AddWithValue("@empId", Convert.ToInt32(empIdStr));
                if (!string.IsNullOrEmpty(fromStr)) cmd.Parameters.AddWithValue("@from", DateTime.Parse(fromStr));
                if (!string.IsNullOrEmpty(toStr)) cmd.Parameters.AddWithValue("@to", DateTime.Parse(toStr).AddDays(1).AddTicks(-1));

                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        DateTime? origTs = reader.IsDBNull(8) ? (DateTime?)null : reader.GetDateTime(8);
                        bool modByAdmin = !reader.IsDBNull(9) && reader.GetBoolean(9);
                        string modBy = reader.IsDBNull(10) ? "" : reader.GetString(10);
                        DateTime? modAt = reader.IsDBNull(11) ? (DateTime?)null : reader.GetDateTime(11);
                        string modReason = reader.IsDBNull(12) ? "" : reader.GetString(12);

                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "employeeId", reader.GetInt32(1) },
                            { "employeeName", reader.GetString(2) },
                            { "contractType", reader.GetString(3) },
                            { "timestamp", reader.GetDateTime(4).ToString("s") },
                            { "eventType", reader.GetString(5) },
                            { "isManualEdit", reader.GetBoolean(6) },
                            { "note", reader.IsDBNull(7) ? "" : reader.GetString(7) },
                            { "originalTimestamp", origTs.HasValue ? origTs.Value.ToString("s") : null },
                            { "modifiedByAdmin", modByAdmin },
                            { "modifiedBy", modBy },
                            { "modifiedAt", modAt.HasValue ? modAt.Value.ToString("s") : null },
                            { "modifyReason", modReason }
                        });
                    }
                }
            }
        }

        SendJson(context, list);
    }

    private void HandleCreateLog(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int empId = Convert.ToInt32(data["employeeId"]);
        DateTime ts = DateTime.Parse(Convert.ToString(data["timestamp"]));
        string eventType = Convert.ToString(data["eventType"]);
        string note = data.ContainsKey("note") ? Convert.ToString(data["note"]) : "Ru\u010Dn\u00ED z\u00E1pis";

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("INSERT INTO [Kipacky].[kipa_AttendanceLogs] (EmployeeId, Timestamp, EventType, IsManualEdit, ModifiedByAdmin, Note, ModifiedBy, ModifiedAt, ModifyReason) VALUES (@e, @t, @ev, 1, 1, @n, @mb, @ma, @mr)", conn))
            {
                cmd.Parameters.AddWithValue("@e", empId);
                cmd.Parameters.AddWithValue("@t", ts);
                cmd.Parameters.AddWithValue("@ev", eventType);
                cmd.Parameters.AddWithValue("@n", note ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@mb", ADMIN_USER);
                cmd.Parameters.AddWithValue("@ma", DateTime.Now);
                cmd.Parameters.AddWithValue("@mr", string.IsNullOrEmpty(note) ? "Ru\u010Dn\u011B vlo\u017Eeno adminem" : note);
                cmd.ExecuteNonQuery();
            }
        }

        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleUpdateLog(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = Convert.ToInt32(context.Request.QueryString["id"] ?? data["id"]);
        DateTime ts = DateTime.Parse(Convert.ToString(data["timestamp"]));
        string eventType = Convert.ToString(data["eventType"]);
        string note = data.ContainsKey("note") ? Convert.ToString(data["note"]) : "Upraveno adminem";

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            // Uchováme původní hodnotu v OriginalTimestamp + kdo, kdy a proč opravil
            using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_AttendanceLogs]
SET OriginalTimestamp = ISNULL(OriginalTimestamp, Timestamp),
    Timestamp = @t,
    EventType = @ev,
    IsManualEdit = 1,
    ModifiedByAdmin = 1,
    Note = @n,
    ModifiedBy = @mb,
    ModifiedAt = @ma,
    ModifyReason = @mr
WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@t", ts);
                cmd.Parameters.AddWithValue("@ev", eventType);
                cmd.Parameters.AddWithValue("@n", note ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@mb", ADMIN_USER);
                cmd.Parameters.AddWithValue("@ma", DateTime.Now);
                cmd.Parameters.AddWithValue("@mr", string.IsNullOrWhiteSpace(note) ? "Oprava z\u00E1znamu adminem" : note);
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }

        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleDeleteLog(HttpContext context)
    {
        int id = Convert.ToInt32(context.Request.QueryString["id"]);
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("DELETE FROM [Kipacky].[kipa_AttendanceLogs] WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    // ==========================================
    // ADMIN: FÁZE 2 – ZAKÁZKY, OPERACE, PRODUKCE
    // ==========================================

    private void HandleGetOrders(HttpContext context)
    {
        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            string sql = @"
SELECT o.Id, o.Name, o.IsActive, o.CreatedAt, ISNULL(o.TargetPieces, 0), o.Deadline, o.Description,
       ISNULL((SELECT SUM(ISNULL(p.ValidatedPieces, p.SubmittedPieces)) FROM [Kipacky].[kipa_ProductionLogs] p WHERE p.OrderId = o.Id AND p.Status = 'Approved'), 0) AS CompletedPieces
FROM [Kipacky].[kipa_Orders] o
ORDER BY o.IsActive DESC, o.Id DESC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        int targetPcs = reader.GetInt32(4);
                        int compPcs = Convert.ToInt32(reader.GetValue(7));
                        DateTime? dline = reader.IsDBNull(5) ? (DateTime?)null : reader.GetDateTime(5);

                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "name", reader.GetString(1) },
                            { "isActive", reader.GetBoolean(2) },
                            { "createdAt", reader.GetDateTime(3).ToString("s") },
                            { "targetPieces", targetPcs },
                            { "deadline", dline.HasValue ? dline.Value.ToString("yyyy-MM-dd") : null },
                            { "description", reader.IsDBNull(6) ? "" : reader.GetString(6) },
                            { "completedPieces", compPcs },
                            { "remainingPieces", (targetPcs > 0 && targetPcs > compPcs) ? (targetPcs - compPcs) : 0 },
                            { "percentDone", (targetPcs > 0) ? Math.Min(100, Math.Round(((double)compPcs / targetPcs) * 100, 1)) : 0 }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleSaveOrder(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = data.ContainsKey("id") ? Convert.ToInt32(data["id"]) : 0;
        string name = data.ContainsKey("name") ? Convert.ToString(data["name"]).Trim() : "";
        int targetPieces = data.ContainsKey("targetPieces") ? Convert.ToInt32(data["targetPieces"]) : 0;
        string deadlineStr = data.ContainsKey("deadline") ? Convert.ToString(data["deadline"]) : null;
        DateTime? deadline = (!string.IsNullOrEmpty(deadlineStr)) ? (DateTime?)DateTime.Parse(deadlineStr) : null;
        string description = data.ContainsKey("description") ? Convert.ToString(data["description"]).Trim() : "";
        bool isActive = data.ContainsKey("isActive") ? Convert.ToBoolean(data["isActive"]) : true;

        if (string.IsNullOrWhiteSpace(name))
        {
            SendError(context, 400, "N\u00E1zev zak\u00E1zky je povinn\u00FD.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            if (id > 0)
            {
                using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_Orders]
SET Name = @n, IsActive = @a, TargetPieces = @tp, Deadline = @dl, Description = @ds
WHERE Id = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@n", name);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.Parameters.AddWithValue("@tp", targetPieces);
                    cmd.Parameters.AddWithValue("@dl", deadline.HasValue ? (object)deadline.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@ds", string.IsNullOrEmpty(description) ? (object)DBNull.Value : description);
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_Orders] (Name, IsActive, TargetPieces, Deadline, Description)
VALUES (@n, @a, @tp, @dl, @ds)", conn))
                {
                    cmd.Parameters.AddWithValue("@n", name);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.Parameters.AddWithValue("@tp", targetPieces);
                    cmd.Parameters.AddWithValue("@dl", deadline.HasValue ? (object)deadline.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@ds", string.IsNullOrEmpty(description) ? (object)DBNull.Value : description);
                    cmd.ExecuteNonQuery();
                }
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleGetOperations(HttpContext context)
    {
        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("SELECT Id, Name, NormPerHour, RatePerPiece, IsActive FROM [Kipacky].[kipa_Operations] ORDER BY IsActive DESC, Name ASC", conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "name", reader.GetString(1) },
                            { "normPerHour", reader.GetInt32(2) },
                            { "ratePerPiece", Convert.ToDouble(reader.GetDecimal(3)) },
                            { "isActive", reader.GetBoolean(4) }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleSaveOperation(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = data.ContainsKey("id") ? Convert.ToInt32(data["id"]) : 0;
        string name = data.ContainsKey("name") ? Convert.ToString(data["name"]).Trim() : "";
        int norm = data.ContainsKey("normPerHour") ? Convert.ToInt32(data["normPerHour"]) : 100;
        decimal rate = data.ContainsKey("ratePerPiece") ? Convert.ToDecimal(data["ratePerPiece"], CultureInfo.InvariantCulture) : 1.35m;
        bool isActive = data.ContainsKey("isActive") ? Convert.ToBoolean(data["isActive"]) : true;

        if (string.IsNullOrWhiteSpace(name))
        {
            SendError(context, 400, "N\u00E1zev operace je povinn\u00FD.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            if (id > 0)
            {
                using (var cmd = new SqlCommand("UPDATE [Kipacky].[kipa_Operations] SET Name = @n, NormPerHour = @norm, RatePerPiece = @rate, IsActive = @a WHERE Id = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@n", name);
                    cmd.Parameters.AddWithValue("@norm", norm);
                    cmd.Parameters.AddWithValue("@rate", rate);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand("INSERT INTO [Kipacky].[kipa_Operations] (Name, NormPerHour, RatePerPiece, IsActive) VALUES (@n, @norm, @rate, @a)", conn))
                {
                    cmd.Parameters.AddWithValue("@n", name);
                    cmd.Parameters.AddWithValue("@norm", norm);
                    cmd.Parameters.AddWithValue("@rate", rate);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.ExecuteNonQuery();
                }
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleGetProduction(HttpContext context)
    {
        string statusFilter = context.Request.QueryString["status"];
        string empFilter = context.Request.QueryString["employeeId"];

        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            string sql = @"
SELECT TOP 500 p.Id, p.EmployeeId, e.FullName, e.ContractType,
       p.OrderId, o.Name AS OrderName,
       p.OperationId, op.Name AS OperationName, op.NormPerHour, op.RatePerPiece,
       p.[Date], p.SubmittedPieces, p.ValidatedPieces, p.DefectPieces, p.[Status], p.ModifiedBy, p.Note
FROM [Kipacky].[kipa_ProductionLogs] p
JOIN [Kipacky].[kipa_Employees] e ON p.EmployeeId = e.Id
JOIN [Kipacky].[kipa_Orders] o ON p.OrderId = o.Id
JOIN [Kipacky].[kipa_Operations] op ON p.OperationId = op.Id
WHERE 1=1 ";

            if (!string.IsNullOrEmpty(statusFilter)) sql += " AND p.[Status] = @st ";
            if (!string.IsNullOrEmpty(empFilter)) sql += " AND p.EmployeeId = @empId ";
            sql += " ORDER BY CASE WHEN p.[Status] = 'Pending' THEN 0 ELSE 1 END, p.[Date] DESC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                if (!string.IsNullOrEmpty(statusFilter)) cmd.Parameters.AddWithValue("@st", statusFilter);
                if (!string.IsNullOrEmpty(empFilter)) cmd.Parameters.AddWithValue("@empId", Convert.ToInt32(empFilter));

                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        int norm = reader.GetInt32(8);
                        double rate = Convert.ToDouble(reader.GetDecimal(9));
                        int submitted = reader.GetInt32(11);
                        int? validated = reader.IsDBNull(12) ? (int?)null : reader.GetInt32(12);
                        int defects = reader.GetInt32(13);
                        int effectivePieces = validated.HasValue ? validated.Value : submitted;

                        double earnedCzk = Math.Round(effectivePieces * rate, 2);
                        double prodHours = norm > 0 ? Math.Round((double)effectivePieces / norm, 2) : 0.0;

                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "employeeId", reader.GetInt32(1) },
                            { "employeeName", reader.GetString(2) },
                            { "contractType", reader.GetString(3) },
                            { "orderId", reader.GetInt32(4) },
                            { "orderName", reader.GetString(5) },
                            { "operationId", reader.GetInt32(6) },
                            { "operationName", reader.GetString(7) },
                            { "normPerHour", norm },
                            { "ratePerPiece", rate },
                            { "date", reader.GetDateTime(10).ToString("s") },
                            { "submittedPieces", submitted },
                            { "validatedPieces", validated },
                            { "defectPieces", defects },
                            { "status", reader.GetString(14) },
                            { "modifiedBy", reader.IsDBNull(15) ? "" : reader.GetString(15) },
                            { "note", reader.IsDBNull(16) ? "" : reader.GetString(16) },
                            { "earnedCzk", earnedCzk },
                            { "productiveHours", prodHours }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleApproveProduction(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = data.ContainsKey("id") ? Convert.ToInt32(data["id"]) : 0;
        int validatedPieces = data.ContainsKey("validatedPieces") ? Convert.ToInt32(data["validatedPieces"]) : 0;
        int defectPieces = data.ContainsKey("defectPieces") ? Convert.ToInt32(data["defectPieces"]) : 0;
        string note = data.ContainsKey("note") ? Convert.ToString(data["note"]) : "";

        if (id <= 0)
        {
            SendError(context, 400, "Neplatn\u00E9 ID z\u00E1znamu produkce.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_ProductionLogs]
SET ValidatedPieces = @val,
    DefectPieces = @def,
    [Status] = 'Approved',
    ModifiedBy = @mod,
    Note = @note
WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@val", validatedPieces);
                cmd.Parameters.AddWithValue("@def", defectPieces);
                cmd.Parameters.AddWithValue("@mod", ADMIN_USER);
                cmd.Parameters.AddWithValue("@note", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }

        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleDeleteProduction(HttpContext context)
    {
        int id = Convert.ToInt32(context.Request.QueryString["id"]);
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("DELETE FROM [Kipacky].[kipa_ProductionLogs] WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    // ==========================================
    // ADMIN: FÁZE 3 – BOZP DOKUMENTY A SMĚNY
    // ==========================================

    private void HandleGetDocuments(HttpContext context)
    {
        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("SELECT Id, Title, ISNULL(ShortText, Content) AS ShortText, ISNULL(FullText, '') AS FullText, IsActive, CreatedAt FROM [Kipacky].[kipa_Documents] ORDER BY IsActive DESC, Id ASC", conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        string shortTxt = reader.IsDBNull(2) ? "" : reader.GetString(2);
                        string fullTxt = reader.IsDBNull(3) ? "" : reader.GetString(3);
                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "title", reader.GetString(1) },
                            { "content", shortTxt },
                            { "shortText", shortTxt },
                            { "fullText", fullTxt },
                            { "isActive", reader.GetBoolean(4) },
                            { "createdAt", reader.GetDateTime(5).ToString("s") }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleGetDocumentDetail(HttpContext context)
    {
        int id = Convert.ToInt32(context.Request.QueryString["id"]);
        if (id <= 0)
        {
            SendError(context, 400, "Neplatn\u00E9 ID dokumentu.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("SELECT Id, Title, ISNULL(ShortText, Content) AS ShortText, ISNULL(FullText, '') AS FullText, IsActive, CreatedAt FROM [Kipacky].[kipa_Documents] WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        string shortTxt = reader.IsDBNull(2) ? "" : reader.GetString(2);
                        string fullTxt = reader.IsDBNull(3) ? "" : reader.GetString(3);
                        SendJson(context, new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "title", reader.GetString(1) },
                            { "shortText", shortTxt },
                            { "fullText", fullTxt },
                            { "isActive", reader.GetBoolean(4) },
                            { "createdAt", reader.GetDateTime(5).ToString("s") }
                        });
                        return;
                    }
                }
            }
        }
        SendError(context, 404, "Dokument nebyl nalezen.");
    }

    private void HandleSaveDocument(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = data.ContainsKey("id") ? Convert.ToInt32(data["id"]) : 0;
        string title = data.ContainsKey("title") ? Convert.ToString(data["title"]).Trim() : "";
        string shortText = data.ContainsKey("shortText") ? Convert.ToString(data["shortText"]).Trim() : (data.ContainsKey("content") ? Convert.ToString(data["content"]).Trim() : "");
        string fullText = data.ContainsKey("fullText") ? Convert.ToString(data["fullText"]).Trim() : "";
        bool isActive = data.ContainsKey("isActive") ? Convert.ToBoolean(data["isActive"]) : true;

        if (string.IsNullOrWhiteSpace(title))
        {
            SendError(context, 400, "N\u00E1zev dokumentu je povinn\u00FD.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            if (id > 0)
            {
                using (var cmd = new SqlCommand("UPDATE [Kipacky].[kipa_Documents] SET Title = @t, Content = @s, ShortText = @s, FullText = @f, IsActive = @a WHERE Id = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@t", title);
                    cmd.Parameters.AddWithValue("@s", shortText);
                    cmd.Parameters.AddWithValue("@f", string.IsNullOrEmpty(fullText) ? (object)DBNull.Value : fullText);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand("INSERT INTO [Kipacky].[kipa_Documents] (Title, Content, ShortText, FullText, IsActive) VALUES (@t, @s, @s, @f, @a)", conn))
                {
                    cmd.Parameters.AddWithValue("@t", title);
                    cmd.Parameters.AddWithValue("@s", shortText);
                    cmd.Parameters.AddWithValue("@f", string.IsNullOrEmpty(fullText) ? (object)DBNull.Value : fullText);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.ExecuteNonQuery();
                }
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleGetConsents(HttpContext context)
    {
        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            string sql = @"
SELECT c.Id, c.EmployeeId, e.FullName, e.ContractType, c.DocumentId, d.Title, c.AgreedAt
FROM [Kipacky].[kipa_DocumentConsents] c
JOIN [Kipacky].[kipa_Employees] e ON c.EmployeeId = e.Id
JOIN [Kipacky].[kipa_Documents] d ON c.DocumentId = d.Id
ORDER BY c.AgreedAt DESC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "employeeId", reader.GetInt32(1) },
                            { "employeeName", reader.GetString(2) },
                            { "contractType", reader.GetString(3) },
                            { "documentId", reader.GetInt32(4) },
                            { "documentTitle", reader.GetString(5) },
                            { "agreedAt", reader.GetDateTime(6).ToString("s") }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleGetShifts(HttpContext context)
    {
        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            string sql = @"
SELECT s.Id, s.ShiftDate, s.StartTime, s.EndTime,
       s.EmployeeId, e.FullName AS EmployeeName,
       s.OrderId, o.Name AS OrderName, s.Note
FROM [Kipacky].[kipa_Shifts] s
LEFT JOIN [Kipacky].[kipa_Employees] e ON s.EmployeeId = e.Id
LEFT JOIN [Kipacky].[kipa_Orders] o ON s.OrderId = o.Id
ORDER BY s.ShiftDate DESC, s.StartTime ASC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "shiftDate", reader.GetDateTime(1).ToString("yyyy-MM-dd") },
                            { "startTime", reader.GetString(2) },
                            { "endTime", reader.GetString(3) },
                            { "employeeId", reader.IsDBNull(4) ? (int?)null : reader.GetInt32(4) },
                            { "employeeName", reader.IsDBNull(5) ? "Otev\u0159en\u00E1 sm\u011Bna" : reader.GetString(5) },
                            { "orderId", reader.IsDBNull(6) ? (int?)null : reader.GetInt32(6) },
                            { "orderName", reader.IsDBNull(7) ? "" : reader.GetString(7) },
                            { "note", reader.IsDBNull(8) ? "" : reader.GetString(8) }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleSaveShift(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = data.ContainsKey("id") ? Convert.ToInt32(data["id"]) : 0;
        DateTime shiftDate = DateTime.Parse(Convert.ToString(data["shiftDate"]));
        string startTime = data.ContainsKey("startTime") ? Convert.ToString(data["startTime"]) : "06:00";
        string endTime = data.ContainsKey("endTime") ? Convert.ToString(data["endTime"]) : "14:00";
        int? empId = (data.ContainsKey("employeeId") && data["employeeId"] != null && Convert.ToString(data["employeeId"]) != "" && Convert.ToInt32(data["employeeId"]) > 0)
            ? Convert.ToInt32(data["employeeId"]) : (int?)null;
        int? ordId = (data.ContainsKey("orderId") && data["orderId"] != null && Convert.ToString(data["orderId"]) != "" && Convert.ToInt32(data["orderId"]) > 0)
            ? Convert.ToInt32(data["orderId"]) : (int?)null;
        string note = data.ContainsKey("note") ? Convert.ToString(data["note"]) : "";

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            if (id > 0)
            {
                using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_Shifts]
SET ShiftDate = @dt, StartTime = @st, EndTime = @et, EmployeeId = @emp, OrderId = @ord, Note = @note
WHERE Id = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@dt", shiftDate);
                    cmd.Parameters.AddWithValue("@st", startTime);
                    cmd.Parameters.AddWithValue("@et", endTime);
                    cmd.Parameters.AddWithValue("@emp", empId.HasValue ? (object)empId.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@ord", ordId.HasValue ? (object)ordId.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@note", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_Shifts] (ShiftDate, StartTime, EndTime, EmployeeId, OrderId, Note)
VALUES (@dt, @st, @et, @emp, @ord, @note)", conn))
                {
                    cmd.Parameters.AddWithValue("@dt", shiftDate);
                    cmd.Parameters.AddWithValue("@st", startTime);
                    cmd.Parameters.AddWithValue("@et", endTime);
                    cmd.Parameters.AddWithValue("@emp", empId.HasValue ? (object)empId.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@ord", ordId.HasValue ? (object)ordId.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@note", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                    cmd.ExecuteNonQuery();
                }
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleDeleteShift(HttpContext context)
    {
        int id = Convert.ToInt32(context.Request.QueryString["id"]);
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("DELETE FROM [Kipacky].[kipa_Shifts] WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    // ==========================================
    // FINÁLNÍ MĚSÍČNÍ MASTER REPORT (DOCHÁZKA + PRODUKCE + MZDY + 300H LIMIT)
    // ==========================================

    private void HandleMonthlyReport(HttpContext context, bool asCsv)
    {
        int year = Convert.ToInt32(context.Request.QueryString["year"] ?? DateTime.Now.Year.ToString());
        int month = Convert.ToInt32(context.Request.QueryString["month"] ?? DateTime.Now.Month.ToString());
        string filterEmpId = context.Request.QueryString["employeeId"];

        DateTime start = new DateTime(year, month, 1);
        DateTime end = start.AddMonths(1);
        DateTime yearStart = new DateTime(year, 1, 1);
        DateTime yearEnd = yearStart.AddYears(1);

        var employees = new List<Dictionary<string, object>>();
        var logs = new List<Dictionary<string, object>>();
        var yearLogs = new List<Dictionary<string, object>>();
        var prodLogs = new List<Dictionary<string, object>>();

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            string empSql = "SELECT Id, FullName, ContractType FROM [Kipacky].[kipa_Employees] WHERE 1=1 ";
            if (!string.IsNullOrEmpty(filterEmpId)) empSql += " AND Id = @empId ";
            empSql += " ORDER BY FullName";

            using (var cmd = new SqlCommand(empSql, conn))
            {
                if (!string.IsNullOrEmpty(filterEmpId)) cmd.Parameters.AddWithValue("@empId", Convert.ToInt32(filterEmpId));
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        employees.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "name", reader.GetString(1) },
                            { "contract", reader.GetString(2) }
                        });
                    }
                }
            }

            // Docházka za vybraný měsíc
            string logSql = @"
SELECT EmployeeId, Timestamp, EventType, IsManualEdit, Note 
FROM [Kipacky].[kipa_AttendanceLogs] 
WHERE Timestamp >= @start AND Timestamp < @end 
ORDER BY Timestamp ASC";

            using (var cmd = new SqlCommand(logSql, conn))
            {
                cmd.Parameters.AddWithValue("@start", start);
                cmd.Parameters.AddWithValue("@end", end);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        logs.Add(new Dictionary<string, object>
                        {
                            { "empId", reader.GetInt32(0) },
                            { "ts", reader.GetDateTime(1) },
                            { "event", reader.GetString(2) },
                            { "manual", reader.GetBoolean(3) },
                            { "note", reader.IsDBNull(4) ? "" : reader.GetString(4) }
                        });
                    }
                }
            }

            // Docházka za celý rok (pro výpočet limitu 300h u DPP)
            string yLogSql = @"
SELECT EmployeeId, Timestamp, EventType
FROM [Kipacky].[kipa_AttendanceLogs]
WHERE Timestamp >= @yStart AND Timestamp < @yEnd
ORDER BY Timestamp ASC";

            using (var cmd = new SqlCommand(yLogSql, conn))
            {
                cmd.Parameters.AddWithValue("@yStart", yearStart);
                cmd.Parameters.AddWithValue("@yEnd", yearEnd);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        yearLogs.Add(new Dictionary<string, object>
                        {
                            { "empId", reader.GetInt32(0) },
                            { "ts", reader.GetDateTime(1) },
                            { "event", reader.GetString(2) }
                        });
                    }
                }
            }

            // Produkce za vybraný měsíc
            string prodSql = @"
SELECT p.EmployeeId, p.[Date], p.SubmittedPieces, p.ValidatedPieces, p.DefectPieces, p.[Status],
       op.NormPerHour, op.RatePerPiece, o.Name AS OrderName, op.Name AS OperationName
FROM [Kipacky].[kipa_ProductionLogs] p
JOIN [Kipacky].[kipa_Orders] o ON p.OrderId = o.Id
JOIN [Kipacky].[kipa_Operations] op ON p.OperationId = op.Id
WHERE p.[Date] >= @start AND p.[Date] < @end
ORDER BY p.[Date] ASC";

            using (var cmd = new SqlCommand(prodSql, conn))
            {
                cmd.Parameters.AddWithValue("@start", start);
                cmd.Parameters.AddWithValue("@end", end);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        prodLogs.Add(new Dictionary<string, object>
                        {
                            { "empId", reader.GetInt32(0) },
                            { "date", reader.GetDateTime(1) },
                            { "submitted", reader.GetInt32(2) },
                            { "validated", reader.IsDBNull(3) ? (int?)null : reader.GetInt32(3) },
                            { "defects", reader.GetInt32(4) },
                            { "status", reader.GetString(5) },
                            { "norm", reader.GetInt32(6) },
                            { "rate", Convert.ToDouble(reader.GetDecimal(7)) },
                            { "orderName", reader.GetString(8) },
                            { "opName", reader.GetString(9) }
                        });
                    }
                }
            }
        }

        var empSummaries = new List<Dictionary<string, object>>();
        var csvSb = new StringBuilder();
        if (asCsv)
        {
            csvSb.Append('\uFEFF');
            csvSb.AppendLine("Jm\u00E9no zam\u011Bstnance;\u00DAvazek;Datum;P\u0159\u00EDchod;Odchod;Hrub\u00FD \u010Das (hod:min);Z\u00E1konn\u00E1 p\u0159est\u00E1vka (min);\u010Cist\u00FD \u010Das (hod:min);\u010Cist\u00FD \u010Das (h);Schv\u00E1leno kus\u016F;Zmetky (ks);Produktivn\u00ED \u010Das dle normy (h);Vyd\u011Blan\u00E1 \u010D\u00E1stka (K\u010D);Pozn\u00E1mka");
        }

        foreach (var emp in employees)
        {
            int eId = Convert.ToInt32(emp["id"]);
            string eName = Convert.ToString(emp["name"]);
            string eContract = Convert.ToString(emp["contract"]);

            var empLogs = new List<Dictionary<string, object>>();
            foreach (var l in logs)
            {
                if (Convert.ToInt32(l["empId"]) == eId) empLogs.Add(l);
            }

            var empProd = new List<Dictionary<string, object>>();
            foreach (var p in prodLogs)
            {
                if (Convert.ToInt32(p["empId"]) == eId) empProd.Add(p);
            }

            // Celoroční odpracované hodiny pro hlídání 300h DPP
            double ytdNetHours = 0;
            DateTime? yIn = null;
            foreach (var yl in yearLogs)
            {
                if (Convert.ToInt32(yl["empId"]) != eId) continue;
                string yEvt = Convert.ToString(yl["event"]);
                DateTime yTs = (DateTime)yl["ts"];
                if (yEvt == "ClockIn") yIn = yTs;
                else if (yEvt == "ClockOut" && yIn.HasValue)
                {
                    TimeSpan g = yTs - yIn.Value;
                    if (g > TimeSpan.Zero)
                    {
                        TimeSpan b = (g > TimeSpan.FromHours(6)) ? TimeSpan.FromMinutes(30) : TimeSpan.Zero;
                        TimeSpan n = (g > b) ? (g - b) : TimeSpan.Zero;
                        ytdNetHours += n.TotalHours;
                    }
                    yIn = null;
                }
            }

            var shifts = new List<Dictionary<string, object>>();
            Dictionary<string, object> currentIn = null;
            DateTime? currentBreakStart = null;
            TimeSpan accumulatedBreak = TimeSpan.Zero;

            foreach (var l in empLogs)
            {
                string evt = Convert.ToString(l["event"]);
                DateTime ts = (DateTime)l["ts"];
                bool man = (bool)l["manual"];

                if (evt == "ClockIn")
                {
                    if (currentIn != null)
                    {
                        shifts.Add(CreateIncompleteShift(eId, eName, eContract, (DateTime)currentIn["ts"], true));
                    }
                    currentIn = l;
                    currentBreakStart = null;
                    accumulatedBreak = TimeSpan.Zero;
                }
                else if (evt == "BreakStart")
                {
                    if (currentIn != null && !currentBreakStart.HasValue)
                    {
                        currentBreakStart = ts;
                    }
                }
                else if (evt == "BreakEnd")
                {
                    if (currentIn != null && currentBreakStart.HasValue)
                    {
                        TimeSpan bDiff = ts - currentBreakStart.Value;
                        if (bDiff > TimeSpan.Zero) accumulatedBreak += bDiff;
                        currentBreakStart = null;
                    }
                }
                else if (evt == "ClockOut")
                {
                    if (currentIn != null)
                    {
                        if (currentBreakStart.HasValue)
                        {
                            TimeSpan bDiff = ts - currentBreakStart.Value;
                            if (bDiff > TimeSpan.Zero) accumulatedBreak += bDiff;
                            currentBreakStart = null;
                        }

                        DateTime inTs = (DateTime)currentIn["ts"];
                        TimeSpan gross = ts - inTs;
                        if (gross < TimeSpan.Zero) gross = TimeSpan.Zero;

                        TimeSpan minStatutoryBreak = (gross > TimeSpan.FromHours(6)) ? TimeSpan.FromMinutes(30) : TimeSpan.Zero;
                        TimeSpan breakSpan = (accumulatedBreak > minStatutoryBreak) ? accumulatedBreak : minStatutoryBreak;
                        TimeSpan netSpan = (gross > breakSpan) ? (gross - breakSpan) : TimeSpan.Zero;
                        bool isMan = (bool)currentIn["manual"] || man;

                        shifts.Add(new Dictionary<string, object>
                        {
                            { "employeeId", eId },
                            { "employeeName", eName },
                            { "contractType", eContract },
                            { "date", inTs.ToString("s") },
                            { "clockInTime", inTs.ToString("s") },
                            { "clockOutTime", ts.ToString("s") },
                            { "grossDuration", FormatTimeSpan(gross) },
                            { "breakDuration", FormatTimeSpan(breakSpan) },
                            { "netDuration", FormatTimeSpan(netSpan) },
                            { "grossHours", gross.TotalHours },
                            { "breakHours", breakSpan.TotalHours },
                            { "netHours", netSpan.TotalHours },
                            { "isManualEdit", isMan },
                            { "isIncomplete", false },
                            { "note", isMan ? "Ru\u010Dn\u00ED \u00FAprava" : "" }
                        });

                        currentIn = null;
                        currentBreakStart = null;
                        accumulatedBreak = TimeSpan.Zero;
                    }
                    else
                    {
                        shifts.Add(CreateIncompleteShift(eId, eName, eContract, ts, false));
                    }
                }
            }

            if (currentIn != null)
            {
                shifts.Add(CreateIncompleteShift(eId, eName, eContract, (DateTime)currentIn["ts"], true));
            }

            double totalGross = 0;
            double totalBreak = 0;
            double totalNet = 0;
            int incompleteCount = 0;
            int completeCount = 0;

            foreach (var s in shifts)
            {
                DateTime shiftDay = DateTime.Parse(Convert.ToString(s["clockInTime"])).Date;
                int dayApprovedPcs = 0;
                int dayDefectPcs = 0;
                double dayProdHours = 0;
                double dayEarnedCzk = 0;

                foreach (var p in empProd)
                {
                    DateTime pDay = ((DateTime)p["date"]).Date;
                    if (pDay == shiftDay && Convert.ToString(p["status"]) == "Approved")
                    {
                        int valPcs = p["validated"] != null ? Convert.ToInt32(p["validated"]) : Convert.ToInt32(p["submitted"]);
                        int defPcs = Convert.ToInt32(p["defects"]);
                        int norm = Convert.ToInt32(p["norm"]);
                        double rate = (double)p["rate"];

                        dayApprovedPcs += valPcs;
                        dayDefectPcs += defPcs;
                        dayEarnedCzk += valPcs * rate;
                        if (norm > 0) dayProdHours += (double)valPcs / norm;
                    }
                }

                s["approvedPieces"] = dayApprovedPcs;
                s["defectPieces"] = dayDefectPcs;
                s["productiveHours"] = Math.Round(dayProdHours, 2);
                s["earnedCzk"] = Math.Round(dayEarnedCzk, 2);

                if ((bool)s["isIncomplete"])
                {
                    incompleteCount++;
                }
                else
                {
                    completeCount++;
                    totalGross += (double)s["grossHours"];
                    totalBreak += (double)s["breakHours"];
                    totalNet += (double)s["netHours"];
                }
            }

            // Celková produkce zaměstnance za měsíc (včetně dnů bez pípnutí - např. domácí práce)
            int totalApprovedPieces = 0;
            int totalPendingPieces = 0;
            int totalDefectPieces = 0;
            double totalProductiveHours = 0;
            double totalEarnedCzk = 0;

            foreach (var p in empProd)
            {
                string st = Convert.ToString(p["status"]);
                int subPcs = Convert.ToInt32(p["submitted"]);
                int valPcs = p["validated"] != null ? Convert.ToInt32(p["validated"]) : subPcs;
                int defPcs = Convert.ToInt32(p["defects"]);
                int norm = Convert.ToInt32(p["norm"]);
                double rate = (double)p["rate"];

                if (st == "Approved")
                {
                    totalApprovedPieces += valPcs;
                    totalDefectPieces += defPcs;
                    totalEarnedCzk += valPcs * rate;
                    if (norm > 0) totalProductiveHours += (double)valPcs / norm;
                }
                else
                {
                    totalPendingPieces += subPcs;
                }
            }

            empSummaries.Add(new Dictionary<string, object>
            {
                { "employeeId", eId },
                { "employeeName", eName },
                { "contractType", eContract },
                { "totalShifts", completeCount },
                { "totalGrossHours", Math.Round(totalGross, 2) },
                { "totalBreakHours", Math.Round(totalBreak, 2) },
                { "totalNetHours", Math.Round(totalNet, 2) },
                { "incompleteShiftsCount", incompleteCount },
                { "yearToDateNetHours", Math.Round(ytdNetHours, 2) },
                { "totalApprovedPieces", totalApprovedPieces },
                { "totalPendingPieces", totalPendingPieces },
                { "totalDefectPieces", totalDefectPieces },
                { "totalProductiveHours", Math.Round(totalProductiveHours, 2) },
                { "totalEarnedCzk", Math.Round(totalEarnedCzk, 2) },
                { "shifts", shifts }
            });

            if (asCsv)
            {
                foreach (var s in shifts)
                {
                    DateTime dt = DateTime.Parse(Convert.ToString(s["clockInTime"]));
                    string inStr = dt.ToString("HH:mm");
                    string outStr = s["clockOutTime"] != null ? DateTime.Parse(Convert.ToString(s["clockOutTime"])).ToString("HH:mm") : "-";
                    string grossStr = Convert.ToString(s["grossDuration"]).Substring(0, 5);
                    int breakMin = (int)(TimeSpan.Parse(Convert.ToString(s["breakDuration"])).TotalMinutes);
                    string netStr = Convert.ToString(s["netDuration"]).Substring(0, 5);
                    double netH = Math.Round((double)s["netHours"], 2);
                    int appPcs = Convert.ToInt32(s["approvedPieces"]);
                    int defPcs = Convert.ToInt32(s["defectPieces"]);
                    double prodH = Convert.ToDouble(s["productiveHours"]);
                    double earnCzk = Convert.ToDouble(s["earnedCzk"]);

                    csvSb.AppendLine(string.Format("{0};{1};{2};{3};{4};{5};{6};{7};{8};{9};{10};{11};{12};{13}",
                        EscapeCsv(eName), EscapeCsv(eContract), dt.ToString("dd.MM.yyyy"), inStr, outStr,
                        grossStr, breakMin, netStr, netH.ToString("F2", CultureInfo.InvariantCulture),
                        appPcs, defPcs, prodH.ToString("F2", CultureInfo.InvariantCulture),
                        earnCzk.ToString("F2", CultureInfo.InvariantCulture),
                        EscapeCsv(Convert.ToString(s["note"]))));
                }

                string totGrossStr = FormatTimeSpan(TimeSpan.FromHours(totalGross)).Substring(0, 5);
                string totNetStr = FormatTimeSpan(TimeSpan.FromHours(totalNet)).Substring(0, 5);
                csvSb.AppendLine(string.Format("CELKEM {0};{1};;--;--;{2};{3};{4};{5};{6};{7};{8};{9};Po\u010Det sm\u011Bn: {10} | Ro\u010Dn\u011B YTD: {11} h",
                    EscapeCsv(eName), EscapeCsv(eContract), totGrossStr, (int)(totalBreak * 60), totNetStr,
                    totalNet.ToString("F2", CultureInfo.InvariantCulture),
                    totalApprovedPieces, totalDefectPieces,
                    totalProductiveHours.ToString("F2", CultureInfo.InvariantCulture),
                    totalEarnedCzk.ToString("F2", CultureInfo.InvariantCulture),
                    completeCount, Math.Round(ytdNetHours, 1).ToString(CultureInfo.InvariantCulture)));
                csvSb.AppendLine(";;;;;;;;;;;;;");
            }
        }

        if (asCsv)
        {
            context.Response.ContentType = "text/csv; charset=utf-8";
            string fn = string.Format("Kipacky_MasterReport_{0}_{1:D2}.csv", year, month);
            context.Response.AddHeader("Content-Disposition", "attachment; filename=\"" + fn + "\"");
            byte[] bytes = Encoding.UTF8.GetBytes(csvSb.ToString());
            context.Response.OutputStream.Write(bytes, 0, bytes.Length);
        }
        else
        {
            SendJson(context, new Dictionary<string, object>
            {
                { "year", year },
                { "month", month },
                { "employeeSummaries", empSummaries }
            });
        }
    }

    private Dictionary<string, object> CreateIncompleteShift(int empId, string empName, string contract, DateTime ts, bool missingOut)
    {
        return new Dictionary<string, object>
        {
            { "employeeId", empId },
            { "employeeName", empName },
            { "contractType", contract },
            { "date", ts.ToString("s") },
            { "clockInTime", ts.ToString("s") },
            { "clockOutTime", null },
            { "grossDuration", "00:00:00" },
            { "breakDuration", "00:00:00" },
            { "netDuration", "00:00:00" },
            { "grossHours", 0.0 },
            { "breakHours", 0.0 },
            { "netHours", 0.0 },
            { "approvedPieces", 0 },
            { "defectPieces", 0 },
            { "productiveHours", 0.0 },
            { "earnedCzk", 0.0 },
            { "isManualEdit", false },
            { "isIncomplete", true },
            { "note", missingOut ? "Chyb\u00ED odchod (neuzav\u0159en\u00E1 sm\u011Bna)" : "Chyb\u00ED p\u0159\u00EDchod (izolovan\u00FD odchod)" }
        };
    }

    private string FormatTimeSpan(TimeSpan ts)
    {
        return string.Format("{0:D2}:{1:D2}:{2:D2}", (int)ts.TotalHours, ts.Minutes, ts.Seconds);
    }

    private static string EscapeCsv(string val)
    {
        if (string.IsNullOrEmpty(val)) return "";
        if (val.Contains(";") || val.Contains("\"") || val.Contains("\n") || val.Contains("\r"))
            return "\"" + val.Replace("\"", "\"\"") + "\"";
        return val;
    }

    private void SendJson(HttpContext context, object data, int statusCode = 200)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.StatusCode = statusCode;
        string json = _json.Serialize(data);
        byte[] bytes = Encoding.UTF8.GetBytes(json);
        context.Response.OutputStream.Write(bytes, 0, bytes.Length);
    }

    private void SendError(HttpContext context, int statusCode, string message)
    {
        SendJson(context, new Dictionary<string, object> { { "error", message } }, statusCode);
    }

    public bool IsReusable { get { return false; } }
}
