# Kalkulator poligraficzny

Prosty, użyteczny kalkulator dla poligrafii: wpisujesz format użytku, arkusz drukarski, spady i nakład, a dostajesz liczbę użytków na arkuszu i liczbę potrzebnych arkuszy. Jedno narzędzie, jedno zadanie, bez zbędnych ekranów.

Ten system zawiera **pięć propozycji stylu** do wyboru. Każda ma własny zestaw kolorów (tokeny z przedrostkiem `p1`–`p5`), własną parę krojów pisma i podgląd kalkulatora w zakładce *Components*. Po wyborze jednej propozycji pozostałe zostaną usunięte, a wybrana stanie się jedynym systemem.

## Zasady wspólne dla wszystkich propozycji

- **Liczby są bohaterem.** Wynik (użytki na arkuszu, liczba arkuszy) jest największym elementem ekranu. Pola wejściowe są drugorzędne.
- **Jedna kolumna, jeden przebieg.** Dane wejściowe u góry, wynik u dołu lub obok; brak zakładek i kreatorów.
- **Jednostki zawsze przy wartości.** `210 × 297 mm`, `3 mm spadu`, `125 ark.` — nigdy gołe liczby.
- **Jeden kolor akcentu.** Służy wyłącznie do wyniku i głównej akcji. Reszta to tusz, papier i szarości.
- **Siatka 4 px.** Odstępy z tokenów `space-1`…`space-6`.

---

## Propozycja 1 — Papier i tusz

**Charakter:** redakcyjny, spokojny, „jak dobrze złożona strona książki”. Dla kogoś, kto pracuje z papierem na co dzień i chce, żeby narzędzie wyglądało jak z tej samej branży.

- **Kolory:** ciepły, kremowy papier `p1-bg`, kartka `p1-surface`, głęboki tusz `p1-ink`, przygaszona szarość `p1-muted`. Akcent: czerwień pasera `p1-accent` — tylko dla wyniku i przycisku.
- **Typografia:** nagłówki i wynik w szeryfowym *Fraunces*, dane i etykiety w *Inter*.
- **Kształty:** promień `radius-sm` (4 px), linie włosowe `p1-hairline` zamiast cieni i ramek.
- **Wzór znaku:** cienkie linie, paser, znaczniki cięcia.

## Propozycja 2 — Technik

**Charakter:** precyzyjny, inżynierski, karta technologiczna drukarni. Dla tych, którzy chcą widzieć wymiary jak na rysunku technicznym.

- **Kolory:** chłodny, błękitnawy papier milimetrowy `p2-bg`, biel `p2-surface`, granatowy tusz `p2-ink`, stalowa szarość `p2-muted`. Akcent: kreślarski błękit `p2-accent`. Siatka `p2-grid`.
- **Typografia:** wszystkie liczby w *JetBrains Mono* (cyfry tabelaryczne, równe kolumny), tekst w *Inter*.
- **Kształty:** promień `radius-none` lub `radius-sm`, ramki 1 px, kropkowana siatka w tle co `space-4`.
- **Wzór znaku:** siatka kropek lub krzyżyków.

## Propozycja 3 — CMYK

**Charakter:** odważny, plakatowy, ale czysty. Czerń na bieli plus cztery kolory procesowe użyte jako bloki, nie jako tekst. Najbardziej „drukarski” w rozpoznaniu.

- **Kolory:** biel `p3-bg`, jasna szarość `p3-surface`, czerń `p3-key`, szarość `p3-muted`. Bloki: `p3-cyan`, `p3-magenta`, `p3-yellow`. Tekst akcentowy tylko w ciemniejszej magencie `p3-accent`.
- **Typografia:** *Space Grotesk* w jednym kroju, duże cyfry, wąskie etykiety wersalikami.
- **Kształty:** `radius-none`, grube ramki 2 px, bloki koloru jako wskaźniki pól.
- **Wzór znaku:** paski lub szachownica w czterech kolorach.

## Propozycja 4 — Ciemnia

**Charakter:** ciemny interfejs narzędzia profesjonalnego. Nie męczy oczu przy długiej pracy w hali, wynik świeci na grafitowym tle.

- **Kolory:** grafit `p4-bg`, ciemniejsza płytka `p4-surface`, jasny tekst `p4-ink`, szarość `p4-muted`, obramowanie `p4-border`. Akcent: limonka `p4-accent` — wyłącznie wynik i akcja główna.
- **Typografia:** *Manrope* dla wszystkiego; wynik w wadze 800.
- **Kształty:** `radius-md` (8 px), płaskie płytki bez cieni, krawędzie 1 px.
- **Wzór znaku:** zaokrąglone płytki na siatce.

## Propozycja 5 — Formularz

**Charakter:** miękki, przyjazny, jak nowoczesna aplikacja SaaS. Najłatwiejszy dla osoby, która nie jest poligrafem (np. klient drukarni).

- **Kolory:** chłodna, zielonkawa biel `p5-bg`, karta `p5-surface`, ciemna zieleń tekstu `p5-ink`, szarość `p5-muted`, delikatne obramowanie `p5-border`. Akcent: zieleń `p5-accent`.
- **Typografia:** *DM Sans* dla całości, duży i czytelny wynik.
- **Kształty:** `radius-lg` (12 px) i `radius-pill` dla przycisków, duże pola, dużo powietrza (`space-5`, `space-6`).
- **Wzór znaku:** pigułki i półkola.

---

## Jak wybrać

Otwórz zakładkę *Components* — każda propozycja ma podgląd tego samego ekranu kalkulatora. Wybierz jedną (albo połącz: np. kolory z 1, typografię z 2), a system zostanie uporządkowany pod tę decyzję.
