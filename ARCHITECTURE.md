# Kalkulator poligraficzny – architektura

Prosty, profesjonalny kalkulator dla drukarni: **ile użytków mieści się na arkuszu, ile arkuszy potrzeba na nakład, ile waży i kosztuje papier**. Jeden kod źródłowy → iOS, Android i web.

## 1. Stos technologiczny

| Warstwa | Technologia | Dlaczego |
|---|---|---|
| Silnik obliczeń | TypeScript, zero zależności (`packages/core`) | Czysta logika, w 100 % testowalna, możliwa do użycia w dowolnym froncie (także w backendzie czy wtyczce). |
| Aplikacja | Expo SDK 58 + React Native + Expo Router (`apps/app`) | Jeden kod dla iOS / Android / web. Routing plikowy, statyczny eksport web, builds przez EAS. |
| Stan | zustand + `persist` (AsyncStorage) | Minimalny, przewidywalny stan; dane wejściowe zapamiętywane lokalnie na urządzeniu i w przeglądarce. |
| Podgląd arkusza | react-native-svg | Wektorowy, skalowalny rysunek arkusza na każdej platformie. |
| Testy | Vitest | Szybkie testy jednostkowe silnika. |
| Monorepo | npm workspaces | Bez dodatkowych narzędzi; `@printcalc/core` importowany bezpośrednio przez aplikację. |

## 2. Struktura katalogów

```
print-calc/
├── package.json                 # workspaces + skrypty zbiorcze
├── ARCHITECTURE.md
├── packages/core/               # @printcalc/core – silnik obliczeniowy (bez zależności)
│   ├── src/
│   │   ├── types.ts             # model domenowy (Size, ImpositionInput, Layout, …)
│   │   ├── formats.ts           # formaty ISO (A/B/C/RA/SRA/US) i handlowe
│   │   ├── imposition.ts        # układanie użytków: siatka + układ mieszany (gilotynowy)
│   │   ├── sheets.ts            # arkusze na nakład, papier (masa/koszt), broszury, grzbiet
│   │   ├── compare.ts           # porównanie formatów arkusza
│   │   └── units.ts, index.ts
│   └── tests/                   # 26 testów (Vitest)
└── apps/app/                    # @printcalc/app – Expo (iOS / Android / web)
    ├── app.json, eas.json
    └── src/
        ├── app/                 # TRASY (Expo Router)
        │   ├── _layout.tsx      # Stack: zakładki + ekrany podrzędne i arkusze dolne (formSheet)
        │   ├── (tabs)/          # index (Kalkulator), library (Biblioteka), history (Historia)
        │   ├── pick-format.tsx  # arkusz dolny: wybór formatu
        │   ├── pick-sheet.tsx   # arkusz dolny: wybór arkusza (użytki · arkusze przy każdym)
        │   ├── card.tsx         # karta zlecenia (PDF / udostępnij)
        │   ├── new-format.tsx, new-sheet.tsx
        │   └── settings.tsx, help.tsx
        ├── features/            # ekrany pogrupowane funkcjonalnie (calculator, pickers, card, library, history, settings, help)
        ├── components/
        │   ├── ui.tsx           # Screen, TabHeader, StackHeader, Card, Chip, PillButton, Segmented, Row, KV, ListItem, Toggle
        │   ├── number-field.tsx, text-field.tsx
        │   ├── sheet-preview.tsx# rysunek arkusza w SVG (z numeracją na karcie)
        │   ├── tab-bar.tsx      # pływający pasek zakładek (pigułka)
        │   └── icons.tsx        # ikony liniowe z makiet
        ├── store/app-store.ts   # zustand+persist: wejścia, biblioteka, historia, ustawienia
        ├── hooks/use-calculation.ts, use-unit.ts
        ├── lib/library-data.ts  # wbudowane arkusze (B2, B1, A2+, B3, 640×900, SRA3, SRA3+, A3) i formaty
        ├── lib/export.ts        # PDF karty (expo-print), udostępnianie, CSV historii
        ├── lib/format.ts        # formatowanie liczb i dat (pl-PL)
        ├── theme/tokens.ts      # ★ paleta (jasna/ciemna), odstępy, promienie, typografia (Inter)
        └── i18n/pl.ts           # wszystkie teksty UI
```

