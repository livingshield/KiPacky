using System;

namespace Kipacky.Data;

public class DocumentConsent
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public int DocumentId { get; set; }
    public Document? Document { get; set; }
    public DateTime AgreedAt { get; set; } = DateTime.UtcNow;
}
