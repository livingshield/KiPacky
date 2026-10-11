Skvělá práce! Pokud máte základní docházku (Fáze 1) a kostru administrace hotovou, máte ten nejtěžší odrazový můstek za sebou. Nyní můžeme systém rozšířit o to, co je pro Martu z byznysového hlediska nejdůležitější – propojení času s reálnou produkcí a následnou HR agendu.

Zde je **komplexní a podrobné technické zadání pro Fázi 2 (Produkce) a Fázi 3 (HR a Směny)**, navržené přesně v duchu "antigravity" (maximální hodnota pro uživatele, minimální bolest pro vývojáře).

---

# Technická specifikace: Fáze 2 – Modul Produkce a Úkolové mzdy

Tento modul řeší evidenci vyrobených kusů, jejich validaci administrátorem a přepočet na čas/peníze podle stanovených norem.

## 1. Databázový model (EF Core)

Do vašeho stávajícího schématu `[Attendance]` (nebo nového `[Production]`) přidáte tři nové tabulky:

* **Tabulka `Orders` (Zakázky)**
* `Id` (PK)
* `Name` (String) – např. "Zakázka ALFA - Dárkové boxy".
* `IsActive` (Boolean) – Pokud je `false`, brigádníkům se už nenabízí.


* **Tabulka `Operations` (Operace a Normy)**
* `Id` (PK)
* `Name` (String) – např. "Kompletní krabička", "Balení", "Příprava", "Kompletace a vkládání".
* `NormPerHour` (Int) – Kolik kusů se má stihnout za 1 hodinu (např. 100).
* `RatePerPiece` (Decimal) – Odměna za 1 kus v Kč (např. 1.35).


* **Tabulka `ProductionLogs` (Výkazy produkce)**
* `Id` (PK)
* `EmployeeId` (FK)
* `OrderId` (FK)
* `OperationId` (FK)
* `Date` (DateTime) – Datum a čas zadání.
* `SubmittedPieces` (Int) – Množství zadané brigádníkem.
* `ValidatedPieces` (Int, nullable) – Množství uznané Martou.
* `DefectPieces` (Int) – Počet zmetků (odečtených Martou).
* `Status` (Enum) – `Pending` (Čeká na schválení), `Approved` (Schváleno).
* `ModifiedBy` (String, nullable) – Kdo záznam upravil (Audit log).



## 2. Uživatelské rozhraní pro Brigádníka (React)

Na obrazovce brigádníka přibude vedle tlačítek "Příchod/Odchod" nové velké tlačítko **Zapsat výrobu**.

* **Krok 1:** Zobrazí se jednoduchý formulář (Select boxy).
* **Krok 2:** Brigádník vybere `Zakázku` (z aktivních).
* **Krok 3:** Vybere `Operaci`.
* **Krok 4:** Do velkého inputu (number pad) zadá `Počet hotových kusů`.
* **Krok 5:** Klikne na odeslat. Zobrazí se hláška: *"Uloženo. Čeká na kontrolu a schválení."*

## 3. Uživatelské rozhraní pro Administrátora (Marta)

V administraci vznikne nová záložka **Kontrola produkce**.

* **Přehled (Pending):** Marta vidí tabulku všech neschválených záznamů (Kdo, Kdy, Zakázka, Operace, Nahlášený počet).
* **Akce schválení (Dvojí ověření):** U každého řádku je input pro `Schválené kusy` (předvyplněný nahlášenou hodnotou) a input pro `Zmetky`. Marta fyzicky spočítá krabičky. Pokud nahlásil 150, ale 5 je špatně, zadá: Schváleno: 145, Zmetky: 5.
* **Uložení:** Klikne na tlačítko "Schválit". Status se změní na `Approved`.

## 4. Business logika a výpočet (Backend .NET)

Při exportu na konci měsíce (nebo v náhledu) probíhá automatický výpočet odměny podle Martinina vzorce:

* **Základní norma:** Pokud je norma 100 ks/h a sazba 1,35 Kč/ks, základní hodinovka je 135 Kč.
* **Výpočet odměny za operaci:** `Odměna = ValidatedPieces * RatePerPiece`.
* *Příklad nadnormy:* Brigádník udělal 150 ks. Odměna je 150 * 1,35 = 202,50 Kč.


