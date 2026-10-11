# WhatsApp Chat Export: Marta Chorobikova
Export date: 10 October 2026 at 7:36

---

## 9 October 2026

[22:04] **Marta Chorobikova:** Navrhuji, abychom postupovali takto:

První fáze – Docházka. Zaměstnanec přijde, ověří se pomocí mobilní aplikace a zaznamená příchod. Při odchodu se zaznamená konec práce. Systém vypočítá dobu přítomnosti, přestávky a odpracovaný čas.
Identifikace je pomoci pin kodu. Po otevření aplikace si vyfoti obrazek dne, aby byl dukaz že nepodvadi. Mozno i kodík.

Druhá fáze – Zaměstnanecké formuláře. Osobní údaje, možnost jejich aktualizace, potvrzování seznámení s provozními pravidly a evidence školení bezpečnosti práce.

Třetí fáze – Produkce a normy. Evidence zakázek, množství vyrobených kusů, jednotlivých operací, výkonu zaměstnanců a podkladů pro výpočet odměn.

Čtvrtá fáze – Administrativa a výstupy. Přehledy, měsíční součty, upozornění na blížící se limit odpracovaných hodin a exporty do Excelu, neno ručne upravitelne tabulky s možnosti tisku.

[22:10] **Marta Chorobikova:** části.
1. Identifikace zaměstnance
Jak se zaměstnanec poprvé přihlásí do aplikace?
Jak bude propojený se svým osobním profilem?
Jak bude fungovat osobní PIN?
Co se stane, když PIN zapomene nebo ho několikrát zadá špatně?

[22:10] **Marta Chorobikova:** 2. Zaznamenání příchodu
Zaměstnanec otevře aplikaci v mobilu.
Na dveřích najde aktuální QR kód, případně jiný symbol dne.
Aplikace ověří kód a zaměstnance.
Systém automaticky zaznamená datum a čas příchodu.
Záznam se uloží do databáze.
Musíme také určit, jak zabráníme tomu, aby si zaměstnanec zaznamenal příchod z domova pomocí fotografie kódu.

[22:11] **Marta Chorobikova:** Zaznamenání odchodu
Zaměstnanec při odchodu zopakuje ověření.
Systém zaznamená čas odchodu.
Přiřadí odchod k příslušnému příchodu.
Vypočítá dobu přítomnosti a následně odpracovaný čas podle stanovených pravidel.
Musíme vyřešit i situaci, kdy zaměstnanec zapomene odchod zaznamenat.

[22:11] **Marta Chorobikova:** Přestávky a výpočet hodin
Systém musí umět:
evidovat začátek a konec přestávky;
počítat odpracovanou dobu;
zobrazovat denní a měsíční součty;
upozornit na chybějící záznamy;
upozornit na překročení stanoveného pracovního limitu.
Pravidla přestávek nastavíme podle skutečného pracovněprávního režimu. Nebudeme automaticky předpokládat, že každý zaměstnanec musí mít přestávku přesně po 4,5 hodinách.

[22:12] **Marta Chorobikova:** 5. Měsíční docházková tabulka
Každý zaměstnanec bude mít přehled za celý měsíc.
Tabulka bude obsahovat například:
Datum
Den
Příchod
Přestávka
Odchod
Odpracováno
Splnění normy
1. 10.
Čtvrtek
6:00
0:30
10:30
4:00
Zatím nehodnoceno
2. 10.
Pátek
6:05
0:30
10:35
4:00
Zatím nehodnoceno
Jde pouze o ukázku vzhledu. Konkrétní pravidla výpočtu přestávek a pracovní doby se musí teprve stanovit.
V tabulce bude 31 dnů, přičemž u kratších měsíců zůstanou neexistující dny prázdné nebo neaktivní.

[22:12] **Marta Chorobikova:** 6. Administrátorský přehled
Ty potřebuješ na jednom místě vidět:
kdo přišel a kdo odešel;
kdo má neúplnou docházku;
kolik hodin zaměstnanci odpracovali za měsíc;
kdo se blíží k limitu 300 hodin;
které záznamy potřebují zkontrolovat.
Budeš také potřebovat možnost opravit chybný záznam. Původní hodnota ale musí zůstat zachovaná a u opravy musí být uvedeno, kdo ji provedl, kdy a proč.

[22:12] **Marta Chorobikova:** 7. Export do Excelu a tisk
Na konci měsíce budeš potřebovat:
exportovat docházku jednotlivých zaměstnanců;
vytisknout měsíční přehled;
získat součet hodin;
případně vyexportovat data pro další zpracování.
Je důležité, aby export nebyl jediným místem, kde data existují. Hlavním zdrojem bude databáze aplikace.

[22:13] **Marta Chorobikova:** 8. Výjimky a problémové situace
Programátor musí vědět, co se má stát, když:
zaměstnanec zaznamená dva příchody za sebou;
zapomene se odhlásit;
nemá připojení k internetu;
QR kód nefunguje;
změní mobilní telefon;
administrátor potřebuje opravit záznam.
Tyto situace jsou důležité, protože v praxi nastávají a bez předem stanovených pravidel mohou způsobit chyby v celé docházce.

[22:14] **Marta Chorobikova:** Asi bych to moc neprožívala. Prijde na dilnu, kde ho ceka prekvapeni na dveřích v podobe qr kodu, nebo obrazku dne. Ten si vyfoti do aplikace jako dukaz.

[22:17] **Marta Chorobikova:** Kazdy bude mit svuj profil. Na kterem bude dochazka + dukumenty. U dokumentu typu BZOP si odklikne 1x mesicne, ze vede v patrnosti, ze tento dokument existuje. Datum a cas se mu ulozi do tabulky. V pripade potreby se tabulka vytiskne a ppodepise. 

Pak tam bude osobni dotaznik. Zmeny zapise, jinak pouze potvrdi.

[22:20] **Marta Chorobikova:** Domaci pracuji doma v ukole, jejich pracovni dobu netreba overovat ppomoci obrazku, ale muzou dostat taky magnetek na dvere

[22:28] **Marta Chorobikova:** A pak se tam nejak zakomponuje produkce. 

Brigadnik dela v ukole, takze nas zajima cas, ale rozhodujici je pro nej mnozstvi kusu, ktere se přepočítáva na cas. Tj ma vyrobit 100 ks za hodinu. Jeden kus stoji 1.35 takze ve finale si vydelal 135 kc za hodinu.

Pokud bude sikovny a slozi 150 ks za hodinu, tak je to 100 na 135 a + 50x1.35

Z jeho dochazky se mu uapocitaji jen produktivni hodiny. Realne nas take zajimají, ale v navaznosti na rychlost  operaci pro stanoveni norem.

[22:30] **Marta Chorobikova:** Mnozstvi si zapisuje brigadnik, ale je overeno pri predaní, kdy osobne spocitam produkci a napisi pocet odevzdanych - pocet chybne slozenych. A to se mu prepocita do casu.

[22:31] **Marta Chorobikova:** A jeste se tam musi ukazat co delal a na jake zakazce to delal. Na zakazku ho priřadim ja.

[22:32] **Marta Chorobikova:** Mame zatim faze kompletni krabicka, balení, příprava

[22:32] **Marta Chorobikova:** kompletace a vkladani

[22:33] **Marta Chorobikova:** A jeste po.me stat chce planovani smen.
