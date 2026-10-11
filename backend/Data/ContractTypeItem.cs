namespace Kipacky.Data;

public class ContractTypeItem
{
    public string Code { get; set; } = string.Empty; // DPP, DPČ, HPP, IČO
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
