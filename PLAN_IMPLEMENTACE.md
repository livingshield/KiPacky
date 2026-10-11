# Plán fází implementace projektu Kípačky (Docházka, Výroba, HR & Mzdy)

**URL nasazené aplikace:** `https://www.ekobio.org/apps/Kipacky/`  
**Databáze:** MSSQL `sql8.aspone.cz` | Databáze: `db4937` | Schéma: `[Kipacky]` | Prefix tabulek: `kipa_`  
**Architektura:** React 19 + TypeScript + Tailwind CSS (PWA Kiosk & Admin) + bezúdržbový ASP.NET C# Handler (`api.ashx`)

---

## Přehled fází projektu

| Fáze | Název etapy | Hlavní cíl | Stav |
| :--- | :--- | :--- | :--- |
| **Fáze 1** | **Kompletní docházkový systém & Kiosk** | Evidence příchodů, odchodů a přestávek přes PIN, Symbol/Kód dne na dveřích dílny, audit oprav (*původní čas + kdo, kdy a proč*), 31denní tisknutelná karta | ✅ **Hotovo a nasazeno** |
| **Fáze 2** | **Produkce, Zakázky, Operace & Úkolová mzda** | Evidence vyrobených kusů brigádníky na kiosku, správa zakázek a norem (`ks/h`, `Kč/ks`), dvojitá verifikace (schválení a zmetky) | ✅ **Hotovo a nasazeno** |
| **Fáze 3** | **HR, BOZP dokumenty & Plánování směn** | Elektronické podepisování BOZP směrnic (1× měsíčně) s tiskem archu, plánování směn (Top-Down) | ✅ **Hotovo a nasazeno** |
| **Fáze 4** | **Finální Měsíční Master Report & Mzdy** | Spojení docházky a úkolové mzdy, výpočet normohodin a výdělku v Kč, hlídání limitu 300 h/rok pro DPP, export do CSV (Excel) | ✅ **Hotovo a nasazeno** |
| **Fáze 5** | **Rozšíření: Cíle zakázek, Burza směn & Osobní profil brigádníka** | Cílový objem zakázek s ukazatelem hotovo/cíl, samoobslužná burza volných směn na kiosku, osobní a bankovní platební profil brigádníka | ✅ **Hotovo a nasazeno** |
| **Fáze 6** | **Úřední A4 tisk BOZP protokolu & PWA instalovatelný kiosk** | Samostatný A4 protokol pro kontrolu SÚIP s podpisy a zákonnou hlavičkou, offline Service Worker a PWA manifest pro tablet | ✅ **Hotovo a nasazeno** |
| **Fáze 7** | **Modul plných znění směrnic bez PDF (Zadání 03)** | Databázové uložení plných textů BOZP/PO/Provozního řádu, samostatná A4 webová čtečka na URL `?doc=ID`, tisk směrnice, odkazy z kiosku a administrace | ✅ **Hotovo a nasazeno** |
| **Fáze 8** | **Měsíční výkaz brigádníka na Kiosku & Mzdové exporty (Zadání 04)** | Samoobslužný měsíční přehled odpracovaných hodin, schválených kusů a výdělku v Kč na kiosku, sjednocení DPP semaforu (250h/290h), Master CSV | ✅ **Hotovo a nasazeno** |
| **Fáze 9** | **PWA Offline stav, BYOD ergonomie & Databázový Seed** | `vite-plugin-pwa` s precache schránkou aplikace (ochrana proti dinosauru), živá červená lišta při výpadku sítě a deaktivace PIN tlačítek, Mobile-First touch ovládání pro telefony brigádníků, databázový seed v EF Core i MSSQL (Marta, úvazky DPP/DPČ/HPP/IČO, 4 operace výroby) | ✅ **Hotovo a nasazeno** |
| **Fáze 10** | **Offline synchronizace, Inactivity Timeout & Notifikační centrum** | Lokální ukládání záznamů docházky a výroby do offline fronty (`localStorage`) s reálným časem a automatická synchronizace po obnovení sítě, automatické odhlášení po 60 s nečinnosti na Kiosku, administrační notifikační centrum (zvoneček, badge, varovný panel s prokliky k řešení) | ✅ **Hotovo a nasazeno** |

---

