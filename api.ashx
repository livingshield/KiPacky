<%@ WebHandler Language="C#" Class="KipackyApiHandler" %>
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
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
        context.Response.ContentEncoding = Encoding.UTF8;
        context.Response.Charset = "utf-8";
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
                case "get-employee-payslips":
                    HandleGetEmployeePayslips(context);
                    break;
                case "download-payslip-kiosk":
                    HandleDownloadPayslipKiosk(context);
                    break;
                case "get-videos":
                    HandleGetVideos(context);
                    break;
                case "confirm-video-view":
                    HandleConfirmVideoView(context);
                    break;

                // --- AUTH ENDPOINTY ---
                case "login":
                    HandleLogin(context);
                    break;
                case "admin-pin-login":
                    HandleAdminPinLogin(context);
                    break;
                case "change-admin-pin":
                    RequireAuth(context);
                    HandleChangeAdminPin(context);
                    break;
                case "get-admin-users":
                    RequireAuth(context);
                    HandleGetAdminUsers(context);
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
                case "get-order-detail":
                    RequireAuth(context);
                    HandleGetOrderDetail(context);
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
                case "get-order-assignments":
                    RequireAuth(context);
                    HandleGetOrderAssignments(context);
                    break;
                case "save-order-assignment":
                    RequireAuth(context);
                    HandleSaveOrderAssignment(context);
                    break;
                case "delete-order-assignment":
                    RequireAuth(context);
                    HandleDeleteOrderAssignment(context);
                    break;

                // --- ADMIN: FÁZE 3 – SKLAD MATERIÁLU, PŘÍJEM & VÝDEJ ---
                case "get-order-materials":
                    RequireAuth(context);
                    HandleGetOrderMaterials(context);
                    break;
                case "save-order-material":
                    RequireAuth(context);
                    HandleSaveOrderMaterial(context);
                    break;
                case "delete-order-material":
                    RequireAuth(context);
                    HandleDeleteOrderMaterial(context);
                    break;
                case "get-material-dispatches":
                    RequireAuth(context);
                    HandleGetMaterialDispatches(context);
                    break;
                case "save-material-dispatch":
                    RequireAuth(context);
                    HandleSaveMaterialDispatch(context);
                    break;
                case "delete-material-dispatch":
                    RequireAuth(context);
                    HandleDeleteMaterialDispatch(context);
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
                case "delete-document":
                    RequireAuth(context);
                    HandleDeleteDocument(context);
                    break;
                case "get-document-file":
                    RequireAuth(context);
                    HandleGetDocumentFile(context);
                    break;
                case "upload-payslips-batch":
                    RequireAuth(context);
                    HandleUploadPayslipsBatch(context);
                    break;
                case "save-video":
                    RequireAuth(context);
                    HandleSaveVideo(context);
                    break;
                case "delete-video":
                    RequireAuth(context);
                    HandleDeleteVideo(context);
                    break;
                case "get-video-views":
                    RequireAuth(context);
                    HandleGetVideoViews(context);
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

        string matchedUser = null;
        string matchedName = null;

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureAdminUsers(conn);

            // 1. Zkontroluj přihlášení jménem a heslem (nebo jménem a PINem)
            using (var cmd = new SqlCommand("SELECT Username, FullName, PasswordHash, PinCode FROM [Kipacky].[kipa_AdminUsers] WHERE LOWER(Username) = LOWER(@u)", conn))
            {
                cmd.Parameters.AddWithValue("@u", user);
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        string dbPass = reader.GetString(2);
                        string dbPin = reader.IsDBNull(3) ? "" : reader.GetString(3);
                        if (pass == dbPass || pass == dbPin)
                        {
                            matchedUser = reader.GetString(0);
                            matchedName = reader.GetString(1);
                        }
                    }
                }
            }

            // Fallback na výchozí admin účty, pokud by v DB chyběly
            if (matchedUser == null)
            {
                if (user == ADMIN_USER && (pass == ADMIN_PASS || pass == "1452"))
                {
                    matchedUser = ADMIN_USER;
                    matchedName = "Admin (Marta)";
                }
                else if (user.ToLower() == "lordkikin" && (pass == "remlute4" || pass == "1408"))
                {
                    matchedUser = "lordkikin";
                    matchedName = "Admin (Ján)";
                }
            }
        }

        if (matchedUser != null)
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
                { "username", matchedName ?? matchedUser },
                { "token", token }
            });
        }
        else
        {
            SendError(context, 401, "Nesprávné přihlašovací jméno nebo heslo.");
        }
    }

    private void HandleAdminPinLogin(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string pin = data.ContainsKey("pin") ? Convert.ToString(data["pin"]) : (data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]) : "");

        if (string.IsNullOrWhiteSpace(pin))
        {
            SendError(context, 400, "Zadejte PIN.");
            return;
        }

        string matchedUser = null;
        string matchedName = null;

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureAdminUsers(conn);

            using (var cmd = new SqlCommand("SELECT Username, FullName FROM [Kipacky].[kipa_AdminUsers] WHERE PinCode = @p", conn))
            {
                cmd.Parameters.AddWithValue("@p", pin);
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        matchedUser = reader.GetString(0);
                        matchedName = reader.GetString(1);
                    }
                }
            }

            // Bezpečnostní záložní fallback pro 1452 a 1408
            if (matchedUser == null)
            {
                if (pin == "1452") { matchedUser = "admin"; matchedName = "Admin (Marta)"; }
                else if (pin == "1408") { matchedUser = "lordkikin"; matchedName = "Admin (Ján)"; }
            }
        }

        if (matchedUser != null)
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
                { "username", matchedName ?? matchedUser },
                { "token", token }
            });
        }
        else
        {
            SendError(context, 401, "Neplatný administrátorský Master PIN.");
        }
    }

    private void EnsureAdminUsers(SqlConnection conn)
    {
        try
        {
            string sql = @"
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kipa_AdminUsers' AND schema_id = SCHEMA_ID('Kipacky'))
BEGIN
    CREATE TABLE [Kipacky].[kipa_AdminUsers] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Username] NVARCHAR(50) NOT NULL UNIQUE,
        [FullName] NVARCHAR(100) NOT NULL,
        [PasswordHash] NVARCHAR(200) NOT NULL,
        [PinCode] NVARCHAR(10) NULL,
        [Role] NVARCHAR(50) NOT NULL DEFAULT 'Administrator'
    );
END

IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_AdminUsers] WHERE LOWER(Username) = 'admin')
BEGIN
    INSERT INTO [Kipacky].[kipa_AdminUsers] (Username, FullName, PasswordHash, PinCode, Role)
    VALUES ('admin', 'Admin (Marta)', 'Kipacky2026!', '1452', 'Administrator');
END
ELSE
BEGIN
    UPDATE [Kipacky].[kipa_AdminUsers] SET PinCode = '1452' WHERE LOWER(Username) = 'admin' AND (PinCode IS NULL OR PinCode = '');
END

IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_AdminUsers] WHERE LOWER(Username) = 'lordkikin')
BEGIN
    INSERT INTO [Kipacky].[kipa_AdminUsers] (Username, FullName, PasswordHash, PinCode, Role)
    VALUES ('lordkikin', 'Admin (Ján)', 'remlute4', '1408', 'Administrator');
END
ELSE
BEGIN
    UPDATE [Kipacky].[kipa_AdminUsers] SET PinCode = '1408' WHERE LOWER(Username) = 'lordkikin' AND (PinCode IS NULL OR PinCode = '');
END";
            using (var cmd = new SqlCommand(sql, conn))
            {
                cmd.ExecuteNonQuery();
            }

            EnsureSchemaMigrations(conn);
        }
        catch { }
    }

    private void EnsureSchemaMigrations(SqlConnection conn)
    {
        try
        {
            string sql = @"
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'EmployeeNumber')
    ALTER TABLE [Kipacky].[kipa_Employees] ADD [EmployeeNumber] NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'Street')
    ALTER TABLE [Kipacky].[kipa_Employees] ADD [Street] NVARCHAR(200) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'City')
    ALTER TABLE [Kipacky].[kipa_Employees] ADD [City] NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'ContractHoursLimit')
    ALTER TABLE [Kipacky].[kipa_Employees] ADD [ContractHoursLimit] INT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'EmploymentStatus')
    ALTER TABLE [Kipacky].[kipa_Employees] ADD [EmploymentStatus] NVARCHAR(50) NOT NULL DEFAULT 'Active';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'DefaultWorkplace')
    ALTER TABLE [Kipacky].[kipa_Employees] ADD [DefaultWorkplace] NVARCHAR(50) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'PhotoUrl')
    ALTER TABLE [Kipacky].[kipa_Employees] ADD [PhotoUrl] NVARCHAR(MAX) NULL;

-- FÁZE 2: Rozšíření zakázek (Orders)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'MinTargetPieces')
    ALTER TABLE [Kipacky].[kipa_Orders] ADD [MinTargetPieces] INT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'MaxTargetPieces')
    ALTER TABLE [Kipacky].[kipa_Orders] ADD [MaxTargetPieces] INT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'PackagingDesc')
    ALTER TABLE [Kipacky].[kipa_Orders] ADD [PackagingDesc] NVARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'LogisticsDesc')
    ALTER TABLE [Kipacky].[kipa_Orders] ADD [LogisticsDesc] NVARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'CoordinatorContact')
    ALTER TABLE [Kipacky].[kipa_Orders] ADD [CoordinatorContact] NVARCHAR(200) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'CustomerContact')
    ALTER TABLE [Kipacky].[kipa_Orders] ADD [CustomerContact] NVARCHAR(200) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'WorkplaceMode')
    ALTER TABLE [Kipacky].[kipa_Orders] ADD [WorkplaceMode] NVARCHAR(50) NULL DEFAULT 'Na dílně';

-- FÁZE 2: Rozšíření operací (Operations - Pomocné práce vs Finální fáze)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Operations]') AND name = 'OperationStage')
    ALTER TABLE [Kipacky].[kipa_Operations] ADD [OperationStage] NVARCHAR(50) NOT NULL DEFAULT 'Final';

-- FÁZE 2: Tabulka pro přiřazení brigádníků na zakázku (OrderAssignments)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kipa_OrderAssignments' AND schema_id = SCHEMA_ID('Kipacky'))
BEGIN
    CREATE TABLE [Kipacky].[kipa_OrderAssignments] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [OrderId] INT NOT NULL,
        [EmployeeId] INT NOT NULL,
        [OperationId] INT NULL,
        [AssignedPieces] INT NOT NULL DEFAULT 0,
        [AssignedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [DeadlineDate] DATE NULL,
        [Workplace] NVARCHAR(50) NOT NULL DEFAULT 'Na dílně',
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
        [Note] NVARCHAR(MAX) NULL
    );
END

-- FÁZE 3: Rozšíření dokumentů (cílený zaměstnanec a typ dokumentu)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Documents]') AND name = 'TargetEmployeeId')
    ALTER TABLE [Kipacky].[kipa_Documents] ADD [TargetEmployeeId] INT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Documents]') AND name = 'DocumentType')
    ALTER TABLE [Kipacky].[kipa_Documents] ADD [DocumentType] NVARCHAR(50) NOT NULL DEFAULT 'General';

-- FÁZE 3: Sklad materiálu k zakázkám (OrderMaterials)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kipa_OrderMaterials' AND schema_id = SCHEMA_ID('Kipacky'))
BEGIN
    CREATE TABLE [Kipacky].[kipa_OrderMaterials] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [OrderId] INT NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [DeliveredQuantity] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Unit] NVARCHAR(50) NOT NULL DEFAULT 'ks',
        [ConsumptionPerPiece] DECIMAL(18,4) NOT NULL DEFAULT 1,
        [MatchesTargetPieces] BIT NOT NULL DEFAULT 1,
        [Note] NVARCHAR(MAX) NULL,
        [ReceivedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [CreatedBy] NVARCHAR(100) NULL
    );
END

-- FÁZE 3: Výdej materiálu brigádníkům (MaterialDispatches)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kipa_MaterialDispatches' AND schema_id = SCHEMA_ID('Kipacky'))
BEGIN
    CREATE TABLE [Kipacky].[kipa_MaterialDispatches] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [OrderId] INT NOT NULL,
        [EmployeeId] INT NOT NULL,
        [PlannedPieces] INT NOT NULL DEFAULT 0,
        [DispatchedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [DispatchedBy] NVARCHAR(100) NULL,
        [DocumentId] INT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Issued',
        [Note] NVARCHAR(MAX) NULL
    );
END

-- FÁZE 3: Položky výdejky materiálu (MaterialDispatchItems)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kipa_MaterialDispatchItems' AND schema_id = SCHEMA_ID('Kipacky'))
BEGIN
    CREATE TABLE [Kipacky].[kipa_MaterialDispatchItems] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [DispatchId] INT NOT NULL,
        [MaterialId] INT NOT NULL,
        [Quantity] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [ReturnedQuantity] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Unit] NVARCHAR(50) NOT NULL DEFAULT 'ks'
    );
END

-- FÁZE 4: Zmetkové protokoly
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_ProductionLogs]') AND name = 'DefectProtocolDocId')
    ALTER TABLE [Kipacky].[kipa_ProductionLogs] ADD [DefectProtocolDocId] INT NULL;

-- FÁZE 5: Nástěnka a Výplatní pásky
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Documents]') AND name = 'PeriodYear')
    ALTER TABLE [Kipacky].[kipa_Documents] ADD [PeriodYear] INT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Documents]') AND name = 'PeriodMonth')
    ALTER TABLE [Kipacky].[kipa_Documents] ADD [PeriodMonth] INT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Documents]') AND name = 'FileName')
    ALTER TABLE [Kipacky].[kipa_Documents] ADD [FileName] NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Documents]') AND name = 'FileBase64')
    ALTER TABLE [Kipacky].[kipa_Documents] ADD [FileBase64] NVARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Documents]') AND name = 'RequiresSignature')
    ALTER TABLE [Kipacky].[kipa_Documents] ADD [RequiresSignature] BIT NOT NULL DEFAULT 1;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Documents]') AND name = 'Priority')
    ALTER TABLE [Kipacky].[kipa_Documents] ADD [Priority] NVARCHAR(20) NOT NULL DEFAULT 'Normal';

-- FÁZE 6: Sekce Videa (BOZP a školící videa)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kipa_Videos' AND schema_id = SCHEMA_ID('Kipacky'))
BEGIN
    CREATE TABLE [Kipacky].[kipa_Videos] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Title] NVARCHAR(300) NOT NULL,
        [Url] NVARCHAR(500) NOT NULL,
        [VideoId] NVARCHAR(50) NULL,
        [Category] NVARCHAR(100) NOT NULL DEFAULT N'BOZP a bezpečnost práce',
        [Description] NVARCHAR(MAX) NULL,
        [Author] NVARCHAR(200) NULL,
        [ThumbnailUrl] NVARCHAR(500) NULL,
        [Duration] NVARCHAR(50) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE()
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kipa_VideoViews' AND schema_id = SCHEMA_ID('Kipacky'))
BEGIN
    CREATE TABLE [Kipacky].[kipa_VideoViews] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [VideoId] INT NOT NULL,
        [EmployeeId] INT NOT NULL,
        [ViewedAt] DATETIME NOT NULL DEFAULT GETDATE()
    );
END

IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_Videos] WHERE [VideoId] = '7TNIb7IXXJY')
BEGIN
    INSERT INTO [Kipacky].[kipa_Videos] ([Title], [Url], [VideoId], [Category], [Description], [Author], [ThumbnailUrl], [Duration], [IsActive])
    VALUES (
        N'Vizuální průvodce 101 2005 Sb',
        N'https://www.youtube.com/watch?v=7TNIb7IXXJY',
        N'7TNIb7IXXJY',
        N'BOZP a bezpečnost práce',
        N'Vizuální průvodce nařízením vlády č. 101/2005 Sb., o podrobnějších požadavcích na pracoviště a pracovní prostředí.',
        N'Jan Kytýr',
        N'https://i.ytimg.com/vi/7TNIb7IXXJY/hqdefault.jpg',
        N'',
        1
    );
END

IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_Videos] WHERE [VideoId] = 'v34ZPNiWroM')
BEGIN
    INSERT INTO [Kipacky].[kipa_Videos] ([Title], [Url], [VideoId], [Category], [Description], [Author], [ThumbnailUrl], [Duration], [IsActive])
    VALUES (
        N'Rizika výroby papírových obalů',
        N'https://www.youtube.com/watch?v=v34ZPNiWroM',
        N'v34ZPNiWroM',
        N'BOZP a bezpečnost práce',
        N'Bezpečnost práce, prevence úrazů a rizika při výrobě a kompletaci papírových obalů.',
        N'Jan Kytýr',
        N'https://i.ytimg.com/vi/v34ZPNiWroM/hqdefault.jpg',
        N'',
        1
    );
END

IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_Videos] WHERE [VideoId] = 'vc1uD09xaC8')
BEGIN
    INSERT INTO [Kipacky].[kipa_Videos] ([Title], [Url], [VideoId], [Category], [Description], [Author], [ThumbnailUrl], [Duration], [IsActive])
    VALUES (
        N'Přísná pravidla, která formují vaše pracoviště',
        N'https://youtube.com/shorts/vc1uD09xaC8',
        N'vc1uD09xaC8',
        N'BOZP a bezpečnost práce',
        N'Přehled přísných pravidel BOZP ve skladu a na pracovišti, která zajišťují bezpečnost při práci.',
        N'Jan Kytýr',
        N'https://i.ytimg.com/vi/vc1uD09xaC8/hqdefault.jpg',
        N'',
        1
    );
