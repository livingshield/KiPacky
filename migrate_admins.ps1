Add-Type -AssemblyName System.Data
$cfg = Get-Content (Join-Path $PSScriptRoot "appsettings.local.json") -Raw | ConvertFrom-Json
$conn = New-Object System.Data.SqlClient.SqlConnection($cfg.ConnectionStrings.ProductionConnection)
$conn.Open()

function Run-Sql($sql) {
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $sql
    $cmd.ExecuteNonQuery() | Out-Null
}

# 1. Add PinCode column in its own batch
Run-Sql "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_AdminUsers]') AND name = 'PinCode') ALTER TABLE [Kipacky].[kipa_AdminUsers] ADD [PinCode] NVARCHAR(10) NULL;"
Write-Host "PinCode column verified." -ForegroundColor Green

# 2. Update/insert admin (Marta)
Run-Sql @"
IF EXISTS (SELECT 1 FROM [Kipacky].[kipa_AdminUsers] WHERE [Username] = 'admin')
    UPDATE [Kipacky].[kipa_AdminUsers] SET [FullName] = 'Marta Chorobiková', [PasswordHash] = 'Kipacky2026!', [PinCode] = '1452', [Role] = 'Admin' WHERE [Username] = 'admin';
ELSE
    INSERT INTO [Kipacky].[kipa_AdminUsers] ([Username], [FullName], [PasswordHash], [PinCode], [Role], [CreatedAt]) VALUES ('admin', 'Marta Chorobiková', 'Kipacky2026!', '1452', 'Admin', SYSDATETIME());
"@
Write-Host "Admin 'admin' verified." -ForegroundColor Green

# 3. Update/insert lordkikin (Ján)
Run-Sql @"
IF EXISTS (SELECT 1 FROM [Kipacky].[kipa_AdminUsers] WHERE [Username] = 'lordkikin')
    UPDATE [Kipacky].[kipa_AdminUsers] SET [FullName] = 'Ján (lordkikin)', [PasswordHash] = 'remlute4', [PinCode] = '1408', [Role] = 'Admin' WHERE [Username] = 'lordkikin';
ELSE
    INSERT INTO [Kipacky].[kipa_AdminUsers] ([Username], [FullName], [PasswordHash], [PinCode], [Role], [CreatedAt]) VALUES ('lordkikin', 'Ján (lordkikin)', 'remlute4', '1408', 'Admin', SYSDATETIME());
"@
Write-Host "Admin 'lordkikin' verified." -ForegroundColor Green

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Id, Username, FullName, PinCode, PasswordHash, Role FROM [Kipacky].[kipa_AdminUsers]"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host "User: $($reader['Username']) | Name: $($reader['FullName']) | PIN: $($reader['PinCode']) | Role: $($reader['Role'])"
}
$reader.Close()
$conn.Close()