## Detailní rozpis jednotlivých fází

### Fáze 1: Kompletní docházka a Kiosk – ✅ HOTOVO A NASAZENO
1. **Databázová vrstva:**
   - `[Kipacky].[kipa_Employees]` – evidence pracovníků (`Id`, `FullName`, `PinCode` s kontrolou unikátnosti, `ContractType` – DPP/DPČ/HPP, `IsActive`, `CreatedAt`).
   - `[Kipacky].[kipa_AttendanceLogs]` – záznamy pípnutí (`Id`, `EmployeeId`, `Timestamp`, `EventType` – `ClockIn`/`ClockOut`/`BreakStart`/`BreakEnd`, `Note`, `IsManualEdit`, `OriginalTimestamp`, `ModifiedByAdmin`, `ModifiedBy`, `ModifiedAt`, `ModifyReason`).
2. **Kiosk rozhraní (`KioskPage.tsx`, `PinPad.tsx`, `ActionSelect.tsx`):**
   - Dotyková klávesnice pro rychlé zadání 4místného PINu.
   - Zobrazení aktuálního stavu pracovníka (`● Na pracovišti`, `☕ Na přestávce`, `○ Mimo pracoviště`).
   - Tlačítka **PŘÍCHOD**, **ZAČÁTEK PŘESTÁVKY / KONEC PŘESTÁVKY (NÁVRAT)** a **ODCHOD**.
   - Ochrana proti dvojkliku (Anti-Double-Click do 5 minut).
3. **Administrace (`AdminPage.tsx`):**
   - Správa pracovníků s živou kontrolou unikátnosti PINu.
   - **Vchodový QR kód & Symbol dne:** generování denního kontrolního symbolu a kódu na dveře dílny.
   - **Audit ručních oprav:** při úpravě záznamu administrátorem zůstává zachován původní čas (`OriginalTimestamp`) a ukládá se **kdo** (`ModifiedBy`), **kdy** (`ModifiedAt`) a **proč** (`ModifyReason`) záznam upravil.
   - **31denní měsíční docházková karta zaměstnance:** přehledová a tisknutelná tabulka na 31 dnů (*Datum | Den | Příchod | Přestávka | Odchod | Odpracováno | Splnění normy*) s neaktivními dny u kratších měsíců.

---

### Fáze 2: Modul Produkce a Úkolové mzdy – ✅ HOTOVO A NASAZENO
1. **Databázová vrstva:**
   - `[Kipacky].[kipa_Orders]` – zakázky (`Id`, `Name`, `IsActive`, `CreatedAt`).
   - `[Kipacky].[kipa_Operations]` – operace a normy dle zadání Marty Chorobikové (`Id`, `Name`, `NormPerHour`, `RatePerPiece`, `IsActive`):
     - *Kompletní krabička* (100 ks/h | 1,35 Kč/ks)
     - *Balení* (100 ks/h | 1,35 Kč/ks)
     - *Příprava* (120 ks/h | 1,15 Kč/ks)
     - *Kompletace a vkládání* (100 ks/h | 1,35 Kč/ks)
   - `[Kipacky].[kipa_ProductionLogs]` – nahlášené a schválené výkony (`Id`, `EmployeeId`, `OrderId`, `OperationId`, `Date`, `SubmittedPieces`, `ValidatedPieces`, `DefectPieces`, `Status`, `ModifiedBy`, `Note`).
2. **Kiosk – Zápis výroby (`ActionSelect.tsx`):**
   - Tlačítko **„ZAPSAT VÝROBU (KUSY)“** po zadání PINu.
   - 3krokový dotykový průvodce: **Výběr zakázky → Výběr operace → Zadání kusů** (numpad + rychlé volby `+10`, `+50`, `+100`).
3. **Administrace – Dvojitá verifikace (`AdminPage.tsx` – záložka *Produkce & Normy*):**
   - Přehled čekajících (*Pending*) a schválených (*Approved*) výrobních dávek.
   - Možnost schválit dávku nebo upravit uznaný počet kusů a zaevidovat **zmetky (`DefectPieces`)**.
   - Správa číselníků zakázek a operací (možnost měnit normy a sazby).

---

