\# GREENBERG – Kompletní specifikace vizuálního redesignu interní aplikace



\*\*Verze:\*\* 1.0

\*\*Typ zadání:\*\* HTML/CSS redesign existující webové aplikace

\*\*Firma:\*\* Greenberg s.r.o.

\*\*Webová doména:\*\* etisk.eu

\*\*Provozovna a výroba:\*\* Nepomuk

\*\*Interní aplikace:\*\* Kipáčky – evidence docházky, výroby a zaměstnanců



\---



\# 1. CÍL A ROZSAH ZADÁNÍ



Cílem je kompletně sjednotit vizuální podobu existující interní aplikace do nové firemní identity Greenberg.



Nový design musí působit moderně, profesionálně, přehledně a současně lehce odkazovat na tradiční řemeslnou výrobu, kartonáž, tisk, přírodní materiály a region Nepomuka.



Vizuální styl vychází z kombinace:



\- Tmavé lesní zelené.

\- Přírodní kartonové béžové.

\- Světlé papírové krémové.

\- Měděných a zemitých akcentů.

\- Čisté geometrické typografie.

\- Jemných detailů inspirovaných papírem, výseky a skládáním kartonáže.



\*\*Zásadní požadavek: Jedná se o vizuální redesign, nikoliv o změnu funkčnosti aplikace.\*\*



Zachovat veškeré existující funkce, výpočty, data, workflow, oprávnění, API, formuláře, validace, stavové přechody a uživatelské operace.



Nesmí dojít ke ztrátě žádného ovládacího prvku nebo existující funkce.



Lze upravit rozmístění prvků, vzhled, velikost, typografii, barevnost, ikony a responzivní chování. Případné úpravy funkčních textů nebo navigační logiky vyžadují samostatné schválení.



\# 2. ROZDĚLENÍ APLIKACE



Aplikace obsahuje dvě uživatelská prostředí.



\## 2.1 Zaměstnanecká část – Mobile First



Zaměstnanci používají výhradně vlastní mobilní telefony.



Na dveřích provozovny je umístěný fyzický QR kód. Po jeho naskenování se otevře webová aplikace, zaměstnanec zadá svůj čtyřmístný PIN a následně může zaznamenat příchod, odchod, výrobu nebo zobrazit další své dostupné funkce.



Vizuální požadavky:



\- Primárně optimalizovat pro šířky mobilů 320–430 px.

\- Tmavý zelený design.

\- Velké dotykové plochy.

\- Vysoký kontrast a dobře čitelné údaje.

\- Minimální vizuální šum.

\- Nejvýznamnější akce musí být okamžitě rozeznatelné.

\- Možnost přirozeného vertikálního posouvání stránky.

\- Respektování výřezu displeje a spodní systémové oblasti telefonu.



Nepřidávat do aplikace vlastní QR skener. QR kód se skenuje fotoaparátem telefonu a otevírá webový odkaz.



\## 2.2 Administrace – Desktop First



Vedení používá primárně stolní počítače, ale aplikace musí zůstat použitelná i na mobilech.



Vizuální požadavky:



\- Světlý krémový design.

\- Tmavě zelená hlavní navigace.

\- Bílé nebo velmi světlé pracovní karty.

\- Přehledné tabulky, formuláře a statistiky.

\- Úspornější typografie než u mobilní zaměstnanecké části.

\- Efektivní využití širokých monitorů.

\- Responzivní přizpůsobení mobilům.



Obě prostředí musí využívat společné designové tokeny a jednotný vizuální jazyk.



\# 3. BAREVNÁ IDENTITA



\## 3.1 Základní firemní paleta



| Název                  | HEX       | Použití                                                |

| ---------------------- | --------- | ------------------------------------------------------ |

| Primární lesní zelená  | `#193F34` | Hlavní firemní barva, navigace, tlačítka, tmavé panely |

| Světlejší lesní zelená | `#285446` | Karty v tmavém režimu, sekundární prvky                |

| Tmavá zelená           | `#102E26` | Tmavé pozadí, hlubší kontrast                          |

| Kartonová béžová       | `#D7BE97` | Zvýraznění, štítky, vybrané prvky, dekorace            |

| Papírová krémová       | `#F7F3E9` | Pozadí světlého režimu, světlé texty                   |

| Měděná                 | `#B96543` | Dekorace, aktivní grafické detaily                     |

| Tmavá měděná           | `#8E4B2F` | Kontrastní měděné texty na světlém pozadí              |

| Grafitová              | `#232B28` | Hlavní texty, ikony                                    |

| Bílá                   | `#FFFFFF` | Karty, pole, kontrastní text                           |



Tyto barvy představují závazný základ designu.



Nepoužívat jako hlavní firemní barvu původní sytě modrou, cyan nebo fialovou. Nahradit je zelenými, béžovými a měděnými odstíny.



\## 3.2 Barvy pracovních ploch a textů



| Prvek                          | HEX       |

| ------------------------------ | --------- |

| Pozadí administrace            | `#F7F3E9` |

| Pozadí administrativních karet | `#FFFFFF` |

| Alternativní světlá plocha     | `#F0EBE0` |

| Záhlaví světlé tabulky         | `#E9E1D2` |

| Ohraničení světlých komponent  | `#E4DDD0` |

| Primární tmavý text            | `#232B28` |

| Sekundární text                | `#55645B` |

| Pomocný text                   | `#5E6C63` |

