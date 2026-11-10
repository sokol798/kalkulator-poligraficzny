# Kalkulator poligraficzny

Aplikacja do poligrafii: wpisujesz format użytku, arkusz drukarski, spady i nakład,
a dostajesz liczbę użytków na arkuszu, liczbę potrzebnych arkuszy, wykorzystanie
arkusza i wagę papieru.

## Uruchamianie

Najprościej: otwórz plik `app/index.html` dwuklikiem w przeglądarce (Safari, Chrome).
Aplikacja działa bez internetu i zapisuje dane (historia, własne formaty, ustawienia)
w pamięci przeglądarki na tym komputerze.

Na telefonie: wgraj folder `app/` na dowolny serwer WWW (albo uruchom lokalny)
i otwórz adres w przeglądarce. Na iPhonie „Dodaj do ekranu początkowego” daje
ikonę i tryb pełnoekranowy. Lokalny serwer testowy:

```bash
python3 -m http.server 8765 --directory /Users/sokol/Desktop/Kalkulator/app
```

i otwórz http://127.0.0.1:8765/ (telefon w tej samej sieci Wi-Fi: adres IP komputera zamiast 127.0.0.1).

## Co umie

- **Kalkulator**: szybkie formaty (A4, A5, A6, DL i ostatnio używane), wymiar własny, nakład
  z krokiem ±100, wybór arkusza, gramatura, orientacja użytku (auto / pion / poziom),
  wynik na żywo z podglądem rozkładu na arkuszu, waga arkuszy i nakładu.
- **Karta zlecenia**: wszystkie liczby jednego obliczenia, numerowany rozkład użytków,
  zapis do PDF (przez drukowanie), udostępnianie tekstu, nazwa zlecenia.
- **Biblioteka**: formaty standardowe i własne (ze spadem), arkusze offsetowe (chwyt)
  i cyfrowe (margines), własne arkusze, arkusz domyślny.
- **Historia**: ostatnie obliczenia pogrupowane dniami, gwiazdka „zapisane”, „Powtórz”,
  eksport do CSV (średniki, polskie przecinki, otwiera się w Excelu i Numbers).
- **Ustawienia**: domyślne spady, chwyt, gramatura, orientacja, zaokrąglanie arkuszy
  (w górę albo do pełnych 10), jednostka mm/cm, automatyczny zapis w historii.

## Jak liczy

1. Użytek brutto = format netto + spad z każdej strony.
2. Pole zadruku = arkusz minus chwyt (offset, jedna krawędź) albo minus margines (cyfra, każda krawędź).
3. Użytki na arkuszu = ile brutto zmieści się w pionie × w poziomie, dla obu orientacji; auto wybiera lepszą.
   Układy mieszane (część użytków obrócona) nie są liczone.
4. Arkusze = nakład ÷ użytki, zaokrąglone w górę. Bez naddatku technologicznego: dolicz według praktyki drukarni.
5. Wykorzystanie = pole użytków brutto ÷ pole arkusza.
6. Waga = gramatura × powierzchnia (arkusz brutto; sztuka po obcięciu).

Przykład z makiet: A5 ze spadem 3 mm na B2 z chwytem 10 mm → 9 użytków (3 × 3), 1 000 szt. → 112 arkuszy,
wykorzystanie 86 %, papier 130 g → 5,1 kg.

## Pliki

```
app/
  index.html     strona startowa
  app.css        style (kolory i układ z makiet)
  calc.js        logika obliczeń (czysty moduł, bez interfejsu)
  data.js        formaty i arkusze standardowe, pamięć (localStorage)
  app.js         ekrany i nawigacja
  manifest.json  dane aplikacji dla „Dodaj do ekranu początkowego”
  icon.svg       ikona
  tests/calc.test.js   testy logiki: node tests/calc.test.js
design/
  ekrany/        makiety 9 ekranów z chmury Claude (źródło projektu interfejsu)
  system/        system projektowy: tokeny, pięć propozycji stylu
```

Testy logiki:

```bash
node /Users/sokol/Desktop/Kalkulator/app/tests/calc.test.js
```

Źródła w chmurze: makiety https://claude.ai/artifact/S5e4rsGPfPSx3hEvojcJCX,
system projektowy https://claude.ai/artifact/JPovsZsyiKgrdqFV3PfQLq.
