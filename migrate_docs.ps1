Add-Type -AssemblyName System.Data
$localConfigPath = Join-Path $PSScriptRoot "appsettings.local.json"
if (Test-Path $localConfigPath) {
    $cfg = Get-Content $localConfigPath -Raw | ConvertFrom-Json
    $connStr = $cfg.ConnectionStrings.ProductionConnection
} else {
    $connStr = if ($env:DB_CONN_STR) { $env:DB_CONN_STR } else { "Server=YOUR_SERVER;Database=YOUR_DATABASE;User Id=YOUR_USER;Password=YOUR_PASSWORD;Encrypt=False" }
}
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

# 1. Přidání sloupce ShortText a FullText, pokud neexistují
$alterSql = @"
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Documents]') AND name = 'ShortText')
BEGIN
    ALTER TABLE [Kipacky].[kipa_Documents] ADD [ShortText] NVARCHAR(MAX) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Kipacky].[kipa_Documents]') AND name = 'FullText')
BEGIN
    ALTER TABLE [Kipacky].[kipa_Documents] ADD [FullText] NVARCHAR(MAX) NULL;
END
"@

$cmd = $conn.CreateCommand()
$cmd.CommandText = $alterSql
$cmd.ExecuteNonQuery() | Out-Null
Write-Host "Columns ShortText and FullText ensured."

# 2. Naplnění stávajících dokumentů šablonami z zadani 03.md
$updateSql = @"
-- Dokument 1: BOZP
UPDATE [Kipacky].[kipa_Documents]
SET Title = N'BOZP – Bezpečnost a ochrana zdraví při práci',
    ShortText = N'Potvrzuji, že jsem byl/a seznámen/a s platnými pravidly bezpečnosti a ochrany zdraví při práci (BOZP). Zavazuji se dodržovat bezpečné pracovní postupy, používat ochranné pomůcky, nepracovat pod vlivem návykových látek a ihned hlásit každý úraz nadřízenému. Byla mi poskytnuta možnost prostudovat si plné znění směrnice.',
    FullText = N'Základní pravidla bezpečnosti a ochrany zdraví při práci (BOZP)

1. Všeobecné povinnosti: Zaměstnanec/brigádník je povinen dbát podle svých možností o svou vlastní bezpečnost, o své zdraví i o bezpečnost a zdraví osob, kterých se bezprostředně dotýká jeho jednání.
2. Pracovní postupy: Je přísně zakázáno vyřazovat z provozu bezpečnostní a ochranná zařízení na strojích a vybavení. Zaměstnanec smí obsluhovat pouze stroje a zařízení, pro které byl zaškolen.
3. Ochranné pomůcky: Zaměstnanec je povinen používat přidělené osobní ochranné pracovní prostředky (OOPP) a starat se o jejich údržbu.
4. Zákaz alkoholu a omamných látek: Je přísně zakázáno požívat alkoholické nápoje a zneužívat jiné návykové látky na pracovištích zaměstnavatele a v pracovní době i mimo tato pracoviště. Zaměstnanec nesmí vstupovat pod jejich vlivem na pracoviště. Zaměstnavatel si vyhrazuje právo provádět namátkové kontroly.
5. Pracovní úrazy: Každý pracovní úraz, i drobná poranění (např. říznutí o papír, oděrky), je zaměstnanec povinen neprodleně nahlásit svému nadřízenému a zapsat do Knihy úrazů.
6. Pořádek na pracovišti: Každý odpovídá za čistotu a pořádek na svém pracovišti. Je zakázáno blokovat komunikační uličky materiálem či odpadem.',
    Content = N'Potvrzuji, že jsem byl/a seznámen/a s platnými pravidly bezpečnosti a ochrany zdraví při práci (BOZP). Zavazuji se dodržovat bezpečné pracovní postupy, používat ochranné pomůcky, nepracovat pod vlivem návykových látek a ihned hlásit každý úraz nadřízenému. Byla mi poskytnuta možnost prostudovat si plné znění směrnice.'
WHERE Id = 1;

-- Dokument 2: Požární ochrana
UPDATE [Kipacky].[kipa_Documents]
SET Title = N'Požární ochrana a únikové cesty',
    ShortText = N'Potvrzuji, že jsem byl/a proškolen/a v oblasti požární ochrany. Znám umístění hasicích přístrojů, lékárničky a únikových východů. Vím, jak postupovat při požáru nebo vyhlášení poplachu. Byla mi poskytnuta možnost prostudovat si plné znění směrnice.',
    FullText = N'Směrnice o požární ochraně (PO) a evakuační plán

