using System;
using Microsoft.EntityFrameworkCore;

namespace Kipacky.Data;

public class KipackyDbContext : DbContext
{
    public KipackyDbContext(DbContextOptions<KipackyDbContext> options) : base(options)
    {
    }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<AttendanceLog> AttendanceLogs => Set<AttendanceLog>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Operation> Operations => Set<Operation>();
    public DbSet<ProductionLog> ProductionLogs => Set<ProductionLog>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentConsent> DocumentConsents => Set<DocumentConsent>();
    public DbSet<Shift> Shifts => Set<Shift>();
    public DbSet<ContractTypeItem> ContractTypes => Set<ContractTypeItem>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("Kipacky");

        // Zaměstnanci
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.ToTable("kipa_Employees");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.PinCode).HasMaxLength(4).IsRequired();
            entity.Property(e => e.ContractType).HasMaxLength(20).IsRequired().HasDefaultValue("DPP");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.PinCode);
        });

        // Docházka
        modelBuilder.Entity<AttendanceLog>(entity =>
        {
            entity.ToTable("kipa_AttendanceLogs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EventType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Timestamp).IsRequired();
            entity.Property(e => e.IsManualEdit).HasDefaultValue(false);
            entity.Property(e => e.Note).HasMaxLength(500);

            entity.HasOne(e => e.Employee)
                  .WithMany()
                  .HasForeignKey(e => e.EmployeeId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.EmployeeId, e.Timestamp });
        });

        // Zakázky
        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("kipa_Orders");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.TargetPricePerPiece).HasPrecision(18, 2);
        });

        // Výrobní operace a normy
        modelBuilder.Entity<Operation>(entity =>
        {
            entity.ToTable("kipa_Operations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
            entity.Property(e => e.NormPerHour).IsRequired();
            entity.Property(e => e.RatePerPiece).HasPrecision(10, 2).IsRequired();
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(e => e.Order)
                  .WithMany()
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Seed výchozích 4 výrobních operací
            entity.HasData(
                new Operation { Id = 1, Name = "Kompletní krabička", NormPerHour = 100, RatePerPiece = 1.35m, IsActive = true },
                new Operation { Id = 2, Name = "Balení", NormPerHour = 100, RatePerPiece = 1.35m, IsActive = true },
                new Operation { Id = 3, Name = "Příprava", NormPerHour = 120, RatePerPiece = 1.15m, IsActive = true },
                new Operation { Id = 4, Name = "Kompletace a vkládání", NormPerHour = 100, RatePerPiece = 1.35m, IsActive = true }
            );
        });

        // Výroba
        modelBuilder.Entity<ProductionLog>(entity =>
        {
            entity.ToTable("kipa_ProductionLogs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Pending");
            entity.Property(e => e.ModifiedBy).HasMaxLength(100);

            entity.HasOne(e => e.Employee)
                  .WithMany()
                  .HasForeignKey(e => e.EmployeeId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Order)
                  .WithMany()
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Operation)
                  .WithMany()
                  .HasForeignKey(e => e.OperationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.EmployeeId, e.Date });
        });

        // Číselník typů úvazků
        modelBuilder.Entity<ContractTypeItem>(entity =>
        {
            entity.ToTable("kipa_ContractTypes");
            entity.HasKey(e => e.Code);
            entity.Property(e => e.Code).HasMaxLength(20);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            // Seed typů úvazků: DPP, DPČ, HPP, IČO
            entity.HasData(
                new ContractTypeItem { Code = "DPP", Name = "Dohoda o provedení práce", Description = "Zákonný limit 300 hodin ročně", IsActive = true },
                new ContractTypeItem { Code = "DPČ", Name = "Dohoda o pracovní činnosti", Description = "Limit max. polovina stanovené týdenní pracovní doby", IsActive = true },
                new ContractTypeItem { Code = "HPP", Name = "Hlavní pracovní poměr", Description = "Standardní pracovní smlouva na plný či zkrácený úvazek", IsActive = true },
                new ContractTypeItem { Code = "IČO", Name = "Osoba samostatně výdělečně činná (IČO)", Description = "Spolupráce na živnostenský list / fakturaci", IsActive = true }
            );
        });

        // Administrátoři
        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.ToTable("kipa_AdminUsers");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).HasMaxLength(50).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.FullName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Role).HasMaxLength(50).HasDefaultValue("Administrator");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.Username).IsUnique();

            // Seed administrátorky Marty Chorobikové (heslo Kipacky2026!)
            entity.HasData(
                new AdminUser
                {
                    Id = 1,
                    Username = "admin",
                    PasswordHash = "4a75e818fb25efda65c190209dfa9809930f36894c73bf5408a1dc3a9e1e24bc",
                    FullName = "Marta Chorobiková",
                    Role = "Administrator",
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        });
    }

    public void EnsureSchemaAndTablesCreated()
    {
        var sql = @"
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Kipacky')
BEGIN
    EXEC('CREATE SCHEMA Kipacky');
END

-- 1. Zaměstnanci
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'Kipacky' AND t.name = 'kipa_Employees')
BEGIN
    CREATE TABLE [Kipacky].[kipa_Employees] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [FullName] NVARCHAR(150) NOT NULL,
        [PinCode] NVARCHAR(4) NOT NULL,
        [ContractType] NVARCHAR(20) NOT NULL DEFAULT 'DPP',
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [Phone] NVARCHAR(50) NULL,
        [Email] NVARCHAR(100) NULL,
        [BankAccount] NVARCHAR(50) NULL,
        [PersonalDataConfirmedAt] DATETIME2 NULL
    );
    CREATE INDEX [IX_kipa_Employees_PinCode] ON [Kipacky].[kipa_Employees]([PinCode]);
