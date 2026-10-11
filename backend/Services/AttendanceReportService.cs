using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using Kipacky.Data;

namespace Kipacky.Services;

public class ShiftRecord
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string ContractType { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public DateTime ClockInTime { get; set; }
    public DateTime? ClockOutTime { get; set; }
    public TimeSpan GrossDuration { get; set; }
    public TimeSpan BreakDuration { get; set; }
    public TimeSpan NetDuration { get; set; }
    public bool IsManualEdit { get; set; }
    public bool IsIncomplete { get; set; }
    public string Note { get; set; } = string.Empty;
}

public class MonthlyEmployeeSummary
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string ContractType { get; set; } = string.Empty;
    public int TotalShifts { get; set; }
    public double TotalGrossHours { get; set; }
    public double TotalBreakHours { get; set; }
    public double TotalNetHours { get; set; }
    public int IncompleteShiftsCount { get; set; }
    public List<ShiftRecord> Shifts { get; set; } = new();
}

public class MonthlyReportResult
{
    public int Year { get; set; }
    public int Month { get; set; }
    public List<MonthlyEmployeeSummary> EmployeeSummaries { get; set; } = new();
}

public class AttendanceReportService
{
    /// <summary>
    /// Spáruje záznamy docházky do směn, aplikuje pravidlo zákonné 30min přestávky po 6 hodinách a agreguje měsíční výsledky.
    /// </summary>
    public MonthlyReportResult GenerateMonthlyReport(List<Employee> employees, List<AttendanceLog> logs, int year, int month)
    {
        var result = new MonthlyReportResult
        {
            Year = year,
            Month = month
        };

        var logsByEmployee = logs.GroupBy(l => l.EmployeeId).ToDictionary(g => g.Key, g => g.OrderBy(l => l.Timestamp).ToList());

        foreach (var emp in employees)
        {
            var empLogs = logsByEmployee.TryGetValue(emp.Id, out var el) ? el : new List<AttendanceLog>();
            var shifts = PairShifts(emp, empLogs);

            var summary = new MonthlyEmployeeSummary
            {
                EmployeeId = emp.Id,
                EmployeeName = emp.FullName,
                ContractType = emp.ContractType,
                Shifts = shifts,
                TotalShifts = shifts.Count(s => !s.IsIncomplete),
                TotalGrossHours = Math.Round(shifts.Where(s => !s.IsIncomplete).Sum(s => s.GrossDuration.TotalHours), 2),
                TotalBreakHours = Math.Round(shifts.Where(s => !s.IsIncomplete).Sum(s => s.BreakDuration.TotalHours), 2),
                TotalNetHours = Math.Round(shifts.Where(s => !s.IsIncomplete).Sum(s => s.NetDuration.TotalHours), 2),
                IncompleteShiftsCount = shifts.Count(s => s.IsIncomplete)
            };

            result.EmployeeSummaries.Add(summary);
        }

        return result;
    }

