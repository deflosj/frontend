# Tournament Portal – Navigation

## What to build
Build a responsive navigation component for the tournament portal with 4 sections:
- **Teams** – list of all 48 teams with search bar and poule filter
- **Poules** – standings per poule (position, team name, wins, points)
- **Matches** – all matches as cards (team left · score · team right), filterable by poule/round, live matches highlighted
- **Bracket** – knockout bracket with round selector chips (e.g. Kwartfinale / Halve finale / Finale)

## Navigation behaviour
### Mobile (< 768px)
- **Bottom tab bar** — fixed to the bottom of the screen
- Show **icons only** (no text labels)
- 4 tabs: Teams, Poules, Matches, Bracket
- Use clear recognizable icons (e.g. people icon, grid icon, calendar icon, trophy icon)
- Active tab: filled/highlighted icon in accent color
- Thumb-friendly tap targets (minimum 48px height)

### Desktop (≥ 768px)
- **Top navigation bar** — fixed to the top
- Show **icon + text label** side by side for each tab
- Same 4 tabs
- Active tab: underline or accent color indicator

## Design rules
- Mobile-first approach
- Clean, flat design — no gradients, no heavy shadows
- Each match is a card, never a table row
- Live matches get a colored border + "Live" badge
- Poule standings are compact tables inside cards, one card per poule
- Bracket shows one round at a time using chip/pill selectors, no horizontal scroll
- Teams tab has a search bar at the top and filter chips per poule (A, B, C...)