| Pozadí mobilní aplikace        | `#102E26` |

| Pozadí mobilních karet         | `#193F34` |

| Alternativní mobilní karta     | `#285446` |

| Ohraničení tmavých komponent   | `#426456` |

| Primární světlý text           | `#F7F3E9` |

| Sekundární světlý text         | `#C9DDD0` |



V administraci upřednostnit zelený či grafitový text před čistou černou.



V mobilní části nepoužívat čistě černé pozadí. Tmavé zelené odstíny vytvoří příjemnější, firemně konzistentní prostředí.



\## 3.3 Sémantické barvy



Funkční stavové barvy se nemusí vždy shodovat s dekorativní paletou.



| Význam                      | Popředí / tlačítko | Světlé pozadí  |

| --------------------------- | ------------------ | -------------- |

| Úspěch / příchod            | `#16634D`          | `#E3F2EA`      |

| Chyba / kritické upozornění | `#A53F4E`          | `#FCE9EC`      |

| Varování                    | `#835614`          | `#FFF1D7`      |

| Informační sdělení          | `#193F34`          | `#E9F1EB`      |

| Odchod – tmavá akce         | `#432F32`          | Text `#FFE0DE` |

| Zápis výroby – hlavní akce  | `#9B623F`          | Text `#FFFFFF` |



Měděnou `#B96543` nepoužívat pro drobný text na světlém pozadí; tam použít kontrastnější `#8E4B2F`.



Nezaměňovat odchod s chybovým stavem. Odchod je běžná pracovní operace, nikoli chyba.



\## 3.4 Barvy jednotlivých typů akcí



| Akce                                | Pozadí    | Text      |

| ----------------------------------- | --------- | --------- |

| Primární firemní tlačítko           | `#193F34` | `#FFFFFF` |

| Příchod                             | `#16634D` | `#FFFFFF` |

| Odchod                              | `#432F32` | `#FFE0DE` |

| Zapsat výrobu                       | `#9B623F` | `#FFFFFF` |

| Sekundární mobilní tlačítko         | `#285446` | `#F7F3E9` |

| Profil / výplata – zvýrazněný prvek | `#D7BE97` | `#193F34` |

| Nebezpečná akce                     | `#A53F4E` | `#FFFFFF` |

| Vypnuté mobilní tlačítko            | `#43574E` | `#ADBDB3` |



Zakázané barevné kombinace:



\- Fialové hlavní tlačítko výroby.

\- Jasně modrá navigace administrace.

\- Neonově cyan zvýraznění.

\- Mnoho různých barev pro prvky stejného významu.



\# 4. TYPOGRAFIE



Použít maximálně dvě rodiny fontů.



\*\*Nadpisy:\*\* Manrope, váha 600–800.



\*\*Ostatní texty:\*\* Inter, váha 400–600.



Fallback: Segoe UI, Arial, sans-serif.



Číselné údaje zobrazovat s tabulárními číslicemi (`font-variant-numeric: tabular-nums`) tam, kde se mění čas, počet kusů, výdělek či hodinové údaje.



\## 4.1 Typografická hierarchie



| Prvek                   | Mobil    | Desktop  | Váha    |

| ----------------------- | -------- | -------- | ------- |

| Hlavní nadpis stránky   | 24–28 px | 28–32 px | 700–800 |

| Nadpis karty            | 18–20 px | 18–20 px | 700     |

| Nadpis sekce            | 16–18 px | 16–18 px | 600–700 |

| Standardní text         | 15–16 px | 14–15 px | 400–500 |

| Text tlačítek           | 16–20 px | 14–16 px | 600–700 |

| Štítky polí             | 13–14 px | 13–14 px | 500–600 |

| Sekundární informace    | 13–14 px | 13–14 px | 400–500 |

| Velké numerické hodnoty | 30–40 px | 24–32 px | 700–800 |

| Texty tabulek           | 14 px    | 13–14 px | 400–600 |



Texty obsahující zásadní informace nesmějí být menší než 14 px na mobilu.



Nadpisy používat střídmě. Nepoužívat dlouhé texty psané velkými písmeny, kromě hlavních tlačítek typu PŘÍCHOD, ODCHOD a ZAPSAT VÝROBU.



Řádkování běžného textu 1.45–1.6.



\# 5. GEOMETRIE A PROSTOROVÝ SYSTÉM



\## 5.1 Základní spacing



Používat jednotnou násobkovou škálu:



`4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 px`



Konkrétní pravidla:



\- Mezera mezi ikonou a textem: 8–12 px.

\- Mezera mezi souvisejícími poli: 8–12 px.

\- Mezera mezi tlačítky: 12–14 px.

\- Mezera mezi hlavními kartami: 16–24 px.

\- Vnitřní odsazení mobilních karet: 16–20 px.

\- Vnitřní odsazení desktopových karet: 20–24 px.

\- Okraj mobilní obrazovky: 16 px.

\- Okraj desktopového obsahu: 24–32 px.



\## 5.2 Zaoblení



| Prvek                | Border radius |

| -------------------- | ------------- |

| Hlavní karty         | 16 px         |

| Velké mobilní akce   | 16 px         |

| Standardní tlačítka  | 10–12 px      |

| Vstupní pole         | 10–12 px      |

| Numerická klávesnice | 14 px         |

| Malé štítky          | 8 px          |

| Stavové indikátory   | 9999 px       |