## 3. Model domenowy (słownik)

| Pojęcie | Pole | Opis |
|---|---|---|
| Użytek | `item` | Gotowy produkt netto (np. A4 210×297). |
| Spad | `bleed` | Naddatek grafiki na każdą krawędź; użytek brutto = netto + 2×spad. |
| Odstęp | `gutter` | Przerwa między użytkami brutto (np. na znaczniki cięcia). Ostatni użytek w rzędzie nie potrzebuje odstępu. |
| Arkusz | `sheet` | Arkusz drukowy (np. B1 707×1000, SRA3 320×450). |
| Chwyt (łapka) | `margins.top` | Pas chwytu maszyny, nie do zadruku. W aplikacji przypisany do arkusza. |
| Marginesy | `margins.*` | Pozostałe pasy nie do zadruku. Obszar zadruku = arkusz − marginesy. |
| Układ | `Layout` | Konkretne rozmieszczenie: strategia, kolumny × wiersze, lista pozycji, wykorzystanie, resztki. |
| Nakład | `quantity` | Liczba egzemplarzy do wydrukowania. |
| Wersje | `versions` | Liczba różnych projektów łączonych na jednym arkuszu (gang run). |
| Naddatek | `wastePercent`, `wasteMinSheets` | Naddatek technologiczny – większa z wartości: % lub minimalna liczba arkuszy. |
| Ark. zakupowy | `sheetsPerParentSheet` | Ile arkuszy drukowych wychodzi z arkusza kupowanego (B1 → 4×B3). |
| Gramatura | `grammage` | g/m²; masa arkusza = powierzchnia [m²] × gramatura. |

## 4. Algorytm impozycji (`imposition.ts`)

1. Oblicz obszar zadruku i wymiar użytku brutto.
2. **Siatka** w pionie i w poziomie: `floor((obszar + odstęp) / (brutto + odstęp))` w obu osiach.
3. **Układ mieszany (gilotynowy)**, jeśli dozwolony: główna siatka w orientacji A z `k` kolumnami (lub wierszami) dla każdego `k`, a w pozostałym pasku (prawym lub dolnym) użytki w orientacji B. Sprawdzane są wszystkie `k`, bo czasem opłaca się oddać kolumnę, by zmieścić więcej w pasku.
4. Kandydaci są deduplikowani i sortowani: **więcej użytków → prostszy układ (siatka przed mieszanym) → większe wykorzystanie**.
5. Zwracany jest `best` oraz lista `candidates` (w UI jako „Inne warianty ułożenia”).

Każdy `Layout` zawiera współrzędne wszystkich użytków → podgląd SVG i w przyszłości eksport (PDF/JDF) bez zmian w silniku. Testy sprawdzają m.in. brak nachodzenia użytków i mieszczenie się w obszarze zadruku.

## 5. Przepływ danych

```
UI (ekrany) ──set()──▶ zustand store (inputs) ──persist──▶ AsyncStorage / localStorage
                             │
                      useCalculation()  (useMemo)
                             │
                 @printcalc/core: calculateImposition → calculateSheets → calculatePaper
                             │
                     UI: StatTile / ResultRow / SheetPreview
```

Wyniki nie są przechowywane – zawsze wyliczane z wejścia, więc nie ma stanu niespójnego.

## 6. Ekrany (wg makiet „styl 8”)