END

-- 2. Docházka
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'Kipacky' AND t.name = 'kipa_AttendanceLogs')
BEGIN
    CREATE TABLE [Kipacky].[kipa_AttendanceLogs] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [EmployeeId] INT NOT NULL,
        [Timestamp] DATETIME2 NOT NULL,
        [EventType] NVARCHAR(20) NOT NULL,
        [IsManualEdit] BIT NOT NULL DEFAULT 0,
        [Note] NVARCHAR(500) NULL,
        [OriginalTimestamp] DATETIME2 NULL,
        [ModifiedByAdmin] BIT NOT NULL DEFAULT 0,
        [ModifiedBy] NVARCHAR(100) NULL,
        [ModifiedAt] DATETIME2 NULL,
        [ModifyReason] NVARCHAR(500) NULL,
        CONSTRAINT [FK_kipa_AttendanceLogs_Employees] FOREIGN KEY ([EmployeeId]) 
            REFERENCES [Kipacky].[kipa_Employees]([Id])
    );
    CREATE INDEX [IX_kipa_AttendanceLogs_EmployeeId_Timestamp] 
        ON [Kipacky].[kipa_AttendanceLogs]([EmployeeId], [Timestamp]);
END

-- 3. Zakázky
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'Kipacky' AND t.name = 'kipa_Orders')
BEGIN
    CREATE TABLE [Kipacky].[kipa_Orders] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(150) NOT NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [TargetPieces] INT NULL,
        [TotalPiecesTarget] INT NULL,
        [StartDate] DATE NULL,
        [EndDate] DATE NULL,
        [Deadline] DATETIME2 NULL,
        [TargetPricePerPiece] DECIMAL(18,2) NULL,
        [Description] NVARCHAR(500) NULL
    );
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'TotalPiecesTarget')
        ALTER TABLE [Kipacky].[kipa_Orders] ADD [TotalPiecesTarget] INT NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'StartDate')
        ALTER TABLE [Kipacky].[kipa_Orders] ADD [StartDate] DATE NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'EndDate')
        ALTER TABLE [Kipacky].[kipa_Orders] ADD [EndDate] DATE NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'TargetPricePerPiece')
        ALTER TABLE [Kipacky].[kipa_Orders] ADD [TargetPricePerPiece] DECIMAL(18,2) NULL;
END

-- 4. Výrobní operace a normy
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'Kipacky' AND t.name = 'kipa_Operations')
BEGIN
    CREATE TABLE [Kipacky].[kipa_Operations] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(150) NOT NULL,
        [NormPerHour] INT NOT NULL DEFAULT 100,
        [RatePerPiece] DECIMAL(10,2) NOT NULL DEFAULT 1.35,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [OrderId] INT NULL
    );
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Operations]') AND name = 'OrderId')
        ALTER TABLE [Kipacky].[kipa_Operations] ADD [OrderId] INT NULL;
END

-- Employees extra columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'ContractStartDate')
    ALTER TABLE [Kipacky].[kipa_Employees] ADD [ContractStartDate] DATE NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'ContractEndDate')
    ALTER TABLE [Kipacky].[kipa_Employees] ADD [ContractEndDate] DATE NULL;
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'SelfScheduled')
    ALTER TABLE [Kipacky].[kipa_Employees] ADD [SelfScheduled] BIT NOT NULL DEFAULT 0;

