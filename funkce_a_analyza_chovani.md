# Kípačky – Kompletní dokumentace funkcí a analýza chování systému (v1.0.3)

Tento dokument slouží jako ucelený technicko-provozní přehled celého systému **Kípačky** pro provozovnu Greenberg Nepomuk. Popisuje všechny dostupné moduly, logiku výpočtů mezd a norem, chování terminálu (kiosku), administrátorské rozhraní, legislativní mechanismy a bezpečnostní pravidla.

---

## 1. Architektura a technologický stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, QR kód generátor, PWA Service Worker (offline-ready shell).
- **Backend / API:** ASP.NET modul v jazyce C# (`api.ashx`), běžící na IIS serveru v prostředí hostingu ASPONE (`windows11.aspone.cz`).
- **Databáze:** Microsoft SQL Server (MSSQL), relační schéma s tabulkami `kipa_*`.
- **Zabezpečení a hosting (ASPONE pravidla):**
  - **Přísný zákaz souborů `.exe`:** Aplikace je kompilována výhradně jako webová aplikace a klientský bundle, deployment probíhá přes FTP bez jakýchkoliv spustitelných binárek.
  - Citlivé údaje (připojovací řetězce, hesla) jsou izolovány v `appsettings.local.json` a nikdy se neukládají do veřejného repozitáře.

---

## 2. Kiosk (Docházkový a výrobní terminál pro pracovníky)

Kiosk je optimalizovaný pro dotykové tablety u vstupu a mobilní telefony pracovníků.

### 2.1 Identifikace pracovníka (PIN Pad)
- **4místný PIN:** Každý brigádník/zaměstnanec má unikátní 4místný číselný kód.
- Po zadání 4. číslice dojde k okamžitému ověření proti databázi bez nutnosti mačkat "Potvrdit".
- Po přihlášení se zobrazí karta pracovníka (jméno, typ úvazku DPP/DPČ/HPP, aktuální stav na dílně).
- **Všudypřítomné odhlášení:** Na všech podstránkách i v záhlaví je umístěno tlačítko **"Odhlásit se a zavřít"**, které okamžitě smaže stav relace a vrátí terminál do pohotovostního režimu pro dalšího pracovníka.

### 2.2 Akce docházky (Časový záznam)
1. **Příchod (ClockIn):** Zaznamená začátek směny. Pokud již pracovník na dílně je, systém ho na to upozorní.
2. **Odchod (ClockOut):** Zaznamená konec směny.
3. **Začátek přestávky (BreakStart) / Konec přestávky (BreakEnd):** Eviduje čerpání přestávek na jídlo a oddech.
4. **Zákonná přestávka (Auditní pravidlo):** Pokud čistá směna přesáhne 6 hodin a pracovník nezadal vlastní přestávku, systém automaticky odečte 30 minut zákonné pauzy.

### 2.3 Zápis kusové výroby (Produkce)
1. **Výběr zakázky:** Pracovník si vybere aktivní zakázku (např. *Zakázka GAMA*).
2. **Dynamické filtrování operací:** Krok 2 nabídne **výhradně operace přiřazené k dané zakázce** (případně obecné sdílené operace). U každé operace pracovník vidí normu (ks/h) a sazbu v Kč/ks.
3. **Zadání kusů:** Pracovník zadá celkový počet zhotovených kusů.
4. **Odeslání ke schválení:** Záznam se uloží ve stavu `Pending` (Čeká na schválení vedoucí).

### 2.4 BOZP směrnice a elektronický podpis
- Zobrazuje seznam platných provozních dokumentů (BOZP, PO, hygiena).
- Pracovník si může dokument přečíst a potvrdit seznámení zadáním svého PIN kódu.
- Vytvoří se neměnný auditní záznam s časovým razítkem potvrzení.

### 2.5 Přehled plánovaných směn
- Zobrazuje nejbližší směny naplánované vedoucí výroby pro daného pracovníka.

### 2.6 Můj měsíční výkaz (Samoobsluha brigádníka)
- Pracovník vidí svůj aktuální měsíční stav:
  - Fyzicky odpracované netto hodiny.
  - **Uznaný Normočas** (hodiny vypočtené z norem schválené výroby).
  - **Roční čerpání limitu 300 h DPP** (počítané z normočasu).
  - Výdělek v Kč.

---

## 3. Administrační rozhraní (Správa pro Martu a vedení)

Přístupné přes zabezpečené přihlášení (heslo nebo **rychlý 4místný Master PIN** `1452` / `1408`).

### 3.1 Správa pracovníků a smluv
- **Zakládání a editace zaměstnanců:**
  - Jméno, příjmení, typ úvazku (DPP, DPČ, HPP, IČO), unikátní PIN.
  - Kontaktní údaje (telefon, e-mail) a číslo bankovního účtu pro výplaty.
  - **Platnost smlouvy:** Datum od (`ContractStartDate`) a do (`ContractEndDate`).
  - **Samorozvrhování pracovní doby:** Přepínač pro distanční pracovníky (práce z domova). Systém u nich neuplatňuje víkendové příplatky.
