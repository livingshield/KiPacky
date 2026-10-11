Tento dokument představuje detailní technickou a funkční specifikaci pro projekt **Sestaveni pracovni dochazky zamestnancu do firmy. V cestine se nekdy pouziva vyraz pichacky.**. Je navržen s ohledem na maximální efektivitu vývoje ("antigravity" přístup), snadnou údržbu a plnění zákonných povinností u pracovníků na dohodu (DPP/DPČ).

## **1\. Technologický stack a architektura**

Systém je rozdělen na klientskou část (mobilní zobrazení pro zaměstnance) a administrační/backendovou část (správa dat a API).

* **Backend:** .NET 10 (hostováno na existujícím vývojovém serveru). Využití **Minimal APIs** pro rychlou definici endpointů s minimální režií.  
* **Databáze:** MSSQL s využitím **Entity Framework Core** (EF Core). Data budou izolována ve vlastním databázovém schématu (např. \[Attendance\].\[Employees\]).  
* **Frontend (Klientská aplikace):** React.js inicializovaný přes Vite. Aplikace bude navržena jako PWA (Progressive Web App) s využitím **Tailwind CSS** pro rychlé poskládání responzivního mobilního UI.  
* **Zabezpečení a komunikace:** Nastavení CORS na backendu pro povolení požadavků z React frontendu. Zabezpečení administrace pomocí nativní Cookie autentizace s pevně definovanými přihlašovacími údaji v appsettings.json nebo v proměnných prostředí.

## **2\. Databázový model**

Pro pokrytí všech požadavků včetně historizace a možností oprav postačí dvě vzájemně provázané tabulky.

* **Tabulka Employees (Zaměstnanci):**  
  * Id (Primary Key, GUID nebo INT)  
  * FullName (String) – Jméno a příjmení zaměstnance.  
  * PinCode (String, délka 4\) – Unikátní numerický kód pro identifikaci.  
  * ContractType (String) – Typ úvazku (DPP, DPČ, HPP).  
  * IsActive (Boolean) – Příznak pro "soft delete". Neaktivní zaměstnanci se nebudou moci přihlásit, ale jejich data zůstanou pro historické exporty.  
* **Tabulka AttendanceLogs (Záznamy docházky):**  
  * Id (Primary Key, GUID nebo INT)  
  * EmployeeId (Foreign Key \-\> Employees.Id)  
  * Timestamp (DateTime) – Přesný čas zaznamenání události.  
  * EventType (Enum nebo String) – Hodnota ClockIn (Příchod) nebo ClockOut (Odchod).  
  * IsManualEdit (Boolean) – Indikátor, zda byl záznam vytvořen systémem (přes PIN), nebo přidán/upraven ručně v administraci.

## **3\. Uživatelské rozhraní pro zaměstnance (Frontend workflow)**

Proces evidence je navržen tak, aby byl co nejrychlejší a minimalizoval chybovost pracovníků v provozu. Pracovník naskenuje **jeden statický, univerzální QR kód** umístěný u vchodu, který otevře webovou aplikaci.

* **Krok 1: Identifikace (PinPad):** Zobrazí se čistá komponenta s numerickou klávesnicí (tlačítka 0–9 stylizovaná přes CSS Grid). Uživatel zadá svůj 4místný PIN.  
* **Krok 2: Volba akce a Smart State:** Po zadání PINu si frontend vyžádá z backendu poslední známý stav zaměstnance. Zobrazí se jméno pracovníka, jeho aktuální stav (např. *Stav: Mimo pracoviště*) a dvě velká tlačítka **Příchod** a **Odchod**. Logičtější tlačítko (podle posledního stavu) může být vizuálně zvýrazněno.  
* **Krok 3: Zpracování a validace (Anti-Double-Click):** Po kliknutí se odešle API požadavek. Backend zkontroluje poslední záznam daného zaměstnance. Pokud zjistí pokus o uložení stejné akce (např. 2x Příchod) v intervalu kratším než **5 minut**, systém požadavek buď ignoruje, nebo vrátí upozornění.  
* **Krok 4: Vizuální zpětná vazba:** Po úspěšném zápisu celá obrazovka na 3 vteřiny zezelená, zobrazí se výrazná ikona fajfky a text (např. *Příchod zaznamenán v 06:14*). Následně se aplikace resetuje do výchozího stavu.

## **4\. Administrátorská sekce a logika exportů**

Bezpečné webové rozhraní pro majitelku/účetní, které umožňuje kompletní správu systému a generování zákonných podkladů.

* **Dashboard a Správa zaměstnanců:** Formulář pro přidávání nových brigádníků, manuální definici PIN kódů (nebo jejich změnu v případě zapomenutí) a deaktivaci ukončených poměrů. Obsahuje také generátor statického QR kódu obsahujícího URL adresu aplikace.  
* **Správa docházky (Ruční zásahy):** Tabulkový přehled všech "pípnutí" s možností filtrování. Umožňuje ručně vložit chybějící záznam (např. zapomenutý odchod) nebo upravit chybný čas. Každý takový zásah je v databázi trvale označen příznakem IsManualEdit \= true.  
* **Modul Exportů a Výpočet mezd:** Klíčová funkce pro účetní. Uživatel vybere konkrétní měsíc a rok. Systém spáruje všechny Příchody a Odchody do ucelených směn a vypočítá celkovou dobu.  
* **Automatická penalizace (Zákonné přestávky):** Během generování exportu backend projde jednotlivé směny. Pokud hrubý časový rozdíl mezi příchodem a odchodem **přesáhne 6 hodin**, systém automaticky strhne z odpracované doby **30 minut** (v exportu bude jasně vyznačeno: Hrubý čas / Přestávka / Čistý čas). Výstupem je CSV nebo formátovaný Excel soubor připravený pro účetní software.

Kterou část architektury byste chtěl při samotném vývoji implementovat jako první?