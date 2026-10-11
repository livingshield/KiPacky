using System;

namespace Kipacky.Data;

public class Shift
{
    public int Id { get; set; }
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public int? OrderId { get; set; }
    public Order? Order { get; set; }
    public DateTime ShiftDate { get; set; }
    public string StartTime { get; set; } = "06:00";
    public string EndTime { get; set; } = "14:30";
    public string? Note { get; set; }
}
