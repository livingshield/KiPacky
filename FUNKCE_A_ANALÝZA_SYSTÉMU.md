# Kípačky – Kompletní přehled funkcí a analýza chování systému

**Verze systému:** 1.0.2  
**Společnost:** Greenberg s.r.o.  
**Provozovna:** Nepomuk  
**Webová doména:** `etisk.eu` / `kipacky.ekobio.org`  
**Datum vydání dokumentace:** 12. 10. 2026  

---

## 1. Architektura a koncepce řešení

Systém **Kípačky** je komplexní interní platforma pro evidenci docházky, řízení a vykazování malosériové výroby (kartonáž, tisk, kompletace), evidenci BOZP směrnic a podkladů pro zpracování mezd.

### 1.1 Technologický zásobník (Stack)
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, QRCode.react.
- **PWA / Mobilní vrstva:** `vite-plugin-pwa`, Service Worker (`sw.js`), Workbox precache, manifest pro instalaci na plochu.
- **Offline architektura:** IndexedDB / localStorage fronta událostí (`utils/offlineQueue.ts`), automatické posílání při `window.online`.
- **Backend & API:** C# / .NET (ASP.NET Core / IIS HTTP Handler `api.ashx`), Microsoft SQL Server (MSSQL) na hostingu ASPONE.
- **Bezpečnost hostingu ASPONE:** Přísný zákaz nahrávání souborů `.exe`. Aplikace běží výhradně přes C# skript/modul `api.ashx` a statické distribuční assety bez kompilovaných binárních launcherů.

---

## 2. Kiosk – Mobilní zaměstnanecká část (Mobile-First)

### 2.1 Přístup přes fyzický QR kód u vchodu
1. Zaměstnanec naskenuje fotoaparátem telefonu QR kód vyvěšený na dveřích provozovny v Nepomuku.
2. Aplikace se otevře v mobilním prohlížeči. Díky podpoře PWA lze aplikaci přidat na plochu telefonu jako nativní aplikaci.
3. V horní stavové liště se zobrazuje stav sítě:
   - **`DOCHÁZKA ONLINE`** (zelený indikátor).
   - **`OFFLINE FRONTA`** (jantarový indikátor s počtem čekajících záznamů v paměti).

### 2.2 Autentizace 4místným PINem
- Číselník s velkými dotykovými tlačítky (min. 64–68 px).
- Podpora fyzické klávesnice (čísla, Backspace, Escape).
- Po zadání 4. číslice proběhne automatická validace přes API (`/api/verify-pin`):
  - **Úspěch:** Zobrazí se jméno pracovníka, typ úvazku (DPP / DPČ / HPP / IČO), stav aktuální směny a nabídka akcí.
  - **Neúspěch:** Zčervenání teček, vibrační odezva, chybová hláška *„Neplatný PIN kód“* a reset pole.

### 2.3 Evidence docházky (Tlačítka akcí)
- **PŘÍCHOD (`ClockIn`):**
  - Tmavě zelené dominantní tlačítko (72 px).
  - Zaznamená začátek směny.
- **ODCHOD (`ClockOut`):**
  - Tlumené cihlové tlačítko (72 px).
  - Zaznamená konec směny a vypočítá celkovou dobu.
- **PŘESTÁVKA (`BreakStart` / `BreakEnd`):**
  - Jantarové tlačítko (64 px).
  - Pokud je pracovník na směně, zobrazí se *„Zahájit přestávku“*.
  - Pokud již přestávka běží, tlačítko se přepne na *„Ukončit přestávku“* s odpočtem uplynulých minut.
- **Automatické odhlášení nečinnosti:**
  - Časovač 60 sekund. Pokud pracovník neklikne na žádnou akci, relace se automaticky ukončí a terminál se vrátí k zadání PINu.

### 2.4 Evidence výroby a norem (Výrobní workflow)
Tříkrokový průvodce zapsáním hotové práce:
1. **Krok 1 – Výběr zakázky:**
   - Výpis aktivních zakázek (např. *EkoBio – Čajové krabičky*, *Vánoční balení*).
2. **Krok 2 – Výběr operace:**
   - Výběr prováděného úkonu (*Kompletní krabička*, *Balení*, *Příprava*, *Kompletace a vkládání*).
   - Zobrazení hodinové normy (např. 100 ks/h) a úkolové sazby (např. 1,35 Kč/ks).
3. **Krok 3 – Zápis kusů:**
   - Numerická klávesnice + rychlá tlačítka přičítání (`+10`, `+50`, `+100`).
   - Přepínač na zmetky (vadné kusy).
   - Odeslání do systému se stavem `Pending` (čeká na schválení Martou v administraci).

### 2.5 Burza směn (Shift Marketplace)
- Přehled plánovaných směn na aktuální týden/měsíc.
- Možnost přihlásit se na volnou vypsanou směnu (*Claim*).
- Možnost uvolnit směnu, pokud pracovník nemůže dorazit (*Release*).

### 2.6 BOZP a provozní směrnice
- Povinné potvrzení seznámení se směrnicemi.
- Pokud je publikován nový bezpečnostní předpis, pracovník je vyzván k přečtení zkráceného znění a potvrzení PINem.
- Odkaz na plné znění směrnice s možností otevření čtečky dokumentu.

### 2.7 Profil a bankovní účet
- Pracovník si může přímo v kiosku zkontrolovat a upravit:
  - Telefonní číslo.
  - E-mail.
  - Číslo bankovního účtu pro zasílání mzdy/odměny.