### Fáze 3: Modul HR, BOZP a Plánování směn – ✅ HOTOVO A NASAZENO
1. **Databázová vrstva:**
   - `[Kipacky].[kipa_Documents]` – směrnice a BOZP dokumenty (`Id`, `Title`, `Content`, `IsActive`, `UpdatedAt`).
   - `[Kipacky].[kipa_DocumentConsents]` – elektronické podpisy brigádníků (`Id`, `EmployeeId`, `DocumentId`, `AgreedAt`).
   - `[Kipacky].[kipa_Shifts]` – plánované směny (`Id`, `EmployeeId`, `OrderId`, `ShiftDate`, `StartTime`, `EndTime`, `Note`).
2. **Kiosk – BOZP a Směny (`ActionSelect.tsx`):**
   - Upozornění na nepodepsané nebo expirované BOZP dokumenty (kontrola 1× měsíčně / 30 dní).
   - Zobrazení plného znění směrnice na kiosku a potvrzení tlačítkem **„Potvrzuji seznámení s dokumentem“**.
   - Sekce **„Moje nejbližší směny“** přímo na obrazovce pracovníka.
3. **Administrace (`AdminPage.tsx` – záložka *Směny & BOZP*):**
   - Plánování směn na konkrétní dny, časy a zakázky.
   - Správa BOZP dokumentů a tisk prezenční listiny podepsaných dokumentů pro případ kontroly.

---

### Fáze 4: Finální Měsíční Master Report a Mzdy – ✅ HOTOVO A NASAZENO
1. **Výpočty na backendu (`api.ashx` – `monthly-report` & `monthly-report-csv`):**
   - Spojení čisté odpracované doby na dílně (**Netto hodiny** po odečtu evidovaných přestávek resp. zákonného minima 30 min nad 6 h) s výkonem v úkolu (**Schválené ks**, **Zmetky**).
   - Výpočet **Normohodin** ($\text{Schválené ks} / \text{Norma za hodinu}$) a **Úkolové mzdy v Kč** ($\sum (\text{Schválené ks} \times \text{Sazba za ks})$).
   - Kumulativní sledování odpracovaných hodin od začátku roku (**YTD limit 300 h u DPP**).
2. **Administrace (`AdminPage.tsx` – záložka *Měsíční výkazy & Mzdy*):**
   - Souhrnné karty jednotlivých pracovníků s barevnou indikací čerpání limitu 300 h u DPP, detailním rozpisem směn, **31denní tisknutelnou kartou** a exportem do **CSV (Excel)** s UTF-8 BOM.

---

### Fáze 5: Cíle zakázek, Burza směn & Platební profil brigádníka – ✅ HOTOVO A NASAZENO
1. **Cílové objemy zakázek & Rozpracovanost:**
   - `[Kipacky].[kipa_Orders]` rozšířeno o `TargetPieces` (cílový objem ks), `Deadline` (termín dokončení) a `Description`.
   - Výpočet rozpracovanosti: automatické sčítání schválených a odevzdaných kusů vůči cíli v procentech.
   - Vizuální progress bar rozpracovanosti zakázky v administraci i na dotykovém kiosku při výběru zakázky.
2. **Samoobslužná burza volných směn (Open Shifts):**
   - Administrátor může vypsat směnu bez konkrétního pracovníka (`EmployeeId IS NULL`).
   - Brigádník po zadání PINu vidí sekci **„Burza směn“**, kde si může volnou směnu jedním klepnutím převzít/přihlásit se na ni, nebo v případě potřeby svou stávající směnu uvolnit zpět na burzu.
3. **Osobní dotazník a platební profil brigádníka:**
   - `[Kipacky].[kipa_Employees]` rozšířeno o `Phone`, `Email`, `BankAccount` (číslo účtu pro výplatu mzdy) a `PersonalDataConfirmedAt` (čas ověření údajů).
   - Brigádník má na kiosku vyhrazenou sekci **„Profil & Výplata“**, kde si může jednoduše zadat nebo zkontrolovat bankovní účet a kontakty a potvrdit jejich správnost.
   - Administrátor vidí platební údaje a stav ověření přímo v tabulce zaměstnanců.

---

