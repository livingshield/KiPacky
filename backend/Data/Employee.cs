using System;

namespace Kipacky.Data;

public class Employee
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public string ContractType { get; set; } = "DPP"; // DPP, DPČ, HPP
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
