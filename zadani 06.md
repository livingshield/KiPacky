Tady je návrh dokumentu, který shrnuje všechny úpravy a nové požadavky do jasných fází. Můžete ho předložit "antigravity" přístupu pro efektivní implementaci.

---

# Kípačky – Specifikace Fáze 2: Rozšíření produkce a UX

Tento dokument definuje úpravy systému "Kípačky" (verze 1.0.2) na základě reálného nasazení a zpětné vazby z provozu. Cílem je implementovat podporu pro dynamické výrobní operace vázané na zakázky a vylepšit uživatelské rozhraní pro mobilní zařízení.

## Fáze 2.1: Úprava databázového modelu (Dynamické operace)

Současný systém globálních operací nepostačuje, protože každá zakázka (např. různé krabičky) vyžaduje jiné úkony s různými normami a sazbami.

### 1. Tabulka `Orders` (Zakázky) – Rozšíření

* **Nový sloupec:** `TotalPiecesTarget` (Int) – Celkový požadovaný počet kusů pro zakázku (např. 2000 ks).
* **Nový sloupec:** `StartDate` (DateOnly) – Datum začátku zakázky.
* **Nový sloupec:** `EndDate` (DateOnly) – Termín dokončení.
* **Nový sloupec:** `TargetPricePerPiece` (Decimal) – Cílová cena za jeden kompletní výrobek (slouží pro informaci/kontrolu).

### 2. Tabulka `Operations` (Operace) – Vázání na zakázku

* **Nový sloupec:** `OrderId` (FK -> `Orders.Id`) – **Klíčová změna.** Operace (např. "Díl A", "Díl B", "Sestavení") už nejsou globální, ale patří pod konkrétní zakázku. Při zakládání zakázky se k ní rovnou definují její specifické operace, normy a sazby.

### 3. Změny v Kiosku (Zápis výroby)

* **Výběr operace:** Když zaměstnanec v kroku 1 vybere Zakázku, v kroku 2 (Výběr operace) se mu načtou **pouze operace náležející k této vybrané zakázce**.

---

## Fáze 2.2: Sledování rozpracovanosti (Administrace)

Marta potřebuje vidět stav zakázky a kdo se na ní podílel.

### 1. Nový pohled: "Detail zakázky"

V modulu "Produkce & Schvalování norem" přibude obrazovka s detailem konkrétní zakázky.

* **Celkový progres:** Zobrazení `Součet všech schválených kusů` / `TotalPiecesTarget` (vizuální progress bar).
* **Sestava lidí (Soupis účastníků):** Tabulka zobrazující agregovaná data pro danou zakázku:
* Jméno pracovníka
* Operace (Díl A, Sestavení atd.)
* Počet schválených kusů
* *Tiskový výstup:* Tuto tabulku musí být možné vytisknout jako "archivní sestavu" pro danou zakázku.



---

## Fáze 2.3: Přepočet času na produkci (Úřední vs. Fyzický čas)

Systém musí umět oddělit fyzický čas strávený na dílně od "produktivního" času vypočítaného z norem (používá se pro limit 300 hodin u DPP).

### 1. Modul: Měsíční výkazy a Mzdové podklady

* **Nový výpočet:** V reportu pro účetní (a v měsíční kartě) přibude sloupec **Úřední hodiny (Normočas)**.
* **Vzorec:** `Normočas = Suma(Schválené kusy operace / Hodinová norma dané operace)`.
* Tento "Normočas" se bude odečítat z ročního limitu 300 hodin.
* *Poznámka:* Fyzický čas z `AttendanceLogs` (odpípáno) nadále zůstává v systému pro účely BOZP a statistiky.

---

## Fáze 2.4: UX úpravy a Specifika pro smlouvy

Drobné úpravy pro zlepšení použitelnosti a pokrytí legislativních výjimek.

### 1. Kiosk – Tlačítko "Odhlásit"

* Na každé obrazovce v Kiosku (po úspěšném přihlášení PINem) bude k dispozici zřetelné tlačítko **"Odhlásit se a zavřít"**.
* Po kliknutí se uživatel okamžitě vrátí na úvodní obrazovku pro zadání PINu.

### 2. Administrace – Detail Zaměstnance

* **Nová pole:** `ContractStartDate` (Platnost smlouvy od) a `ContractEndDate` (Platnost smlouvy do). Zobrazení v detailu profilu.
* **Samorozvrhování (Výjimka víkendy):** Přidání zaškrtávacího políčka `Samorozvrhování pracovní doby`. Pokud je zaškrtnuto, systém u tohoto zaměstnance (typicky práce z domova) nepočítá případné víkendové příplatky v reportech.

### 3. Zrychlený Admin Login

* Na přihlašovací obrazovce do administrace se přidá možnost přihlásit se pomocí 4místného "Master PINu" (např. pomocí stejné komponenty PIN padu jako v kiosku), místo nutnosti vypisovat dlouhé heslo na mobilním zařízení.

---

Je tento formát a obsah to, co jste si představoval pro předání?