    public List<ShiftRecord> PairShifts(Employee emp, List<AttendanceLog> orderedLogs)
    {
        var shifts = new List<ShiftRecord>();
        AttendanceLog? currentIn = null;

        for (int i = 0; i < orderedLogs.Count; i++)
        {
            var log = orderedLogs[i];

            if (log.EventType == "ClockIn")
            {
                if (currentIn != null)
                {
                    // Předchozí ClockIn neměl odpovídající ClockOut -> nespárovaná směna
                    shifts.Add(new ShiftRecord
                    {
                        EmployeeId = emp.Id,
                        EmployeeName = emp.FullName,
                        ContractType = emp.ContractType,
                        Date = currentIn.Timestamp.Date,
                        ClockInTime = currentIn.Timestamp,
                        ClockOutTime = null,
                        GrossDuration = TimeSpan.Zero,
                        BreakDuration = TimeSpan.Zero,
                        NetDuration = TimeSpan.Zero,
                        IsManualEdit = currentIn.IsManualEdit,
                        IsIncomplete = true,
                        Note = "Chybí odchod (neuzavřená směna)"
                    });
                }
                currentIn = log;
            }
            else if (log.EventType == "ClockOut")
            {
                if (currentIn != null)
                {
                    var gross = log.Timestamp - currentIn.Timestamp;
                    if (gross < TimeSpan.Zero) gross = TimeSpan.Zero;

                    // Zákonná přestávka: Pokud směna přesáhne 6 hodin, odečte se 30 minut
                    var breakTime = gross > TimeSpan.FromHours(6) ? TimeSpan.FromMinutes(30) : TimeSpan.Zero;
                    var net = gross > breakTime ? gross - breakTime : TimeSpan.Zero;

                    shifts.Add(new ShiftRecord
                    {
                        EmployeeId = emp.Id,
                        EmployeeName = emp.FullName,
                        ContractType = emp.ContractType,
                        Date = currentIn.Timestamp.Date,
                        ClockInTime = currentIn.Timestamp,
                        ClockOutTime = log.Timestamp,
                        GrossDuration = gross,
                        BreakDuration = breakTime,
                        NetDuration = net,
                        IsManualEdit = currentIn.IsManualEdit || log.IsManualEdit,
                        IsIncomplete = false,
                        Note = (currentIn.IsManualEdit || log.IsManualEdit) ? "Ruční úprava" : string.Empty
                    });

                    currentIn = null;
                }
                else
                {
                    // ClockOut bez předchozího ClockIn -> nespárovaný odchod
                    shifts.Add(new ShiftRecord
                    {
                        EmployeeId = emp.Id,
                        EmployeeName = emp.FullName,
                        ContractType = emp.ContractType,
                        Date = log.Timestamp.Date,
                        ClockInTime = log.Timestamp,
                        ClockOutTime = log.Timestamp,
                        GrossDuration = TimeSpan.Zero,
                        BreakDuration = TimeSpan.Zero,
                        NetDuration = TimeSpan.Zero,
                        IsManualEdit = log.IsManualEdit,
                        IsIncomplete = true,
                        Note = "Chybí příchod (izolovaný odchod)"
                    });
                }
            }
        }

        // Poslední neuzavřený ClockIn
        if (currentIn != null)
        {
            shifts.Add(new ShiftRecord
            {
                EmployeeId = emp.Id,
                EmployeeName = emp.FullName,
                ContractType = emp.ContractType,
                Date = currentIn.Timestamp.Date,
                ClockInTime = currentIn.Timestamp,
                ClockOutTime = null,
                GrossDuration = TimeSpan.Zero,
                BreakDuration = TimeSpan.Zero,
                NetDuration = TimeSpan.Zero,
                IsManualEdit = currentIn.IsManualEdit,
                IsIncomplete = true,
                Note = "Chybí odchod (neuzavřená směna)"
            });
        }

        return shifts;
    }

    public string ExportToCsv(MonthlyReportResult report)
    {
        var sb = new StringBuilder();
        // UTF-8 BOM pro správné otevření v Excelu s diakritikou
        sb.Append('\uFEFF');

        // Hlavička
        sb.AppendLine("Jméno zaměstnance;Úvazek;Datum;Příchod;Odchod;Hrubý čas (hod:min);Zákonná přestávka (min);Čistý čas (hod:min);Čistý čas (desetinně);Poznámka");

        foreach (var emp in report.EmployeeSummaries)
        {
            foreach (var shift in emp.Shifts)
            {
                var dateStr = shift.Date.ToString("dd.MM.yyyy");
                var inStr = shift.ClockInTime.ToString("HH:mm");
                var outStr = shift.ClockOutTime.HasValue ? shift.ClockOutTime.Value.ToString("HH:mm") : "-";

                var grossStr = $"{(int)shift.GrossDuration.TotalHours:D2}:{shift.GrossDuration.Minutes:D2}";
                var breakMinutes = (int)shift.BreakDuration.TotalMinutes;
                var netStr = $"{(int)shift.NetDuration.TotalHours:D2}:{shift.NetDuration.Minutes:D2}";
                var netDecStr = shift.NetDuration.TotalHours.ToString("F2", CultureInfo.InvariantCulture);

                sb.AppendLine($"{EscapeCsv(shift.EmployeeName)};{EscapeCsv(shift.ContractType)};{dateStr};{inStr};{outStr};{grossStr};{breakMinutes};{netStr};{netDecStr};{EscapeCsv(shift.Note)}");
            }

            // Souhrnný řádek pro zaměstnance
            var totalGross = $"{(int)TimeSpan.FromHours(emp.TotalGrossHours).TotalHours:D2}:{TimeSpan.FromHours(emp.TotalGrossHours).Minutes:D2}";
            var totalNet = $"{(int)TimeSpan.FromHours(emp.TotalNetHours).TotalHours:D2}:{TimeSpan.FromHours(emp.TotalNetHours).Minutes:D2}";
            var totalNetDec = emp.TotalNetHours.ToString("F2", CultureInfo.InvariantCulture);

            sb.AppendLine($"CELKEM {EscapeCsv(emp.EmployeeName)};{EscapeCsv(emp.ContractType)};;--;--;{totalGross};{emp.TotalBreakHours * 60:F0};{totalNet};{totalNetDec};Počet směn: {emp.TotalShifts}");
            sb.AppendLine(";;;;;;;;;");
        }

        return sb.ToString();
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(';') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }
}
