# Streamline - !DEPRECATED!

Personal productivity tracker (daily/monthly tasks, counters, routines, badges). Static frontend + a zero-dependency Python stdlib backend that persists data to a private GitHub repo.

## Requirements

- Python 3.9+
- A GitHub account and a private repo to store user data (JSON files)
- A GitHub personal access token with `repo` scope on that data repo

## Setup

1. Create a private GitHub repo to hold the JSON data (e.g. `yourname/streamline-data`). It can be empty — the backend creates files in it on first write.
2. Create a GitHub personal access token with `repo` scope for that repo.
3. Clone this repo and set the environment variables below.
4. Run the backend:
   ```
   pip install -r requirements.txt
   python backend/server.py
   ```
5. Open `http://localhost:8000` and log in with one of the usernames listed in `ALLOWED_USERS`.

## Environment variables

| Variable         | Required | Description                                                                 |
|-------------------|:--------:|-------------------------------------------------------------------------------|
| `GITHUB_TOKEN`    | yes      | GitHub personal access token with `repo` scope on the data repo               |
| `GITHUB_REPO`     | yes      | Data repo in `owner/repo` form, e.g. `yourname/streamline-data`               |
| `ALLOWED_USERS`   | yes      | Comma-separated usernames allowed to log in, e.g. `alice,bob`                 |
| `ALLOWED_ORIGIN`  | yes (prod) | Exact origin allowed to call the API via CORS, e.g. `https://yourapp.onrender.com` |
| `PORT`            | no       | Server port (default `8000`)                                                  |
| `SYNC_INTERVAL`   | no       | Seconds between background syncs to GitHub (default `180`)                    |

Without `ALLOWED_USERS` no one can log in. Without `GITHUB_TOKEN`/`GITHUB_REPO` the server starts but data cannot be loaded or saved.

## Deploying on Render (or similar)

`render.yaml` is included. In the Render dashboard, set `GITHUB_TOKEN`, `GITHUB_REPO`, `ALLOWED_USERS`, and `ALLOWED_ORIGIN` (your deployed URL, e.g. `https://<your-service>.onrender.com`) as environment variables — `sync: false` in `render.yaml` means Render will prompt you for these instead of storing them in the repo.

## Data model

Each user's data is stored as `data/<username>/<username>-<YYYY>-H1|H2.json` in the data repo (split by calendar half-year). The backend merges the current and previous half-year on load so recent history stays available across the boundary.
