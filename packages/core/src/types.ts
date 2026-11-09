/**
 * Typy domenowe kalkulatora poligraficznego.
 * Wszystkie wymiary w milimetrach, masy w gramach / kilogramach, ceny w PLN (lub dowolnej walucie).
 */

/** Prostokąt (wymiar) w mm. */
export interface Size {
  width: number;
  height: number;
}

/** Kierunek włókna papieru względem dłuższego boku arkusza. */
export type GrainDirection = 'long' | 'short' | 'unknown';

/** Orientacja użytku na arkuszu. */
export type Orientation = 'portrait' | 'landscape';

/** Predefiniowany lub własny format arkusza. */
export interface SheetFormat {
  id: string;
  /** Nazwa wyświetlana, np. "B1", "SRA3", "Własny". */
  label: string;
  size: Size;
  /** Seria (A, B, C, SRA, RA, US, custom) – do grupowania na liście. */
  series: 'A' | 'B' | 'C' | 'SRA' | 'RA' | 'US' | 'custom';
}

/** Parametry wejściowe impozycji. */
export interface ImpositionInput {
  /** Format arkusza drukowego (netto, po ewentualnym docięciu). */
  sheet: Size;
  /** Wymiar netto użytku (po obcięciu), bez spadu. */
  item: Size;
  /** Spad na każdą krawędź użytku, mm (zwykle 2–5). */
  bleed: number;
  /** Odstęp między użytkami (poza spadem), mm – np. na znaczniki cięcia. */
  gutter: number;
  /** Marginesy nie do zadrukowania na arkuszu. */
  margins: SheetMargins;
  /** Czy dopuszczać mieszanie orientacji na arkuszu (układ gilotynowy). */
  allowMixed: boolean;
  /** Czy wymuszać orientację użytku (np. ze względu na kierunek włókna). */
  forceOrientation?: Orientation;
}

/** Marginesy arkusza w mm. `gripper` to łapka maszyny (zwykle 8–12 mm). */
export interface SheetMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Pojedynczy użytek ułożony na arkuszu (współrzędne lewego górnego rogu, mm). */
export interface PlacedItem {
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: Orientation;
}

/** Wynik jednego wariantu ułożenia. */
export interface Layout {
  /** Identyfikator strategii, która wygenerowała układ. */
  strategy: 'grid-portrait' | 'grid-landscape' | 'mixed';
  /** Liczba użytków na arkuszu. */
  ups: number;
  /** Liczba kolumn × wierszy (dla układów siatkowych). */
  columns: number;
  rows: number;
  /** Rozmieszczenie użytków (z uwzględnieniem spadu). */
  items: PlacedItem[];
  /** Wykorzystanie powierzchni arkusza (0–1), liczone po użytkach netto. */
  utilization: number;
  /** Powierzchnia odpadu w mm². */
  wasteArea: number;
  /** Obszar faktycznie zajęty przez użytki (bounding box) w mm. */
  usedArea: Size;
  /** Pozostałe wolne paski po prawej i na dole, mm. */
  leftover: { right: number; bottom: number };
}

/** Pełny wynik impozycji – wszystkie rozpatrzone warianty i najlepszy. */
export interface ImpositionResult {
  input: ImpositionInput;
  /** Obszar zadruku (arkusz minus marginesy). */
  printableArea: Size;
  /** Wymiar użytku brutto (netto + 2×spad). */
  itemWithBleed: Size;
  /** Krok siatki (brutto + odstęp). */
  pitch: Size;
  best: Layout | null;
  candidates: Layout[];
}

/** Wejście do obliczenia liczby arkuszy. */
export interface SheetsInput {
  /** Nakład – liczba gotowych egzemplarzy. */
  quantity: number;
  /** Użytków na arkuszu. */
  ups: number;
  /** Liczba różnych użytków (wzorów) drukowanych razem – np. 1 dla jednego projektu. */
  versions?: number;
  /** Naddatek technologiczny w procentach (np. 5 = 5 %). */
  wastePercent: number;
  /** Minimalny naddatek w arkuszach, niezależnie od procentu. */
  wasteMinSheets: number;
  /** Ile arkuszy drukowych wychodzi z jednego arkusza zakupowego (np. B1 → 4×B3). */
  sheetsPerParentSheet?: number;
}

export interface SheetsResult {
  /** Arkuszy netto (bez naddatku), zaokrąglone w górę. */
  netSheets: number;
  /** Arkuszy naddatku. */
  wasteSheets: number;
  /** Arkuszy brutto do druku. */
  grossSheets: number;
  /** Egzemplarzy wychodzących z arkuszy brutto. */
  producedQuantity: number;
  /** Nadprodukcja ponad nakład (egz.). */
  overrun: number;
  /** Arkuszy zakupowych (jeśli podano `sheetsPerParentSheet`). */
  parentSheets: number | null;
}

/** Wejście do obliczeń masy / kosztu papieru. */
export interface PaperInput {
  sheet: Size;
  /** Gramatura, g/m². */
  grammage: number;
  /** Liczba arkuszy. */
  sheets: number;
  /** Cena za kg papieru (opcjonalnie). */
  pricePerKg?: number;
  /** Cena za 1000 arkuszy (opcjonalnie, alternatywa dla ceny za kg). */
  pricePerThousand?: number;
}

export interface PaperResult {
  /** Powierzchnia jednego arkusza, m². */
  sheetAreaM2: number;
  /** Masa jednego arkusza, g. */
  sheetWeightG: number;
  /** Masa całości, kg. */
  totalWeightKg: number;
  /** Masa ryzy (500 ark.), kg. */
  reamWeightKg: number;
  /** Koszt papieru, jeśli podano cenę. */
  cost: number | null;
}

/** Wejście kalkulatora broszur / publikacji wielostronicowych. */
export interface BookletInput {
  /** Liczba stron publikacji (bez okładki). */
  pages: number;
  /** Stron na arkusz drukowy (obie strony), np. 16 dla składki A4 z B1. */
  pagesPerSheet: number;
  /** Czy liczyć okładkę osobno (4 strony). */
  separateCover: boolean;
}

export interface BookletResult {
  /** Liczba składek (sygnatur) na egzemplarz. */
  signatures: number;
  /** Stron po zaokrągleniu do pełnej składki. */
  paddedPages: number;
  /** Pustych stron (wakatów) do dodania. */
  blankPages: number;
  /** Zaokrąglenie do wielokrotności 4 (minimum dla druku dwustronnego składki). */
  isMultipleOf4: boolean;
}