Vizuální styl má být měkký, geometrický a moderní. Nepoužívat ostré pravoúhlé rohy na hlavních kartách ani extrémně zaoblené komponenty bez funkčního důvodu.



\## 5.3 Stíny a rámečky



Administrace:



\- Jemný stín karet: `0 6px 24px rgba(16,40,32,0.08)`.

\- Jemné okraje: `1px solid #E4DDD0`.

\- Bez výrazných barevných zářících efektů.



Mobilní část:



\- Preferovat oddělení komponent změnou odstínu zelené.

\- Lehké ohraničení `#426456`.

\- Pouze decentní stíny, bez neonu.

\- Aktivní akce lze podpořit malým zvýšením kontrastu nebo ztmavením.



\# 6. LOGO, IKONY A VIZUÁLNÍ MOTIVY



\## 6.1 Identita



Greenberg je firemní značka. Kipáčky zůstávají názvem interní aplikace, pokud nebude rozhodnuto jinak.



V zaměstnanecké části lze používat malý textový podpis „Greenberg“ a v patičce název interní aplikace.



V administraci zachovat existující název Kipáčky a doplnit decentní vazbu na firemní identitu Greenberg.



Neprovádět automatické přejmenování aplikace ani plošnou náhradu existujících log bez schválení.



\## 6.2 Ikony



Doporučená sada: Lucide Icons.



Styl ikon:



\- Obrysové, nikoliv kombinace různých stylů.

\- Tloušťka tahu 1.75–2 px.

\- Velikost 18–22 px pro běžné funkce.

\- Velikost 24–28 px u velkých akcí.

\- Jednotné geometrické proporce.



Příklady:



\- Docházka: `clock-3`.

\- Příchod: `log-in`.

\- Odchod: `log-out`.

\- Výroba: `package-plus`.

\- Zaměstnanci: `users`.

\- Směny: `calendar-days`.

\- Výplata: `wallet`.

\- Výkazy: `chart-no-axes-column`.

\- Nastavení: `settings`.

\- Zpět: `arrow-left`.

\- Potvrzení: `check-circle-2`.



Ikony nesmějí nahrazovat důležité textové popisky.



\## 6.3 Regionální a řemeslné motivy



Nepomuk, zámek Zelená Hora, historická architektura a přírodní materiály mají sloužit pouze jako decentní vizuální inspirace.



Přípustné prvky:



\- Jemné geometrické linie připomínající výsekové plány.

\- Stylizované sklady a ohyby papíru.

\- Velmi slabá struktura kartonu.

\- Geometrické prvky odkazující na balení a tisk.

\- Abstraktní silueta Zelené Hory v dekorativním pozadí.



Nepoužívat tyto motivy:



\- Pod formuláři.

\- Za tabulkami.

\- Pod číselnou klávesnicí.

\- Za důležitými texty.

\- Jako rušivé výrazné fotografie pracovního prostředí.



Pokud je použit motiv v pozadí, jeho intenzita má být velmi nízká, zpravidla vizuálně odpovídající krytí 3–5 %.



\# 7. SPOLEČNÉ KOMPONENTY



\## 7.1 Hlavní tlačítka



Výška standardního tlačítka 44–48 px.



Velká zaměstnanecká tlačítka mají výšku 64–76 px.



Tlačítka obsahují ikonu a text, horizontálně vycentrované.



Při dotyku nebo kliknutí použít jemnou změnu odstínu. Přechod 120–180 ms.



Na mobilech nepoužívat hover jako nezbytný způsob rozpoznání funkcionality.



\## 7.2 Vstupní pole



Světlá administrace:



\- Pozadí `#FFFFFF`.

\- Text `#232B28`.

\- Ohraničení `#D6DCD3`.

\- Focus border `#193F34`.

\- Výška 44–48 px.

\- Radius 10 px.



Tmavá mobilní část:



\- Pozadí `#102E26`.

\- Text `#F7F3E9`.

\- Ohraničení `#426456`.

\- Focus border `#D7BE97`.

\- Výška minimálně 48 px.



Písmo vstupních polí na mobilu minimálně 16 px, aby nedocházelo k nechtěnému přibližování stránky při zaměření pole.



\## 7.3 Výběrová pole



Stejný vzhled jako vstupní pole.



Šipka vpravo, jasně oddělený text.



Vybraná položka musí mít dostatečný kontrast.



Dlouhé názvy zakázek se nesmějí stát nečitelnými. V rozbalené nabídce musí být dostupné celé názvy.



\## 7.4 Karty



Karty používají:



\- Jednotné odsazení.

\- Jednotné zaoblení.

\- Jemné okraje.

\- Jasně viditelný nadpis.

\- Vhodně oddělené informace.



V mobilní části jsou hlavním stavebním prvkem UI.



V administraci slouží ke sdružování formulářů, filtrů, tabulek a přehledů.



\## 7.5 Stavové štítky



Zaoblené malé štítky.



Příklady:



\- Aktivní.

\- Mimo pracoviště.

\- DPP.

\- DPČ.

\- Potvrzeno.

\- Chybějící údaj.

\- Dokončeno.



Štítek má kombinovat text a případně barevný indikátor.



Význam nesmí být sdělován pouze barvou.



\## 7.6 Informační a chybová hlášení



Používat jednotný systém:



\- Úspěch – zelený.

\- Varování – teplý jantarový.

\- Chyba – červený.

\- Informace – neutrální zelenošedý.