END
";
            using (var cmd = new SqlCommand(sql, conn))
            {
                cmd.ExecuteNonQuery();
            }
        }
        catch { }
    }

    private void HandleGetAdminUsers(HttpContext context)
    {
        var list = new List<Dictionary<string, object>>();
        try
        {
            using (var conn = new SqlConnection(CONN_STR))
            {
                conn.Open();
                EnsureAdminUsers(conn);

                using (var cmd = new SqlCommand("SELECT Id, Username, FullName, PinCode, Role FROM [Kipacky].[kipa_AdminUsers] ORDER BY Id ASC", conn))
                {
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            list.Add(new Dictionary<string, object>
                            {
                                { "id", reader.GetInt32(0) },
                                { "username", reader.GetString(1) },
                                { "fullName", reader.GetString(2) },
                                { "pinCode", reader.IsDBNull(3) ? "" : reader.GetString(3) },
                                { "role", reader.GetString(4) }
                            });
                        }
                    }
                }
            }
        }
        catch
        {
            list.Add(new Dictionary<string, object> { { "id", 1 }, { "username", "admin" }, { "fullName", "Admin (Marta)" }, { "pinCode", "1452" }, { "role", "Administrator" } });
            list.Add(new Dictionary<string, object> { { "id", 2 }, { "username", "lordkikin" }, { "fullName", "Admin (Ján)" }, { "pinCode", "1408" }, { "role", "Administrator" } });
        }
        SendJson(context, list);
    }

    private void HandleChangeAdminPin(HttpContext context)
    {
        var data = ReadJsonBody(context);
        string username = data.ContainsKey("username") ? Convert.ToString(data["username"]) : "";
        string newPin = data.ContainsKey("newPin") ? Convert.ToString(data["newPin"]) : "";

        if (string.IsNullOrWhiteSpace(newPin) || newPin.Length != 4)
        {
            SendError(context, 400, "Nový PIN musí mít přesně 4 číslice.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureAdminUsers(conn);

            // Ověřit, zda tento PIN již nepoužívá jiný admin
            using (var cmdCheck = new SqlCommand("SELECT Username FROM [Kipacky].[kipa_AdminUsers] WHERE PinCode = @p AND LOWER(Username) != LOWER(@u)", conn))
            {
                cmdCheck.Parameters.AddWithValue("@p", newPin);
                cmdCheck.Parameters.AddWithValue("@u", username);
                var existing = cmdCheck.ExecuteScalar();
                if (existing != null)
                {
                    SendError(context, 400, "Tento PIN již používá jiný administrátor (" + existing.ToString() + "). Zvolte jiný.");
                    return;
                }
            }

            using (var cmd = new SqlCommand("UPDATE [Kipacky].[kipa_AdminUsers] SET PinCode = @p WHERE LOWER(Username) = LOWER(@u)", conn))
            {
                cmd.Parameters.AddWithValue("@p", newPin);
                cmd.Parameters.AddWithValue("@u", username);
                int rows = cmd.ExecuteNonQuery();
                if (rows == 0)
                {
                    SendError(context, 404, "Administrátor nenalezen.");
                    return;
                }
            }
        }

        SendJson(context, new Dictionary<string, object>
        {
            { "success", true },
            { "message", "PIN administrátora byl úspěšně změněn." }
        });
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
            { "username", auth ? "admin" : null }
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
            EnsureSchemaMigrations(conn);
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
SELECT o.Id, o.Name, ISNULL(o.TotalPiecesTarget, ISNULL(o.TargetPieces, 0)) AS TargetPcs, ISNULL(o.EndDate, o.Deadline) AS EndD, o.Description,
       ISNULL((SELECT SUM(ISNULL(p.ValidatedPieces, p.SubmittedPieces)) FROM [Kipacky].[kipa_ProductionLogs] p WHERE p.OrderId = o.Id AND p.Status = 'Approved'), 0) AS CompletedPieces,
       o.StartDate, ISNULL(o.TargetPricePerPiece, 0) AS TargetPrice
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
                        DateTime? endD = reader.IsDBNull(3) ? (DateTime?)null : reader.GetDateTime(3);
                        DateTime? startD = reader.IsDBNull(6) ? (DateTime?)null : reader.GetDateTime(6);
                        decimal targetPrice = reader.GetDecimal(7);

                        activeOrders.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "name", reader.GetString(1) },
                            { "targetPieces", targetPcs },
                            { "totalPiecesTarget", targetPcs },
                            { "deadline", endD.HasValue ? endD.Value.ToString("yyyy-MM-dd") : null },
                            { "endDate", endD.HasValue ? endD.Value.ToString("yyyy-MM-dd") : null },
                            { "startDate", startD.HasValue ? startD.Value.ToString("yyyy-MM-dd") : null },
                            { "targetPricePerPiece", Convert.ToDouble(targetPrice) },
                            { "description", reader.IsDBNull(4) ? "" : reader.GetString(4) },
                            { "completedPieces", compPcs },
                            { "remainingPieces", (targetPcs > 0 && targetPcs > compPcs) ? (targetPcs - compPcs) : 0 },
                            { "percentDone", (targetPcs > 0) ? Math.Min(100, Math.Round(((double)compPcs / targetPcs) * 100, 1)) : 0 }
                        });
                    }
                }
            }

            // 2. Aktivní operace (Fáze 2 & 2.1 – svázané s zakázkou přes OrderId)
            var activeOperations = new List<Dictionary<string, object>>();
            using (var cmd = new SqlCommand("SELECT Id, Name, NormPerHour, RatePerPiece, OrderId FROM [Kipacky].[kipa_Operations] WHERE IsActive = 1 ORDER BY Name ASC", conn))
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
                            { "ratePerPiece", Convert.ToDouble(reader.GetDecimal(3)) },
                            { "orderId", reader.IsDBNull(4) ? (int?)null : reader.GetInt32(4) }
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
WHERE d.IsActive = 1 AND ISNULL(d.DocumentType, 'General') != 'Payslip' AND (d.TargetEmployeeId IS NULL OR d.TargetEmployeeId = @empId)
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

            // 6. Videa (BOZP a školící videa)
            var videosList = new List<Dictionary<string, object>>();
            string videoSql = @"
SELECT v.Id, v.Title, v.Url, ISNULL(v.VideoId, ''), ISNULL(v.Category, N'BOZP a bezpečnost práce'),
       ISNULL(v.Description, ''), ISNULL(v.Author, ''), ISNULL(v.ThumbnailUrl, ''), ISNULL(v.Duration, ''),
       v.IsActive, v.CreatedAt,
       (SELECT MAX(vw.ViewedAt) FROM [Kipacky].[kipa_VideoViews] vw WHERE vw.VideoId = v.Id AND vw.EmployeeId = @empId) AS LastViewedAt
