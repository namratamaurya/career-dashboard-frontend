# Career Dashboard Frontend

Angular 20 standalone SPA for a personal career dashboard. It is built for GitHub Pages, uses hash routing, and ships with a mock-first data layer so the portfolio UI runs before the real Node.js backend is connected.

## Local Development

```bash
npm install
npm start
```

Open `http://localhost:4200/#/login`.

Mock demo accounts:

- `namrata@example.com`
- `recruiter@example.com`

Use any password with at least 4 characters while `useMockApi` is enabled.

## Backend Configuration

API settings live in:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Set `apiBaseUrl` to the deployed backend URL, for example a Render HTTPS URL, and set `useMockApi` to `false` when the backend is ready.

The frontend expects these REST shapes:

- `POST /auth/login`
- `GET /jobs`
- `PATCH /jobs/:id/application-status`
- `GET/POST/PUT/DELETE /companies`
- `POST /companies/:id/scrape-now`
- saved search and profile endpoints matching the service methods in `src/app/core/services/`

Because this is a static SPA, JWTs are stored in memory and `localStorage`. That is convenient for GitHub Pages, but less secure than httpOnly cookies. For production, prefer same-site httpOnly cookies when the hosting model allows it.

## GitHub Pages

The app uses hash routing, so deep links look like `https://<username>.github.io/#/dashboard` and refresh safely on Pages.

The production build defaults to base href `/` for local builds and user/org Pages sites:

```bash
BASE_HREF=/ npm run build:prod
```

For a project Pages site, pass the repo path:

```bash
BASE_HREF=/career-dashboard/ npm run build:prod
```

The workflow in `.github/workflows/deploy.yml` builds on pushes to `main` and publishes `dist/career-dashboard-frontend` to `gh-pages`.
For this repository, the workflow deploys with `BASE_HREF=/career-dashboard-frontend/`.

The backend must:

- allow CORS from `https://<username>.github.io`
- be reachable over HTTPS, otherwise browsers block mixed content from GitHub Pages.

## Scripts

```bash
npm start
npm test
npm run build:prod
```

## Portfolio Screenshot

Add a dashboard screenshot or GIF here once the app is deployed:

```markdown
![Career Dashboard screenshot](docs/dashboard.png)
```