Vždy zobrazit krátký a srozumitelný text.



Nespoléhat pouze na toast, který příliš rychle zmizí.



\# 8. ZAMĚSTNANECKÁ ČÁST – MOBILNÍ OBRAZOVKY



\## 8.1 Globální vzhled



Pozadí aplikace: `#102E26`.



Primární karty: `#193F34`.



Primární text: `#F7F3E9`.



Sekundární text: `#C9DDD0`.



Firemní akcenty: `#D7BE97`.



Celý vzhled má působit jako precizní profesionální pracovní nástroj, nikoliv jako herní aplikace.



Obsah stránky má mít šířku maximálně 460 px a být centrovaný na širších displejích.



Na běžných telefonech využívat celou dostupnou šířku s vnitřním okrajem 16 px.



\## 8.2 Horní stavová lišta



Lišta obsahuje aktuálně používané provozní informace – stav systému, datum a čas.



Doporučená výška 52–60 px.



Pozadí `#193F34`, případně průhledné na tmavém pozadí.



Text `#F7F3E9`.



Aktivní stav:



\- Malý zelený bod `#34C790`.

\- Text `#C9DDD0`.



Čas:



\- Tabulární číslice.

\- Přiměřený kontrast.

\- Menší samostatná plocha nebo rámeček.



Protože zaměstnanci používají vlastní telefony, doporučený text stavové informace je „DOCHÁZKA ONLINE“ namísto původního „KIOSK AKTIVNÍ“. Jde o doporučení textové změny, nikoliv o podmínku redesignu.



Na užších displejích nesmí docházet k překrývání data, času a statusu.



\## 8.3 Obrazovka zadání PINu



Zachovat existující funkcionalitu čtyřmístného PINu.



Struktura obrazovky:



1\. Horní stavová lišta.

2\. Centrální ikona zámku.

3\. Nadpis „Pracovní docházka“.

4\. Vysvětlující text „Zadejte svůj 4místný osobní PIN“.

5\. Čtyři indikátory zadaných číslic.

6\. Velká numerická klávesnice.

7\. Spodní informační patička.



Design:



\- Ikona zámku ve čtverci 64 × 64 px.

\- Pozadí ikony `#285446`.

\- Ikona `#D7BE97`.

\- Nadpis 26–28 px, Manrope Bold.

\- Podnadpis 15 px.

\- PIN indikátory o průměru 14–16 px.

\- Nevyplněné indikátory: okraj `#789184`.

\- Vyplněné indikátory: `#D7BE97`.



Numerická klávesnice:



\- Tři stejně široké sloupce.

\- Rozestupy 10–12 px.

\- Výška tlačítek 64–72 px.

\- Pozadí `#193F34`.

\- Ohraničení `#426456`.

\- Bílé či krémové číslice.

\- Číslice velikosti 26–30 px, váha 700.

\- Radius 14 px.



Tlačítka Smazat a Backspace mají stejnou geometrii jako číselná tlačítka, ale méně výrazný vzhled.



Neaktivní stavy mají být vizuálně jasně rozpoznatelné.



Prvky rozmístit tak, aby klávesnice na běžném telefonu byla dobře dostupná palcem.



Na nižších displejích umožnit posouvání obsahu. Nikdy nezmenšovat tlačítka pod použitelnou dotykovou velikost jen kvůli snaze umístit vše bez scrollování.



\## 8.4 Hlavní obrazovka zaměstnance



Po zadání PINu zachovat stávající informace a dostupné funkce.



Doporučená vizuální hierarchie:



\### A. Karta zaměstnance



Karta obsahuje:



\- Jméno zaměstnance.

\- Typ úvazku.

\- Aktuální stav docházky.

\- Dnes evidovanou odměnu, pokud se již zobrazuje.

\- Poslední docházkový záznam.



Karta má pozadí `#193F34`.



Vnitřní odsazení 20 px.



Radius 16 px.



Jméno 20–22 px, výrazně tučné.



Štítek DPP/DPČ v tlumeném světlejším zeleném poli.



Stav přítomnosti zobrazit pomocí barevného štítku a textu.



Důležité: odměna je odvozena od vyrobených kusů, nikoliv automaticky od odpracovaných hodin.



\### B. Informační karta BOZP



Zachovat současnou funkci a její odkaz.



Použít menší horizontální kartu.



Pozadí `#285446` nebo primární karta s jemným ohraničením.



Ikona dokumentu vlevo.



Text potvrzení uprostřed.



Odkaz „Zobrazit“ vpravo.



Výška podle obsahu, minimálně 48 px.



\### C. Příchod a odchod



Jedny z nejdůležitějších akcí celé aplikace.



Obě tlačítka musí být široká přes celý obsahový prostor.



PŘÍCHOD:



\- Pozadí `#16634D`.

\- Text `#FFFFFF`.

\- Ikona `log-in`.

\- Výška 72 px.

\- Radius 16 px.



ODCHOD:



\- Pozadí `#432F32`.

\- Text `#FFE0DE`.

\- Ikona `log-out`.

\- Výška 72 px.

\- Radius 16 px.



Mezera mezi tlačítky 12–14 px.



Aktivní, neaktivní a ostatní stavové varianty zachovat podle existující logiky aplikace.



\### D. Zapsat výrobu



Samostatná velká akce.



Pozadí `#9B623F`.



Text `#FFFFFF`.



Ikona `package-plus`.



