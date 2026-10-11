using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Kipacky.Data;
using Kipacky.Services;

var builder = WebApplication.CreateBuilder(args);

// Konfigurace DbContextu s MSSQL (schéma Kipacky)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection in configuration.");

builder.Services.AddDbContext<KipackyDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

// Registrace služeb
builder.Services.AddSingleton<AttendanceReportService>();

// CORS pro lokální vývoj frontendu (Vite na portu 5173 apod.)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Cookie autentizace pro administraci
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "Kipacky.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Inicializace databáze (zajištění schématu Kipacky a tabulek kipa_*)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<KipackyDbContext>();
    try
    {
        db.EnsureSchemaAndTablesCreated();

        // Pokud je tabulka zaměstnanců prázdná, vytvoříme výchozího zaměstnance pro testování
        if (!db.Employees.Any())
        {
            db.Employees.Add(new Employee
            {
                FullName = "Jan Novák (Ukázka)",
                PinCode = "1234",
                ContractType = "DPP",
                IsActive = true
            });
            db.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Chyba při inicializaci schématu Kipacky a tabulek.");
    }
}

app.UseCors("AllowLocalDev");

app.UseAuthentication();
app.UseAuthorization();

app.UseDefaultFiles();
app.UseStaticFiles();

// ==========================================
// 1. AUTENTIZACE ENDPOINTY (/api/auth)
// ==========================================

app.MapPost("/api/auth/login", async (HttpContext http, IConfiguration config, LoginRequest req) =>
{
    var expectedUser = config["AdminAuth:Username"] ?? "admin";
    var expectedPass = config["AdminAuth:Password"] ?? "Kipacky2026!";

    if (req.Username == expectedUser && req.Password == expectedPass)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, req.Username),
            new(ClaimTypes.Role, "Admin")
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
        return Results.Ok(new { success = true, username = req.Username });
    }

    return Results.Unauthorized();
});

app.MapPost("/api/auth/logout", async (HttpContext http) =>
{
    await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Ok(new { success = true });
});

app.MapGet("/api/auth/me", (HttpContext http) =>
{
    var isAuth = http.User.Identity?.IsAuthenticated == true;
    return Results.Ok(new
    {
        isAuthenticated = isAuth,
        username = isAuth ? http.User.Identity?.Name : null
    });
});

// ==========================================
// 2. KLIENSKÁ DOCHÁZKA - KIOSK / PINPAD (/api/attendance)
// ==========================================

// Ověření PINu a zjištění stavu zaměstnance
app.MapPost("/api/attendance/verify-pin", async (KipackyDbContext db, VerifyPinRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.PinCode) || req.PinCode.Length != 4)
    {
        return Results.BadRequest(new { error = "PIN musí mít přesně 4 číslice." });
    }

    var employee = await db.Employees.FirstOrDefaultAsync(e => e.PinCode == req.PinCode && e.IsActive);
    if (employee == null)
    {
        return Results.NotFound(new { error = "Neplatný PIN nebo neaktivní zaměstnanec." });
    }

    // Poslední záznam pro zjištění aktuálního stavu
    var lastLog = await db.AttendanceLogs
        .Where(l => l.EmployeeId == employee.Id)
        .OrderByDescending(l => l.Timestamp)
        .FirstOrDefaultAsync();

    var currentStatus = (lastLog != null && lastLog.EventType == "ClockIn") ? "OnSite" : "OffSite";
    var suggestedAction = currentStatus == "OnSite" ? "ClockOut" : "ClockIn";

    return Results.Ok(new
    {
        employeeId = employee.Id,
        fullName = employee.FullName,
        contractType = employee.ContractType,
        status = currentStatus, // "OnSite" (Na pracovišti) nebo "OffSite" (Mimo pracoviště)
        lastEventType = lastLog?.EventType,
        lastEventTimestamp = lastLog?.Timestamp,
        suggestedAction = suggestedAction // "ClockIn" nebo "ClockOut"
    });
});

