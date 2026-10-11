\### Technické zadání pro Antigravity: Modul plných znění směrnic (Web-based)



Rozhodnutí vyhnout se PDF souborům a řešit plné znění jako nativní webové stránky je z hlediska vývoje i uživatelské přívětivosti ideální. Odpadají problémy s kompatibilitou prohlížečů při otevírání PDF na mobilech a usnadňuje se údržba.



\*\*1. Aktualizace databázového modelu (EF Core)\*\*

Do tabulky `Documents` (Směrnice) upravíme strukturu tak, aby pojala jak zkrácený, tak plný text.



\* `Id` (PK)

\* `Title` (String) – Název dokumentu.

\* `ShortText` (String) – Zkrácený text pro obrazovku souhlasu.

\* `FullText` (String / NVARCHAR(MAX)) – Plné znění dokumentu. Může obsahovat čistý text s formátováním pomocí znaků nového řádku (`\\n`), případně jednoduchý Markdown, pokud by Marta chtěla texty strukturovat pomocí nadpisů a odrážek.

\* `IsActive` (Boolean)



\*\*2. Administrátorské rozhraní (React)\*\*



\* Ve formuláři pro vytvoření/úpravu směrnice přibude rozměrný prvek `<textarea>` pro vložení plného textu.

\* Pokud se rozhodnete nepoužít WYSIWYG editor (pro zachování jednoduchosti), stačí při renderování plného textu převádět `\\n` na `<br />`.



\*\*3. Klientská aplikace a Kiosk (React)\*\*



\* \*\*Routing:\*\* Vytvořte novou veřejnou routu, např. `/směrnice/:id`.

\* \*\*Zobrazení souhlasu:\*\* V modálním okně nebo na stránce, kde brigádník kliká na souhlas, bude tlačítko 📄 \*\*Zobrazit plné znění\*\*. Toto tlačítko otevře routu `/směrnice/:id` v nové záložce prohlížeče (`target="\_blank"`).

\* \*\*Stránka plného znění:\*\* Stránka bude mít minimalistický design (černé písmo, bílé pozadí). Bude obsahovat:

\* Nadpis dokumentu (H1).

\* Samotný vyrenderovaný obsah `FullText`.

\* Tlačítko \*\*Vytisknout dokument\*\* (volající nativní `window.print()`).





\* \*\*Tiskové styly (CSS):\*\* Pro čistý tisk z prohlížeče definujte jednoduché pravidlo `@media print`, které skryje navigační prvky a tlačítka, odstraní stíny a nastaví šířku obsahu na 100 %, aby si to Marta mohla z webu kdykoliv vytisknout jako klasickou A4.



\---



\### Šablony plných textů pro uložení do databáze



Níže jsou připravené univerzální texty, které pokrývají základní právní i provozní minimum. Marta si je může upravit podle specifik své dílny (vložením do pole `FullText`).



\#### Dokument 1: BOZP – Bezpečnost a ochrana zdraví při práci



\*\*Zkrácený text (pro souhlas):\*\*

Potvrzuji, že jsem byl/a seznámen/a s platnými pravidly bezpečnosti a ochrany zdraví při práci (BOZP). Zavazuji se dodržovat bezpečné pracovní postupy, používat ochranné pomůcky, nepracovat pod vlivem návykových látek a ihned hlásit každý úraz nadřízenému. Byla mi poskytnuta možnost prostudovat si plné znění směrnice.



\*\*Plné znění (FullText):\*\*

\*\*Základní pravidla bezpečnosti a ochrany zdraví při práci (BOZP)\*\*



1\. \*\*Všeobecné povinnosti:\*\* Zaměstnanec/brigádník je povinen dbát podle svých možností o svou vlastní bezpečnost, o své zdraví i o bezpečnost a zdraví osob, kterých se bezprostředně dotýká jeho jednání.

2\. \*\*Pracovní postupy:\*\* Je přísně zakázáno vyřazovat z provozu bezpečnostní a ochranná zařízení na strojích a vybavení. Zaměstnanec smí obsluhovat pouze stroje a zařízení, pro které byl zaškolen.

3\. \*\*Ochranné pomůcky:\*\* Zaměstnanec je povinen používat přidělené osobní ochranné pracovní prostředky (OOPP) a starat se o jejich údržbu.

