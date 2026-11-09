# Canada Sports Atlas

An interactive map of Canadian professional sports. Every NHL, NBA, MLB, MLS, CFL and CPL team that has played in Canada, current or former, is on it, along with its venues, championships and identity history. Built with the [Astryx](https://github.com/facebook/astryx) design system.

![Desktop map](docs/desktop-map.png)

## Features

- **Map of Canada.** Each sports city gets a dot showing how many teams it has had, plus its name. The ring colours show which leagues the city has. Nearby cities (Montréal and Laval, Vancouver and its suburbs, Toronto and Hamilton) merge into a cluster until you zoom in. Pan, zoom, or use the controls to fit all of Canada.
- **Floating panel.** City and team details open in a panel that floats over the right side of the map and can be closed at any time.
- **Header menu.** Appearance (light, dark or system), Share (copies the current view's link), Credits, and a link to the author.
- **City overview.** Shows a city's active and former teams, league titles, a short history, and a 3D model of its venues.
- **League filter.** A dropdown in the header shows all leagues or just one (NHL, NBA, MLB, MLS, CFL or CPL). The choice is kept in the URL so a view can be shared.
- **Team pages.**
  - *Overview*: summary, what happened to the team, colours, every championship year and other honours.
  - *History*: a timeline of milestones.
  - *Identity*: logo history, home and away uniforms for each era, and the rink, court, field or pitch for each era.
  - *Venues*: every home the team has had, each with a 3D model.
- **Procedural 3D stadiums.** Each venue is built in three.js from its type, capacity, roof and surface. Some have signature details: the Saddledome's saddle roof, the Big O's inclined tower, Rogers Centre's sliding panels and BC Place's ring of masts. Retractable roofs open and close, and models can be viewed full screen.
- **Works on phones.** On small screens the details panel becomes a draggable bottom sheet.
- Keyboard-accessible map markers and no violations from axe-core.

| City overview with 3D venue | Identity history | Mobile |
| --- | --- | --- |
| ![City](docs/desktop-city-3d.png) | ![Identity](docs/desktop-identity.png) | ![Mobile](docs/mobile-city.png) |

## Coverage

The dataset was reviewed in November 2026 and covers 44 teams in 14 cities:

| League | Active | Former |
| --- | --- | --- |
| NHL | Maple Leafs, Canadiens, Senators, Jets, Flames, Oilers, Canucks | Nordiques, Jets (1972–96), Senators (1917–34), Maroons, Tigers, Wanderers, Bulldogs |
| NBA | Raptors | Grizzlies, Huskies |
| MLB | Blue Jays | Expos |
| MLS | Toronto FC, Whitecaps FC, CF Montréal | none |
| CFL | Lions, Stampeders, Elks, Roughriders, Blue Bombers, Tiger-Cats, Argonauts, Redblacks, Alouettes | Rough Riders, Renegades, Concordes |
| CPL | Forge, Cavalry, Pacific, Inter Toronto, HFX Wanderers, Atlético Ottawa, Vancouver FC, Supra du Québec | FC Edmonton, Valour |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # dataset integrity tests
npm run build      # type-check + production build into dist/
```

Requires Node 22.13 or later.

## Project layout

```
src/
  data/            # typed dataset: leagues, cities, venues, teams/*.ts (+ integrity tests)
  data/geo/        # simplified Natural Earth TopoJSON (built by scripts/build-geo.mjs)
  components/      # SportsMap (d3-geo + d3-zoom), panels, filters, credits
  visuals/         # original SVG illustrations: badges, uniforms, playing surfaces
  three/           # procedural stadium builder + React Three Fiber viewer (lazy-loaded)
```

### Editing data

Each team is one object in `src/data/teams/*.ts`, typed by `src/data/types.ts`. Add a venue to `src/data/venues.ts` and a city to `src/data/cities.ts`. Then run `npm test`: the tests check that every reference resolves, that years and statuses agree, and that well-known title counts are right.

### Rebuilding the map

`scripts/build-geo.mjs` explains how to download the Natural Earth source files and regenerate `src/data/geo/canada.topo.json`.

### Deploying

`.github/workflows/pages.yml` publishes the site to GitHub Pages when you run it manually. Pages needs a public repository (or a paid plan for private ones). Turn it on under **Settings → Pages → Source: GitHub Actions**.

## Credits

- **[Wikipedia](https://en.wikipedia.org/)**: team, venue and championship facts, paraphrased (CC BY-SA 4.0). Every team and venue links to its article.
- **[SportsLogos.net](https://www.sportslogos.net/)**: reference for logo and uniform history. The app links to its league archives. SportsLogos.net asks automated tools not to collect its content, so no images or data were copied from it.
- **[Natural Earth](https://www.naturalearthdata.com/)**: boundaries and lakes (public domain).
- **[Astryx](https://github.com/facebook/astryx)**, **[three.js](https://threejs.org/)** / **[React Three Fiber](https://r3f.docs.pmnd.rs/)**, **[d3](https://d3js.org/)**, **[TopoJSON](https://github.com/topojson/topojson)**.

Team badges, uniforms and playing surfaces in this app are original illustrations in each team's colours, not official artwork. Team names, logos and uniforms are trademarks of their owners. This is an unofficial fan project and is not affiliated with any league or team.
