using System;

namespace Kipacky.Data;

public class Order
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? TargetPieces { get; set; }
    public DateTime? Deadline { get; set; }
    public string? Description { get; set; }
}