4\. \*\*Zákaz alkoholu a omamných látek:\*\* Je přísně zakázáno požívat alkoholické nápoje a zneužívat jiné návykové látky na pracovištích zaměstnavatele a v pracovní době i mimo tato pracoviště. Zaměstnanec nesmí vstupovat pod jejich vlivem na pracoviště. Zaměstnavatel si vyhrazuje právo provádět namátkové kontroly.

5\. \*\*Pracovní úrazy:\*\* Každý pracovní úraz, i drobná poranění (např. říznutí o papír, oděrky), je zaměstnanec povinen neprodleně nahlásit svému nadřízenému a zapsat do Knihy úrazů.

6\. \*\*Pořádek na pracovišti:\*\* Každý odpovídá za čistotu a pořádek na svém pracovišti. Je zakázáno blokovat komunikační uličky materiálem či odpadem.



\#### Dokument 2: Požární ochrana a únikové cesty



\*\*Zkrácený text (pro souhlas):\*\*

Potvrzuji, že jsem byl/a proškolen/a v oblasti požární ochrany. Znám umístění hasicích přístrojů, lékárničky a únikových východů. Vím, jak postupovat při požáru nebo vyhlášení poplachu. Byla mi poskytnuta možnost prostudovat si plné znění směrnice.



\*\*Plné znění (FullText):\*\*

\*\*Směrnice o požární ochraně (PO) a evakuační plán\*\*



1\. \*\*Prevence:\*\* Každý pracovník je povinen počínat si tak, aby nezavdal příčinu ke vzniku požáru. Je přísně zakázáno manipulovat s otevřeným ohněm a kouřit ve všech vnitřních prostorách dílny (včetně elektronických cigaret). Kouření je povoleno výhradně na vyhrazeném venkovním místě.

2\. \*\*Únikové cesty:\*\* Únikové cesty, východy a přístupy k hlavním vypínačům elektrické energie, uzávěrům vody a k hasicím přístrojům musí zůstat trvale volné a nesmí být zastavovány materiálem.

3\. \*\*Postup při požáru:\*\* Zpozoruje-li pracovník požár, je povinen se jej pokusit uhasit dostupnými hasicími přístroji, pokud tím neohrozí vlastní život nebo zdraví. V opačném případě okamžitě varuje ostatní (např. voláním "HOŘÍ"), zahájí evakuaci a neprodleně volá hasiče (linka 150 nebo 112).

4\. \*\*Evakuace:\*\* Po vyhlášení poplachu nebo pokynu nadřízeného jsou všichni pracovníci povinni okamžitě opustit budovu po vyznačených únikových cestách a shromáždit se na určeném evakuačním místě před budovou. Zde vyčkají na přepočítání stavu osob.



\#### Dokument 3: Provozní řád a kontrola kvality



\*\*Zkrácený text (pro souhlas):\*\*

Zavazuji se dodržovat provozní řád pracoviště, řádně evidovat příchody a odchody a poctivě hlásit množství vyrobených kusů. Beru na vědomí, že hotová produkce podléhá kontrole a vadné kusy se nezapočítávají do mé odměny. Byla mi poskytnuta možnost prostudovat si plné znění směrnice.



\*\*Plné znění (FullText):\*\*

\*\*Provozní řád a kontrola kvality\*\*



1\. \*\*Evidence docházky a výkonu:\*\* Zaměstnanec/brigádník je povinen evidovat svůj příchod na pracoviště a odchod z něj výhradně pomocí osobního PIN kódu. Dále je povinen pravdivě a přesně hlásit množství odvedené práce (vyrobených/zkompletovaných kusů).

2\. \*\*Technologické postupy:\*\* Práce musí být prováděna přesně podle pokynů a ukázkových vzorů pro danou operaci (kompletace, balení, lepení). Svévolná změna pracovního postupu bez schválení nadřízeného není povolena.

3\. \*\*Kontrola kvality a zmetky:\*\* Každá odevzdaná dávka produktů podléhá namátkové nebo plné kontrole kvality ze strany nadřízeného pracovníka. Kusy, které nesplňují požadovanou kvalitu (zmetky způsobené nepozorností nebo nedodržením postupu), budou z vykázaného počtu odečteny a nezapočítávají se do celkové odměny pracovníka.

4\. \*\*Manipulace s materiálem:\*\* S materiálem a hotovými výrobky je nutné zacházet šetrně, aby nedošlo k jejich poškození nebo znečištění.

5\. \*\*Přestávky:\*\* Přestávky v práci se řídí zákoníkem práce a pokyny nadřízeného. Konzumace jídla je vyhrazena pro určený prostor, u pracovních stolů s materiálem je zakázána.