// Zápis docházky (Příchod / Odchod) s ochranou proti dvojkliku (5 minut)
app.MapPost("/api/attendance/clock", async (KipackyDbContext db, ClockActionRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.PinCode) || req.PinCode.Length != 4)
    {
        return Results.BadRequest(new { error = "PIN musí mít přesně 4 číslice." });
    }

    if (req.EventType != "ClockIn" && req.EventType != "ClockOut")
    {
        return Results.BadRequest(new { error = "Neplatný typ události. Povolené hodnoty: ClockIn, ClockOut." });
    }

    var employee = await db.Employees.FirstOrDefaultAsync(e => e.PinCode == req.PinCode && e.IsActive);
    if (employee == null)
    {
        return Results.NotFound(new { error = "Neplatný PIN nebo neaktivní zaměstnanec." });
    }

    var now = DateTime.Now;

    // Kontrola Anti-Double-Click: pokus o stejnou akci v intervalu < 5 minut
    var recentLog = await db.AttendanceLogs
        .Where(l => l.EmployeeId == employee.Id)
        .OrderByDescending(l => l.Timestamp)
        .FirstOrDefaultAsync();

    if (recentLog != null && recentLog.EventType == req.EventType)
    {
        var diff = now - recentLog.Timestamp;
        if (diff.TotalMinutes < 5 && diff.TotalMinutes >= 0)
        {
            var eventNameCzech = req.EventType == "ClockIn" ? "příchod" : "odchod";
            return Results.Conflict(new
            {
                duplicate = true,
                error = $"Tento {eventNameCzech} již byl zaznamenán před méně než 5 minutami ({recentLog.Timestamp:HH:mm}).",
                lastTimestamp = recentLog.Timestamp
            });
        }
    }

    var newLog = new AttendanceLog
    {
        EmployeeId = employee.Id,
        Timestamp = now,
        EventType = req.EventType,
        IsManualEdit = false,
        Note = null
    };

    db.AttendanceLogs.Add(newLog);
    await db.SaveChangesAsync();

    var actionText = req.EventType == "ClockIn" ? "Příchod" : "Odchod";
    var message = $"{actionText} zaznamenán v {now:HH:mm}";

    return Results.Ok(new
    {
        success = true,
        employeeName = employee.FullName,
        eventType = req.EventType,
        timestamp = now,
        formattedTime = now.ToString("HH:mm"),
        message
    });
});

// ==========================================
// 3. ADMINISTRACE - ZAMĚSTNANCI (/api/admin/employees)
// ==========================================

var adminGroup = app.MapGroup("/api/admin").RequireAuthorization();

adminGroup.MapGet("/employees", async (KipackyDbContext db) =>
{
    var employees = await db.Employees
        .OrderByDescending(e => e.IsActive)
        .ThenBy(e => e.FullName)
        .ToListAsync();
    return Results.Ok(employees);
});

adminGroup.MapPost("/employees", async (KipackyDbContext db, CreateEmployeeRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.FullName))
        return Results.BadRequest(new { error = "Jméno zaměstnance je povinné." });

    if (string.IsNullOrWhiteSpace(req.PinCode) || req.PinCode.Length != 4 || !req.PinCode.All(char.IsDigit))
        return Results.BadRequest(new { error = "PIN musí mít přesně 4 číslice." });

    // Kontrola unikátnosti PINu mezi aktivními
    var pinExists = await db.Employees.AnyAsync(e => e.PinCode == req.PinCode && e.IsActive);
    if (pinExists)
        return Results.BadRequest(new { error = "Tento PIN již používá jiný aktivní zaměstnanec." });

    var emp = new Employee
    {
        FullName = req.FullName.Trim(),
        PinCode = req.PinCode.Trim(),
        ContractType = string.IsNullOrWhiteSpace(req.ContractType) ? "DPP" : req.ContractType.Trim().ToUpperInvariant(),
        IsActive = req.IsActive,
        CreatedAt = DateTime.UtcNow
    };

    db.Employees.Add(emp);
    await db.SaveChangesAsync();
    return Results.Ok(emp);
});

adminGroup.MapPut("/employees/{id:int}", async (KipackyDbContext db, int id, UpdateEmployeeRequest req) =>
{
    var emp = await db.Employees.FindAsync(id);
    if (emp == null) return Results.NotFound();

    if (!string.IsNullOrWhiteSpace(req.FullName))
        emp.FullName = req.FullName.Trim();

    if (!string.IsNullOrWhiteSpace(req.PinCode))
    {
        if (req.PinCode.Length != 4 || !req.PinCode.All(char.IsDigit))
            return Results.BadRequest(new { error = "PIN musí mít přesně 4 číslice." });

        var pinExists = await db.Employees.AnyAsync(e => e.PinCode == req.PinCode && e.Id != id && e.IsActive);
        if (pinExists)
            return Results.BadRequest(new { error = "Tento PIN již používá jiný aktivní zaměstnanec." });

        emp.PinCode = req.PinCode.Trim();
    }

    if (!string.IsNullOrWhiteSpace(req.ContractType))
        emp.ContractType = req.ContractType.Trim().ToUpperInvariant();

    emp.IsActive = req.IsActive;

    await db.SaveChangesAsync();
    return Results.Ok(emp);
});

// ==========================================
// 4. ADMINISTRACE - SPRÁVA ZÁZNAMŮ DOCHÁZKY (/api/admin/logs)
// ==========================================

adminGroup.MapGet("/logs", async (KipackyDbContext db, int? employeeId, DateTime? fromDate, DateTime? toDate) =>
{
    var query = db.AttendanceLogs.Include(l => l.Employee).AsQueryable();

    if (employeeId.HasValue)
        query = query.Where(l => l.EmployeeId == employeeId.Value);

    if (fromDate.HasValue)
        query = query.Where(l => l.Timestamp >= fromDate.Value.Date);

    if (toDate.HasValue)
        query = query.Where(l => l.Timestamp <= toDate.Value.Date.AddDays(1).AddTicks(-1));

    var logs = await query
        .OrderByDescending(l => l.Timestamp)
        .Take(500)
        .Select(l => new
        {
            l.Id,
            l.EmployeeId,
            EmployeeName = l.Employee != null ? l.Employee.FullName : "Neznámý",
            ContractType = l.Employee != null ? l.Employee.ContractType : "",
            l.Timestamp,
            l.EventType,
            l.IsManualEdit,
            l.Note
        })
        .ToListAsync();

    return Results.Ok(logs);
});

