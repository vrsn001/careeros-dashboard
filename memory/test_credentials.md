# CareerOS — Test Credentials

## Seeded users (auto-created on backend startup)

### Admin
- **Email**: `admin@careeros.io`
- **Password**: `admin1234`
- **Role**: `admin`

### Demo (recommended for testing — has a pre-populated profile/resume)
- **Email**: `demo@careeros.io`
- **Password**: `demo1234`
- **Role**: `user`
- **Has profile**: yes (skills, headline, resume_text — required for AI match)

## Auth endpoints
- `POST /api/auth/register` — body: `{ email, password, name? }` → `{ token, user }`
- `POST /api/auth/login` — body: `{ email, password }` → `{ token, user }`
- `GET /api/auth/me` — header: `Authorization: Bearer <token>` → user

## Auth strategy
- JWT in `Authorization: Bearer <token>` header (frontend stores in `localStorage.careeros_token`)
- 7-day access token, HS256
- Bcrypt password hashing (`$2b$…`)

## Frontend login shortcut
On the `/auth` page, click the **"Use demo account"** button to autofill `demo@careeros.io / demo1234`.
