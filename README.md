# SplitEase — Splitwise Clone

A full-stack expense-splitting app built with Django REST Framework + React (Vite) + PostgreSQL (Neon).

**AI Tool Used:** Claude (Anthropic) — claude.ai

---

## Live Demo

- **Frontend:** https://splitease.vercel.app  
- **Backend API:** https://splitease-backend.onrender.com/api/v1/

---

## Features

- JWT authentication (register, login, token refresh)
- Create & manage groups (admin-controlled membership)
- Add expenses with 4 split types: Equal, Unequal, Percentage, Share
- Real-time pairwise balance calculation (no debt simplification)
- Record settlements as separate payment entities
- Real-time expense-level chat via WebSockets (Django Channels)
- INR currency throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Django REST Framework |
| Database | PostgreSQL (Neon) |
| Auth | JWT (djangorestframework-simplejwt) |
| Real-time | Django Channels + WebSockets |
| Frontend host | Vercel |
| Backend host | Render (ASGI via Daphne) |

---

## Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or use the Neon connection string)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/splitwise-clone.git
cd splitwise-clone
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your values

python manage.py migrate
python manage.py runserver
```

The backend will run at `http://localhost:8000`

### 3. Frontend setup
```bash
cd frontend
npm install

# Create local env
cp .env.example .env.local
# .env.local should have:
# VITE_API_BASE_URL=http://localhost:8000/api/v1
# VITE_WS_BASE_URL=ws://localhost:8000

npm run dev
```

The frontend will run at `http://localhost:5173`

---

## Deployment

### Backend → Render

1. Create a new Web Service on Render
2. Connect your GitHub repo, set root directory to `backend/`
3. Build command: `pip install -r requirements.txt && python manage.py migrate --no-input && python manage.py collectstatic --no-input`
4. Start command: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`
5. Set environment variables:
   - `SECRET_KEY` (generate a random one)
   - `DEBUG=False`
   - `DATABASE_URL` (your Neon connection string)
   - `ALLOWED_HOSTS` (your Render domain)
   - `CORS_ALLOWED_ORIGINS` (your Vercel frontend URL)

### Frontend → Vercel

1. Import your GitHub repo on Vercel
2. Set root directory to `frontend/`
3. Set environment variables:
   - `VITE_API_BASE_URL=https://your-render-app.onrender.com/api/v1`
   - `VITE_WS_BASE_URL=wss://your-render-app.onrender.com`
4. Deploy — Vercel auto-detects Vite

---

## Project Structure

```
splitwise-clone/
├── backend/
│   ├── config/          # Django settings, URLs, ASGI
│   ├── users/           # Custom user model + JWT auth
│   ├── groups/          # Group + GroupMember
│   ├── expenses/        # Expense + ExpenseSplit + split logic
│   ├── balances/        # On-the-fly pairwise balance calculator
│   ├── settlements/     # Settlement entity
│   ├── chat/            # WebSocket consumer + Message model
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/         # Axios instance + per-domain modules
    │   ├── context/     # AuthContext
    │   ├── pages/       # Login, Register, Dashboard, GroupDetail, etc.
    │   ├── components/  # Navbar, ChatBox, SplitInputs, etc.
    │   ├── hooks/       # useWebSocket
    │   └── utils/       # formatCurrency, formatDate
    └── package.json
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register/` | Register |
| POST | `/api/v1/auth/login/` | Login |
| GET | `/api/v1/auth/me/` | Current user |
| GET | `/api/v1/groups/` | List groups |
| POST | `/api/v1/groups/` | Create group |
| POST | `/api/v1/groups/:id/members/` | Add member |
| GET | `/api/v1/groups/:id/expenses/` | List expenses |
| POST | `/api/v1/groups/:id/expenses/` | Create expense |
| GET | `/api/v1/groups/:id/balances/` | Group balances |
| POST | `/api/v1/groups/:id/settlements/` | Record payment |
| WS | `/ws/expense/:id/?token=JWT` | Real-time chat |

---

## Key Files

- `AI_CONTEXT.md` — Full working context used to build this app
- `BUILD_PLAN.md` — Architecture decisions and AI collaboration process