### Fáze 6: Úřední A4 tisk BOZP protokolu & PWA instalovatelnost – ✅ HOTOVO A NASAZENO
1. **Úřední A4 tisk protokolu BOZP a PO pro kontrolní orgány (SÚIP):**
   - V administraci v záložce *Směny & BOZP* je tlačítko **„Vytisknout úřední arch BOZP (A4)“**.
   - Generuje čistý tiskový dokument A4 s citací Zákoníku práce (§ 101 a § 103 zákona č. 262/2006 Sb.), tabulkou potvrzených podpisů, časových razítek a podpisovou doložkou pro vedoucí provozu (Marta Chorobiková) i statutárního zástupce.
2. **PWA (Progressive Web App) pro tablet na dílně:**
   - Vytvořen `manifest.json` s konfigurací `standalone` displeje a tématickým brandingem.
   - Vygenerovány ikony `icon-192.png` a `icon-512.png`.
   - Nasazen Service Worker (`sw.js`) pro spolehlivé kešování statických komponent a běh v režimu celé obrazovky bez adresního řádku prohlížeče.

---

### Fáze 7: Modul plných znění směrnic bez PDF (Zadání 03) – ✅ HOTOVO A NASAZENO
1. **Databázová struktura:**
   - Tabulka `[Kipacky].[kipa_Documents]` rozšířena o sloupce `ShortText NVARCHAR(MAX)` a `FullText NVARCHAR(MAX)`.
   - Do ostré databáze nahrána plná právní znění 3 výchozích směrnic ze zadání:
     - *1. BOZP – Bezpečnost a ochrana zdraví při práci*
     - *2. Požární ochrana – Požární řád a poplachové směrnice*
     - *3. Provozní řád dílny, hygienické zásady a nakládání s materiálem*
2. **Backend API (`api.ashx`):**
   - Nový veřejný endpoint `get-document&id=X` pro přímé zobrazení směrnice bez nutnosti přihlášení.
   - Endpoint `verify-pin` vrací `shortText` a příznak `hasFullText` pro odlehčené načítání na kiosku.
   - Endpointy `get-documents` a `save-document` plně podporují správu obou úrovní textů (`shortText` i `fullText`).
3. **Webová čtečka směrnic (`DocumentViewerPage.tsx`):**
   - Samostatné URL zobrazení přes parametr `?doc=ID` nebo `?documentId=ID`.
   - Typograficky vyladěný A4 layout s právní hlavičkou, verzováním, formátováním odstavců a tlačítkem přímého tisku (`window.print()`).
4. **Propojení na kiosku (`ActionSelect.tsx`):**
   - V sekci *Směrnice a BOZP* se zobrazuje zkrácené poučení a odkaz **„📄 Zobrazit plné znění směrnice“**, který otevírá webovou čtečku v nové záložce (`target="_blank"`).
5. **Administrace (`AdminPage.tsx`):**
   - Rozšířen formulář směrnic o editaci zkráceného poučení pro kiosek i velký editor plného znění.
   - Přidáno tlačítko pro rychlý náhled a tisk libovolné směrnice z administrace.

---

### Fáze 8: Měsíční výkaz brigádníka na Kiosku & Mzdové exporty (Zadání 04) – ✅ HOTOVO A NASAZENO
1. **Měsíční výkaz pro brigádníka na kiosku (`ActionSelect.tsx`):**
   - Tlačítko **📊 „Můj měsíční výkaz (hodiny a výdělek)“** přímo v profilovém menu po zadání PINu.
   - Přehledné souhrnné karty: *Čisté hodiny* (po zákonném odečtu pauzy), *Schváleno kusů* (ze statusu `Approved`) a *Celkem vyděláno v Kč* ($\sum \text{Kusy} \times \text{Sazba}$).
   - Detailní rozpis jednotlivých směn daného měsíce s možností přepínání měsíců (předchozí / další).
   - Indikace neuzavřené směny (*„Chybí odchod“*).
2. **Backend API (`api.ashx` – akce `employee-summary`):**
   - Rychlý endpoint pro kiosek ověřovaný PIN kódem.
   - Spojuje data z `kipa_AttendanceLogs` a `kipa_ProductionLogs` za požadovaný měsíc a rok.
   - Spočítá celoroční fond pro brigádníky na DPP (`yearToDateNetHours`) a vrací limit 300 hodin.
