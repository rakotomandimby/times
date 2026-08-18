# What Times?

A simple web application that displays the current time across three different time zones simultaneously, making it easy to compare times around the world.

Online demo: https://times.rktmb.org/

## Features

- **Three parallel clocks** — view the current time in three time zones side by side.
- **City / timezone search** — each clock has a fuzzy-search autocomplete input backed by a comprehensive timezone database ([`@vvo/tzdb`](https://github.com/vvo/tzdb)). Search by city name, country, or timezone identifier.
- **Time adjustment** — step the displayed time forward or backward by one hour using the `+` / `−` buttons, letting you quickly answer "what time will it be in Tokyo when it is 3 PM in Paris?".
- **Persistent selection** — chosen time zones are saved in `localStorage` and restored on the next visit.
- **Conflict-free selection** — the same timezone cannot be selected in two clocks at once; the app automatically picks a replacement when a conflict would occur.
- **Accessible UI** — the autocomplete widget follows ARIA combobox/listbox patterns and supports full keyboard navigation (Arrow keys, Enter, Escape).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 19](https://react.dev/) |
| Build tool | [Vite 8](https://vite.dev/) |
| Timezone data | [@vvo/tzdb](https://github.com/vvo/tzdb) |
| Compiler | [React Compiler](https://react.dev/learn/react-compiler) (via Babel) |
| Linter | [ESLint 10](https://eslint.org/) |

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

## Project Structure

```
src/
├── App.jsx                  # Root component — manages state for all three clocks
├── components/
│   ├── ClockCard.jsx        # Individual clock card (display + controls)
│   └── CityAutocomplete.jsx # Fuzzy-search autocomplete for timezone selection
└── utils/
    ├── time.js              # Time formatting helpers
    ├── timezones.js         # Timezone list derived from @vvo/tzdb
    └── fuzzySearch.js       # Client-side fuzzy filtering for the autocomplete
```