Výška 68–72 px.



Radius 16 px.



Musí být vizuálně výrazná, ale nesmí potlačit dvě hlavní docházkové akce.



Původní intenzivní fialovou barvu odstranit.



\### E. Vedlejší akce



Burza směn a Profil \& Výplata ponechat jako dvě menší karty vedle sebe, pokud se vejdou.



Na mobilu 320 px zajistit čitelnost textů. V případě potřeby je možné upravit vnitřní odsazení nebo použít svislé uspořádání.



Burza směn:



\- Pozadí `#285446`.

\- Světlý text.

\- Ikona kalendáře.



Profil \& Výplata:



\- Pozadí `#D7BE97`.

\- Text `#193F34`.

\- Ikona peněženky.



\### F. Měsíční výkaz



Ponechat samostatnou horizontální kartu.



Pozadí `#193F34`.



Okraj `#426456`.



Obsah:



\- Ikona grafu.

\- Stávající text „Můj měsíční výkaz (hodiny a výdělek)“.

\- Akce Zobrazit.



V přehledu musí být časová evidence a kusová odměna vizuálně odlišeny.



\### G. Návrat



Odkaz „Zpět / Jiný PIN“ ponechat v dolní části.



Nenápadný sekundární styl, ale dostatečně velká dotyková plocha.



Barva textu `#C9DDD0`.



\# 9. EVIDENCE VÝROBY



Jde o jednu z funkčně nejdůležitějších obrazovek.



Prioritou je rychlé zadání množství s minimálním počtem dotyků.



Nesmí být zhoršena stávající rychlost práce.



\## 9.1 Rozložení obrazovky



Zachovat pořadí:



1\. Záhlaví obrazovky a návrat.

2\. Výběr zakázky.

3\. Průběh plnění zakázky.

4\. Výběr operace.

5\. Počet vyrobených kusů.

6\. Rychlé přičítání množství.

7\. Numerická klávesnice.

8\. Odeslání výroby.



\## 9.2 Výběr zakázky



Tmavé výběrové pole.



Pozadí `#102E26`.



Okraj `#426456`.



Vybraný text `#F7F3E9`.



Nad polem menší štítek „1. VYBERTE ZAKÁZKU“.



Zachovat informace o názvu zakázky, čísle zakázky a případném cílovém počtu kusů.



\## 9.3 Průběh zakázky



Progress bar:



\- Pozadí `#285446`.

\- Vyplněná část `#D7BE97`.

\- Výška 8–10 px.

\- Zaoblené konce.



Číselný údaj o průběhu má být dostatečně kontrastní.



Termín dokončení zobrazit menším textem pod průběhem.



Normální informační text světlý.



Blížící se termín nebo varování používat ve stávajícím významu, ale ve sjednocené jantarové barevnosti.



\## 9.4 Výběr operace



Operace zobrazit jako dotykové karty.



Na běžném mobilu dvě karty vedle sebe, pokud jsou názvy čitelné.



Každá karta obsahuje:



\- Název operace.

\- Odměnu za kus.

\- Normu kusů za hodinu.



Neaktivní karta:



\- Pozadí `#193F34`.

\- Okraj `#426456`.

\- Text `#F7F3E9`.



Vybraná karta:



\- Pozadí `#285446`.

\- Okraj `2px solid #D7BE97`.

\- Výraznější název.

\- Text odměny v barvě `#D7BE97`.



Nevyužívat původní fialové orámování.



Výška karet podle textu, minimálně 64 px.



Na velmi úzkých mobilech přepnout na jeden sloupec, pokud by dvousloupcové uspořádání způsobovalo přetékání.



\## 9.5 Počet vyrobených kusů



Hlavní numerická hodnota představuje nejvýznamnější informaci této obrazovky.



\- Velikost čísla 36–40 px.

\- Barva `#F7F3E9`.

\- Váha 700–800.

\- Jednotka „ks“ menší, 14–16 px.

\- Pozadí vstupní části `#102E26`.

\- Okraj `#426456`.

\- Radius 12–14 px.



\## 9.6 Rychlé přičítání



Zachovat tlačítka:



`+10`, `+50`, `+100`, `Vynulovat`.



Tlačítka +10, +50, +100:



\- Pozadí `#285446`.

\- Text `#D7BE97`.

\- Okraj `#426456`.

\- Jednotná výška 44–48 px.



Vynulovat:



\- Tlumený tmavý podklad.

\- Text `#FFE0DE`.

\- Případně jemný vínový rámeček.



Tlačítko Vynulovat musí být vizuálně odlišné od přičítacích tlačítek.



\## 9.7 Numerická klávesnice



Stejný komponentový styl jako PIN klávesnice.



Tři sloupce.



Výška jednotlivých tlačítek přibližně 50–58 px na obrazovce výroby.



Dostatečný kontrast a rozestupy.



Na menších telefonech umožnit vertikální scrollování, ne zmenšování čísel na nečitelnou velikost.



\## 9.8 Odeslat výrobu



Tlačítko přes celou šířku.



Pozadí aktivního stavu `#9B623F`.



Text `#FFFFFF`.



Výška 60–64 px.



Ikona odeslání vlevo.



V neaktivním stavu tlumený zelenošedý vzhled.



Po odeslání vizuálně využít standardní potvrzovací komponentu aplikace.



Neměnit logiku odesílání, kontroly množství ani následného stavu formuláře.