* **Přepočet na produktivní čas (volitelné pro reporty):** Pokud potřebuje Marta vidět "jak dlouho to podle normy mělo trvat", vzorec je: `Produktivní čas v hodinách = ValidatedPieces / NormPerHour`.

---

# Technická specifikace: Fáze 3 – Modul HR, BOZP a Směny

Tento modul digitalizuje papírování a řeší státní požadavek na plánování směn.

## 1. Databázový model (EF Core)

* **Tabulka `Documents` (Dokumenty / Směrnice)**
* `Id` (PK)
* `Title` (String) – např. "BOZP", "Požární ochrana".
* `IsActive` (Boolean)


* **Tabulka `DocumentConsents` (Souhlasy zaměstnanců)**
* `Id` (PK)
* `EmployeeId` (FK)
* `DocumentId` (FK)
* `AgreedAt` (DateTime) – Časové razítko, kdy brigádník kliknul na souhlas.


* **Tabulka `Shifts` (Plánované směny)**
* `Id` (PK)
* `ShiftDate` (DateOnly)
* `StartTime` (TimeOnly)
* `EndTime` (TimeOnly)
* `EmployeeId` (FK, nullable) – Pokud je NULL, jde o "otevřenou" směnu, kterou si může někdo vzít.


* *(Úprava stávající tabulky `AttendanceLogs`)*
* Přidat sloupce `OriginalTimestamp` (DateTime, nullable) a `ModifiedByAdmin` (Boolean). Toto elegantně řeší Martinin požadavek na uchování původní hodnoty v případě ruční opravy, aniž byste musel stavět složitý Event Sourcing.



## 2. HR Workflow (Souhlasy s dokumenty)

* **Pohled Brigádníka:** V aplikaci pod svým profilem vidí sekci **Dokumenty k podpisu**. Pokud Marta přidá nové BOZP, svítí mu tam červená notifikace. Brigádník si může (teoreticky) dokument přečíst a musí kliknout na velké tlačítko **"Potvrzuji seznámení s dokumentem"**.
* **Pohled Admina:** Marta vidí v detailu zaměstnance jednoduchou tabulku (Dokument | Datum odsouhlasení). Má k dispozici tlačítko "Tisk" (které jen vygeneruje jednoduché HTML/PDF pro případnou kontrolu z úřadu). Změny osobních údajů neprogramujte jako formuláře pro brigádníky – nechť je Marta upravuje sama v profilu uživatele na základě ústní dohody (ušetříte si desítky hodin práce).

## 3. Plánování směn (Shift Management)

* **Pohled Admina:** Jednoduchý kalendář (nebo i jen seznam budoucích dnů). Marta nakliká: *Pondělí 6:00 - 14:00*. Z roletky vybere brigádníka, kterému směnu přiděluje.
* **Pohled Brigádníka:** Na hlavní obrazovce (pod tlačítky Příchod/Odchod) vidí komponentu **Moje nejbližší směny**, kde má vypsané dny a časy, kdy se s ním počítá.
* *Antigravity tip:* Neřešte zatím složitý systém, kde si zaměstnanci sami směny zabírají nebo vyměňují. Nechte tvorbu a přiřazování čistě na Martě (Top-down přístup). Splní to zákonný požadavek na plánování s minimem kódu.

## 4. Finální měsíční report (Export)

Reportovací modul v administraci spojí data ze všech tří fází do jedné "master" tabulky (ideálně exportovatelné do Excelu / CSV), která bude obsahovat:

1. Jméno zaměstnance
2. Datum a přesný čas (Od – Do)
3. Odpracováno hodin brutto (přímý rozdíl časů)
4. Odečet přestávky (automaticky -30 minut, pokud brutto čas > 6 hodin)
5. Odpracováno hodin netto (zákonný údaj)
6. Produkce (Počet schválených kusů za daný den napříč zakázkami)
7. Vydělaná částka (dle schválených kusů a norem)

**Je toto rozložení a detailnost to, co jste pro vývoj potřeboval? Můžeme se případně ponořit hlouběji do návrhu konkrétních React komponent, nebo Minimal API endpointů v .NETu pro tyto nové moduly.**