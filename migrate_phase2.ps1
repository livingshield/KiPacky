Add-Type -AssemblyName System.Data
$localConfigPath = Join-Path $PSScriptRoot "appsettings.local.json"
$cfg = Get-Content $localConfigPath -Raw | ConvertFrom-Json
$connStr = $cfg.ConnectionStrings.ProductionConnection

$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

function Exec-Sql($sql) {
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $sql
    $cmd.ExecuteNonQuery() | Out-Null
}

# 1. Orders columns
Exec-Sql "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'TotalPiecesTarget') ALTER TABLE [Kipacky].[kipa_Orders] ADD [TotalPiecesTarget] INT NULL;"
Exec-Sql "EXEC('UPDATE [Kipacky].[kipa_Orders] SET [TotalPiecesTarget] = ISNULL([TargetPieces], 0) WHERE [TotalPiecesTarget] IS NULL');"
Exec-Sql "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'StartDate') ALTER TABLE [Kipacky].[kipa_Orders] ADD [StartDate] DATE NULL;"
Exec-Sql "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'EndDate') ALTER TABLE [Kipacky].[kipa_Orders] ADD [EndDate] DATE NULL;"
Exec-Sql "EXEC('UPDATE [Kipacky].[kipa_Orders] SET [EndDate] = [Deadline] WHERE [EndDate] IS NULL');"
Exec-Sql "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Orders]') AND name = 'TargetPricePerPiece') ALTER TABLE [Kipacky].[kipa_Orders] ADD [TargetPricePerPiece] DECIMAL(18,2) NULL;"

# 2. Operations OrderId
Exec-Sql "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Operations]') AND name = 'OrderId') ALTER TABLE [Kipacky].[kipa_Operations] ADD [OrderId] INT NULL;"
Exec-Sql "EXEC('DECLARE @fo INT = (SELECT TOP 1 Id FROM [Kipacky].[kipa_Orders] ORDER BY Id ASC); IF @fo IS NOT NULL UPDATE [Kipacky].[kipa_Operations] SET [OrderId] = @fo WHERE [OrderId] IS NULL;');"

# 3. Employees columns
Exec-Sql "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'ContractStartDate') ALTER TABLE [Kipacky].[kipa_Employees] ADD [ContractStartDate] DATE NULL;"
Exec-Sql "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'ContractEndDate') ALTER TABLE [Kipacky].[kipa_Employees] ADD [ContractEndDate] DATE NULL;"
Exec-Sql "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Employees]') AND name = 'SelfScheduled') ALTER TABLE [Kipacky].[kipa_Employees] ADD [SelfScheduled] BIT NOT NULL DEFAULT 0;"

Write-Host "Migration verified & finished successfully!" -ForegroundColor Green
$conn.Close()
