using System;

namespace Kipacky.Data;

public class AttendanceLog
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DateTime Timestamp { get; set; }
    public string EventType { get; set; } = "ClockIn"; // ClockIn, ClockOut
    public bool IsManualEdit { get; set; } = false;
    public string? Note { get; set; }
}