\# 10. ADMINISTRACE – DESKTOP



\## 10.1 Hlavní kompozice



Administrace má být vizuálně světlejší a informačně hustší než zaměstnanecká část.



Celková struktura:



\- Tmavě zelená horní navigace.

\- Světlý hlavní pracovní prostor.

\- Karty obsahující formuláře a tabulky.

\- Jednotná horní část stránky s nadpisem a hlavní akcí.

\- Přirozené seskupování souvisejících údajů.



Pozadí stránky `#F7F3E9`.



Maximální šířka hlavního obsahu přibližně 1600 px, na širokém monitoru centrovat.



Horizontální padding desktopu 24–32 px.



\## 10.2 Horní navigace



Pozadí `#193F34`.



Výška přibližně 64 px.



Logo / název Kipáčky vlevo.



Vedle názvu menší doplňující štítek Greenberg / Admin \& výroba.



Položky navigace zachovat:



\- Zaměstnanci.

\- Docházka.

\- Produkce \& Normy.

\- Směny \& BOZP.

\- Měsíční výkazy \& Mzdy.

\- Kiosk / přepnutí příslušného prostředí, pokud je součástí současné aplikace.

\- Odhlášení.



Barvy:



\- Neaktivní položka: `#C9DDD0`.

\- Aktivní položka: pozadí `#D7BE97`, text `#193F34`.

\- Hover: pozadí `#285446`, světlý text.

\- Okraj navigace případně `#426456`.



Nenahrazovat funkční navigaci novou strukturou bez schválení.



Při menších desktopových šířkách lze zmenšit mezery a schovat čistě dekorativní texty.



\## 10.3 Titulek stránky



Pod navigací umístit hlavní nadpis.



Například:



„Správa zaměstnanců a PIN kódů“



Nadpis 28–30 px, Manrope Bold, `#193F34`.



Pod nadpisem existující vysvětlující text, například informace o brigádnících a PINech.



Sekundární text `#55645B`.



Hlavní akce vpravo, pokud ji daná stránka obsahuje.



Příklad:



„Vytisknout vchodový QR kód“



Tlačítko:



\- Pozadí `#193F34`.

\- Text `#FFFFFF`.

\- Výška 44–48 px.

\- Radius 10 px.

\- Ikona QR kódu.



\## 10.4 Formulář zaměstnance



Použít bílou kartu.



Pozadí `#FFFFFF`.



Radius 16 px.



Okraj `#E4DDD0`.



Padding 20–24 px.



Nadpis karty 18 px.



Formulář zachovává všechna stávající pole, například:



\- Jméno a příjmení.

\- PIN.

\- Typ úvazku.

\- Telefon.

\- E-mail.

\- Bankovní účet.

\- Příslušnou akci Přidat.



Pole logicky seskupit do řádků.



Na širokém monitoru mohou být vedle sebe.



Pole s nejdelšími texty mají být širší než krátká pole typu PIN.



Tlačítko Přidat vizuálně patří k formuláři a musí být jasně rozeznatelné.



Barva hlavní akce `#193F34`.



Neměnit význam jednotlivých polí ani jejich validační pravidla.



\## 10.5 Tabulka zaměstnanců



Bílá nebo velmi světlá karta.



Záhlaví tabulky `#E9E1D2`.



Text záhlaví `#193F34`, 12–13 px, váha 700.



Řádky bílé.



Dělicí linie `#E4DDD0`.



Výška řádku přibližně 52–60 px.



Hover řádku `#F0EBE0`.



Zachovat existující sloupce a data.



Zaměstnanecké jméno zobrazit výrazněji než doplňkové údaje.



Typ úvazku zobrazit jako štítek.



Stav zaměstnance zobrazit barevným indikátorem a textem.



Chybějící nebo upozorňující údaje použít sémantickou jantarovou barvu.



Akce úprav jako standardní ikonové tlačítko s dostatečnou klikací plochou.



V tabulkách zachovat současné hodnoty a funkce beze změny.



\## 10.6 Docházka, výroba, normy, výkazy a mzdy



Pro všechny další administrační stránky platí stejný systém.



Docházka:



\- Časové údaje s tabulárními číslicemi.

\- Jasné oddělení příchodu a odchodu.

\- Dobře čitelné datum a souhrn hodin.



Produkce a normy:



\- Zvýraznit počty kusů, sazby a normy.

\- Seskupit informace o zakázkách a výrobních operacích.

\- Výrobní postup označovat neutrálně, stavové výjimky sémantickými barvami.



Měsíční výkazy a mzdy:



\- Vizualizovat samostatně odpracované hodiny a kusové odměny.

\- Finanční souhrny mohou být zvýrazněny měděnou nebo kartonovou barvou.

\- Číselné údaje zarovnávat vpravo.

\- Zachovat přesnost a stávající formát dat.



Důležité: evidence pracovního času a odměna za vyrobené kusy jsou dvě rozdílné datové oblasti. V designu je nezaměňovat.



\# 11. RESPONZIVNÍ PRAVIDLA



\## 11.1 Breakpointy



Doporučené hranice:



| Šířka viewportu | Režim          |

| --------------- | -------------- |

| 320–479 px      | Malý mobil     |

| 480–767 px      | Větší mobil    |

| 768–1023 px     | Tablet         |

| 1024–1439 px    | Desktop        |

| 1440 px a více  | Široký desktop |