| Trasa | Ekran | Zawartość |
|---|---|---|
| `/` | Kalkulator | Chipy formatów (A5/A4/A6/DL/Więcej), szer. × wys., nakład ze stepperem ±100, chipy arkuszy (B2/B1/Więcej), gramatura (80/130/170/300/inna), linia „Spady · chwyt · orientacja · Zmień”, wynik na żywo (arkusze, użytki, %, masa) z miniaturą arkusza i przełącznikiem orientacji (Auto·9 / Pion·9 / Poziom·8), przyciski „Karta zlecenia” i zapis do historii. |
| `/pick-format` | Wybierz format | Arkusz dolny: szukaj, ostatnio używane, moje, seria A, seria B, inne, „Własny wymiar” → nowy format. |
| `/pick-sheet` | Wybierz arkusz | Arkusz dolny: Offset / Cyfra, przy każdym arkuszu użytki i liczba arkuszy dla bieżącego nakładu; własny arkusz (szer., wys., chwyt). |
| `/card` | Karta zlecenia | Nazwa, numerowany rozkład użytków, arkusze/nakład/na arkuszu/papier, tabela szczegółów, PDF i udostępnianie, „Nowe obliczenie”. |
| `/library` | Biblioteka | Segment Formaty (szukaj, Moje, Standardowe, Użyj) / Arkusze (Offset, Cyfra, Domyślny/Użyj, +). |
| `/new-format`, `/new-sheet` | Nowy format / arkusz | Wymiar, nazwa, spady lub chwyt i margines, podgląd „Na B2 zmieści się N”, „Zapisz i użyj” / „Zapisz”. Edycja własnych pozycji przez tę samą trasę z `id`. |
| `/history` | Historia | Wszystkie / Zapisane ★, grupy Dzisiaj / Wczoraj / Wcześniej, duża liczba arkuszy, „Powtórz”, tap → karta. |
| `/settings` | Ustawienia | Spady, chwyt, gramatura, arkusz domyślny, orientacja; zaokrąglanie (w górę / do 10), auto-zapis historii, jednostka mm/cm; pomoc i eksport CSV. |
| `/help` | Jak liczymy | Krótkie wyjaśnienie algorytmu. |

Stan ekranu zapisywany jest lokalnie (AsyncStorage / localStorage); historia trzyma do 200 wpisów, auto-zapis nadpisuje bieżący wpis po 2 s od zmiany.

## 7. Warstwa wizualna – gdzie designer wprowadza zmiany

- **`src/theme/tokens.ts`** – paleta (jasna/ciemna), odstępy, promienie, typografia, max szerokość treści. Ekrany nie używają surowych kolorów.
- **`src/components/ui.tsx`** – wygląd prymitywów (karty, wiersze, kafelki, przyciski). Zmiana tutaj zmienia całą aplikację.
- **`src/global.css`** – fonty na web (np. podpięcie Inter / IBM Plex z Google Fonts).
- Ikony zakładek: `src/app/_layout.tsx` (SF Symbols na iOS, Material Symbols na Android/web).
- Ikona i splash: `app.json` + `assets/images/`.

## 8. Uruchamianie

```bash
npm install
npm run core:test          # testy silnika
npm run typecheck          # TypeScript w obu pakietach
npm run app:web            # web dev server
npm run app:ios            # iOS (Expo Go / symulator)
npm run app:android        # Android
npm run app:export:web     # statyczny build web → apps/app/dist
```

Buildy sklepowe: `cd apps/app && npx eas-cli build --profile production --platform all` (wymaga konta Expo; identyfikatory `pl.printcalc.app` w `app.json`).

## 9. Roadmapa (kolejne kroki)

1. Eksport wyniku: PDF z podglądem arkusza + tabelą, udostępnianie (Share API).
2. Zapisywane kalkulacje / historia i nazwane presety firmowe (np. „B1 Heidelberg, łapka 11”).
3. Kierunek włókna (grain) jako ograniczenie orientacji i ostrzeżenie dla składek.
4. Druk dwustronny z odwracaniem (work-and-turn / work-and-tumble) – liczba form.
5. Kalkulacja kosztów: papier + arkusz drukowy + przygotowalnia + uszlachetnienia.
6. Tryb offline już działa (brak backendu); ewentualna synchronizacja presetów przez konto.