-- 5. Výroba
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'Kipacky' AND t.name = 'kipa_ProductionLogs')
BEGIN
    CREATE TABLE [Kipacky].[kipa_ProductionLogs] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [EmployeeId] INT NOT NULL,
        [OrderId] INT NOT NULL,
        [OperationId] INT NOT NULL,
        [Date] DATETIME2 NOT NULL,
        [SubmittedPieces] INT NOT NULL,
        [ValidatedPieces] INT NOT NULL,
        [DefectPieces] INT NOT NULL DEFAULT 0,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        [ModifiedBy] NVARCHAR(100) NULL,
        [Note] NVARCHAR(500) NULL
    );
END

-- 6. Typy úvazků (DPP, DPČ, HPP, IČO)
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'Kipacky' AND t.name = 'kipa_ContractTypes')
BEGIN
    CREATE TABLE [Kipacky].[kipa_ContractTypes] (
        [Code] NVARCHAR(20) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(255) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1
    );
END

IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_ContractTypes] WHERE [Code] = 'DPP')
    INSERT INTO [Kipacky].[kipa_ContractTypes] ([Code], [Name], [Description]) VALUES ('DPP', N'Dohoda o provedení práce', N'Zákonný limit 300 hodin ročně');
IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_ContractTypes] WHERE [Code] = 'DPČ')
    INSERT INTO [Kipacky].[kipa_ContractTypes] ([Code], [Name], [Description]) VALUES ('DPČ', N'Dohoda o pracovní činnosti', N'Limit max. polovina stanovené týdenní pracovní doby');
IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_ContractTypes] WHERE [Code] = 'HPP')
    INSERT INTO [Kipacky].[kipa_ContractTypes] ([Code], [Name], [Description]) VALUES ('HPP', N'Hlavní pracovní poměr', N'Standardní pracovní smlouva na plný či zkrácený úvazek');
IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_ContractTypes] WHERE [Code] = 'IČO')
    INSERT INTO [Kipacky].[kipa_ContractTypes] ([Code], [Name], [Description]) VALUES ('IČO', N'Osoba samostatně výdělečně činná (IČO)', N'Spolupráce na živnostenský list / fakturaci');

-- 7. Administrátoři
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'Kipacky' AND t.name = 'kipa_AdminUsers')
BEGIN
    CREATE TABLE [Kipacky].[kipa_AdminUsers] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Username] NVARCHAR(50) NOT NULL UNIQUE,
        [PasswordHash] NVARCHAR(255) NOT NULL,
        [FullName] NVARCHAR(150) NOT NULL,
        [Role] NVARCHAR(50) NOT NULL DEFAULT 'Administrator',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END

IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_AdminUsers] WHERE [Username] = 'admin')
BEGIN
    INSERT INTO [Kipacky].[kipa_AdminUsers] ([Username], [PasswordHash], [FullName], [Role]) 
    VALUES ('admin', '4a75e818fb25efda65c190209dfa9809930f36894c73bf5408a1dc3a9e1e24bc', N'Marta Chorobiková', 'Administrator');
END

-- 8. Seed základních operací, pokud chybí
IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_Operations] WHERE [Name] = N'Kompletní krabička')
    INSERT INTO [Kipacky].[kipa_Operations] ([Name], [NormPerHour], [RatePerPiece], [IsActive]) VALUES (N'Kompletní krabička', 100, 1.35, 1);
IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_Operations] WHERE [Name] = N'Balení')
    INSERT INTO [Kipacky].[kipa_Operations] ([Name], [NormPerHour], [RatePerPiece], [IsActive]) VALUES (N'Balení', 100, 1.35, 1);
IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_Operations] WHERE [Name] = N'Příprava')
    INSERT INTO [Kipacky].[kipa_Operations] ([Name], [NormPerHour], [RatePerPiece], [IsActive]) VALUES (N'Příprava', 120, 1.15, 1);
IF NOT EXISTS (SELECT 1 FROM [Kipacky].[kipa_Operations] WHERE [Name] = N'Kompletace a vkládání')
    INSERT INTO [Kipacky].[kipa_Operations] ([Name], [NormPerHour], [RatePerPiece], [IsActive]) VALUES (N'Kompletace a vkládání', 100, 1.35, 1);
";
        Database.ExecuteSqlRaw(sql);
    }
}