### 2.8 Měsíční přehled pracovníka
- Zobrazení souhrnu za aktuální kalendářní měsíc:
  - Odpracované hodiny.
  - Schválené vyrobené kusy.
  - Hrubý odhad vydělané částky (Kč).

---

## 3. Administrace – Desktopové rozhraní (Pro Martu)

### 3.1 Přístup a zabezpečení
- Samostatná přihlašovací obrazovka na adrese s přepínačem z kiosku.
- Heslem chráněný přístup s auditní stopou přihlášení.

### 3.2 Modul 1: Správa zaměstnanců
- Evidence brigádníků a kmenových zaměstnanců.
- Generování a změna 4místných unikátních PIN kódů (s okamžitou kontrolou duplicity v reálném čase).
- Typy úvazků: **DPP**, **DPČ**, **HPP**, **IČO**.
- Kontaktní a platební údaje (telefon, bankovní účet).
- Tlačítko **Vytisknout vchodový QR kód**:
  - Vygeneruje grafický plakát formátu A4 s logem Greenberg, QR kódem, kontrolním symbolem dne a přehlednými instrukcemi pro dílnu.

### 3.3 Modul 2: Evidence docházky (Logs)
- Tabulka všech zaznamenaných pípnutí (příchody, odchody, přestávky).
- Filtrování podle pracovníka, data od-do.
- Možnost ručního vložení zapomenutého záznamu.
- Možnost editace chybného času s povinným zadáním důvodu opravy (kompletní auditní stopa).

### 3.4 Modul 3: Produkce & Schvalování norem
- Schvalování nahlášených kusů od brigádníků:
  - Marta může kusy potvrdit, snížit o vadné kusy (zmetky) nebo zamítnout.
- Správa katalogu výrobních operací a zakázek:
  - Nastavení hodinových norem (ks/hodina).
  - Nastavení úkolových sazeb (Kč/ks).
  - Vytváření nových zakázek s termínem a cílovým objemem.

### 3.5 Modul 4: Plánování směn a BOZP dokumenty
- Tvorba harmonogramu směn pro provozovnu Nepomuk.
- Publikace nových směrnic BOZP s volbou okamžité platnosti.
- Matice podpisů – přehled, který brigádník směrnici potvrdil a kdy.

### 3.6 Modul 5: Měsíční výkazy a Mzdové podklady
- Měsíční rekapitulace za libovolný měsíc a rok:
  - Čistý odpracovaný čas (v hodinách a minutách).
  - Vyrobené kusy a normohodiny.
  - Celková částka k výplatě.
- **31denní docházková karta pracovníka:**
  - Detailní denní rozpis všech 31 dnů v měsíci s časy příchodů, přestávek, odchodů a normy.
  - Tiskový export na A4 s podpisovou doložkou pro zaměstnance i vedoucí provozu.
- **Export do CSV / Excelu:**
  - Jedním kliknutím stažení mzdových podkladů pro účetní kancelář.

### 3.7 Centrum provozních notifikací (Výstražný systém)
Systém automaticky v reálném čase monitoruje a upozorňuje na:
1. **Kritická varování:**
   - Překročení zákonného limitu 300 hodin ročně u dohodářů (DPP).
2. **Provozní varování:**
   - Neuzavřené směny (pracovník pípnul příchod před více než 12 hodinami a chybí odchod).
   - Blížící se limit DPP (překročení 250 hodin).
3. **Informační notifikace:**
   - Čekající nahlášená výroba ke schválení.
   - Chybějící čísla bankovních účtů u aktivních pracovníků.

---

## 4. Analýza chování a mezních stavů (Edge Cases)

| Situace / Scénář | Očekávané chování systému |
| :--- | :--- |
| **Výpadek internetu v dílně** | Kiosk přejde do offline režimu. Po zadání PINu a volbě akce se záznam uloží s přesným časem do lokální fronty v telefonu a zobrazí se zelené potvrzení s poznámkou *(Uloženo offline)*. Po obnovení signálu Service Worker data automaticky pošle na server. |
| **Pracovník zapomene pípnout odchod** | Druhý den ráno mu systém dovolí pípnout příchod. Předchozí otevřená směna je detekována notifikačním centrem a Martě v administraci vyskočí upozornění *Neuzavřená směna*, kde může ručně doplnit odhadovaný odchod. |
| **Zadání duplicitního PINu** | Administrační formulář při zadávání nebo změně PINu v reálném čase kontroluje existující záznamy. Pokud PIN již existuje, tlačítko *Uložit* je zablokováno a zobrazí se varování se jménem stávajícího držitele PINu. |
| **Nečinnost na kiosku** | Po 60 sekundách neaktivity se rozhraní samo odhlásí a smaže rozepsané údaje, aby další pracovník ve frontě nemohl manipulovat s účtem předchozího. |
| **Pokus o nahrání .exe na FTP** | Nasazovací skript `deploy_app.ps1` obsahuje hardcoded bezpečnostní filtr, který okamžitě ukončí proces s chybou `Security violation: .exe strictly forbidden on ASPONE FTP`. |

---

## 5. Závěr a stav připravenosti

Aplikace je plně nasazena v ostrém provozu na serveru ASPONE (`https://www.ekobio.org/apps/Kipacky/`), verze **1.0.2** je synchronizována v Git repozitáři na GitHubu a splňuje všechny bezpečnostní i vizuální standardy Greenberg.