3. **Administrace & Zákonný limit 300 hodin u DPP:**
   - Sjednocen barevný semafor a varování dle zadání:
     - 🟢 **Zelená (0–250 h)**: V normě.
     - 🟠 **Oranžová (250–290 h)**: `⚠️ Blíží se limitu DPP!`.
     - 🔴 **Červená (> 290 h)**: `⛔ Kritický stav DPP: nutno zastavit přidělování směn!`.
4. **Master Export do CSV/Excelu:**
   - Zachován plnohodnotný export do formátovaného CSV s UTF-8 BOM s kompletním spárováním příchodů/odchodů, odečtem 30minutové pauzy u směn delších než 6 hodin a souhrnnými údaji pro mzdovou účetní.

---

### Fáze 9: PWA Offline stav, BYOD Mobile-First & Databázový Seed – ✅ HOTOVO A NASAZENO
1. **Implementace PWA a řešení Offline stavu:**
   - Integrován `vite-plugin-pwa` (Workbox) s precachováním kompletní vizuální schránky aplikace (`index.html`, styly, JavaScript bundly, ikony a manifest).
   - Zajištěno, že při slabém signálu nebo výpadku připojení aplikace neskončí chybou prohlížeče („Dinosaurus“).
   - Vizuální varování v reálném čase: při offline stavu se v horní části obrazovky i přímo nad klávesnicí zobrazí výrazný červený pruh:
     *„Jste offline. Připojte se k internetu pro záznam docházky.“*
   - V offline režimu jsou tlačítka pro zadání PINu i odesílání akcí docházky/výroby bezpečně zablokována s patřičným vizuálním stavem (`disabled`), čímž se zamezuje selhání API volání bez sítě. Po obnovení spojení se rozhraní okamžitě reaktivně odemkne.
2. **Uživatelské rozhraní pro BYOD (Bring Your Own Device):**
   - Mobilní ergonomie (Mobile-First): Klávesnice pro PIN disponuje velkými dotykovými tlačítky (výška 64 px / `h-16`), což výrazně překračuje standard 48 px a zajišťuje pohodlné ovládání jednou rukou na telefonech libovolné úhlopříčky.
   - Vysoký kontrast barev pro dílenské prostředí a umělé osvětlení: sytý tmavý podklad `bg-slate-900`, kontrastní tlačítka s ohraničením `border-2 border-slate-700`, výrazné bílé písmo a zřetelná barevná signalizace akcí (zelená, jantarová, červená, indigová).
   - Responzivní layout v Tailwind CSS optimalizovaný pro šířky 320 px až 430 px bez horizontálního posunu.
3. **Databázový Seed (Počáteční inicializace):**
   - **Entity Framework Core (`KipackyDbContext.cs`):** Definice kompletních modelů (`Employee`, `AttendanceLog`, `Order`, `Operation`, `ProductionLog`, `Document`, `DocumentConsent`, `Shift`, `ContractTypeItem`, `AdminUser`) a konfigurace `OnModelCreating` s metodou `HasData(...)`.
   - **Výchozí Administrátor:** Vytvořen a nasazen výchozí administrátorský profil pro Martu (`admin`, bezpečný SHA-256 hash hesla `Kipacky2026!`, role `Administrator`).
   - **Číselník typů úvazků:** Vytvořena tabulka `[Kipacky].[kipa_ContractTypes]` a inicializována hodnotami `DPP`, `DPČ`, `HPP`, `IČO`. Ve webové administraci přidána volba `IČO` do formulářů pro přidání i editaci zaměstnanců.
   - **Číselník výrobních operací:** V databázi MSSQL i v EF Core seedu definovány 4 výchozí operace dle specifikace:
     - *Kompletní krabička* (100 ks/h | 1,35 Kč/ks)
     - *Balení* (100 ks/h | 1,35 Kč/ks)
     - *Příprava* (120 ks/h | 1,15 Kč/ks)
     - *Kompletace a vkládání* (100 ks/h | 1,35 Kč/ks)
4. **Zálohování databáze:**
   - Dle zadání je automatické zálohování na externí úložiště v rámci MVP odloženo a bude realizováno v následné verzi 1.1 po pilotním zkušebním provozu.

---

