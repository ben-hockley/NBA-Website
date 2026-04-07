# NBA Stats Website

A modern NBA stats website built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**, powered by the public **ESPN API**. It displays live game scores, current standings, and team rosters — all updated in real time.

---

## Features

- 🏀 **Live Scores & Results** — Today's NBA games with live scores, game status (live, scheduled, final), venue information, and win/loss records.
- 📊 **Standings** — Full NBA standings separated by Conference (East / West) with wins, losses, win percentage, games behind, and streak.
- 👥 **Teams & Rosters** — Browse all 30 NBA teams and click any team to see their complete current roster with player stats (position, height, weight, age, experience, college).

---

## Tech Stack

| Tool | Version |
|---|---|
| [Next.js](https://nextjs.org/) | 16 |
| [React](https://react.dev/) | 19 |
| [Tailwind CSS](https://tailwindcss.com/) | 4 |
| [TypeScript](https://www.typescriptlang.org/) | 5 |

---

## Getting Started

### Prerequisites

- **Node.js** v18+ (recommended: v20 or v22)
- **npm** v9+

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ben-hockley/NBA-Website.git
   cd NBA-Website
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server (requires `build` first) |
| `npm run lint` | Run ESLint on the project |

---

## Project Structure

```
.
├── app/
│   ├── layout.tsx          # Root layout with Navbar and global styles
│   ├── globals.css         # Global CSS (Tailwind imports)
│   ├── page.tsx            # Scoreboard page (home — live scores)
│   ├── standings/
│   │   └── page.tsx        # Standings page
│   └── teams/
│       ├── page.tsx        # Teams directory page
│       └── [id]/
│           └── page.tsx    # Individual team roster page
├── components/
│   ├── Navbar.tsx          # Top navigation bar
│   ├── GameCard.tsx        # Individual game score card
│   ├── LoadingSpinner.tsx  # Loading indicator
│   └── ErrorMessage.tsx    # Error display component
├── lib/
│   ├── api.ts              # ESPN API fetch functions
│   └── types.ts            # TypeScript interfaces for API data
├── next.config.ts          # Next.js configuration
├── postcss.config.mjs      # PostCSS / Tailwind CSS v4 configuration
└── tsconfig.json           # TypeScript configuration
```

---

## API Endpoints Used

All data is fetched from the public [ESPN API](https://www.espn.com/):

| Feature | Endpoint |
|---|---|
| Scoreboard | `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard` |
| Standings | `https://site.api.espn.com/apis/v2/sports/basketball/nba/standings` |
| Teams | `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=50` |
| Team Roster | `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/roster` |

> **Note:** These are unofficial public ESPN endpoints and are not guaranteed to remain stable. No API key is required.

---

## License

MIT