adminGroup.MapPost("/logs", async (KipackyDbContext db, CreateLogRequest req) =>
{
    var emp = await db.Employees.FindAsync(req.EmployeeId);
    if (emp == null) return Results.NotFound(new { error = "Zaměstnanec nenalezen." });

    if (req.EventType != "ClockIn" && req.EventType != "ClockOut")
        return Results.BadRequest(new { error = "Neplatný typ události." });

    var log = new AttendanceLog
    {
        EmployeeId = req.EmployeeId,
        Timestamp = req.Timestamp,
        EventType = req.EventType,
        IsManualEdit = true, // Ruční vložení
        Note = string.IsNullOrWhiteSpace(req.Note) ? "Ruční vložení administrátorem" : req.Note.Trim()
    };

    db.AttendanceLogs.Add(log);
    await db.SaveChangesAsync();

    return Results.Ok(log);
});

adminGroup.MapPut("/logs/{id:int}", async (KipackyDbContext db, int id, UpdateLogRequest req) =>
{
    var log = await db.AttendanceLogs.FindAsync(id);
    if (log == null) return Results.NotFound();

    if (req.EventType != "ClockIn" && req.EventType != "ClockOut")
        return Results.BadRequest(new { error = "Neplatný typ události." });

    log.Timestamp = req.Timestamp;
    log.EventType = req.EventType;
    log.IsManualEdit = true; // Označeno jako ruční editace
    log.Note = string.IsNullOrWhiteSpace(req.Note) ? "Upraveno administrátorem" : req.Note.Trim();

    await db.SaveChangesAsync();
    return Results.Ok(log);
});

adminGroup.MapDelete("/logs/{id:int}", async (KipackyDbContext db, int id) =>
{
    var log = await db.AttendanceLogs.FindAsync(id);
    if (log == null) return Results.NotFound();

    db.AttendanceLogs.Remove(log);
    await db.SaveChangesAsync();
    return Results.Ok(new { success = true });
});

// ==========================================
// 5. ADMINISTRACE - REPORTY A VÝPOČET MEZD (/api/admin/reports)
// ==========================================

adminGroup.MapGet("/reports/monthly", async (KipackyDbContext db, AttendanceReportService reportService, int year, int month, int? employeeId) =>
{
    if (month < 1 || month > 12) return Results.BadRequest("Neplatný měsíc.");

    var startDate = new DateTime(year, month, 1);
    var endDate = startDate.AddMonths(1);

    var employeesQuery = db.Employees.AsQueryable();
    if (employeeId.HasValue)
        employeesQuery = employeesQuery.Where(e => e.Id == employeeId.Value);

    var employees = await employeesQuery.ToListAsync();

    var logs = await db.AttendanceLogs
        .Where(l => l.Timestamp >= startDate && l.Timestamp < endDate)
        .OrderBy(l => l.Timestamp)
        .ToListAsync();

    var report = reportService.GenerateMonthlyReport(employees, logs, year, month);
    return Results.Ok(report);
});

adminGroup.MapGet("/reports/monthly/csv", async (KipackyDbContext db, AttendanceReportService reportService, int year, int month, int? employeeId) =>
{
    if (month < 1 || month > 12) return Results.BadRequest("Neplatný měsíc.");

    var startDate = new DateTime(year, month, 1);
    var endDate = startDate.AddMonths(1);

    var employeesQuery = db.Employees.AsQueryable();
    if (employeeId.HasValue)
        employeesQuery = employeesQuery.Where(e => e.Id == employeeId.Value);

    var employees = await employeesQuery.ToListAsync();

    var logs = await db.AttendanceLogs
        .Where(l => l.Timestamp >= startDate && l.Timestamp < endDate)
        .OrderBy(l => l.Timestamp)
        .ToListAsync();

    var report = reportService.GenerateMonthlyReport(employees, logs, year, month);
    var csvContent = reportService.ExportToCsv(report);

    var fileName = $"Dochazka_{year}_{month:D2}.csv";
    return Results.File(System.Text.Encoding.UTF8.GetBytes(csvContent), "text/csv; charset=utf-8", fileName);
});

// Fallback pro React SPA směrování
app.MapFallbackToFile("index.html");

app.Run();

// ==========================================
// DTOs pro API požadavky
// ==========================================
public record LoginRequest(string Username, string Password);
public record VerifyPinRequest(string PinCode);
public record ClockActionRequest(string PinCode, string EventType);
public record CreateEmployeeRequest(string FullName, string PinCode, string? ContractType, bool IsActive);
public record UpdateEmployeeRequest(string? FullName, string? PinCode, string? ContractType, bool IsActive);
public record CreateLogRequest(int EmployeeId, DateTime Timestamp, string EventType, string? Note);
public record UpdateLogRequest(DateTime Timestamp, string EventType, string? Note);