### Fáze 10: Offline synchronizace, Inactivity Timeout & Notifikační centrum v administraci – ✅ HOTOVO A NASAZENO
1. **Offline synchronizace (Offline Queue & Sync):**
   - **Frontend fronta záznamů (`offlineQueue.ts`):** Pokud je zaměstnanec offline nebo dojde k síťovému výpadku při odesílání akce, aplikace neselže chybovou hláškou. Záznam docházky (`ClockIn`, `ClockOut`, `BreakStart`, `BreakEnd`) i výrobní dávky (`submitProduction`) se bezpečně uloží do lokálního úložiště (`localStorage`) s přesným klientským časovým razítkem (`offlineTimestamp` v ISO 8601).
   - **Offline ověření PINu a mezipaměť:** Profily zaměstnanců se při úspěšném přihlášení ukládají do lokální cache (`kipacky_offline_employees`). Při výpadku sítě kiosek umožní zadat PIN a identifikovat zaměstnance i bez spojení se serverem.
   - **Automatická synchronizace:** Jakmile prohlížeč detekuje obnovení spojení (`window.addEventListener('online')`) nebo periodicky každých 20 sekund, systém automaticky projde frontu neodeslaných požadavků a odešle je na backend.
   - **Vizuální indikace na Kiosku:** V horní liště se dynamicky zobrazuje stav neodeslaných záznamů (např. `⚡ 2 neodesláno (offline fronta)`). Po úspěšném odeslání se zobrazí potvrzovací hláška s počtem synchronizovaných záznamů.
   - **Backend podpora (`api.ashx`):** Handlery `HandleClock` i `HandleSubmitProduction` přijímají volitelný parametr `offlineTimestamp`. Pokud je přítomen, uloží záznam s tímto původním historickým časem a do poznámky automaticky připojí příznak `(Offline synchronizováno)`. U offline docházky se současně přeskakuje redundantní anti-double-click validace vázaná na aktuální čas serveru.
2. **Automatické odhlášení při nečinnosti (Inactivity Timeout na Kiosku):**
   - Na obrazovce profilu zaměstnance po zadání PINu (`ActionSelect.tsx`) běží 60sekundový bezpečnostní časovač nečinnosti.
   - **Sledování aktivity:** Jakýkoliv dotyk na displeji, kliknutí myší, stisk klávesy nebo posun (`touchstart`, `mousedown`, `keydown`, `scroll`, `click`) okamžitě resetuje časovač zpět na 60 sekund.
   - **Odpočet a vizuální zpětná vazba:** V pravém horním rohu panelu zaměstnance se zobrazuje živý odpočet `⏳ Odhlášení za Xs`. Pokud brigádník odejde od zařízení bez odhlášení, po uplynutí limitu se kiosek automaticky a bezpečně vrátí na výchozí číselník pro zadání PINu.
3. **Administrátorské notifikační centrum (`AdminPage.tsx`):**
   - **Ikona zvonku a dynamický odznak:** V horní navigační liště administrace přibyla ikona zvonku 🔔 s červeným číselným odznakem neodbavených upozornění.
   - **Kritická varovná lišta:** V horní části obrazovky administrátorky Marty se zobrazuje nepřehlédnutelný pruh upozorňující na urgentní provozní události.
   - **Interaktivní notifikační šuplík (Drawer Modal):** Po kliknutí na zvonek se otevře přehledný panel seskupující operační upozornění s prioritami:
     - 🔴 **Kritické překročení DPP (> 290 h):** Seznam brigádníků, kterým hrozí zákonný limit 300 h/rok.
     - 🟠 **Varování DPP (250–290 h):** Brigádníci blížící se hranici limitu.
     - ⏱️ **Neuzavřená směna (> 12 h bez odchodu):** Zaměstnanci, kteří se zapomněli odhlásit při odchodu z pracoviště.
     - 📦 **Čekající výrobní dávky:** Dávky kusové výroby čekající na schválení či kontrolu zmetků.
     - 💳 **Neúplné bankovní profily:** Zaměstnanci, kteří dosud nevyplnili číslo účtu pro výplatu mzdy.
   - **Přímé řešení na jeden klik:** Každá notifikační karta obsahuje tlačítko **„Přejít k řešení →“**, které administrátorku okamžitě přepne do odpovídající sekce (např. *Produkce & Normy*, *Zaměstnanci*, *Měsíční report*).

