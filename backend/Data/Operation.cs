namespace Kipacky.Data;

public class Operation
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int NormPerHour { get; set; } = 100;
    public decimal RatePerPiece { get; set; } = 1.35m;
    public bool IsActive { get; set; } = true;
    public int? OrderId { get; set; }
    public Order? Order { get; set; }
}