1. Prevence: Každý pracovník je povinen počínat si tak, aby nezavdal příčinu ke vzniku požáru. Je přísně zakázáno manipulovat s otevřeným ohněm a kouřit ve všech vnitřních prostorách dílny (včetně elektronických cigaret). Kouření je povoleno výhradně na vyhrazeném venkovním místě.
2. Únikové cesty: Únikové cesty, východy a přístupy k hlavním vypínačům elektrické energie, uzávěrům vody a k hasicím přístrojům musí zůstat trvale volné a nesmí být zastavovány materiálem.
3. Postup při požáru: Zpozoruje-li pracovník požár, je povinen se jej pokusit uhasit dostupnými hasicími přístroji, pokud tím neohrozí vlastní život nebo zdraví. V opačném případě okamžitě varuje ostatní (např. voláním "HOŘÍ"), zahájí evakuaci a neprodleně volá hasiče (linka 150 nebo 112).
4. Evakuace: Po vyhlášení poplachu nebo pokynu nadřízeného jsou všichni pracovníci povinni okamžitě opustit budovu po vyznačených únikových cestách a shromáždit se na určeném evakuačním místě před budovou. Zde vyčkají na přepočítání stavu osob.',
    Content = N'Potvrzuji, že jsem byl/a proškolen/a v oblasti požární ochrany. Znám umístění hasicích přístrojů, lékárničky a únikových východů. Vím, jak postupovat při požáru nebo vyhlášení poplachu. Byla mi poskytnuta možnost prostudovat si plné znění směrnice.'
WHERE Id = 2;

-- Dokument 3: Provozní řád a kvalita
UPDATE [Kipacky].[kipa_Documents]
SET Title = N'Provozní řád a kontrola kvality',
    ShortText = N'Zavazuji se dodržovat provozní řád pracoviště, řádně evidovat příchody a odchody a poctivě hlásit množství vyrobených kusů. Beru na vědomí, že hotová produkce podléhá kontrole a vadné kusy se nezapočítávají do mé odměny. Byla mi poskytnuta možnost prostudovat si plné znění směrnice.',
    FullText = N'Provozní řád a kontrola kvality

1. Evidence docházky a výkonu: Zaměstnanec/brigádník je povinen evidovat svůj příchod na pracoviště a odchod z něj výhradně pomocí osobního PIN kódu. Dále je povinen pravdivě a přesně hlásit množství odvedené práce (vyrobených/zkompletovaných kusů).
2. Technologické postupy: Práce musí být prováděna přesně podle pokynů a ukázkových vzorů pro danou operaci (kompletace, balení, lepení). Svévolná změna pracovního postupu bez schválení nadřízeného není povolena.
3. Kontrola kvality a zmetky: Každá odevzdaná dávka produktů podléhá namátkové nebo plné kontrole kvality ze strany nadřízeného pracovníka. Kusy, které nesplňují požadovanou kvalitu (zmetky způsobené nepozorností nebo nedodržením postupu), budou z vykázaného počtu odečteny a nezapočítávají se do celkové odměny pracovníka.
4. Manipulace s materiálem: S materiálem a hotovými výrobky je nutné zacházet šetrně, aby nedošlo k jejich poškození nebo znečištění.
5. Přestávky: Přestávky v práci se řídí zákoníkem práce a pokyny nadřízeného. Konzumace jídla je vyhrazena pro určený prostor, u pracovních stolů s materiálem je zakázána.',
    Content = N'Zavazuji se dodržovat provozní řád pracoviště, řádně evidovat příchody a odchody a poctivě hlásit množství vyrobených kusů. Beru na vědomí, že hotová produkce podléhá kontrole a vadné kusy se nezapočítávají do mé odměny. Byla mi poskytnuta možnost prostudovat si plné znění směrnice.'
WHERE Id = 3;
"@

$cmd.CommandText = $updateSql
$rows = $cmd.ExecuteNonQuery()
Write-Host "Updated document templates rows: $rows"

# Zjištění aktuálních dat
$cmd.CommandText = "SELECT Id, Title, LEN(ShortText) AS ShortLen, LEN(FullText) AS FullLen FROM [Kipacky].[kipa_Documents]"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host ("Doc {0}: {1} (Short: {2} chars, Full: {3} chars)" -f $reader[0], $reader[1], $reader[2], $reader[3])
}
$reader.Close()
$conn.Close()
