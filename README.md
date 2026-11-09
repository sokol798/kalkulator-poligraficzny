# Kalkulator poligraficzny

Użytki na arkuszu, arkusze na nakład, waga papieru, karta zlecenia, biblioteka formatów i arkuszy, historia. iOS · Android · Web z jednego kodu (Expo).

- Architektura, model domenowy, algorytm, ekrany: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Zrzuty ekranów (web, wersja mobilna): [docs/screenshots](./docs/screenshots)
- Makiety projektowe: https://claude.ai/artifact/S5e4rsGPfPSx3hEvojcJCX

## Struktura

```
packages/core   silnik obliczeniowy (TypeScript, testy Vitest)
apps/app        aplikacja Expo (iOS / Android / web)
apps/app/dist   gotowy build web (statyczny) – można wrzucić na dowolny hosting
docs/           zrzuty ekranów
```

## Uruchomienie

```bash
npm install
npm run core:test        # testy silnika
npm run typecheck        # TypeScript
npm run app:web          # web (http://localhost:8081)
npm run app:start        # QR dla Expo Go (iOS / Android)
npm run app:export:web   # statyczny build web → apps/app/dist
```

Buildy sklepowe: `cd apps/app && npx eas-cli build --profile production --platform all` (konto Expo; identyfikatory `pl.printcalc.app` w `app.json`).
