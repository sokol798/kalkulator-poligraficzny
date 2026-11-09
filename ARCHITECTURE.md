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
├── ARCHITECTURE.md              # ten dokument
├── packages/core/               # @printcalc/core – silnik obliczeniowy
│   ├── src/
│   │   ├── types.ts             # model domenowy (Size, ImpositionInput, Layout, …)
│   │   ├── formats.ts           # biblioteka formatów (A/B/C/RA/SRA/US + handlowe), presety produktów
│   │   ├── imposition.ts        # algorytm układania użytków (siatka + układ mieszany/gilotynowy)
│   │   ├── sheets.ts            # arkusze na nakład, naddatek, papier (masa, koszt), broszura, grzbiet
│   │   ├── compare.ts           # porównanie formatów arkusza pod kątem zużycia papieru
│   │   ├── units.ts             # jednostki, zaokrąglanie, formatowanie wymiarów
│   │   └── index.ts
│   └── tests/                   # 26 testów (Vitest)
└── apps/app/                    # @printcalc/app – Expo (iOS / Android / web)
    ├── app.json                 # konfiguracja Expo (nazwa, bundle id, ikony, web static)
    ├── eas.json                 # profile buildów EAS (development / preview / production)
    └── src/
        ├── app/                 # TRASY (Expo Router): _layout.tsx = zakładki; index, compare, booklet, settings
        ├── features/            # ekrany pogrupowane funkcjonalnie
        │   ├── imposition/calculator-screen.tsx
        │   ├── compare/compare-screen.tsx
        │   ├── booklet/booklet-screen.tsx
        │   └── settings/settings-screen.tsx
        ├── components/          # komponenty wielokrotnego użytku
        │   ├── ui.tsx           # Screen, Card, Row, ResultRow, StatTile, Button, Segmented, SwitchRow, Notice
        │   ├── number-field.tsx # pole liczbowe (przecinek/kropka, walidacja, jednostka)
        │   ├── size-field.tsx   # szer. × wys. + obrót + preset
        │   ├── preset-picker.tsx# modal z listą formatów (grupy, wyszukiwarka)
        │   └── sheet-preview.tsx# rysunek arkusza w SVG
        ├── store/calculator-store.ts  # zustand: dane wejściowe, broszura, ustawienia domyślne
        ├── hooks/use-calculation.ts   # łączy store z silnikiem (memo)
        ├── theme/tokens.ts      # ★ JEDYNE miejsce z kolorami, odstępami, typografią, promieniami
        ├── theme/use-theme.ts
        ├── i18n/pl.ts           # wszystkie teksty UI
        └── global.css           # fonty / reset dla web
```

## 3. Model domenowy (słownik)

| Pojęcie | Pole | Opis |
|---|---|---|
| Użytek | `item` | Gotowy produkt netto (np. A4 210×297). |
| Spad | `bleed` | Naddatek grafiki na każdą krawędź; użytek brutto = netto + 2×spad. |
| Odstęp | `gutter` | Przerwa między użytkami brutto (np. na znaczniki cięcia). Ostatni użytek w rzędzie nie potrzebuje odstępu. |
| Arkusz | `sheet` | Arkusz drukowy (np. B1 707×1000, SRA3 320×450). |
| Łapka | `margins.top` | Pas chwytu maszyny, nie do zadruku. |
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

## 6. Ekrany

| Trasa | Ekran | Zawartość |
|---|---|---|
| `/` | Kalkulator | Użytek → Arkusz → Wynik (użytki, podgląd, warianty) → Papier (arkusze, naddatek, masa, koszt). Jeden przewijany formularz, wszystko przelicza się na żywo. |
| `/compare` | Formaty | Tabela: dla bieżącego użytku każdy format arkusza → użytki, arkusze brutto, zużycie papieru (m²), wykorzystanie. Przycisk „Użyj” podstawia format. |
| `/booklet` | Broszura | Strony → składki, wakaty, grubość grzbietu. |
| `/settings` | Ustawienia | Wartości domyślne nowego obliczenia (spad, łapka, naddatek, gramatura…). |

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
