using System;

namespace Kipacky.Data;

public class ProductionLog
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public int OperationId { get; set; }
    public Operation? Operation { get; set; }
    public DateTime Date { get; set; }
    public int SubmittedPieces { get; set; }
    public int ValidatedPieces { get; set; }
    public int DefectPieces { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
    public string? ModifiedBy { get; set; }
    public string? Note { get; set; }
}