Breakpointy lze přizpůsobit skutečné šířce obsahu, ale výsledné chování musí odpovídat následujícím zásadám.



\## 11.2 Zaměstnanecká část



\- Jednosloupcové rozložení jako výchozí.

\- Maximální šířka obsahu 460 px.

\- Velká tlačítka a čitelná čísla.

\- Bez horizontálního scrollování stránky.

\- Na výšku omezených mobilech umožnit přirozené vertikální posouvání.

\- Zachovat bezpečné okraje displeje.

\- Nevyužívat pevně stanovenou výšku obsahu, která způsobí skrytí tlačítek.



\## 11.3 Administrace na mobilu



Desktopové tabulky mohou být na mobilu transformovány do přehledných záznamových karet.



Každá karta obsahuje:



\- Hlavní identifikátor.

\- Základní údaje.

\- Stav.

\- Akce.



Nesmějí zmizet data ani akce dostupné na desktopu.



Kde je nutné zachovat tabulkové porovnávání velkého počtu sloupců, lze použít horizontální posouvání uvnitř samostatného tabulkového kontejneru. Nikdy však horizontální scrollování celé stránky.



Formuláře na mobilu přeskupit do jednoho sloupce.



Horní administrativní menu se může změnit na rozbalovací nebo mobilní navigaci, ale všechny existující sekce musí zůstat dostupné.



\# 12. ZPĚTNÁ VAZBA A STAVY UI



\## 12.1 Hover



Pouze jemné ztmavení nebo zesvětlení komponenty.



Bez nadměrných animací.



\## 12.2 Focus



Každý interaktivní prvek musí mít dobře viditelný focus stav.



Na světlém pozadí používat zelenou, na tmavém béžovou.



Focus nesmí být vyjádřen pouze nepatrnou změnou pozadí.



\## 12.3 Disabled



Neaktivní komponenty musí být vizuálně tlumené, ale jejich popisek musí zůstat rozpoznatelný.



Nepoužívat pouze velmi nízkou opacity pro celý obsah.



\## 12.4 Loading



Při probíhající akci zobrazit jednotný indikátor zpracování podle současné logiky aplikace.



Barva indikátoru `#D7BE97` na tmavém podkladu a `#193F34` na světlém.



\## 12.5 Potvrzení



Po úspěšné uživatelské operaci zobrazit výsledek dostatečně čitelně, s ikonou a textem.



Používat sjednocený vizuální komponent.



Samotnou existující logiku potvrzování a ukládání neměnit.



\# 13. PŘÍSTUPNOST A ERGONOMIE



Design musí splnit minimálně tyto požadavky:



\- Kontrast běžného textu vůči pozadí alespoň 4,5 : 1.

\- Kontrast většího textu alespoň 3 : 1.

\- Dotykové prvky zaměstnanců alespoň 44 × 44 px, hlavní akce výrazně větší.

\- Texty nesmějí být závislé na hoveru.

\- Informace nesdělovat pouze barvou.

\- Zachovat viditelný stav zaměření.

\- Respektovat systémové zvětšení textu.

\- Nepoužívat animace, které mohou narušovat práci.

\- Podporovat `prefers-reduced-motion`.

\- Nenechat čitelnost záviset na dekorativních efektech nebo fotografiích.



Mobilní část musí být bez problémů ovladatelná na běžném telefonu v prostředí výroby.



Desktopová část musí zůstat pohodlná při několikahodinové práci.



\# 14. ZAKÁZANÉ NEBO NEŽÁDOUCÍ DESIGNOVÉ POSTUPY



Nepoužívat:



\- Neonové záře kolem tlačítek.

\- Intenzivní fialovou nebo sytě modrou jako dominantní barvu.

\- Velké fotografie či ornamenty na pracovních obrazovkách.

\- Výrazný glassmorphism a průhledné panely zhoršující čitelnost.

\- Mnoho různých barevných přechodů.

\- Animované pozadí.

\- Extrémně malé texty.

\- Přehnaně velké stíny.

\- Zbytečně velké prázdné plochy mezi ovládacími prvky.

\- Barevné odlišení bez jasné funkce.



Důraz klást na konzistenci, čitelnost a rychlost práce.



\# 15. TECHNICKÁ IMPLEMENTACE DESIGNU



\## 15.1 CSS designové tokeny



Všechny barvy, rozměry, fonty, mezery a poloměry zaoblení soustředit do společné sady CSS proměnných.



Doporučené názvy hlavních tokenů:



| CSS token                   | Hodnota   |

| --------------------------- | --------- |

| `--color-brand-primary`     | `#193F34` |

| `--color-brand-dark`        | `#102E26` |

| `--color-brand-secondary`   | `#285446` |

| `--color-brand-paper`       | `#F7F3E9` |

| `--color-brand-kraft`       | `#D7BE97` |

| `--color-brand-copper`      | `#B96543` |

| `--color-brand-copper-text` | `#8E4B2F` |

| `--color-text-primary`      | `#232B28` |

| `--color-text-secondary`    | `#55645B` |

| `--color-text-inverse`      | `#F7F3E9` |

| `--color-surface-light`     | `#FFFFFF` |

| `--color-surface-dark`      | `#193F34` |

| `--color-border-light`      | `#E4DDD0` |

| `--color-border-dark`       | `#426456` |

| `--color-action-arrival`    | `#16634D` |

| `--color-action-departure`  | `#432F32` |

| `--color-action-production` | `#9B623F` |

