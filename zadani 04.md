Tady je finální, podrobná technická specifikace pro zbývající tři moduly. Tímto se váš systém na \*\*Sestaveni pracovni dochazky zamestnancu do firmy. V cestine se nekdy pouziva vyraz pichacky.\*\* stane naprosto kompletním a připraveným pro nasazení do ostrého provozu.



Opět se držíme "antigravity" přístupu – maximální užitná hodnota pro Martu, minimální architektonická složitost pro vás.



\---



\# Technická specifikace: Fáze 4 – Směny, Výkazy a Exporty



\## Modul 1: Plánování směn (Zákonný požadavek)



Cílem není budovat složitý rezervační systém, ale jednoduše splnit povinnost zaměstnavatele "rozvrhnout pracovní dobu" a dát brigádníkům vědět, kdy mají přijít. Je to čistě "Top-Down" přístup (Marta určuje, brigádník čte).



\*\*1. Databázový model (EF Core)\*\*



\* \*\*Tabulka `Shifts` (Směny)\*\*

\* `Id` (PK)

\* `EmployeeId` (FK -> Employees)

\* `Date` (DateOnly) – Datum směny.

\* `StartTime` (TimeOnly) – Plánovaný začátek (např. 06:00).

\* `EndTime` (TimeOnly) – Plánovaný konec (např. 14:30).







\*\*2. Backendové API (.NET Minimal API)\*\*



\* `GET /api/shifts?month=10\&year=2026` – Vrátí směny pro administraci.

\* `GET /api/shifts/my?limit=5` – Vrátí 5 nejbližších budoucích směn pro konkrétního přihlášeného brigádníka (ověřeno přes PIN v session/tokenu).

\* `POST /api/shifts` – Vytvoření nové směny (Marta odesílá z adminu).

\* `DELETE /api/shifts/{id}` – Smazání směny.



\*\*3. Frontend pro Administrátora (Marta)\*\*



\* \*\*Komponenta `ShiftPlanner`:\*\* Jednoduchá obrazovka, kde Marta vybere z kalendáře den (nebo rovnou celý týden).

\* \*\*Zadávání:\*\* Formulář: `Vyberte datum`, `Od (čas)`, `Do (čas)`, `Zaměstnanec (Select box)`. Tlačítko uložit.

\* \*\*Zobrazení:\*\* Jednoduchá tabulka (nebo výpis) s naplánovanými směnami seřazená chronologicky.



\*\*4. Frontend pro Brigádníka (Kiosk/Mobil)\*\*



\* Na domovské obrazovce (pod velkými tlačítky Příchod/Odchod) bude malá karta: \*\*📅 Moje nejbližší směny\*\*.

\* Bude obsahovat jednoduchý seznam, např.:

\* \*Středa 14. 10. (06:00 - 14:00)\*

\* \*Pátek 16. 10. (06:00 - 14:00)\*







\---



\## Modul 2: Měsíční výkaz pro brigádníka



Motivační a informační prvek pro pracovníky. Eliminují se tím dotazy typu "Kolik už mám letos odpracováno a uznáno?".



\*\*1. Backendové API (.NET Minimal API)\*\*



\* `GET /api/employee/summary?month=10\&year=2026` – Tento endpoint udělá "těžkou práci". Spojí data z `AttendanceLogs` (docházka) a `ProductionLogs` (výroba) za vybraný měsíc pro daného brigádníka.



\*\*2. Frontend pro Brigádníka (Kiosk/Mobil)\*\*



\* V aplikaci přibude tlačítko 📊 \*\*Můj měsíční výkaz\*\*.

\* Po kliknutí se otevře přehledná tabulka pro aktuální měsíc s těmito sloupci:

\* \*\*Datum\*\* (např. 1. 10.)

\* \*\*Čas v práci\*\* (např. 06:00 - 14:30)

\* \*\*Čisté hodiny\*\* (zde už bude započítán automatický odečet pauzy 30 min, pokud byl v práci > 6h)

\* \*\*Schváleno kusů\*\* (pouze kusy ve statusu `Approved`)

\* \*\*Výdělek\*\* (Kusy × Sazba dané operace)





\* Pod tabulkou bude \*\*Celkový součet za měsíc\*\* (Celkem hodin a Celkem vyděláno Kč).



\---



\## Modul 3: Master Export a Hlídání limitů DPP (Administrativa)



Toto je nejdůležitější nástroj pro účetní. Nahrazuje papírové archy a manuální počítání s kalkulačkou.



\*\*1. Hlídání zákonného limitu 300 hodin (DPP)\*\*



\* \*\*Logika (Backend):\*\* V .NETu si vytvořte službu `DppLimitService`. Ta při načtení seznamu zaměstnanců v administraci sečte všechny jejich `AttendanceLogs` (čisté hodiny po odečtení pauz) od 1. ledna aktuálního roku do dnešního dne, ale \*\*pouze pro zaměstnance, kteří mají `ContractType == "DPP"\*\*`.

\* \*\*UI pro Martu:\*\* V hlavní tabulce zaměstnanců se u "DPP" brigádníků zobrazí malý ukazatel.

\* Zelená (0–250 h).

\* Oranžová (250–290 h) s varováním: \*Blíží se limitu!\*

\* Červená (> 290 h): \*Kritický stav, nutno zastavit přidělování směn.\*







\*\*2. Master Export do CSV/Excelu\*\*



\* \*\*Backend API:\*\* `GET /api/export/monthly?month=10\&year=2026`

\* \*\*Proces (C# EF Core Query):\*\*

1\. Vybere všechny aktivní zaměstnance.

2\. Pro každého získá příchody a odchody v daném měsíci. Spáruje je do "Směn" (zde je důležité seřadit logy podle času a spárovat po sobě jdoucí ClockIn a ClockOut).

3\. Pokud `ClockOut - ClockIn` > 6 hodin, odečte 30 minut (`TimeSpan.FromMinutes(30)`).

4\. Pro každý den vytáhne sumu schválené produkce z `ProductionLogs`.

5\. Vypočítá odměnu za den podle norem operací.





\* \*\*Formát výstupu:\*\* Můžete použít jednoduchou C# knihovnu `CsvHelper` pro generování formátovaného CSV, nebo balíček `ClosedXML` (pokud Marta striktně vyžaduje `.xlsx` soubor).

\* \*\*Struktura reportu:\*\*

\* Sloupce: Jméno | Typ úvazku | Datum | Příchod | Odchod | Hrubý čas | Pauza | Čistý čas (hod) | Zadáno ks | Uznáno ks | Zmetky | Mzda Kč.

\* Na konci souboru by měly být agregované měsíční součty za každého zaměstnance, které účetní jen přepíše do mzdového softwaru.







\*\*3. Automatické řešení chybějícího odchodu\*\*



\* Co se stane, když někdo nepípne odchod, a vy generujete export? Spojování logů by spadlo.

\* \*\*Ošetření v kódu:\*\* Pokud systém najde `ClockIn`, ale do půlnoci (nebo v rozumném okně např. 16 hodin) neexistuje `ClockOut`, systém tento záznam do exportu zahrne s poznámkou "CHYBÍ ODCHOD" (čas i mzdu spočítá jako 0) a v administraci se u něj rozsvítí červený vykřičník, aby ho Marta musela ručně opravit (doplnit odchod v záložce Docházka), než export odešle účetní.



Dává vám tento ucelený návrh smysl z pohledu implementace v .NET 10 a Reactu? Můžete klidně začít hned zakládáním entit v EF Core.