- **Tisk vchodového QR kódu:** Generování archu s QR kódem a denním bezpečnostním symbolem pro tisk na nástěnku/vchod.

### 3.2 Audit docházky (Historie a ruční korekce)
- Úplná historie příchodů, odchodů a přestávek.
- **Ruční zápis a editace:** Možnost ručního vložení zapomenuté směny nebo úpravy času.
- **Auditní stopa:** Každá ruční editace zachovává původní čas i jméno administrátora a vyžaduje důvod opravy.

### 3.3 Řízení produkce, norem a zakázek
- **Správa zakázek (Orders):**
  - Název zakázky, cílový počet kusů (`TotalPiecesTarget`), termín dokončení (deadline), popis.
  - Přepínání stavu Aktivní / Skrytá.
- **Vázané operace (Operations):**
  - Definice úkonů pro konkrétní zakázku.
  - Parametry: Hodinová norma (ks/h) a kusová sazba (Kč/ks).
- **Dvojí schvalování výroby (Kontrola Marty):**
  - Seznam odevzdaných dávek od brigádníků ve stavu `Pending`.
  - Možnost zkontrolovat nahlášené kusy, zadat **počet zmetků** a potvrdit výsledný počet uznaných kusů.
- **Detail zakázky a A4 výrobní list:**
  - Vizuální progress bar plnění zakázky v procentech.
  - Jmenný rozpad všech pracovníků, kteří na zakázce pracovali (uznané kusy, zmetky, normočas, vyplaceno).
  - **Tiskový archivní list (A4):** Oficiální protokol pro archivaci s podpisovými poli pro vedoucí provozu a statutárního zástupce.

### 3.4 Plánování směn a BOZP dokumentace
- **Rozvrh směn:** Přiřazení pracovníka k datu a časovému intervalu s vazbou na zakázku.
- **Správa BOZP dokumentů:** Nahrávání textů směrnic.
- **Evidenční arch podpisů BOZP:** Tiskový A4 protokol se seznamem všech elektronických podpisů dle Zákoníku práce.

### 3.5 Měsíční Master Report & Výpočet mezd
- Komplexní měsíční přehled spojující docházku, kusovou výrobu a mzdové kalkulace.
- **31denní docházková karta:** Tiskový formát pro mzdovou účetní a archivaci.
- **Export do Excelu (CSV):** Generování kompletního CSV souboru pro účetní software.
- **Notifikační centrum:**
  - Upozornění na blížící se nebo překročený limit 300 h DPP (oranžová při $\ge 250\text{ h}$, červená kritická při $\ge 290\text{ h}$).
  - Upozornění na neuzavřené směny (pracovník zapomněl odpípat odchod déle než 12 h).
  - Upozornění na čekající neschválenou výrobu.
  - Upozornění na chybějící čísla účtů pro výplatu.

---

## 4. Výpočtová logika a legislativní pravidla

### 4.1 Fyzický čas vs. Úřední Normočas
| Pojem | Zdroj | Použití |
| :--- | :--- | :--- |
| **Fyzický netto čas** | `kipa_AttendanceLogs` (Příchod – Odchod – Přestávky) | Bezpečnost práce (BOZP), evidence přítomnosti na dílně, kontrola směn. |
| **Úřední Normočas** | $\sum (\text{Schválené kusy} / \text{Norma operace})$ | **Odečet z ročního limitu 300 hodin u DPP**, mzdové podklady pro úkolovou mzdu. |

### 4.2 Výpočet mzdy v úkolu
$$\text{Výdělek (Kč)} = \sum (\text{Schválené kusy} \times \text{Sazba za kus})$$
Zmetky se nezapočítávají do odměny ani do normočasu.

### 4.3 Víkendové příplatky a Samorozvrhování
- **Běžný pracovník na dílně:** Víkendové hodiny se evidují pro případný zákonný příplatek za práci o víkendu.
- **Pracovník se samorozvrhováním (`SelfScheduled = true`):** Práce z domova / flexibilní režim dle dohody – víkendové hodiny jsou vykazovány jako běžné bez příplatků.

---

## 5. Matice rolí a přístupových oprávnění

| Role | Identifikace | Povolené akce |
| :--- | :--- | :--- |
| **Brigádník / Pracovník** | Osobní 4místný PIN | Odpípnutí příchodu/odchodu/pauzy, nahlášení vyrobených kusů, elektronický podpis BOZP, zobrazení vlastního měsíčního výkazu a plánu směn. |
| **Vedoucí výroby (Marta)** | Master PIN `1452` nebo heslo | Kompletní správa zaměstnanců, schvalování výroby a zmetků, editace docházky, detail zakázek, tisk archů, měsíční reporty. |
| **Druhý administrátor (Ján)** | Master PIN `1408` nebo heslo | Plná administrátorská práva, správa databáze, systémová konfigurace. |

---

## 6. Závěr a stav připravenosti

Aplikace je plně nasazena ve verzi **1.0.3** na hostingu ASPONE. Systém splňuje všechny legislativní i provozní požadavky ze zadání 01 až 06.