| `--color-status-error`      | `#A53F4E` |

| `--color-status-warning`    | `#835614` |

| `--radius-card`             | `16px`    |

| `--radius-button`           | `12px`    |

| `--radius-input`            | `10px`    |

| `--space-unit`              | `4px`     |



Doplnit samostatné kontextové proměnné pro mobilní a administrační prostředí, například `--page-bg`, `--card-bg`, `--field-bg`, `--text-main`.



Neměnit základní barevné tokeny jen podle konkrétní stránky. Rozdíly řešit kontextovými proměnnými.



\## 15.2 Architektura stylů



Preferovat společné komponentové styly:



\- Button.

\- Input.

\- Select.

\- Card.

\- Badge.

\- Alert.

\- Table.

\- Dialog.

\- Navigation.

\- NumericKeypad.

\- ProgressBar.



Nad nimi vytvořit dvě sady tematických pravidel:



\- `theme-employee-dark`.

\- `theme-admin-light`.



Konkrétní názvy lze přizpůsobit současné architektuře projektu.



Nepřepisovat existující funkční komponenty, pokud lze požadovaného vzhledu dosáhnout úpravou CSS a bezpečnými změnami struktury HTML.



Pokud aplikace již obsahuje existující design systém, upravit jej místo vytváření paralelního systému.



\## 15.3 Zachování existující funkčnosti



Při redesignu:



\- Zachovat obslužné události.

\- Zachovat existující identifikátory, pokud na nich závisí JavaScript.

\- Zachovat API a databázovou komunikaci.

\- Zachovat stávající výpočty.

\- Zachovat systém PINů.

\- Zachovat evidenci příchodů a odchodů.

\- Zachovat evidenci výroby a kusů.

\- Zachovat stávající formulářová pole.

\- Zachovat administrační funkce.

\- Zachovat všechny navigační cesty a dostupné akce.



Nedělat nevyžádaný refactoring obchodní logiky.



Nevymazávat již existující části aplikace jen proto, že nejsou na poskytnutých screenshotech.



Nepředpokládat, že screenshoty zobrazují všechny možné stavy aplikace.



\# 16. VÝSLEDNÝ VIZUÁLNÍ CHARAKTER



Aplikace má vyvolávat tyto asociace:



\*\*Profesionální česká výrobní firma. Moderní interní systém. Přírodní materiály. Precizní kartonáž. Řemeslná kvalita. Technologická spolehlivost.\*\*



Mobilní část má být jednoduchá, tmavě zelená, výrazná a ergonomická.



Administrace má být čistá, světlá, klidná, dobře strukturovaná a datově přehledná.



Firemní motivy se projeví především v barvách, typografii, detailních liniích a geometrii, nikoliv v rušivých ilustracích.



Stejnou firemní barevnost a vizuální identitu musí být možné později převzít i do veřejného webu etisk.eu.



\# 17. KONTROLNÍ SEZNAM HOTOVÉHO REDESIGNU



Redesign je dokončený teprve tehdy, když platí všechny následující podmínky:



\- \[ ] Všechny obrazovky používají sjednocenou paletu Greenberg.

\- \[ ] Zaměstnanecké obrazovky jsou primárně optimalizované pro mobil.

\- \[ ] Administrace je optimalizovaná pro PC.

\- \[ ] Administrace zůstává použitelná i na mobilu.

\- \[ ] Numerické klávesnice jsou dostatečně velké a čitelné.

\- \[ ] Příchod, odchod a výroba jsou jasně vizuálně rozlišené.

\- \[ ] Výběr zakázky a operace je přehledný.

\- \[ ] Formuláře a tabulky mají jednotný vzhled.

\- \[ ] Všechny existující funkce jsou zachované.

\- \[ ] Žádné ovládací prvky nepřetékají mimo obrazovku.

\- \[ ] Aktivní, neaktivní a chybové stavy jsou rozlišitelné.

\- \[ ] Texty splňují stanovená kontrastní pravidla.

\- \[ ] Nejsou zavedeny zbytečné dekorativní animace.

\- \[ ] Nejsou použity původní dominantní modré a fialové akcenty.

\- \[ ] CSS využívá jednotné designové tokeny.

\- \[ ] Vzhled je konzistentní napříč všemi částmi aplikace.

\- \[ ] Jsou vizuálně zkontrolovány nejméně mobilní šířky 320, 375 a 430 px a desktopové šířky 1024, 1440 a 1920 px.



\---



\## ZÁVĚREČNÝ POKYN PRO IMPLEMENTACI



Proveď vizuální redesign existující aplikace Kipáčky podle této specifikace. Zachovej její současnou funkčnost a architekturu.



Upřednostni úpravu společných CSS tokenů, komponent a layoutů před přepisováním jednotlivých obrazovek.



Vzhled musí být jednotný, profesionální a plně responzivní.



\*\*Priorita rozhodování:\*\*



1\. Zachování funkčnosti.

2\. Rychlost a ergonomie ovládání.

3\. Čitelnost a přístupnost.

4\. Konzistentní design Greenberg.

5\. Dekorativní a estetické detaily.



Pokud by některý designový požadavek zhoršoval funkčnost, přístupnost nebo ergonomii, upřednostni funkční a přehledné řešení.



\*\*Výsledkem musí být kompletně vizuálně sjednocená aplikace, nikoliv pouze přebarvená úvodní obrazovka.\*\*