FROM [Kipacky].[kipa_Videos] v
WHERE v.IsActive = 1
ORDER BY v.Id ASC";
            using (var cmd = new SqlCommand(videoSql, conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        DateTime? lastViewed = reader.IsDBNull(11) ? (DateTime?)null : reader.GetDateTime(11);
                        string vidId = reader.GetString(3);
                        string thumb = reader.GetString(7);
                        if (string.IsNullOrEmpty(thumb) && !string.IsNullOrEmpty(vidId))
                        {
                            thumb = "https://i.ytimg.com/vi/" + vidId + "/hqdefault.jpg";
                        }
                        videosList.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "title", reader.GetString(1) },
                            { "url", reader.GetString(2) },
                            { "videoId", vidId },
                            { "category", reader.GetString(4) },
                            { "description", reader.GetString(5) },
                            { "author", reader.GetString(6) },
                            { "thumbnailUrl", thumb },
                            { "duration", reader.GetString(8) },
                            { "isActive", reader.GetBoolean(9) },
                            { "createdAt", reader.GetDateTime(10).ToString("s") },
                            { "lastViewedAt", lastViewed.HasValue ? lastViewed.Value.ToString("s") : null },
                            { "isViewed", lastViewed.HasValue }
                        });
                    }
                }
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
                { "todaySubmittedPieces", todaySubmittedPieces },
                { "videos", videosList }
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
            EnsureSchemaMigrations(conn);
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
            EnsureSchemaMigrations(conn);
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
            EnsureSchemaMigrations(conn);
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
            EnsureSchemaMigrations(conn);
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
            EnsureSchemaMigrations(conn);
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
            EnsureSchemaMigrations(conn);
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
            EnsureSchemaMigrations(conn);
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

            // 2b. Celoroční normočas pro DPP limit (300h)
            double ytdNormHours = 0;
            using (var cmd = new SqlCommand(@"
SELECT ISNULL(SUM(CASE WHEN op.NormPerHour > 0 THEN CAST(ISNULL(p.ValidatedPieces, p.SubmittedPieces) AS FLOAT) / op.NormPerHour ELSE 0 END), 0)
FROM [Kipacky].[kipa_ProductionLogs] p
JOIN [Kipacky].[kipa_Operations] op ON p.OperationId = op.Id
WHERE p.EmployeeId = @empId AND p.[Date] >= @yStart AND p.[Date] < @yEnd AND p.[Status] = 'Approved'", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                cmd.Parameters.AddWithValue("@yStart", yearStart);
                cmd.Parameters.AddWithValue("@yEnd", yearEnd);
                ytdNormHours = Convert.ToDouble(cmd.ExecuteScalar());
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
            double totalNormHours = 0;

            foreach (var p in empProd)
            {
                if (Convert.ToString(p["status"]) == "Approved")
                {
                    int val = p["validated"] != null ? Convert.ToInt32(p["validated"]) : Convert.ToInt32(p["submitted"]);
                    int n = Convert.ToInt32(p["norm"]);
                    if (n > 0) totalNormHours += ((double)val / n);
                }
            }

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
                { "totalNormHours", Math.Round(totalNormHours, 2) },
                { "totalProductiveHours", Math.Round(totalNormHours, 2) },
                { "totalEarnedCzk", Math.Round(totalEarnedCzk, 2) },
                { "totalApprovedPieces", totalApprovedPieces },
                { "yearToDateNetHours", Math.Round(ytdNetHours, 2) },
                { "yearToDateNormHours", Math.Round(ytdNormHours, 2) },
                { "remainingDppHours", Math.Max(0, 300 - Math.Round(ytdNormHours, 2)) },
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
            EnsureSchemaMigrations(conn);

            string sql = @"
SELECT Id, FullName, PinCode, ContractType, IsActive, CreatedAt, Phone, Email, BankAccount, 
       PersonalDataConfirmedAt, ContractStartDate, ContractEndDate, ISNULL(SelfScheduled, 0) AS SelfScheduled,
       EmployeeNumber, Street, City, ContractHoursLimit, ISNULL(EmploymentStatus, 'Active') AS EmploymentStatus,
       DefaultWorkplace, PhotoUrl
FROM [Kipacky].[kipa_Employees] 
ORDER BY IsActive DESC, FullName ASC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        DateTime? confAt = reader.IsDBNull(9) ? (DateTime?)null : reader.GetDateTime(9);
                        DateTime? cStart = reader.IsDBNull(10) ? (DateTime?)null : reader.GetDateTime(10);
                        DateTime? cEnd = reader.IsDBNull(11) ? (DateTime?)null : reader.GetDateTime(11);
                        bool selfScheduled = reader.GetBoolean(12);
                        string empNum = reader.IsDBNull(13) ? "" : reader.GetString(13);
                        string street = reader.IsDBNull(14) ? "" : reader.GetString(14);
                        string city = reader.IsDBNull(15) ? "" : reader.GetString(15);
                        int? limitHours = reader.IsDBNull(16) ? (int?)null : reader.GetInt32(16);
                        string empStatus = reader.IsDBNull(17) ? "Active" : reader.GetString(17);
                        string workplace = reader.IsDBNull(18) ? "" : reader.GetString(18);
                        string photoUrl = reader.IsDBNull(19) ? "" : reader.GetString(19);

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
                            { "personalDataConfirmedAt", confAt.HasValue ? confAt.Value.ToString("s") : null },
                            { "contractStartDate", cStart.HasValue ? cStart.Value.ToString("yyyy-MM-dd") : null },
                            { "contractEndDate", cEnd.HasValue ? cEnd.Value.ToString("yyyy-MM-dd") : null },
                            { "selfScheduled", selfScheduled },
                            { "employeeNumber", empNum },
                            { "street", street },
                            { "city", city },
                            { "contractHoursLimit", limitHours },
                            { "employmentStatus", empStatus },
                            { "defaultWorkplace", workplace },
                            { "photoUrl", photoUrl }
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
        string contract = data.ContainsKey("contractType") ? Convert.ToString(data["contractType"]).Trim() : "DPP (300 hodin)";
        string phone = data.ContainsKey("phone") ? Convert.ToString(data["phone"]).Trim() : "";
        string email = data.ContainsKey("email") ? Convert.ToString(data["email"]).Trim() : "";
        string bankAccount = data.ContainsKey("bankAccount") ? Convert.ToString(data["bankAccount"]).Trim() : "";
        bool isActive = data.ContainsKey("isActive") ? Convert.ToBoolean(data["isActive"]) : true;
        string csStr = data.ContainsKey("contractStartDate") ? Convert.ToString(data["contractStartDate"]) : null;
        DateTime? contractStartDate = (!string.IsNullOrEmpty(csStr)) ? (DateTime?)DateTime.Parse(csStr) : null;
        string ceStr = data.ContainsKey("contractEndDate") ? Convert.ToString(data["contractEndDate"]) : null;
        DateTime? contractEndDate = (!string.IsNullOrEmpty(ceStr)) ? (DateTime?)DateTime.Parse(ceStr) : null;
        bool selfScheduled = data.ContainsKey("selfScheduled") && Convert.ToBoolean(data["selfScheduled"]);

        string employeeNumber = data.ContainsKey("employeeNumber") ? Convert.ToString(data["employeeNumber"]).Trim() : "";
        string street = data.ContainsKey("street") ? Convert.ToString(data["street"]).Trim() : "";
        string city = data.ContainsKey("city") ? Convert.ToString(data["city"]).Trim() : "";
        int? contractHoursLimit = data.ContainsKey("contractHoursLimit") && data["contractHoursLimit"] != null ? (int?)Convert.ToInt32(data["contractHoursLimit"]) : null;
        string employmentStatus = data.ContainsKey("employmentStatus") ? Convert.ToString(data["employmentStatus"]).Trim() : "Active";
        string defaultWorkplace = data.ContainsKey("defaultWorkplace") ? Convert.ToString(data["defaultWorkplace"]).Trim() : "Na dílně";
        string photoUrl = data.ContainsKey("photoUrl") ? Convert.ToString(data["photoUrl"]) : "";

        if (string.IsNullOrWhiteSpace(name)) { SendError(context, 400, "Jméno je povinné."); return; }
        if (pin.Length != 4) { SendError(context, 400, "PIN musí mít přesně 4 číslice."); return; }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            using (var chk = new SqlCommand("SELECT TOP 1 FullName, IsActive FROM [Kipacky].[kipa_Employees] WHERE PinCode = @pin", conn))
            {
                chk.Parameters.AddWithValue("@pin", pin);
                using (var reader = chk.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        string existingName = reader.GetString(0);
                        bool isAct = reader.GetBoolean(1);
                        string statusText = isAct ? "aktivní" : "neaktivní";
                        SendError(context, 400, "Tento PIN (" + pin + ") již má přiřazen jiný " + statusText + " zaměstnanec (" + existingName + "). PIN musí být unikátní.");
                        return;
                    }
                }
            }

            using (var cmd = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_Employees] 
(FullName, PinCode, ContractType, IsActive, CreatedAt, Phone, Email, BankAccount, ContractStartDate, ContractEndDate, SelfScheduled, EmployeeNumber, Street, City, ContractHoursLimit, EmploymentStatus, DefaultWorkplace, PhotoUrl)
OUTPUT INSERTED.Id
VALUES 
(@n, @p, @c, @a, GETUTCDATE(), @ph, @em, @ba, @cs, @ce, @ss, @en, @st, @ct, @chl, @es, @dw, @pu)", conn))
            {
                cmd.Parameters.AddWithValue("@n", name);
                cmd.Parameters.AddWithValue("@p", pin);
                cmd.Parameters.AddWithValue("@c", string.IsNullOrEmpty(contract) ? "DPP (300 hodin)" : contract);
                cmd.Parameters.AddWithValue("@a", isActive);
                cmd.Parameters.AddWithValue("@ph", string.IsNullOrEmpty(phone) ? (object)DBNull.Value : phone);
                cmd.Parameters.AddWithValue("@em", string.IsNullOrEmpty(email) ? (object)DBNull.Value : email);
                cmd.Parameters.AddWithValue("@ba", string.IsNullOrEmpty(bankAccount) ? (object)DBNull.Value : bankAccount);
                cmd.Parameters.AddWithValue("@cs", contractStartDate.HasValue ? (object)contractStartDate.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@ce", contractEndDate.HasValue ? (object)contractEndDate.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@ss", selfScheduled);
                cmd.Parameters.AddWithValue("@en", string.IsNullOrEmpty(employeeNumber) ? (object)DBNull.Value : employeeNumber);
                cmd.Parameters.AddWithValue("@st", string.IsNullOrEmpty(street) ? (object)DBNull.Value : street);
                cmd.Parameters.AddWithValue("@ct", string.IsNullOrEmpty(city) ? (object)DBNull.Value : city);
                cmd.Parameters.AddWithValue("@chl", contractHoursLimit.HasValue ? (object)contractHoursLimit.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@es", string.IsNullOrEmpty(employmentStatus) ? "Active" : employmentStatus);
                cmd.Parameters.AddWithValue("@dw", string.IsNullOrEmpty(defaultWorkplace) ? (object)DBNull.Value : defaultWorkplace);
                cmd.Parameters.AddWithValue("@pu", string.IsNullOrEmpty(photoUrl) ? (object)DBNull.Value : photoUrl);

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
                    { "bankAccount", bankAccount },
                    { "contractStartDate", contractStartDate.HasValue ? contractStartDate.Value.ToString("yyyy-MM-dd") : null },
                    { "contractEndDate", contractEndDate.HasValue ? contractEndDate.Value.ToString("yyyy-MM-dd") : null },
                    { "selfScheduled", selfScheduled },
                    { "employeeNumber", employeeNumber },
                    { "street", street },
                    { "city", city },
                    { "contractHoursLimit", contractHoursLimit },
                    { "employmentStatus", employmentStatus },
                    { "defaultWorkplace", defaultWorkplace },
                    { "photoUrl", photoUrl }
                });
            }
        }
    }

    private void HandleUpdateEmployee(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = Convert.ToInt32(context.Request.QueryString["id"] ?? (data.ContainsKey("id") ? data["id"] : 0));
        if (id <= 0) { SendError(context, 400, "Neplatné ID zaměstnance."); return; }

        string name = data.ContainsKey("fullName") ? Convert.ToString(data["fullName"]).Trim() : null;
        string pin = data.ContainsKey("pinCode") ? Convert.ToString(data["pinCode"]).Trim() : null;
        string contract = data.ContainsKey("contractType") ? Convert.ToString(data["contractType"]).Trim() : null;
        string phone = data.ContainsKey("phone") ? Convert.ToString(data["phone"]).Trim() : null;
        string email = data.ContainsKey("email") ? Convert.ToString(data["email"]).Trim() : null;
        string bankAccount = data.ContainsKey("bankAccount") ? Convert.ToString(data["bankAccount"]).Trim() : null;
        bool isActive = data.ContainsKey("isActive") ? Convert.ToBoolean(data["isActive"]) : true;
        string csStr = data.ContainsKey("contractStartDate") ? Convert.ToString(data["contractStartDate"]) : null;
        DateTime? contractStartDate = (!string.IsNullOrEmpty(csStr)) ? (DateTime?)DateTime.Parse(csStr) : null;
        string ceStr = data.ContainsKey("contractEndDate") ? Convert.ToString(data["contractEndDate"]) : null;
        DateTime? contractEndDate = (!string.IsNullOrEmpty(ceStr)) ? (DateTime?)DateTime.Parse(ceStr) : null;
        bool selfScheduled = data.ContainsKey("selfScheduled") && Convert.ToBoolean(data["selfScheduled"]);

        string employeeNumber = data.ContainsKey("employeeNumber") ? Convert.ToString(data["employeeNumber"]).Trim() : null;
        string street = data.ContainsKey("street") ? Convert.ToString(data["street"]).Trim() : null;
        string city = data.ContainsKey("city") ? Convert.ToString(data["city"]).Trim() : null;
        int? contractHoursLimit = data.ContainsKey("contractHoursLimit") && data["contractHoursLimit"] != null ? (int?)Convert.ToInt32(data["contractHoursLimit"]) : null;
        string employmentStatus = data.ContainsKey("employmentStatus") ? Convert.ToString(data["employmentStatus"]).Trim() : null;
        string defaultWorkplace = data.ContainsKey("defaultWorkplace") ? Convert.ToString(data["defaultWorkplace"]).Trim() : null;
        string photoUrl = data.ContainsKey("photoUrl") ? Convert.ToString(data["photoUrl"]) : null;

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            if (!string.IsNullOrEmpty(pin))
            {
                if (pin.Length != 4) { SendError(context, 400, "PIN musí mít přesně 4 číslice."); return; }

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
                            string statusText = isAct ? "aktivní" : "neaktivní";
                            SendError(context, 400, "Tento PIN (" + pin + ") již má přiřazen jiný " + statusText + " zaměstnanec (" + existingName + "). PIN musí být unikátní.");
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
    BankAccount = ISNULL(@ba, BankAccount),
    ContractStartDate = @cs,
    ContractEndDate = @ce,
    SelfScheduled = @ss,
    EmployeeNumber = ISNULL(@en, EmployeeNumber),
    Street = ISNULL(@st, Street),
    City = ISNULL(@ct, City),
    ContractHoursLimit = ISNULL(@chl, ContractHoursLimit),
    EmploymentStatus = ISNULL(@es, EmploymentStatus),
    DefaultWorkplace = ISNULL(@dw, DefaultWorkplace),
    PhotoUrl = ISNULL(@pu, PhotoUrl)
WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@n", (object)name ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@p", (object)pin ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@c", (object)contract ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@a", isActive);
                cmd.Parameters.AddWithValue("@ph", (object)phone ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@em", (object)email ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ba", (object)bankAccount ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@cs", contractStartDate.HasValue ? (object)contractStartDate.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@ce", contractEndDate.HasValue ? (object)contractEndDate.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@ss", selfScheduled);
                cmd.Parameters.AddWithValue("@en", (object)employeeNumber ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@st", (object)street ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ct", (object)city ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@chl", contractHoursLimit.HasValue ? (object)contractHoursLimit.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@es", (object)employmentStatus ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@dw", (object)defaultWorkplace ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@pu", (object)photoUrl ?? DBNull.Value);
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
SELECT TOP 500 l.Id, l.EmployeeId, e.FullName, e.ContractType, l.Timestamp, l.EventType, l.IsManualEdit, l.Note, l.OriginalTimestamp, l.ModifiedByAdmin, l.ModifiedBy, l.ModifiedAt, l.ModifyReason, e.EmployeeNumber, e.PhotoUrl
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
                        string empNum = reader.IsDBNull(13) ? "" : reader.GetString(13);
                        string photo = reader.IsDBNull(14) ? "" : reader.GetString(14);

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
                            { "modifyReason", modReason },
                            { "employeeNumber", empNum },
                            { "photoUrl", photo }
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
            EnsureSchemaMigrations(conn);
            string sql = @"
SELECT o.Id, o.Name, o.IsActive, o.CreatedAt, 
       ISNULL(o.TotalPiecesTarget, ISNULL(o.TargetPieces, 0)) AS TargetPcs,
       ISNULL(o.EndDate, o.Deadline) AS EndD,
       o.Description,
       o.StartDate,
       ISNULL(o.TargetPricePerPiece, 0) AS TargetPrice,
       ISNULL((SELECT SUM(ISNULL(p.ValidatedPieces, p.SubmittedPieces)) FROM [Kipacky].[kipa_ProductionLogs] p WHERE p.OrderId = o.Id AND p.Status = 'Approved'), 0) AS CompletedPieces,
       o.MinTargetPieces, o.MaxTargetPieces, o.PackagingDesc, o.LogisticsDesc, o.CoordinatorContact, o.CustomerContact, o.WorkplaceMode
FROM [Kipacky].[kipa_Orders] o
ORDER BY o.IsActive DESC, o.Id DESC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        int targetPcs = reader.GetInt32(4);
                        int compPcs = Convert.ToInt32(reader.GetValue(9));
                        DateTime? endD = reader.IsDBNull(5) ? (DateTime?)null : reader.GetDateTime(5);
                        DateTime? startD = reader.IsDBNull(7) ? (DateTime?)null : reader.GetDateTime(7);
                        decimal targetPrice = reader.GetDecimal(8);
                        int? minPcs = reader.IsDBNull(10) ? (int?)null : reader.GetInt32(10);
                        int? maxPcs = reader.IsDBNull(11) ? (int?)null : reader.GetInt32(11);
                        string packDesc = reader.IsDBNull(12) ? "" : reader.GetString(12);
                        string logDesc = reader.IsDBNull(13) ? "" : reader.GetString(13);
                        string coordContact = reader.IsDBNull(14) ? "" : reader.GetString(14);
                        string custContact = reader.IsDBNull(15) ? "" : reader.GetString(15);
                        string workMode = reader.IsDBNull(16) ? "Na dílně" : reader.GetString(16);

                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "name", reader.GetString(1) },
                            { "isActive", reader.GetBoolean(2) },
                            { "createdAt", reader.GetDateTime(3).ToString("s") },
                            { "targetPieces", targetPcs },
                            { "totalPiecesTarget", targetPcs },
                            { "deadline", endD.HasValue ? endD.Value.ToString("yyyy-MM-dd") : null },
                            { "endDate", endD.HasValue ? endD.Value.ToString("yyyy-MM-dd") : null },
                            { "startDate", startD.HasValue ? startD.Value.ToString("yyyy-MM-dd") : null },
                            { "targetPricePerPiece", Convert.ToDouble(targetPrice) },
                            { "description", reader.IsDBNull(6) ? "" : reader.GetString(6) },
                            { "completedPieces", compPcs },
                            { "remainingPieces", (targetPcs > 0 && targetPcs > compPcs) ? (targetPcs - compPcs) : 0 },
                            { "percentDone", (targetPcs > 0) ? Math.Min(100, Math.Round(((double)compPcs / targetPcs) * 100, 1)) : 0 },
                            { "minTargetPieces", minPcs },
                            { "maxTargetPieces", maxPcs },
                            { "packagingDesc", packDesc },
                            { "logisticsDesc", logDesc },
                            { "coordinatorContact", coordContact },
                            { "customerContact", custContact },
                            { "workplaceMode", workMode }
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
        int targetPieces = data.ContainsKey("totalPiecesTarget") ? Convert.ToInt32(data["totalPiecesTarget"]) : (data.ContainsKey("targetPieces") ? Convert.ToInt32(data["targetPieces"]) : 0);
        string startStr = data.ContainsKey("startDate") ? Convert.ToString(data["startDate"]) : null;
        DateTime? startDate = (!string.IsNullOrEmpty(startStr)) ? (DateTime?)DateTime.Parse(startStr) : null;
        string endStr = data.ContainsKey("endDate") ? Convert.ToString(data["endDate"]) : (data.ContainsKey("deadline") ? Convert.ToString(data["deadline"]) : null);
        DateTime? endDate = (!string.IsNullOrEmpty(endStr)) ? (DateTime?)DateTime.Parse(endStr) : null;
        decimal targetPrice = data.ContainsKey("targetPricePerPiece") ? Convert.ToDecimal(data["targetPricePerPiece"], CultureInfo.InvariantCulture) : 0m;
        string description = data.ContainsKey("description") ? Convert.ToString(data["description"]).Trim() : "";
        bool isActive = data.ContainsKey("isActive") ? Convert.ToBoolean(data["isActive"]) : true;

        int? minTargetPieces = (data.ContainsKey("minTargetPieces") && data["minTargetPieces"] != null && !string.IsNullOrEmpty(Convert.ToString(data["minTargetPieces"]))) ? (int?)Convert.ToInt32(data["minTargetPieces"]) : null;
        int? maxTargetPieces = (data.ContainsKey("maxTargetPieces") && data["maxTargetPieces"] != null && !string.IsNullOrEmpty(Convert.ToString(data["maxTargetPieces"]))) ? (int?)Convert.ToInt32(data["maxTargetPieces"]) : null;
        string packagingDesc = data.ContainsKey("packagingDesc") ? Convert.ToString(data["packagingDesc"]).Trim() : "";
        string logisticsDesc = data.ContainsKey("logisticsDesc") ? Convert.ToString(data["logisticsDesc"]).Trim() : "";
        string coordinatorContact = data.ContainsKey("coordinatorContact") ? Convert.ToString(data["coordinatorContact"]).Trim() : "";
        string customerContact = data.ContainsKey("customerContact") ? Convert.ToString(data["customerContact"]).Trim() : "";
        string workplaceMode = data.ContainsKey("workplaceMode") ? Convert.ToString(data["workplaceMode"]).Trim() : "Na dílně";

        if (string.IsNullOrWhiteSpace(name))
        {
            SendError(context, 400, "Název zakázky je povinný.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            if (id > 0)
            {
                using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_Orders]
SET Name = @n, IsActive = @a, TargetPieces = @tp, TotalPiecesTarget = @tp, Deadline = @ed, EndDate = @ed, StartDate = @sd, TargetPricePerPiece = @tpr, Description = @ds,
    MinTargetPieces = @minP, MaxTargetPieces = @maxP, PackagingDesc = @packD, LogisticsDesc = @logD, CoordinatorContact = @coord, CustomerContact = @cust, WorkplaceMode = @wp
WHERE Id = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@n", name);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.Parameters.AddWithValue("@tp", targetPieces);
                    cmd.Parameters.AddWithValue("@ed", endDate.HasValue ? (object)endDate.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@sd", startDate.HasValue ? (object)startDate.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@tpr", targetPrice);
                    cmd.Parameters.AddWithValue("@ds", string.IsNullOrEmpty(description) ? (object)DBNull.Value : description);
                    cmd.Parameters.AddWithValue("@minP", minTargetPieces.HasValue ? (object)minTargetPieces.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@maxP", maxTargetPieces.HasValue ? (object)maxTargetPieces.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@packD", string.IsNullOrEmpty(packagingDesc) ? (object)DBNull.Value : packagingDesc);
                    cmd.Parameters.AddWithValue("@logD", string.IsNullOrEmpty(logisticsDesc) ? (object)DBNull.Value : logisticsDesc);
                    cmd.Parameters.AddWithValue("@coord", string.IsNullOrEmpty(coordinatorContact) ? (object)DBNull.Value : coordinatorContact);
                    cmd.Parameters.AddWithValue("@cust", string.IsNullOrEmpty(customerContact) ? (object)DBNull.Value : customerContact);
                    cmd.Parameters.AddWithValue("@wp", string.IsNullOrEmpty(workplaceMode) ? (object)"Na dílně" : workplaceMode);
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_Orders] 
(Name, IsActive, TargetPieces, TotalPiecesTarget, Deadline, EndDate, StartDate, TargetPricePerPiece, Description, MinTargetPieces, MaxTargetPieces, PackagingDesc, LogisticsDesc, CoordinatorContact, CustomerContact, WorkplaceMode)
OUTPUT INSERTED.Id
VALUES 
(@n, @a, @tp, @tp, @ed, @ed, @sd, @tpr, @ds, @minP, @maxP, @packD, @logD, @coord, @cust, @wp)", conn))
                {
                    cmd.Parameters.AddWithValue("@n", name);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.Parameters.AddWithValue("@tp", targetPieces);
                    cmd.Parameters.AddWithValue("@ed", endDate.HasValue ? (object)endDate.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@sd", startDate.HasValue ? (object)startDate.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@tpr", targetPrice);
                    cmd.Parameters.AddWithValue("@ds", string.IsNullOrEmpty(description) ? (object)DBNull.Value : description);
                    cmd.Parameters.AddWithValue("@minP", minTargetPieces.HasValue ? (object)minTargetPieces.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@maxP", maxTargetPieces.HasValue ? (object)maxTargetPieces.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@packD", string.IsNullOrEmpty(packagingDesc) ? (object)DBNull.Value : packagingDesc);
                    cmd.Parameters.AddWithValue("@logD", string.IsNullOrEmpty(logisticsDesc) ? (object)DBNull.Value : logisticsDesc);
                    cmd.Parameters.AddWithValue("@coord", string.IsNullOrEmpty(coordinatorContact) ? (object)DBNull.Value : coordinatorContact);
                    cmd.Parameters.AddWithValue("@cust", string.IsNullOrEmpty(customerContact) ? (object)DBNull.Value : customerContact);
                    cmd.Parameters.AddWithValue("@wp", string.IsNullOrEmpty(workplaceMode) ? (object)"Na dílně" : workplaceMode);
                    id = Convert.ToInt32(cmd.ExecuteScalar());
                }
            }

            // Pokud byly předány operace pro tuto zakázku, vytvoříme je rovnou svázané s tímto OrderId
            if (id > 0 && data.ContainsKey("operations") && data["operations"] != null)
            {
                var opsList = data["operations"] as System.Collections.IEnumerable;
                if (opsList != null)
                {
                    foreach (var item in opsList)
                    {
                        var opDict = item as Dictionary<string, object>;
                        if (opDict != null)
                        {
                        string opName = opDict.ContainsKey("name") ? Convert.ToString(opDict["name"]).Trim() : "";
                        if (!string.IsNullOrWhiteSpace(opName))
                        {
                            int norm = opDict.ContainsKey("normPerHour") ? Convert.ToInt32(opDict["normPerHour"]) : 100;
                            decimal rate = opDict.ContainsKey("ratePerPiece") ? Convert.ToDecimal(opDict["ratePerPiece"], CultureInfo.InvariantCulture) : 1.35m;
                            using (var opCmd = new SqlCommand("INSERT INTO [Kipacky].[kipa_Operations] (Name, NormPerHour, RatePerPiece, IsActive, OrderId) VALUES (@n, @norm, @rate, 1, @ord)", conn))
                            {
                                opCmd.Parameters.AddWithValue("@n", opName);
                                opCmd.Parameters.AddWithValue("@norm", norm);
                                opCmd.Parameters.AddWithValue("@rate", rate);
                                opCmd.Parameters.AddWithValue("@ord", id);
                                opCmd.ExecuteNonQuery();
                            }
                        }
                    }
                }
            }
        }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true }, { "id", id } });
    }

    private void HandleGetOrderDetail(HttpContext context)
    {
        string idStr = context.Request.QueryString["orderId"] ?? context.Request.QueryString["id"];
        if (string.IsNullOrEmpty(idStr))
        {
            SendError(context, 400, "Chyb\u00ED ID zak\u00E1zky.");
            return;
        }
        int orderId = Convert.ToInt32(idStr);

        Dictionary<string, object> orderData = null;
        var operations = new List<Dictionary<string, object>>();
        var participants = new List<Dictionary<string, object>>();
        int totalApprovedPieces = 0;
        int totalDefectPieces = 0;
        double totalEarnedCzk = 0;
        double totalProductiveHours = 0;

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            // 1. Zakázka
            using (var cmd = new SqlCommand(@"
SELECT o.Id, o.Name, o.IsActive, o.CreatedAt,
       ISNULL(o.TotalPiecesTarget, ISNULL(o.TargetPieces, 0)) AS TargetPcs,
       ISNULL(o.EndDate, o.Deadline) AS EndD,
       o.Description,
       o.StartDate,
       ISNULL(o.TargetPricePerPiece, 0) AS TargetPrice
FROM [Kipacky].[kipa_Orders] o
WHERE o.Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", orderId);
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        DateTime? endD = reader.IsDBNull(5) ? (DateTime?)null : reader.GetDateTime(5);
                        DateTime? startD = reader.IsDBNull(7) ? (DateTime?)null : reader.GetDateTime(7);
                        orderData = new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "name", reader.GetString(1) },
                            { "isActive", reader.GetBoolean(2) },
                            { "createdAt", reader.GetDateTime(3).ToString("s") },
                            { "totalPiecesTarget", reader.GetInt32(4) },
                            { "targetPieces", reader.GetInt32(4) },
                            { "endDate", endD.HasValue ? endD.Value.ToString("yyyy-MM-dd") : null },
                            { "startDate", startD.HasValue ? startD.Value.ToString("yyyy-MM-dd") : null },
                            { "description", reader.IsDBNull(6) ? "" : reader.GetString(6) },
                            { "targetPricePerPiece", Convert.ToDouble(reader.GetDecimal(8)) }
                        };
                    }
                }
            }

            if (orderData == null)
            {
                SendError(context, 404, "Zak\u00E1zka nenalezena.");
                return;
            }

            // 2. Operace patřící k zakázce
            using (var cmd = new SqlCommand(@"
SELECT Id, Name, NormPerHour, RatePerPiece, IsActive, OrderId
FROM [Kipacky].[kipa_Operations]
WHERE OrderId = @id
ORDER BY IsActive DESC, Name ASC", conn))
            {
                cmd.Parameters.AddWithValue("@id", orderId);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        operations.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "name", reader.GetString(1) },
                            { "normPerHour", reader.GetInt32(2) },
                            { "ratePerPiece", Convert.ToDouble(reader.GetDecimal(3)) },
                            { "isActive", reader.GetBoolean(4) },
                            { "orderId", reader.IsDBNull(5) ? (int?)null : reader.GetInt32(5) }
                        });
                    }
                }
            }

            // 3. Soupis účastníků a agregovaná schválená produkce
            using (var cmd = new SqlCommand(@"
SELECT p.EmployeeId, e.FullName, e.ContractType,
       p.OperationId, op.Name AS OperationName, op.NormPerHour, op.RatePerPiece,
       SUM(ISNULL(p.ValidatedPieces, p.SubmittedPieces)) AS ApprovedPieces,
       SUM(p.DefectPieces) AS DefectPieces,
       SUM(ISNULL(p.ValidatedPieces, p.SubmittedPieces) * op.RatePerPiece) AS TotalEarnedCzk,
       SUM(CASE WHEN op.NormPerHour > 0 THEN CAST(ISNULL(p.ValidatedPieces, p.SubmittedPieces) AS FLOAT) / op.NormPerHour ELSE 0 END) AS ProductiveHours
FROM [Kipacky].[kipa_ProductionLogs] p
JOIN [Kipacky].[kipa_Employees] e ON p.EmployeeId = e.Id
JOIN [Kipacky].[kipa_Operations] op ON p.OperationId = op.Id
WHERE p.OrderId = @id AND p.[Status] = 'Approved'
GROUP BY p.EmployeeId, e.FullName, e.ContractType, p.OperationId, op.Name, op.NormPerHour, op.RatePerPiece
ORDER BY e.FullName ASC, op.Name ASC", conn))
            {
                cmd.Parameters.AddWithValue("@id", orderId);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        int appPcs = Convert.ToInt32(reader.GetValue(7));
                        int defPcs = Convert.ToInt32(reader.GetValue(8));
                        double earned = Convert.ToDouble(reader.GetValue(9));
                        double prodH = Convert.ToDouble(reader.GetValue(10));

                        totalApprovedPieces += appPcs;
                        totalDefectPieces += defPcs;
                        totalEarnedCzk += earned;
                        totalProductiveHours += prodH;

                        participants.Add(new Dictionary<string, object>
                        {
                            { "employeeId", reader.GetInt32(0) },
                            { "employeeName", reader.GetString(1) },
                            { "fullName", reader.GetString(1) },
                            { "contractType", reader.GetString(2) },
                            { "operationId", reader.GetInt32(3) },
                            { "operationName", reader.GetString(4) },
                            { "normPerHour", reader.GetInt32(5) },
                            { "ratePerPiece", Convert.ToDouble(reader.GetDecimal(6)) },
                            { "approvedPieces", appPcs },
                            { "defectPieces", defPcs },
                            { "totalEarnedCzk", Math.Round(earned, 2) },
                            { "productiveHours", Math.Round(prodH, 2) }
                        });
                    }
                }
            }
        }

        int target = Convert.ToInt32(orderData["totalPiecesTarget"]);
        orderData["completedPieces"] = totalApprovedPieces;
        orderData["remainingPieces"] = (target > 0 && target > totalApprovedPieces) ? (target - totalApprovedPieces) : 0;
        orderData["percentDone"] = (target > 0) ? Math.Min(100, Math.Round(((double)totalApprovedPieces / target) * 100, 1)) : 0;

        var result = new Dictionary<string, object>
        {
            { "order", orderData },
            { "operations", operations },
            { "participants", participants },
            { "stats", new Dictionary<string, object>
                {
                    { "totalPiecesTarget", target },
                    { "targetPieces", target },
                    { "completedPieces", totalApprovedPieces },
                    { "totalApprovedPieces", totalApprovedPieces },
                    { "defectPieces", totalDefectPieces },
                    { "totalDefectPieces", totalDefectPieces },
                    { "remainingPieces", (target > 0 && target > totalApprovedPieces) ? (target - totalApprovedPieces) : 0 },
                    { "percentDone", (target > 0) ? Math.Min(100, Math.Round(((double)totalApprovedPieces / target) * 100, 1)) : 0 },
                    { "totalEarnedCzk", Math.Round(totalEarnedCzk, 2) },
                    { "totalProductiveHours", Math.Round(totalProductiveHours, 2) }
                }
            }
        };

        SendJson(context, result);
    }

    private void HandleGetOperations(HttpContext context)
    {
        string orderIdStr = context.Request.QueryString["orderId"];
        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            string sql = @"
SELECT op.Id, op.Name, op.NormPerHour, op.RatePerPiece, op.IsActive, op.OrderId, o.Name AS OrderName, ISNULL(op.OperationStage, 'Final') AS OperationStage
FROM [Kipacky].[kipa_Operations] op
LEFT JOIN [Kipacky].[kipa_Orders] o ON op.OrderId = o.Id
WHERE 1=1 ";
            if (!string.IsNullOrEmpty(orderIdStr))
            {
                sql += " AND op.OrderId = @orderId ";
            }
            sql += " ORDER BY op.IsActive DESC, op.Name ASC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                if (!string.IsNullOrEmpty(orderIdStr))
                {
                    cmd.Parameters.AddWithValue("@orderId", Convert.ToInt32(orderIdStr));
                }
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
                            { "isActive", reader.GetBoolean(4) },
                            { "orderId", reader.IsDBNull(5) ? (int?)null : reader.GetInt32(5) },
                            { "orderName", reader.IsDBNull(6) ? "" : reader.GetString(6) },
                            { "operationStage", reader.GetString(7) }
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
        int? orderId = (data.ContainsKey("orderId") && data["orderId"] != null && !string.IsNullOrEmpty(Convert.ToString(data["orderId"])) && Convert.ToInt32(data["orderId"]) > 0)
            ? Convert.ToInt32(data["orderId"]) : (int?)null;
        string operationStage = data.ContainsKey("operationStage") ? Convert.ToString(data["operationStage"]).Trim() : "Final";

        if (string.IsNullOrWhiteSpace(name))
        {
            SendError(context, 400, "Název operace je povinný.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            if (id > 0)
            {
                using (var cmd = new SqlCommand("UPDATE [Kipacky].[kipa_Operations] SET Name = @n, NormPerHour = @norm, RatePerPiece = @rate, IsActive = @a, OrderId = @ord, OperationStage = @stage WHERE Id = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@n", name);
                    cmd.Parameters.AddWithValue("@norm", norm);
                    cmd.Parameters.AddWithValue("@rate", rate);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.Parameters.AddWithValue("@ord", orderId.HasValue ? (object)orderId.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@stage", string.IsNullOrEmpty(operationStage) ? "Final" : operationStage);
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand("INSERT INTO [Kipacky].[kipa_Operations] (Name, NormPerHour, RatePerPiece, IsActive, OrderId, OperationStage) VALUES (@n, @norm, @rate, @a, @ord, @stage)", conn))
                {
                    cmd.Parameters.AddWithValue("@n", name);
                    cmd.Parameters.AddWithValue("@norm", norm);
                    cmd.Parameters.AddWithValue("@rate", rate);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.Parameters.AddWithValue("@ord", orderId.HasValue ? (object)orderId.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@stage", string.IsNullOrEmpty(operationStage) ? "Final" : operationStage);
                    cmd.ExecuteNonQuery();
                }
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleGetOrderAssignments(HttpContext context)
    {
        string orderIdStr = context.Request.QueryString["orderId"];
        string empIdStr = context.Request.QueryString["employeeId"];
        var list = new List<Dictionary<string, object>>();

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            string sql = @"
SELECT a.Id, a.OrderId, o.Name AS OrderName, a.EmployeeId, e.FullName AS EmployeeName, e.EmployeeNumber,
       a.OperationId, op.Name AS OperationName, a.AssignedPieces, a.AssignedAt, a.DeadlineDate,
       a.Workplace, a.Status, a.Note,
       ISNULL((SELECT SUM(ISNULL(p.ValidatedPieces, p.SubmittedPieces)) FROM [Kipacky].[kipa_ProductionLogs] p WHERE p.OrderId = a.OrderId AND p.EmployeeId = a.EmployeeId AND (a.OperationId IS NULL OR p.OperationId = a.OperationId) AND p.Status = 'Approved'), 0) AS DonePieces
FROM [Kipacky].[kipa_OrderAssignments] a
JOIN [Kipacky].[kipa_Orders] o ON a.OrderId = o.Id
JOIN [Kipacky].[kipa_Employees] e ON a.EmployeeId = e.Id
LEFT JOIN [Kipacky].[kipa_Operations] op ON a.OperationId = op.Id
WHERE 1=1 ";

            if (!string.IsNullOrEmpty(orderIdStr)) sql += " AND a.OrderId = @orderId ";
            if (!string.IsNullOrEmpty(empIdStr)) sql += " AND a.EmployeeId = @empId ";
            sql += " ORDER BY a.Id DESC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                if (!string.IsNullOrEmpty(orderIdStr)) cmd.Parameters.AddWithValue("@orderId", Convert.ToInt32(orderIdStr));
                if (!string.IsNullOrEmpty(empIdStr)) cmd.Parameters.AddWithValue("@empId", Convert.ToInt32(empIdStr));

                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        DateTime? deadD = reader.IsDBNull(10) ? (DateTime?)null : reader.GetDateTime(10);
                        int assignedPcs = reader.GetInt32(8);
                        int donePcs = Convert.ToInt32(reader.GetValue(14));

                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "orderId", reader.GetInt32(1) },
                            { "orderName", reader.GetString(2) },
                            { "employeeId", reader.GetInt32(3) },
                            { "employeeName", reader.GetString(4) },
                            { "employeeNumber", reader.IsDBNull(5) ? "" : reader.GetString(5) },
                            { "operationId", reader.IsDBNull(6) ? (int?)null : reader.GetInt32(6) },
                            { "operationName", reader.IsDBNull(7) ? "Všechny operace" : reader.GetString(7) },
                            { "assignedPieces", assignedPcs },
                            { "assignedAt", reader.GetDateTime(9).ToString("s") },
                            { "deadlineDate", deadD.HasValue ? deadD.Value.ToString("yyyy-MM-dd") : null },
                            { "workplace", reader.GetString(11) },
                            { "status", reader.GetString(12) },
                            { "note", reader.IsDBNull(13) ? "" : reader.GetString(13) },
                            { "donePieces", donePcs },
                            { "remainingPieces", Math.Max(0, assignedPcs - donePcs) }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleSaveOrderAssignment(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = data.ContainsKey("id") ? Convert.ToInt32(data["id"]) : 0;
        int orderId = Convert.ToInt32(data["orderId"]);
        int employeeId = Convert.ToInt32(data["employeeId"]);
        int? operationId = (data.ContainsKey("operationId") && data["operationId"] != null && Convert.ToInt32(data["operationId"]) > 0)
            ? (int?)Convert.ToInt32(data["operationId"]) : null;
        int assignedPieces = data.ContainsKey("assignedPieces") ? Convert.ToInt32(data["assignedPieces"]) : 0;
        string deadStr = data.ContainsKey("deadlineDate") ? Convert.ToString(data["deadlineDate"]) : null;
        DateTime? deadlineDate = (!string.IsNullOrEmpty(deadStr)) ? (DateTime?)DateTime.Parse(deadStr) : null;
        string workplace = data.ContainsKey("workplace") ? Convert.ToString(data["workplace"]).Trim() : "Na dílně";
        string note = data.ContainsKey("note") ? Convert.ToString(data["note"]).Trim() : "";

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            if (id > 0)
            {
                using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_OrderAssignments]
SET OrderId = @ord, EmployeeId = @emp, OperationId = @op, AssignedPieces = @pcs, DeadlineDate = @dl, Workplace = @wp, Note = @nt
WHERE Id = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@ord", orderId);
                    cmd.Parameters.AddWithValue("@emp", employeeId);
                    cmd.Parameters.AddWithValue("@op", operationId.HasValue ? (object)operationId.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@pcs", assignedPieces);
                    cmd.Parameters.AddWithValue("@dl", deadlineDate.HasValue ? (object)deadlineDate.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@wp", string.IsNullOrEmpty(workplace) ? "Na dílně" : workplace);
                    cmd.Parameters.AddWithValue("@nt", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_OrderAssignments] (OrderId, EmployeeId, OperationId, AssignedPieces, AssignedAt, DeadlineDate, Workplace, Status, Note)
VALUES (@ord, @emp, @op, @pcs, GETDATE(), @dl, @wp, 'Active', @nt)", conn))
                {
                    cmd.Parameters.AddWithValue("@ord", orderId);
                    cmd.Parameters.AddWithValue("@emp", employeeId);
                    cmd.Parameters.AddWithValue("@op", operationId.HasValue ? (object)operationId.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@pcs", assignedPieces);
                    cmd.Parameters.AddWithValue("@dl", deadlineDate.HasValue ? (object)deadlineDate.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@wp", string.IsNullOrEmpty(workplace) ? "Na dílně" : workplace);
                    cmd.Parameters.AddWithValue("@nt", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                    cmd.ExecuteNonQuery();
                }
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleDeleteOrderAssignment(HttpContext context)
    {
        int id = Convert.ToInt32(context.Request.QueryString["id"]);
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("DELETE FROM [Kipacky].[kipa_OrderAssignments] WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    // ==========================================
    // ADMIN: FÁZE 3 – SKLAD MATERIÁLU, PŘÍJEM & VÝDEJ
    // ==========================================

    private void HandleGetOrderMaterials(HttpContext context)
    {
        var list = new List<Dictionary<string, object>>();
        string orderIdStr = context.Request.QueryString["orderId"];
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);
            string sql = @"
SELECT m.Id, m.OrderId, o.Name AS OrderName, ISNULL(o.TotalPiecesTarget, ISNULL(o.TargetPieces, 0)) AS TargetPieces,
       m.Name, m.DeliveredQuantity, m.Unit, m.ConsumptionPerPiece, m.MatchesTargetPieces,
       m.Note, m.ReceivedAt, m.CreatedBy,
       ISNULL((SELECT SUM(mdi.Quantity) FROM [Kipacky].[kipa_MaterialDispatchItems] mdi WHERE mdi.MaterialId = m.Id), 0) AS DispatchedQuantity
FROM [Kipacky].[kipa_OrderMaterials] m
JOIN [Kipacky].[kipa_Orders] o ON m.OrderId = o.Id
" + (!string.IsNullOrEmpty(orderIdStr) ? "WHERE m.OrderId = @ord " : "") + @"
ORDER BY o.Id DESC, m.Id ASC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                if (!string.IsNullOrEmpty(orderIdStr))
                {
                    cmd.Parameters.AddWithValue("@ord", Convert.ToInt32(orderIdStr));
                }
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        decimal delivered = reader.GetDecimal(5);
                        decimal dispatched = Convert.ToDecimal(reader.GetValue(12));
                        decimal remaining = delivered - dispatched;
                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "orderId", reader.GetInt32(1) },
                            { "orderName", reader.GetString(2) },
                            { "targetPieces", reader.GetInt32(3) },
                            { "name", reader.GetString(4) },
                            { "deliveredQuantity", Convert.ToDouble(delivered) },
                            { "unit", reader.GetString(6) },
                            { "consumptionPerPiece", Convert.ToDouble(reader.GetDecimal(7)) },
                            { "matchesTargetPieces", reader.GetBoolean(8) },
                            { "note", reader.IsDBNull(9) ? "" : reader.GetString(9) },
                            { "receivedAt", reader.GetDateTime(10).ToString("yyyy-MM-dd HH:mm") },
                            { "createdBy", reader.IsDBNull(11) ? "" : reader.GetString(11) },
                            { "dispatchedQuantity", Convert.ToDouble(dispatched) },
                            { "remainingQuantity", Convert.ToDouble(remaining) }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleSaveOrderMaterial(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = data.ContainsKey("id") ? Convert.ToInt32(data["id"]) : 0;
        int orderId = data.ContainsKey("orderId") ? Convert.ToInt32(data["orderId"]) : 0;
        string name = data.ContainsKey("name") ? Convert.ToString(data["name"]).Trim() : "";
        decimal delivered = data.ContainsKey("deliveredQuantity") ? Convert.ToDecimal(data["deliveredQuantity"], CultureInfo.InvariantCulture) : 0m;
        string unit = data.ContainsKey("unit") ? Convert.ToString(data["unit"]).Trim() : "ks";
        decimal consumption = data.ContainsKey("consumptionPerPiece") ? Convert.ToDecimal(data["consumptionPerPiece"], CultureInfo.InvariantCulture) : 1m;
        bool matches = data.ContainsKey("matchesTargetPieces") ? Convert.ToBoolean(data["matchesTargetPieces"]) : true;
        string note = data.ContainsKey("note") ? Convert.ToString(data["note"]).Trim() : "";
        string receivedAtStr = data.ContainsKey("receivedAt") ? Convert.ToString(data["receivedAt"]) : null;
        DateTime dtParsed;
        DateTime receivedAt = (!string.IsNullOrEmpty(receivedAtStr) && DateTime.TryParse(receivedAtStr, out dtParsed)) ? dtParsed : DateTime.Now;
        string createdBy = data.ContainsKey("createdBy") ? Convert.ToString(data["createdBy"]).Trim() : "Admin";

        if (orderId <= 0 || string.IsNullOrWhiteSpace(name))
        {
            SendError(context, 400, "Je nutné vybrat zakázku a zadat název materiálu.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);
            if (id > 0)
            {
                using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_OrderMaterials]
SET OrderId = @ord, Name = @n, DeliveredQuantity = @del, Unit = @u, ConsumptionPerPiece = @cons,
    MatchesTargetPieces = @mat, Note = @nt, ReceivedAt = @rec
WHERE Id = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.Parameters.AddWithValue("@ord", orderId);
                    cmd.Parameters.AddWithValue("@n", name);
                    cmd.Parameters.AddWithValue("@del", delivered);
                    cmd.Parameters.AddWithValue("@u", unit);
                    cmd.Parameters.AddWithValue("@cons", consumption);
                    cmd.Parameters.AddWithValue("@mat", matches);
                    cmd.Parameters.AddWithValue("@nt", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                    cmd.Parameters.AddWithValue("@rec", receivedAt);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_OrderMaterials] (OrderId, Name, DeliveredQuantity, Unit, ConsumptionPerPiece, MatchesTargetPieces, Note, ReceivedAt, CreatedBy)
VALUES (@ord, @n, @del, @u, @cons, @mat, @nt, @rec, @by)", conn))
                {
                    cmd.Parameters.AddWithValue("@ord", orderId);
                    cmd.Parameters.AddWithValue("@n", name);
                    cmd.Parameters.AddWithValue("@del", delivered);
                    cmd.Parameters.AddWithValue("@u", unit);
                    cmd.Parameters.AddWithValue("@cons", consumption);
                    cmd.Parameters.AddWithValue("@mat", matches);
                    cmd.Parameters.AddWithValue("@nt", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                    cmd.Parameters.AddWithValue("@rec", receivedAt);
                    cmd.Parameters.AddWithValue("@by", string.IsNullOrEmpty(createdBy) ? "Admin" : createdBy);
                    cmd.ExecuteNonQuery();
                }
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleDeleteOrderMaterial(HttpContext context)
    {
        int id = Convert.ToInt32(context.Request.QueryString["id"]);
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("DELETE FROM [Kipacky].[kipa_MaterialDispatchItems] WHERE MaterialId = @id; DELETE FROM [Kipacky].[kipa_OrderMaterials] WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleGetMaterialDispatches(HttpContext context)
    {
        var list = new List<Dictionary<string, object>>();
        string orderIdStr = context.Request.QueryString["orderId"];
        string employeeIdStr = context.Request.QueryString["employeeId"];

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            string sql = @"
SELECT d.Id, d.OrderId, o.Name AS OrderName, d.EmployeeId, e.FullName AS EmployeeName, e.EmployeeNumber,
       d.PlannedPieces, d.DispatchedAt, d.DispatchedBy, d.DocumentId, d.Status, d.Note,
       (SELECT MAX(c.AgreedAt) FROM [Kipacky].[kipa_DocumentConsents] c WHERE c.DocumentId = d.DocumentId AND c.EmployeeId = d.EmployeeId) AS ConfirmedAt
FROM [Kipacky].[kipa_MaterialDispatches] d
JOIN [Kipacky].[kipa_Orders] o ON d.OrderId = o.Id
JOIN [Kipacky].[kipa_Employees] e ON d.EmployeeId = e.Id
WHERE 1=1 "
+ (!string.IsNullOrEmpty(orderIdStr) ? "AND d.OrderId = @ord " : "")
+ (!string.IsNullOrEmpty(employeeIdStr) ? "AND d.EmployeeId = @emp " : "") + @"
ORDER BY d.Id DESC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                if (!string.IsNullOrEmpty(orderIdStr)) cmd.Parameters.AddWithValue("@ord", Convert.ToInt32(orderIdStr));
                if (!string.IsNullOrEmpty(employeeIdStr)) cmd.Parameters.AddWithValue("@emp", Convert.ToInt32(employeeIdStr));

                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        int dispatchId = reader.GetInt32(0);
                        DateTime? confAt = reader.IsDBNull(12) ? (DateTime?)null : reader.GetDateTime(12);
                        list.Add(new Dictionary<string, object>
                        {
                            { "id", dispatchId },
                            { "orderId", reader.GetInt32(1) },
                            { "orderName", reader.GetString(2) },
                            { "employeeId", reader.GetInt32(3) },
                            { "employeeName", reader.GetString(4) },
                            { "employeeNumber", reader.IsDBNull(5) ? "" : reader.GetString(5) },
                            { "plannedPieces", reader.GetInt32(6) },
                            { "dispatchedAt", reader.GetDateTime(7).ToString("yyyy-MM-dd HH:mm") },
                            { "dispatchedBy", reader.IsDBNull(8) ? "" : reader.GetString(8) },
                            { "documentId", reader.IsDBNull(9) ? (int?)null : reader.GetInt32(9) },
                            { "status", reader.GetString(10) },
                            { "note", reader.IsDBNull(11) ? "" : reader.GetString(11) },
                            { "confirmedAt", confAt.HasValue ? confAt.Value.ToString("yyyy-MM-dd HH:mm") : null },
                            { "items", new List<Dictionary<string, object>>() }
                        });
                    }
                }
            }

            foreach (var disp in list)
            {
                int dispId = (int)disp["id"];
                var items = (List<Dictionary<string, object>>)disp["items"];
                using (var cmdItems = new SqlCommand(@"
SELECT i.Id, i.MaterialId, m.Name AS MaterialName, i.Quantity, i.ReturnedQuantity, i.Unit
FROM [Kipacky].[kipa_MaterialDispatchItems] i
JOIN [Kipacky].[kipa_OrderMaterials] m ON i.MaterialId = m.Id
WHERE i.DispatchId = @did", conn))
                {
                    cmdItems.Parameters.AddWithValue("@did", dispId);
                    using (var r = cmdItems.ExecuteReader())
                    {
                        while (r.Read())
                        {
                            items.Add(new Dictionary<string, object>
                            {
                                { "id", r.GetInt32(0) },
                                { "materialId", r.GetInt32(1) },
                                { "materialName", r.GetString(2) },
                                { "quantity", Convert.ToDouble(r.GetDecimal(3)) },
                                { "returnedQuantity", Convert.ToDouble(r.GetDecimal(4)) },
                                { "unit", r.GetString(5) }
                            });
                        }
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleSaveMaterialDispatch(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = data.ContainsKey("id") ? Convert.ToInt32(data["id"]) : 0;
        int orderId = data.ContainsKey("orderId") ? Convert.ToInt32(data["orderId"]) : 0;
        int employeeId = data.ContainsKey("employeeId") ? Convert.ToInt32(data["employeeId"]) : 0;
        int plannedPieces = data.ContainsKey("plannedPieces") ? Convert.ToInt32(data["plannedPieces"]) : 0;
        string dispatchedBy = data.ContainsKey("dispatchedBy") ? Convert.ToString(data["dispatchedBy"]).Trim() : "Admin";
        string note = data.ContainsKey("note") ? Convert.ToString(data["note"]).Trim() : "";
        string status = data.ContainsKey("status") ? Convert.ToString(data["status"]).Trim() : "Issued";
        bool createDoc = data.ContainsKey("createDocument") && Convert.ToBoolean(data["createDocument"]);

        if (orderId <= 0 || employeeId <= 0 || plannedPieces <= 0)
        {
            SendError(context, 400, "Je nutné zvolit zakázku, brigádníka a zadat plánovaný počet kusů.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            // Fetch order and employee info for naming
            string orderName = "Zakázka";
            using (var cmdOrd = new SqlCommand("SELECT Name FROM [Kipacky].[kipa_Orders] WHERE Id = @oid", conn))
            {
                cmdOrd.Parameters.AddWithValue("@oid", orderId);
                var oRes = cmdOrd.ExecuteScalar();
                if (oRes != null) orderName = Convert.ToString(oRes);
            }

            string employeeName = "Brigádník";
            string employeeNumber = "";
            using (var cmdEmp = new SqlCommand("SELECT FullName, EmployeeNumber FROM [Kipacky].[kipa_Employees] WHERE Id = @eid", conn))
            {
                cmdEmp.Parameters.AddWithValue("@eid", employeeId);
                using (var r = cmdEmp.ExecuteReader())
                {
                    if (r.Read())
                    {
                        employeeName = r.GetString(0);
                        employeeNumber = r.IsDBNull(1) ? "" : r.GetString(1);
                    }
                }
            }

            int dispatchId = id;
            if (id > 0)
            {
                using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_MaterialDispatches]
SET OrderId = @ord, EmployeeId = @emp, PlannedPieces = @pcs, DispatchedBy = @by, Status = @st, Note = @nt
WHERE Id = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.Parameters.AddWithValue("@ord", orderId);
                    cmd.Parameters.AddWithValue("@emp", employeeId);
                    cmd.Parameters.AddWithValue("@pcs", plannedPieces);
                    cmd.Parameters.AddWithValue("@by", dispatchedBy);
                    cmd.Parameters.AddWithValue("@st", status);
                    cmd.Parameters.AddWithValue("@nt", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                    cmd.ExecuteNonQuery();
                }

                using (var cmdDelItems = new SqlCommand("DELETE FROM [Kipacky].[kipa_MaterialDispatchItems] WHERE DispatchId = @did", conn))
                {
                    cmdDelItems.Parameters.AddWithValue("@did", id);
                    cmdDelItems.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_MaterialDispatches] (OrderId, EmployeeId, PlannedPieces, DispatchedAt, DispatchedBy, Status, Note)
VALUES (@ord, @emp, @pcs, GETDATE(), @by, @st, @nt);
SELECT SCOPE_IDENTITY();", conn))
                {
                    cmd.Parameters.AddWithValue("@ord", orderId);
                    cmd.Parameters.AddWithValue("@emp", employeeId);
                    cmd.Parameters.AddWithValue("@pcs", plannedPieces);
                    cmd.Parameters.AddWithValue("@by", dispatchedBy);
                    cmd.Parameters.AddWithValue("@st", status);
                    cmd.Parameters.AddWithValue("@nt", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                    dispatchId = Convert.ToInt32(cmd.ExecuteScalar());
                }
            }

            // Insert items
            var itemDescriptions = new List<string>();
            var htmlRows = new StringBuilder();

            var rawItems = data.ContainsKey("items") ? (data["items"] as System.Collections.IEnumerable) : null;
            if (rawItems != null)
            {
                foreach (var itemObj in rawItems)
                {
                    var itm = itemObj as Dictionary<string, object>;
                    if (itm != null)
                    {
                        int matId = Convert.ToInt32(itm["materialId"]);
                        decimal qty = Convert.ToDecimal(itm["quantity"], CultureInfo.InvariantCulture);
                        string unit = itm.ContainsKey("unit") ? Convert.ToString(itm["unit"]).Trim() : "ks";
                        string matName = itm.ContainsKey("materialName") ? Convert.ToString(itm["materialName"]).Trim() : "";

                        using (var cmdItm = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_MaterialDispatchItems] (DispatchId, MaterialId, Quantity, Unit)
VALUES (@did, @mid, @qty, @u)", conn))
                        {
                            cmdItm.Parameters.AddWithValue("@did", dispatchId);
                            cmdItm.Parameters.AddWithValue("@mid", matId);
                            cmdItm.Parameters.AddWithValue("@qty", qty);
                            cmdItm.Parameters.AddWithValue("@u", unit);
                            cmdItm.ExecuteNonQuery();
                        }

                        itemDescriptions.Add(matName + ": " + qty.ToString() + " " + unit);
                        htmlRows.Append("<tr><td>" + matName + "</td><td align=\"right\"><strong>" + qty.ToString() + "</strong></td><td>" + unit + "</td></tr>");
                    }
                }
            }

            // If createDocument requested, generate a document in kipa_Documents
            if (createDoc)
            {
                string title = "Předávací protokol materiálu č. VYD-" + dispatchId + " – " + orderName;
                string shortText = "Materiál na " + plannedPieces + " ks zakázky '" + orderName + "'. Vydáno: " + string.Join(", ", itemDescriptions) + ". Prosíme o potvrzení převzetí.";
                string fullText = @"<div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;"">
<h2 style=""color: #065f46; margin-bottom: 4px;"">PŘEDÁVACÍ PROTOKOL MATERIÁLU K ZAKÁZCE</h2>
<p style=""margin-top: 0; color: #6b7280; font-size: 14px;"">Číslo výdejky: <strong>VYD-" + dispatchId + @"</strong></p>
<table style=""width: 100%; margin-bottom: 16px; border-collapse: collapse;"">
<tr><td style=""width: 160px; padding: 4px 0; color: #4b5563;""><strong>Zakázka:</strong></td><td><strong>" + orderName + @"</strong></td></tr>
<tr><td style=""padding: 4px 0; color: #4b5563;""><strong>Příjemce (brigádník):</strong></td><td>" + employeeName + (string.IsNullOrEmpty(employeeNumber) ? "" : (" (os. č. " + employeeNumber + ")")) + @"</td></tr>
<tr><td style=""padding: 4px 0; color: #4b5563;""><strong>Předal koordinátor:</strong></td><td>" + dispatchedBy + @"</td></tr>
<tr><td style=""padding: 4px 0; color: #4b5563;""><strong>Datum předání:</strong></td><td>" + DateTime.Now.ToString("dd. MM. yyyy HH:mm") + @"</td></tr>
<tr><td style=""padding: 4px 0; color: #4b5563;""><strong>Závazek ke zhotovení:</strong></td><td><strong>" + plannedPieces + @" ks</strong></td></tr>
" + (string.IsNullOrEmpty(note) ? "" : ("<tr><td style=\"padding: 4px 0; color: #4b5563;\"><strong>Poznámka:</strong></td><td>" + note + "</td></tr>")) + @"
</table>
<h3 style=""color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px;"">Soupis předaného materiálu a komponent</h3>
<table border=""1"" cellpadding=""8"" cellspacing=""0"" style=""width: 100%; border-collapse: collapse; border-color: #d1d5db;"">
<thead><tr style=""background: #f3f4f6; color: #374151;""><th align=""left"">Materiál / komponenta</th><th align=""right"">Vydané množství</th><th align=""left"">Měrná jednotka</th></tr></thead>
<tbody>" + htmlRows.ToString() + @"</tbody>
</table>
<div style=""margin-top: 24px; padding: 12px; background: #ecfdf5; border-left: 4px solid #059669; font-size: 13px; color: #065f46;"">
<strong>Čestné prohlášení:</strong> Svým elektronickým potvrzením potvrzuji fyzické převzetí výše uvedeného materiálu v deklarovaném množství a bez zjevných vad. Zavazuji se materiál využít výhradně pro kompletaci zakázky, chránit jej před poškozením a zbylé či vadné kusy vrátit koordinátorovi.
</div>
</div>";

                int docId = 0;
                using (var cmdDoc = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_Documents] (Title, Content, ShortText, FullText, IsActive, TargetEmployeeId, DocumentType)
VALUES (@t, @s, @s, @f, 1, @emp, 'MaterialHandover');
SELECT SCOPE_IDENTITY();", conn))
                {
                    cmdDoc.Parameters.AddWithValue("@t", title);
                    cmdDoc.Parameters.AddWithValue("@s", shortText);
                    cmdDoc.Parameters.AddWithValue("@f", fullText);
                    cmdDoc.Parameters.AddWithValue("@emp", employeeId);
                    docId = Convert.ToInt32(cmdDoc.ExecuteScalar());
                }

                using (var cmdUpdDisp = new SqlCommand("UPDATE [Kipacky].[kipa_MaterialDispatches] SET DocumentId = @docId WHERE Id = @id", conn))
                {
                    cmdUpdDisp.Parameters.AddWithValue("@docId", docId);
                    cmdUpdDisp.Parameters.AddWithValue("@id", dispatchId);
                    cmdUpdDisp.ExecuteNonQuery();
                }
            }
        }

        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleDeleteMaterialDispatch(HttpContext context)
    {
        int id = Convert.ToInt32(context.Request.QueryString["id"]);
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            int? docId = null;
            using (var cmdChk = new SqlCommand("SELECT DocumentId FROM [Kipacky].[kipa_MaterialDispatches] WHERE Id = @id", conn))
            {
                cmdChk.Parameters.AddWithValue("@id", id);
                var res = cmdChk.ExecuteScalar();
                if (res != null && res != DBNull.Value) docId = Convert.ToInt32(res);
            }

            using (var cmd = new SqlCommand(@"
DELETE FROM [Kipacky].[kipa_MaterialDispatchItems] WHERE DispatchId = @id;
DELETE FROM [Kipacky].[kipa_MaterialDispatches] WHERE Id = @id;", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }

            if (docId.HasValue)
            {
                using (var cmdDoc = new SqlCommand("UPDATE [Kipacky].[kipa_Documents] SET IsActive = 0 WHERE Id = @docId", conn))
                {
                    cmdDoc.Parameters.AddWithValue("@docId", docId.Value);
                    cmdDoc.ExecuteNonQuery();
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
            EnsureSchemaMigrations(conn);
            string sql = @"
SELECT TOP 500 p.Id, p.EmployeeId, e.FullName, e.ContractType,
       p.OrderId, o.Name AS OrderName,
       p.OperationId, op.Name AS OperationName, op.NormPerHour, op.RatePerPiece,
       p.[Date], p.SubmittedPieces, p.ValidatedPieces, p.DefectPieces, p.[Status], p.ModifiedBy, p.Note,
       p.DefectProtocolDocId, e.EmployeeNumber, e.PhotoUrl
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
                        double normHours = Math.Round((effectivePieces * rate) / 135.0, 2);
                        int? defectDocId = reader.IsDBNull(17) ? (int?)null : reader.GetInt32(17);
                        string empNum = reader.IsDBNull(18) ? "" : reader.GetString(18);
                        string photo = reader.IsDBNull(19) ? "" : reader.GetString(19);

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
                            { "productiveHours", prodHours },
                            { "normHours", normHours },
                            { "defectProtocolDocId", defectDocId },
                            { "employeeNumber", empNum },
                            { "photoUrl", photo }
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
            SendError(context, 400, "Neplatné ID záznamu produkce.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            int empId = 0;
            string empName = "";
            string empNumber = "";
            string orderName = "";
            string opName = "";
            DateTime prodDate = DateTime.Now;

            using (var cmdInfo = new SqlCommand(@"
SELECT p.EmployeeId, e.FullName, e.EmployeeNumber, o.Name AS OrderName, op.Name AS OpName, p.[Date]
FROM [Kipacky].[kipa_ProductionLogs] p
JOIN [Kipacky].[kipa_Employees] e ON p.EmployeeId = e.Id
JOIN [Kipacky].[kipa_Orders] o ON p.OrderId = o.Id
JOIN [Kipacky].[kipa_Operations] op ON p.OperationId = op.Id
WHERE p.Id = @id", conn))
            {
                cmdInfo.Parameters.AddWithValue("@id", id);
                using (var r = cmdInfo.ExecuteReader())
                {
                    if (r.Read())
                    {
                        empId = r.GetInt32(0);
                        empName = r.GetString(1);
                        empNumber = r.IsDBNull(2) ? "" : r.GetString(2);
                        orderName = r.GetString(3);
                        opName = r.GetString(4);
                        prodDate = r.GetDateTime(5);
                    }
                }
            }

            int? defectDocId = null;
            if (defectPieces > 0 && empId > 0)
            {
                string title = "Zmetkový protokol č. ZM-" + id + " – " + orderName;
                string shortText = "Při kontrole zakázky '" + orderName + "' (" + opName + ") bylo vyřazeno " + defectPieces + " vadných kusů. Prosíme o potvrzení.";
                string fullText = @"<div style=""font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;"">
<h2 style=""color: #991b1b; margin-bottom: 4px;"">ZMETKOVÝ PROTOKOL – VADNÉ KUSY</h2>
<p style=""margin-top: 0; color: #6b7280; font-size: 14px;"">Číslo protokolu: <strong>ZM-" + id + @"</strong> | Zjištěno: " + DateTime.Now.ToString("dd. MM. yyyy HH:mm") + @"</p>
<table style=""width: 100%; margin-bottom: 16px; border-collapse: collapse;"">
<tr><td style=""width: 160px; padding: 4px 0; color: #4b5563;""><strong>Pracovník / Brigádník:</strong></td><td><strong>" + empName + @"</strong>" + (string.IsNullOrEmpty(empNumber) ? "" : (" (os. č. " + empNumber + ")")) + @"</td></tr>
<tr><td style=""padding: 4px 0; color: #4b5563;""><strong>Zakázka:</strong></td><td>" + orderName + @"</td></tr>
<tr><td style=""padding: 4px 0; color: #4b5563;""><strong>Operace / úkon:</strong></td><td>" + opName + @"</td></tr>
<tr><td style=""padding: 4px 0; color: #4b5563;""><strong>Datum výroby:</strong></td><td>" + prodDate.ToString("dd. MM. yyyy") + @"</td></tr>
<tr><td style=""padding: 4px 0; color: #4b5563;""><strong>Schváleno bez vad:</strong></td><td><strong style=""color: #065f46;"">" + validatedPieces + @" ks</strong> (k proplacení)</td></tr>
<tr><td style=""padding: 4px 0; color: #991b1b;""><strong>Počet zmetků (vadných kusů):</strong></td><td><strong style=""color: #991b1b; font-size: 16px;"">" + defectPieces + @" ks</strong> (neplacených)</td></tr>
<tr><td style=""padding: 4px 0; color: #4b5563;""><strong>Kontrolu provedl:</strong></td><td>" + ADMIN_USER + @"</td></tr>
" + (string.IsNullOrEmpty(note) ? "" : ("<tr><td style=\"padding: 4px 0; color: #4b5563;\"><strong>Důvod vyřazení / poznámka:</strong></td><td>" + note + "</td></tr>")) + @"
</table>
<div style=""margin-top: 20px; padding: 12px; background: #fef2f2; border-left: 4px solid #ef4444; font-size: 13px; color: #991b1b;"">
<strong>Vyjádření kontroly:</strong> Uvedený počet kusů nesplňuje kvalitativní standardy zakázky a nelze jej uznat k proplacení. Svým elektronickým potvrzením brigádník bere tento záznam o zmetcích na vědomí.
</div>
</div>";

                using (var cmdDoc = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_Documents] (Title, Content, ShortText, FullText, IsActive, TargetEmployeeId, DocumentType)
VALUES (@t, @s, @s, @f, 1, @emp, 'DefectProtocol');
SELECT SCOPE_IDENTITY();", conn))
                {
                    cmdDoc.Parameters.AddWithValue("@t", title);
                    cmdDoc.Parameters.AddWithValue("@s", shortText);
                    cmdDoc.Parameters.AddWithValue("@f", fullText);
                    cmdDoc.Parameters.AddWithValue("@emp", empId);
                    defectDocId = Convert.ToInt32(cmdDoc.ExecuteScalar());
                }
            }

            using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_ProductionLogs]
SET ValidatedPieces = @val,
    DefectPieces = @def,
    [Status] = 'Approved',
    ModifiedBy = @mod,
    Note = @note,
    DefectProtocolDocId = @docId
WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@val", validatedPieces);
                cmd.Parameters.AddWithValue("@def", defectPieces);
                cmd.Parameters.AddWithValue("@mod", ADMIN_USER);
                cmd.Parameters.AddWithValue("@note", string.IsNullOrEmpty(note) ? (object)DBNull.Value : note);
                cmd.Parameters.AddWithValue("@docId", defectDocId.HasValue ? (object)defectDocId.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }

        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleApproveAllProduction(HttpContext context)
    {
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_ProductionLogs]
SET ValidatedPieces = SubmittedPieces,
    DefectPieces = 0,
    [Status] = 'Approved',
    ModifiedBy = @mod
WHERE [Status] = 'Pending'", conn))
            {
                cmd.Parameters.AddWithValue("@mod", ADMIN_USER);
                int count = cmd.ExecuteNonQuery();
                SendJson(context, new Dictionary<string, object> { { "success", true }, { "approvedCount", count } });
            }
        }
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
        string typeFilter = context.Request.QueryString["type"];
        string empIdStr = context.Request.QueryString["employeeId"];
        string yearStr = context.Request.QueryString["year"];
        string monthStr = context.Request.QueryString["month"];

        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            string sql = @"
SELECT d.Id, d.Title, ISNULL(d.ShortText, d.Content) AS ShortText, ISNULL(d.FullText, '') AS FullText,
       d.IsActive, d.CreatedAt, d.TargetEmployeeId, e.FullName AS TargetEmployeeName, e.EmployeeNumber AS TargetEmployeeNumber,
       d.DocumentType, d.PeriodYear, d.PeriodMonth, d.FileName,
       CASE WHEN d.FileBase64 IS NOT NULL AND LEN(d.FileBase64) > 0 THEN 1 ELSE 0 END AS HasFile,
       d.RequiresSignature, d.Priority,
       (SELECT COUNT(DISTINCT c.EmployeeId) FROM [Kipacky].[kipa_DocumentConsents] c WHERE c.DocumentId = d.Id) AS ConsentCount
FROM [Kipacky].[kipa_Documents] d
LEFT JOIN [Kipacky].[kipa_Employees] e ON d.TargetEmployeeId = e.Id
WHERE d.IsActive = 1 ";

            if (!string.IsNullOrEmpty(typeFilter))
            {
                sql += " AND d.DocumentType = @type ";
            }
            if (!string.IsNullOrEmpty(empIdStr))
            {
                sql += " AND (d.TargetEmployeeId IS NULL OR d.TargetEmployeeId = @empId) ";
            }
            if (!string.IsNullOrEmpty(yearStr))
            {
                sql += " AND d.PeriodYear = @year ";
            }
            if (!string.IsNullOrEmpty(monthStr))
            {
                sql += " AND d.PeriodMonth = @month ";
            }

            sql += " ORDER BY d.CreatedAt DESC, d.Id DESC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                if (!string.IsNullOrEmpty(typeFilter)) cmd.Parameters.AddWithValue("@type", typeFilter);
                if (!string.IsNullOrEmpty(empIdStr)) cmd.Parameters.AddWithValue("@empId", Convert.ToInt32(empIdStr));
                if (!string.IsNullOrEmpty(yearStr)) cmd.Parameters.AddWithValue("@year", Convert.ToInt32(yearStr));
                if (!string.IsNullOrEmpty(monthStr)) cmd.Parameters.AddWithValue("@month", Convert.ToInt32(monthStr));

                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        string shortTxt = reader.IsDBNull(2) ? "" : reader.GetString(2);
                        string fullTxt = reader.IsDBNull(3) ? "" : reader.GetString(3);
                        int? targetEmpId = reader.IsDBNull(6) ? (int?)null : reader.GetInt32(6);
                        string targetEmpName = reader.IsDBNull(7) ? "" : reader.GetString(7);
                        string targetEmpNum = reader.IsDBNull(8) ? "" : reader.GetString(8);
                        string docType = reader.IsDBNull(9) ? "General" : reader.GetString(9);
                        int? pYear = reader.IsDBNull(10) ? (int?)null : reader.GetInt32(10);
                        int? pMonth = reader.IsDBNull(11) ? (int?)null : reader.GetInt32(11);
                        string fName = reader.IsDBNull(12) ? "" : reader.GetString(12);
                        bool hasFile = reader.GetInt32(13) == 1;
                        bool reqSig = reader.IsDBNull(14) ? true : reader.GetBoolean(14);
                        string priority = reader.IsDBNull(15) ? "Normal" : reader.GetString(15);
                        int consentCount = reader.GetInt32(16);

                        list.Add(new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "title", reader.GetString(1) },
                            { "content", shortTxt },
                            { "shortText", shortTxt },
                            { "fullText", fullTxt },
                            { "hasFullText", !string.IsNullOrWhiteSpace(fullTxt) },
                            { "isActive", reader.GetBoolean(4) },
                            { "createdAt", reader.GetDateTime(5).ToString("s") },
                            { "targetEmployeeId", targetEmpId },
                            { "targetEmployeeName", targetEmpName },
                            { "targetEmployeeNumber", targetEmpNum },
                            { "documentType", docType },
                            { "periodYear", pYear },
                            { "periodMonth", pMonth },
                            { "fileName", fName },
                            { "hasFile", hasFile },
                            { "requiresSignature", reqSig },
                            { "priority", priority },
                            { "consentCount", consentCount }
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
            SendError(context, 400, "Neplatné ID dokumentu.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand(@"
SELECT d.Id, d.Title, ISNULL(d.ShortText, d.Content) AS ShortText, ISNULL(d.FullText, '') AS FullText,
       d.IsActive, d.CreatedAt, d.TargetEmployeeId, e.FullName AS TargetEmployeeName, e.EmployeeNumber AS TargetEmployeeNumber,
       d.DocumentType, d.PeriodYear, d.PeriodMonth, d.FileName, d.RequiresSignature, d.Priority
FROM [Kipacky].[kipa_Documents] d
LEFT JOIN [Kipacky].[kipa_Employees] e ON d.TargetEmployeeId = e.Id
WHERE d.Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        string shortTxt = reader.IsDBNull(2) ? "" : reader.GetString(2);
                        string fullTxt = reader.IsDBNull(3) ? "" : reader.GetString(3);
                        int? targetEmpId = reader.IsDBNull(6) ? (int?)null : reader.GetInt32(6);
                        string targetEmpName = reader.IsDBNull(7) ? "" : reader.GetString(7);
                        string targetEmpNum = reader.IsDBNull(8) ? "" : reader.GetString(8);
                        string docType = reader.IsDBNull(9) ? "General" : reader.GetString(9);
                        int? pYear = reader.IsDBNull(10) ? (int?)null : reader.GetInt32(10);
                        int? pMonth = reader.IsDBNull(11) ? (int?)null : reader.GetInt32(11);
                        string fName = reader.IsDBNull(12) ? "" : reader.GetString(12);
                        bool reqSig = reader.IsDBNull(13) ? true : reader.GetBoolean(13);
                        string priority = reader.IsDBNull(14) ? "Normal" : reader.GetString(14);

                        SendJson(context, new Dictionary<string, object>
                        {
                            { "id", reader.GetInt32(0) },
                            { "title", reader.GetString(1) },
                            { "shortText", shortTxt },
                            { "fullText", fullTxt },
                            { "isActive", reader.GetBoolean(4) },
                            { "createdAt", reader.GetDateTime(5).ToString("s") },
                            { "targetEmployeeId", targetEmpId },
                            { "targetEmployeeName", targetEmpName },
                            { "targetEmployeeNumber", targetEmpNum },
                            { "documentType", docType },
                            { "periodYear", pYear },
                            { "periodMonth", pMonth },
                            { "fileName", fName },
                            { "requiresSignature", reqSig },
                            { "priority", priority }
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
        int? targetEmpId = data.ContainsKey("targetEmployeeId") && data["targetEmployeeId"] != null && !string.IsNullOrEmpty(data["targetEmployeeId"].ToString()) ? (int?)Convert.ToInt32(data["targetEmployeeId"]) : null;
        string docType = data.ContainsKey("documentType") ? Convert.ToString(data["documentType"]) : "General";
        int? pYear = data.ContainsKey("periodYear") && data["periodYear"] != null && !string.IsNullOrEmpty(data["periodYear"].ToString()) ? (int?)Convert.ToInt32(data["periodYear"]) : null;
        int? pMonth = data.ContainsKey("periodMonth") && data["periodMonth"] != null && !string.IsNullOrEmpty(data["periodMonth"].ToString()) ? (int?)Convert.ToInt32(data["periodMonth"]) : null;
        string fName = data.ContainsKey("fileName") ? Convert.ToString(data["fileName"]) : null;
        string fBase64 = data.ContainsKey("fileBase64") ? Convert.ToString(data["fileBase64"]) : null;
        bool reqSig = data.ContainsKey("requiresSignature") ? Convert.ToBoolean(data["requiresSignature"]) : true;
        string priority = data.ContainsKey("priority") ? Convert.ToString(data["priority"]) : "Normal";

        if (string.IsNullOrWhiteSpace(title))
        {
            SendError(context, 400, "Název dokumentu je povinný.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            if (id > 0)
            {
                using (var cmd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_Documents]
SET Title = @t, Content = @s, ShortText = @s, FullText = @f, IsActive = @a,
    TargetEmployeeId = @emp, DocumentType = @type, PeriodYear = @py, PeriodMonth = @pm,
    RequiresSignature = @req, Priority = @pri" +
(string.IsNullOrEmpty(fBase64) ? "" : ", FileName = @fn, FileBase64 = @fb") + @"
WHERE Id = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@t", title);
                    cmd.Parameters.AddWithValue("@s", shortText);
                    cmd.Parameters.AddWithValue("@f", string.IsNullOrEmpty(fullText) ? (object)DBNull.Value : fullText);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.Parameters.AddWithValue("@emp", targetEmpId.HasValue ? (object)targetEmpId.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@type", docType);
                    cmd.Parameters.AddWithValue("@py", pYear.HasValue ? (object)pYear.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@pm", pMonth.HasValue ? (object)pMonth.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@req", reqSig);
                    cmd.Parameters.AddWithValue("@pri", priority);
                    if (!string.IsNullOrEmpty(fBase64))
                    {
                        cmd.Parameters.AddWithValue("@fn", string.IsNullOrEmpty(fName) ? "dokument.pdf" : fName);
                        cmd.Parameters.AddWithValue("@fb", fBase64);
                    }
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_Documents]
(Title, Content, ShortText, FullText, IsActive, TargetEmployeeId, DocumentType, PeriodYear, PeriodMonth, FileName, FileBase64, RequiresSignature, Priority)
VALUES
(@t, @s, @s, @f, @a, @emp, @type, @py, @pm, @fn, @fb, @req, @pri)", conn))
                {
                    cmd.Parameters.AddWithValue("@t", title);
                    cmd.Parameters.AddWithValue("@s", shortText);
                    cmd.Parameters.AddWithValue("@f", string.IsNullOrEmpty(fullText) ? (object)DBNull.Value : fullText);
                    cmd.Parameters.AddWithValue("@a", isActive);
                    cmd.Parameters.AddWithValue("@emp", targetEmpId.HasValue ? (object)targetEmpId.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@type", docType);
                    cmd.Parameters.AddWithValue("@py", pYear.HasValue ? (object)pYear.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@pm", pMonth.HasValue ? (object)pMonth.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@fn", string.IsNullOrEmpty(fName) ? (object)DBNull.Value : fName);
                    cmd.Parameters.AddWithValue("@fb", string.IsNullOrEmpty(fBase64) ? (object)DBNull.Value : fBase64);
                    cmd.Parameters.AddWithValue("@req", reqSig);
                    cmd.Parameters.AddWithValue("@pri", priority);
                    cmd.ExecuteNonQuery();
                }
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleDeleteDocument(HttpContext context)
    {
        int id = Convert.ToInt32(context.Request.QueryString["id"]);
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("UPDATE [Kipacky].[kipa_Documents] SET IsActive = 0 WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }
        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleGetDocumentFile(HttpContext context)
    {
        int id = Convert.ToInt32(context.Request.QueryString["id"]);
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand("SELECT FileName, FileBase64 FROM [Kipacky].[kipa_Documents] WHERE Id = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var r = cmd.ExecuteReader())
                {
                    if (r.Read())
                    {
                        string fName = r.IsDBNull(0) ? "dokument.pdf" : r.GetString(0);
                        string b64 = r.IsDBNull(1) ? "" : r.GetString(1);
                        SendJson(context, new Dictionary<string, object>
                        {
                            { "fileName", fName },
                            { "fileBase64", b64 }
                        });
                        return;
                    }
                }
            }
        }
        SendError(context, 404, "Soubor nebyl nalezen.");
    }

    private void HandleUploadPayslipsBatch(HttpContext context)
    {
        var data = ReadJsonBody(context);
        var list = data.ContainsKey("payslips") ? data["payslips"] as ArrayList : null;
        if (list == null || list.Count == 0)
        {
            SendError(context, 400, "Nebyly předány žádné soubory výplatních pásek.");
            return;
        }

        var results = new List<Dictionary<string, object>>();
        int successCount = 0;
        int failCount = 0;

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            var empMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            var empNameMap = new Dictionary<int, string>();
            using (var cmdEmps = new SqlCommand("SELECT Id, EmployeeNumber, FullName FROM [Kipacky].[kipa_Employees] WHERE EmployeeNumber IS NOT NULL AND LEN(EmployeeNumber) > 0", conn))
            {
                using (var r = cmdEmps.ExecuteReader())
                {
                    while (r.Read())
                    {
                        int empId = r.GetInt32(0);
                        string num = r.GetString(1).Trim();
                        string name = r.GetString(2);
                        if (!empMap.ContainsKey(num))
                        {
                            empMap[num] = empId;
                            empNameMap[empId] = name;
                        }
                    }
                }
            }

            foreach (var itemObj in list)
            {
                var item = itemObj as Dictionary<string, object>;
                if (item == null) continue;

                string fileName = item.ContainsKey("fileName") ? Convert.ToString(item["fileName"]).Trim() : "";
                string fileBase64 = item.ContainsKey("fileBase64") ? Convert.ToString(item["fileBase64"]).Trim() : "";

                if (string.IsNullOrEmpty(fileName))
                {
                    failCount++;
                    results.Add(new Dictionary<string, object>
                    {
                        { "fileName", fileName },
                        { "success", false },
                        { "error", "Chybí název souboru." }
                    });
                    continue;
                }

                string nameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
                string[] parts = nameWithoutExt.Split('_');
                if (parts.Length < 3)
                {
                    failCount++;
                    results.Add(new Dictionary<string, object>
                    {
                        { "fileName", fileName },
                        { "success", false },
                        { "error", "Neplatný formát názvu. Očekáván tvar: 'osobnicislo_RR_MM.pdf'." }
                    });
                    continue;
                }

                string empNum = parts[0].Trim();
                int parsedYear = 0;
                int parsedMonth = 0;

                if (!int.TryParse(parts[1], out parsedYear) || !int.TryParse(parts[2], out parsedMonth))
                {
                    failCount++;
                    results.Add(new Dictionary<string, object>
                    {
                        { "fileName", fileName },
                        { "success", false },
                        { "error", "Číslo roku nebo měsíce v názvu není platné číslo." }
                    });
                    continue;
                }

                if (parsedYear < 100)
                {
                    parsedYear = 2000 + parsedYear;
                }

                if (parsedMonth < 1 || parsedMonth > 12)
                {
                    failCount++;
                    results.Add(new Dictionary<string, object>
                    {
                        { "fileName", fileName },
                        { "success", false },
                        { "error", "Měsíc musí být v rozmezí 1 až 12." }
                    });
                    continue;
                }

                if (!empMap.ContainsKey(empNum))
                {
                    failCount++;
                    results.Add(new Dictionary<string, object>
                    {
                        { "fileName", fileName },
                        { "success", false },
                        { "employeeNumber", empNum },
                        { "year", parsedYear },
                        { "month", parsedMonth },
                        { "error", "Zaměstnanec s osobním číslem #" + empNum + " nebyl v systému nalezen." }
                    });
                    continue;
                }

                int targetEmpId = empMap[empNum];
                string targetEmpName = empNameMap[targetEmpId];

                string docTitle = "Výplatní páska " + parsedMonth.ToString("D2") + "/" + parsedYear + " – " + targetEmpName;
                string docShort = "Výplatní páska za období " + parsedMonth.ToString("D2") + "/" + parsedYear + ".";
                string docFull = "Mzdový list a výplatní páska pro pracovníka " + targetEmpName + " (os. č. " + empNum + ") za období " + parsedMonth.ToString("D2") + "/" + parsedYear + ".";

                int existingDocId = 0;
                using (var cmdCheck = new SqlCommand("SELECT TOP 1 Id FROM [Kipacky].[kipa_Documents] WHERE DocumentType = 'Payslip' AND TargetEmployeeId = @empId AND PeriodYear = @y AND PeriodMonth = @m", conn))
                {
                    cmdCheck.Parameters.AddWithValue("@empId", targetEmpId);
                    cmdCheck.Parameters.AddWithValue("@y", parsedYear);
                    cmdCheck.Parameters.AddWithValue("@m", parsedMonth);
                    object obj = cmdCheck.ExecuteScalar();
                    if (obj != null && obj != DBNull.Value)
                    {
                        existingDocId = Convert.ToInt32(obj);
                    }
                }

                if (existingDocId > 0)
                {
                    using (var cmdUpd = new SqlCommand(@"
UPDATE [Kipacky].[kipa_Documents]
SET Title = @t,
    ShortText = @s,
    Content = @s,
    FullText = @f,
    FileName = @fn,
    FileBase64 = @fb,
    IsActive = 1,
    CreatedAt = GETDATE()
WHERE Id = @id", conn))
                    {
                        cmdUpd.Parameters.AddWithValue("@t", docTitle);
                        cmdUpd.Parameters.AddWithValue("@s", docShort);
                        cmdUpd.Parameters.AddWithValue("@f", docFull);
                        cmdUpd.Parameters.AddWithValue("@fn", fileName);
                        cmdUpd.Parameters.AddWithValue("@fb", fileBase64);
                        cmdUpd.Parameters.AddWithValue("@id", existingDocId);
                        cmdUpd.ExecuteNonQuery();
                    }
                }
                else
                {
                    using (var cmdIns = new SqlCommand(@"
INSERT INTO [Kipacky].[kipa_Documents]
(Title, Content, ShortText, FullText, IsActive, TargetEmployeeId, DocumentType, PeriodYear, PeriodMonth, FileName, FileBase64, RequiresSignature, Priority)
VALUES
(@t, @s, @s, @f, 1, @empId, 'Payslip', @y, @m, @fn, @fb, 0, 'Normal')", conn))
                    {
                        cmdIns.Parameters.AddWithValue("@t", docTitle);
                        cmdIns.Parameters.AddWithValue("@s", docShort);
                        cmdIns.Parameters.AddWithValue("@f", docFull);
                        cmdIns.Parameters.AddWithValue("@empId", targetEmpId);
                        cmdIns.Parameters.AddWithValue("@y", parsedYear);
                        cmdIns.Parameters.AddWithValue("@m", parsedMonth);
                        cmdIns.Parameters.AddWithValue("@fn", fileName);
                        cmdIns.Parameters.AddWithValue("@fb", fileBase64);
                        cmdIns.ExecuteNonQuery();
                    }
                }

                successCount++;
                results.Add(new Dictionary<string, object>
                {
                    { "fileName", fileName },
                    { "success", true },
                    { "employeeId", targetEmpId },
                    { "employeeName", targetEmpName },
                    { "employeeNumber", empNum },
                    { "year", parsedYear },
                    { "month", parsedMonth }
                });
            }
        }

        SendJson(context, new Dictionary<string, object>
        {
            { "success", true },
            { "totalCount", list.Count },
            { "successCount", successCount },
            { "failCount", failCount },
            { "results", results }
        });
    }

    private void HandleGetEmployeePayslips(HttpContext context)
    {
        string pin = context.Request.QueryString["pinCode"] ?? "";
        int empId = 0;
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);
            using (var cmdP = new SqlCommand("SELECT Id FROM [Kipacky].[kipa_Employees] WHERE PinCode = @p AND Status = 'Active'", conn))
            {
                cmdP.Parameters.AddWithValue("@p", pin);
                object obj = cmdP.ExecuteScalar();
                if (obj != null && obj != DBNull.Value) empId = Convert.ToInt32(obj);
            }

            if (empId <= 0)
            {
                SendError(context, 401, "Neplatný PIN.");
                return;
            }

            var list = new List<Dictionary<string, object>>();
            using (var cmd = new SqlCommand(@"
SELECT d.Id, d.Title, d.PeriodYear, d.PeriodMonth, d.FileName, d.CreatedAt,
       (SELECT MAX(c.AgreedAt) FROM [Kipacky].[kipa_DocumentConsents] c WHERE c.DocumentId = d.Id AND c.EmployeeId = @empId) AS ViewedAt
FROM [Kipacky].[kipa_Documents] d
WHERE d.IsActive = 1 AND d.DocumentType = 'Payslip' AND d.TargetEmployeeId = @empId
ORDER BY d.PeriodYear DESC, d.PeriodMonth DESC", conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                using (var r = cmd.ExecuteReader())
                {
                    while (r.Read())
                    {
                        DateTime? viewed = r.IsDBNull(6) ? (DateTime?)null : r.GetDateTime(6);
                        list.Add(new Dictionary<string, object>
                        {
                            { "id", r.GetInt32(0) },
                            { "title", r.GetString(1) },
                            { "year", r.IsDBNull(2) ? 0 : r.GetInt32(2) },
                            { "month", r.IsDBNull(3) ? 0 : r.GetInt32(3) },
                            { "fileName", r.IsDBNull(4) ? "" : r.GetString(4) },
                            { "createdAt", r.GetDateTime(5).ToString("s") },
                            { "viewedAt", viewed.HasValue ? viewed.Value.ToString("s") : null }
                        });
                    }
                }
            }
            SendJson(context, list);
        }
    }

    private void HandleDownloadPayslipKiosk(HttpContext context)
    {
        string pin = context.Request.QueryString["pinCode"] ?? "";
        int docId = Convert.ToInt32(context.Request.QueryString["id"]);
        int empId = 0;
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);
            using (var cmdP = new SqlCommand("SELECT Id FROM [Kipacky].[kipa_Employees] WHERE PinCode = @p AND Status = 'Active'", conn))
            {
                cmdP.Parameters.AddWithValue("@p", pin);
                object obj = cmdP.ExecuteScalar();
                if (obj != null && obj != DBNull.Value) empId = Convert.ToInt32(obj);
            }

            if (empId <= 0)
            {
                SendError(context, 401, "Neplatný PIN.");
                return;
            }

            string fName = "";
            string b64 = "";
            using (var cmd = new SqlCommand("SELECT FileName, FileBase64 FROM [Kipacky].[kipa_Documents] WHERE Id = @id AND TargetEmployeeId = @empId AND IsActive = 1", conn))
            {
                cmd.Parameters.AddWithValue("@id", docId);
                cmd.Parameters.AddWithValue("@empId", empId);
                using (var r = cmd.ExecuteReader())
                {
                    if (r.Read())
                    {
                        fName = r.IsDBNull(0) ? "vyplatni_paska.pdf" : r.GetString(0);
                        b64 = r.IsDBNull(1) ? "" : r.GetString(1);
                    }
                }
            }

            if (string.IsNullOrEmpty(b64))
            {
                SendError(context, 404, "Výplatní páska nebyla nalezena.");
                return;
            }

            using (var cmdCons = new SqlCommand("INSERT INTO [Kipacky].[kipa_DocumentConsents] (EmployeeId, DocumentId, AgreedAt) VALUES (@emp, @doc, GETDATE())", conn))
            {
                cmdCons.Parameters.AddWithValue("@emp", empId);
                cmdCons.Parameters.AddWithValue("@doc", docId);
                cmdCons.ExecuteNonQuery();
            }

            SendJson(context, new Dictionary<string, object>
            {
                { "fileName", fName },
                { "fileBase64", b64 }
            });
        }
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
        var ytdNormHoursMap = new Dictionary<int, double>();

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            string empSql = "SELECT Id, FullName, ContractType, ISNULL(SelfScheduled, 0) AS SelfScheduled FROM [Kipacky].[kipa_Employees] WHERE 1=1 ";
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
                            { "contract", reader.GetString(2) },
                            { "selfScheduled", reader.GetBoolean(3) }
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

            // Docházka za celý rok (pro výpočet limitu 300h u DPP - fyzické hodiny)
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

            // Produkce za celý rok pro výpočet limitu 300h u DPP (Normočas)
            string ytdProdSql = @"
SELECT p.EmployeeId,
       SUM(CASE WHEN op.NormPerHour > 0 THEN CAST(ISNULL(p.ValidatedPieces, p.SubmittedPieces) AS FLOAT) / op.NormPerHour ELSE 0 END) AS YtdNorm
FROM [Kipacky].[kipa_ProductionLogs] p
JOIN [Kipacky].[kipa_Operations] op ON p.OperationId = op.Id
WHERE p.[Date] >= @yStart AND p.[Date] < @yEnd AND p.[Status] = 'Approved'
GROUP BY p.EmployeeId";
            using (var cmd = new SqlCommand(ytdProdSql, conn))
            {
                cmd.Parameters.AddWithValue("@yStart", yearStart);
                cmd.Parameters.AddWithValue("@yEnd", yearEnd);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        ytdNormHoursMap[reader.GetInt32(0)] = Convert.ToDouble(reader.GetValue(1));
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
            csvSb.AppendLine("Jm\u00E9no zam\u011Bstnance;\u00DAvazek;Samorozvrhov\u00E1n\u00ED;Datum;P\u0159\u00EDchod;Odchod;Hrub\u00FD \u010Das (hod:min);Z\u00E1konn\u00E1 p\u0159est\u00E1vka (min);\u010Cist\u00FD \u010Das (hod:min);\u010Cist\u00FD \u010Das (h);V\u00EDkendov\u00E9 hodiny (h);Schv\u00E1leno kus\u016F;Zmetky (ks);Normo\u010Das (h);Vyd\u011Blan\u00E1 \u010D\u00E1stka (K\u010D);Pozn\u00E1mka");
        }

        foreach (var emp in employees)
        {
            int eId = Convert.ToInt32(emp["id"]);
            string eName = Convert.ToString(emp["name"]);
            string eContract = Convert.ToString(emp["contract"]);
            bool eSelfScheduled = emp.ContainsKey("selfScheduled") && Convert.ToBoolean(emp["selfScheduled"]);
            double ytdNormHours = ytdNormHoursMap.ContainsKey(eId) ? ytdNormHoursMap[eId] : 0.0;

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
            double totalWeekendHours = 0;
            int incompleteCount = 0;
            int completeCount = 0;

            foreach (var s in shifts)
            {
                DateTime shiftDay = DateTime.Parse(Convert.ToString(s["clockInTime"])).Date;
                bool isWeekend = (shiftDay.DayOfWeek == DayOfWeek.Saturday || shiftDay.DayOfWeek == DayOfWeek.Sunday);
                bool eligibleWeekend = !eSelfScheduled && isWeekend;
                s["isWeekend"] = isWeekend;
                s["eligibleWeekendOvertime"] = eligibleWeekend;

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
                s["normHours"] = Math.Round(dayProdHours, 2);
                s["earnedCzk"] = Math.Round(dayEarnedCzk, 2);

                if ((bool)s["isIncomplete"])
                {
                    s["weekendHours"] = 0.0;
                    incompleteCount++;
                }
                else
                {
                    completeCount++;
                    double netH = (double)s["netHours"];
                    totalGross += (double)s["grossHours"];
                    totalBreak += (double)s["breakHours"];
                    totalNet += netH;

                    double wH = eligibleWeekend ? netH : 0.0;
                    s["weekendHours"] = Math.Round(wH, 2);
                    totalWeekendHours += wH;
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
                { "selfScheduled", eSelfScheduled },
                { "totalShifts", completeCount },
                { "totalGrossHours", Math.Round(totalGross, 2) },
                { "totalBreakHours", Math.Round(totalBreak, 2) },
                { "totalNetHours", Math.Round(totalNet, 2) },
                { "totalWeekendHours", Math.Round(totalWeekendHours, 2) },
                { "incompleteShiftsCount", incompleteCount },
                { "yearToDateNetHours", Math.Round(ytdNetHours, 2) },
                { "totalApprovedPieces", totalApprovedPieces },
                { "totalPendingPieces", totalPendingPieces },
                { "totalDefectPieces", totalDefectPieces },
                { "totalProductiveHours", Math.Round(totalProductiveHours, 2) },
                { "normHours", Math.Round(totalProductiveHours, 2) },
                { "yearToDateNormHours", Math.Round(ytdNormHours, 2) },
                { "remainingDppHours", Math.Max(0, 300 - Math.Round(ytdNormHours, 2)) },
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
                    double wH = Convert.ToDouble(s["weekendHours"]);
                    int appPcs = Convert.ToInt32(s["approvedPieces"]);
                    int defPcs = Convert.ToInt32(s["defectPieces"]);
                    double prodH = Convert.ToDouble(s["productiveHours"]);
                    double earnCzk = Convert.ToDouble(s["earnedCzk"]);

                    csvSb.AppendLine(string.Format("{0};{1};{2};{3};{4};{5};{6};{7};{8};{9};{10};{11};{12};{13};{14};{15}",
                        EscapeCsv(eName), EscapeCsv(eContract), eSelfScheduled ? "ANO" : "NE", dt.ToString("dd.MM.yyyy"), inStr, outStr,
                        grossStr, breakMin, netStr, netH.ToString("F2", CultureInfo.InvariantCulture),
                        wH.ToString("F2", CultureInfo.InvariantCulture),
                        appPcs, defPcs, prodH.ToString("F2", CultureInfo.InvariantCulture),
                        earnCzk.ToString("F2", CultureInfo.InvariantCulture),
                        EscapeCsv(Convert.ToString(s["note"]))));
                }

                string totGrossStr = FormatTimeSpan(TimeSpan.FromHours(totalGross)).Substring(0, 5);
                string totNetStr = FormatTimeSpan(TimeSpan.FromHours(totalNet)).Substring(0, 5);
                csvSb.AppendLine(string.Format("CELKEM {0};{1};{2};;--;--;{3};{4};{5};{6};{7};{8};{9};{10};{11};Po\u010Det sm\u011Bn: {12} | Normo\u010Das: {10} h | YTD Normo\u010Das: {13} h | Zb\u00FDv\u00E1 z 300h DPP: {14} h",
                    EscapeCsv(eName), EscapeCsv(eContract), eSelfScheduled ? "ANO" : "NE",
                    totGrossStr, (int)(totalBreak * 60), totNetStr,
                    totalNet.ToString("F2", CultureInfo.InvariantCulture),
                    totalWeekendHours.ToString("F2", CultureInfo.InvariantCulture),
                    totalApprovedPieces, totalDefectPieces,
                    totalProductiveHours.ToString("F2", CultureInfo.InvariantCulture),
                    totalEarnedCzk.ToString("F2", CultureInfo.InvariantCulture),
                    completeCount, Math.Round(ytdNormHours, 1).ToString(CultureInfo.InvariantCulture),
                    Math.Max(0, 300 - Math.Round(ytdNormHours, 1)).ToString(CultureInfo.InvariantCulture)));
                csvSb.AppendLine(";;;;;;;;;;;;;;;");
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

    private string ExtractYouTubeVideoId(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return "";
        url = url.Trim();
        try
        {
            Match m1 = Regex.Match(url, @"(?:v=|\/embed\/|youtu\.be\/|\/shorts\/|\/live\/)([a-zA-Z0-9_-]{11})");
            if (m1.Success) return m1.Groups[1].Value;
            if (Regex.IsMatch(url, @"^[a-zA-Z0-9_-]{11}$")) return url;
        }
        catch { }
        return "";
    }

    private void HandleGetVideos(HttpContext context)
    {
        int empId = 0;
        int.TryParse(context.Request.QueryString["employeeId"] ?? "0", out empId);
        bool includeInactive = (context.Request.QueryString["includeInactive"] ?? "") == "true" || IsAuthenticated(context);

        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            string sql = @"
                SELECT v.Id, v.Title, v.Url, v.VideoId, v.Category, v.Description, v.Author, v.ThumbnailUrl, v.Duration, v.IsActive, v.CreatedAt,
                       (SELECT COUNT(*) FROM [Kipacky].[kipa_VideoViews] vv WHERE vv.VideoId = v.Id) AS ViewsCount,
                       (SELECT TOP 1 vv2.ViewedAt FROM [Kipacky].[kipa_VideoViews] vv2 WHERE vv2.VideoId = v.Id AND vv2.EmployeeId = @empId ORDER BY vv2.ViewedAt DESC) AS EmployeeViewedAt
                FROM [Kipacky].[kipa_Videos] v
                WHERE (@inc = 1 OR v.IsActive = 1)
                ORDER BY v.IsActive DESC, v.Id ASC";

            using (var cmd = new SqlCommand(sql, conn))
            {
                cmd.Parameters.AddWithValue("@empId", empId);
                cmd.Parameters.AddWithValue("@inc", includeInactive ? 1 : 0);
                using (var r = cmd.ExecuteReader())
                {
                    while (r.Read())
                    {
                        string vid = r.IsDBNull(3) ? "" : r.GetString(3);
                        string url = r.GetString(2);
                        if (string.IsNullOrEmpty(vid)) vid = ExtractYouTubeVideoId(url);
                        string thumb = r.IsDBNull(7) ? "" : r.GetString(7);
                        if (string.IsNullOrEmpty(thumb) && !string.IsNullOrEmpty(vid))
                        {
                            thumb = "https://i.ytimg.com/vi/" + vid + "/hqdefault.jpg";
                        }

                        list.Add(new Dictionary<string, object>
                        {
                            { "id", r.GetInt32(0) },
                            { "title", r.GetString(1) },
                            { "url", url },
                            { "videoId", vid },
                            { "category", r.IsDBNull(4) ? "BOZP a bezpečnost práce" : r.GetString(4) },
                            { "description", r.IsDBNull(5) ? "" : r.GetString(5) },
                            { "author", r.IsDBNull(6) ? "" : r.GetString(6) },
                            { "thumbnailUrl", thumb },
                            { "duration", r.IsDBNull(8) ? "" : r.GetString(8) },
                            { "isActive", r.GetBoolean(9) },
                            { "createdAt", r.GetDateTime(10).ToString("s") },
                            { "viewsCount", r.IsDBNull(11) ? 0 : r.GetInt32(11) },
                            { "isWatched", !r.IsDBNull(12) },
                            { "watchedAt", r.IsDBNull(12) ? null : r.GetDateTime(12).ToString("s") }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void HandleSaveVideo(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = data.ContainsKey("id") && data["id"] != null ? Convert.ToInt32(data["id"]) : 0;
        string title = data.ContainsKey("title") && data["title"] != null ? Convert.ToString(data["title"]).Trim() : "";
        string url = data.ContainsKey("url") && data["url"] != null ? Convert.ToString(data["url"]).Trim() : "";
        string category = data.ContainsKey("category") && data["category"] != null ? Convert.ToString(data["category"]).Trim() : "BOZP a bezpečnost práce";
        string description = data.ContainsKey("description") && data["description"] != null ? Convert.ToString(data["description"]).Trim() : "";
        string author = data.ContainsKey("author") && data["author"] != null ? Convert.ToString(data["author"]).Trim() : "";
        string thumbnailUrl = data.ContainsKey("thumbnailUrl") && data["thumbnailUrl"] != null ? Convert.ToString(data["thumbnailUrl"]).Trim() : "";
        string duration = data.ContainsKey("duration") && data["duration"] != null ? Convert.ToString(data["duration"]).Trim() : "";
        bool isActive = !data.ContainsKey("isActive") || data["isActive"] == null || Convert.ToBoolean(data["isActive"]);

        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(url))
        {
            SendError(context, 400, "Zadejte název videa a odkaz (URL).");
            return;
        }

        string videoId = data.ContainsKey("videoId") && data["videoId"] != null ? Convert.ToString(data["videoId"]).Trim() : "";
        if (string.IsNullOrEmpty(videoId))
        {
            videoId = ExtractYouTubeVideoId(url);
        }
        if (string.IsNullOrEmpty(thumbnailUrl) && !string.IsNullOrEmpty(videoId))
        {
            thumbnailUrl = "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg";
        }
        if (string.IsNullOrEmpty(category))
        {
            category = "BOZP a bezpečnost práce";
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);

            if (id > 0)
            {
                string sql = @"
                    UPDATE [Kipacky].[kipa_Videos]
                    SET [Title] = @title, [Url] = @url, [VideoId] = @vid, [Category] = @cat,
                        [Description] = @desc, [Author] = @auth, [ThumbnailUrl] = @thumb,
                        [Duration] = @dur, [IsActive] = @act
                    WHERE [Id] = @id";
                using (var cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.Parameters.AddWithValue("@title", title);
                    cmd.Parameters.AddWithValue("@url", url);
                    cmd.Parameters.AddWithValue("@vid", videoId);
                    cmd.Parameters.AddWithValue("@cat", category);
                    cmd.Parameters.AddWithValue("@desc", description);
                    cmd.Parameters.AddWithValue("@auth", author);
                    cmd.Parameters.AddWithValue("@thumb", thumbnailUrl);
                    cmd.Parameters.AddWithValue("@dur", duration);
                    cmd.Parameters.AddWithValue("@act", isActive);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                string sql = @"
                    INSERT INTO [Kipacky].[kipa_Videos] ([Title], [Url], [VideoId], [Category], [Description], [Author], [ThumbnailUrl], [Duration], [IsActive])
                    OUTPUT INSERTED.Id
                    VALUES (@title, @url, @vid, @cat, @desc, @auth, @thumb, @dur, @act)";
                using (var cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@title", title);
                    cmd.Parameters.AddWithValue("@url", url);
                    cmd.Parameters.AddWithValue("@vid", videoId);
                    cmd.Parameters.AddWithValue("@cat", category);
                    cmd.Parameters.AddWithValue("@desc", description);
                    cmd.Parameters.AddWithValue("@auth", author);
                    cmd.Parameters.AddWithValue("@thumb", thumbnailUrl);
                    cmd.Parameters.AddWithValue("@dur", duration);
                    cmd.Parameters.AddWithValue("@act", isActive);
                    id = Convert.ToInt32(cmd.ExecuteScalar());
                }
            }
        }

        SendJson(context, new Dictionary<string, object>
        {
            { "success", true },
            { "id", id },
            { "videoId", videoId }
        });
    }

    private void HandleDeleteVideo(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int id = data.ContainsKey("id") && data["id"] != null ? Convert.ToInt32(data["id"]) : 0;
        if (id == 0) int.TryParse(context.Request.QueryString["id"] ?? "0", out id);

        if (id <= 0)
        {
            SendError(context, 400, "Chybí ID videa.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);
            using (var cmd1 = new SqlCommand("DELETE FROM [Kipacky].[kipa_VideoViews] WHERE [VideoId] = @id", conn))
            {
                cmd1.Parameters.AddWithValue("@id", id);
                cmd1.ExecuteNonQuery();
            }
            using (var cmd2 = new SqlCommand("DELETE FROM [Kipacky].[kipa_Videos] WHERE [Id] = @id", conn))
            {
                cmd2.Parameters.AddWithValue("@id", id);
                cmd2.ExecuteNonQuery();
            }
        }

        SendJson(context, new Dictionary<string, object> { { "success", true } });
    }

    private void HandleConfirmVideoView(HttpContext context)
    {
        var data = ReadJsonBody(context);
        int videoId = data.ContainsKey("videoId") && data["videoId"] != null ? Convert.ToInt32(data["videoId"]) : 0;
        int employeeId = data.ContainsKey("employeeId") && data["employeeId"] != null ? Convert.ToInt32(data["employeeId"]) : 0;

        if (videoId <= 0 || employeeId <= 0)
        {
            SendError(context, 400, "Chybí ID videa nebo zaměstnance.");
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);
            string sql = @"
                IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_VideoViews] WHERE [VideoId] = @vid AND [EmployeeId] = @emp)
                BEGIN
                    INSERT INTO [Kipacky].[kipa_VideoViews] ([VideoId], [EmployeeId], [ViewedAt])
                    VALUES (@vid, @emp, GETDATE());
                END
                ELSE
                BEGIN
                    UPDATE [Kipacky].[kipa_VideoViews] SET [ViewedAt] = GETDATE() WHERE [VideoId] = @vid AND [EmployeeId] = @emp;
                END";
            using (var cmd = new SqlCommand(sql, conn))
            {
                cmd.Parameters.AddWithValue("@vid", videoId);
                cmd.Parameters.AddWithValue("@emp", employeeId);
                cmd.ExecuteNonQuery();
            }
        }

        SendJson(context, new Dictionary<string, object>
        {
            { "success", true },
            { "viewedAt", DateTime.Now.ToString("s") }
        });
    }

    private void HandleGetVideoViews(HttpContext context)
    {
        int videoId = 0;
        int.TryParse(context.Request.QueryString["videoId"] ?? "0", out videoId);

        var list = new List<Dictionary<string, object>>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureSchemaMigrations(conn);
            string sql = @"
                SELECT vv.Id, vv.VideoId, v.Title, vv.EmployeeId, e.Name, e.ContractType, vv.ViewedAt
                FROM [Kipacky].[kipa_VideoViews] vv
                INNER JOIN [Kipacky].[kipa_Videos] v ON v.Id = vv.VideoId
                INNER JOIN [Kipacky].[kipa_Employees] e ON e.Id = vv.EmployeeId
                WHERE (@vid = 0 OR vv.VideoId = @vid)
                ORDER BY vv.ViewedAt DESC";
            using (var cmd = new SqlCommand(sql, conn))
            {
                cmd.Parameters.AddWithValue("@vid", videoId);
                using (var r = cmd.ExecuteReader())
                {
                    while (r.Read())
                    {
                        list.Add(new Dictionary<string, object>
                        {
                            { "id", r.GetInt32(0) },
                            { "videoId", r.GetInt32(1) },
                            { "videoTitle", r.GetString(2) },
                            { "employeeId", r.GetInt32(3) },
                            { "employeeName", r.GetString(4) },
                            { "contractType", r.GetString(5) },
                            { "viewedAt", r.GetDateTime(6).ToString("s") }
                        });
                    }
                }
            }
        }
        SendJson(context, list);
    }

    private void SendJson(HttpContext context, object data, int statusCode = 200)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.ContentEncoding = Encoding.UTF8;
        context.Response.Charset = "utf-8";
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
