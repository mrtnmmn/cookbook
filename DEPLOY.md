# Deploying CookBook

The repository is a monorepo with two independently deployable units:

| Unit | Path | Target |
| --- | --- | --- |
| Spring Boot API | repository root | Render (Docker) |
| Next.js frontend | `frontend/` | Vercel |
| PostgreSQL | - | Neon |

Render has **no native Java/Spring runtime** (only Node, Python, Ruby, Go,
Rust, Elixir and Docker), which is why the API ships as a Docker image built
from the `Dockerfile` at the repository root.

---

## 1. Database (Neon)

Neon gives a libpq URL:

```
postgresql://USER:PASSWORD@HOST/DB?sslmode=require&channel_binding=require
```

Convert it for the JDBC driver:

* prefix with `jdbc:`
* remove `USER:PASSWORD@` (they become separate properties)
* remove `channel_binding` - it is libpq-only and pgjdbc rejects it

```
jdbc:postgresql://HOST/DB?sslmode=require
```

Two endpoints matter:

* **pooled** host contains `-pooler` - used at runtime (`DB_URL`)
* **direct** host is the same name without `-pooler` - used by Flyway
  (`DB_DIRECT_URL`), because Flyway's session-level advisory locks do not
  survive PgBouncer transaction pooling

Flyway applies `src/main/resources/db/migration` automatically on boot.

---

## 2. API (Render)

Dashboard -> **New -> Blueprint** and pick this repository (uses `render.yaml`),
or create a Web Service manually with:

* **Language/Runtime:** `Docker`
* **Dockerfile Path:** `./Dockerfile`
* **Health Check Path:** `/api/health`

Environment variables:

| Key | Value |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://<pooled-host>/CookBook?sslmode=require` |
| `DB_DIRECT_URL` | `jdbc:postgresql://<direct-host>/CookBook?sslmode=require` |
| `DB_USERNAME` | Neon user |
| `DB_PASSWORD` | Neon password |
| `CORS_ALLOWED_ORIGINS` | `https://<your-app>.vercel.app` |
| `DOCKER_COMPOSE_ENABLED` | `false` |

`PORT` is injected by Render and picked up by `server.port=${PORT:8085}`.

Do **not** set `SPRING_PROFILES_ACTIVE=neon`: that profile file is git-ignored
and does not exist in the image. The variables above are read directly by
`application.properties`.

> Free instances sleep after ~15 minutes idle; the next request pays a cold
> start of roughly 30-50 s.

---

## 3. Frontend (Vercel)

* **Root Directory:** `frontend`
* Framework preset: Next.js (auto-detected)

Environment variable:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://<your-api>.onrender.com` |

Deploy the API first so the URL exists, then set `CORS_ALLOWED_ORIGINS` on
Render to the Vercel domain once that is known.

---

## Local verification

Build and run the production image exactly as Render does:

```bash
docker build -t cookbook:test .

docker run --rm -p 8099:8099 \
  -e PORT=8099 \
  -e DB_URL='jdbc:postgresql://<pooled-host>/CookBook?sslmode=require' \
  -e DB_DIRECT_URL='jdbc:postgresql://<direct-host>/CookBook?sslmode=require' \
  -e DB_USERNAME='<user>' \
  -e DB_PASSWORD='<password>' \
  -e CORS_ALLOWED_ORIGINS='https://<your-app>.vercel.app' \
  cookbook:test

curl http://localhost:8099/api/health
curl http://localhost:8099/api/health/db
```

For day-to-day local development nothing changes: `./mvnw spring-boot:run`
still starts `compose.yaml` and uses the local Postgres container.

---

## Keep-alive / uptime check (GitHub Actions)

`.github/workflows/health-check.yml` pings `GET /api/health` every 10 minutes.
On the Render free plan the instance sleeps after ~15 minutes without traffic,
so this keeps it warm and fails (with an email notification) when the API is
unreachable.

Setup:

1. Push the workflow to the default branch - scheduled workflows only run from
   the default branch.
2. In GitHub: **Settings -> Secrets and variables -> Actions -> Variables ->
   New repository variable**
   - Name: `API_BASE_URL`
   - Value: `https://<your-service>.onrender.com` (no trailing slash)
3. **Actions** tab -> *Health check* -> **Run workflow** to verify it manually.

Notes:

- Cron runs in UTC and GitHub may delay scheduled runs by several minutes when
  hosted runners are busy; `*/10` is a best effort, not a guarantee.
- GitHub disables scheduled workflows in public repos after 60 days without
  commits; re-enable them from the Actions tab.
- The job retries 5 times with 30s pauses, which covers a Render cold start.
