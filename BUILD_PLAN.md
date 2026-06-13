# BUILD_PLAN.md
## Splitwise Clone — Build Plan

---

## 1. PRODUCT RESEARCH

### How I Studied Splitwise
- Analyzed the core Splitwise app (web + mobile) end-to-end
- Mapped every user-facing screen and identified the data behind each
- Identified the 5 primary user journeys: auth, group management, expense creation, balance checking, settlement
- Noted which features are core vs. premium (removed premium from scope)

### What I Learned
| Insight | Impact on Build |
|---|---|
| Splitwise defaults to "equal split" with all members | Default split includes all group members |
| Balance is pairwise (not simplified by default on free plan) | No debt simplification in MVP |
| Settlement is a separate concept from expense | Separate Settlement model |
| Chat is scoped to individual expenses, not groups | WebSocket rooms per expense ID |
| "Paid by" and "split among" are independent choices | paid_by field on expense, separate splits table |
| Share-based split is proportional, not ratio-fixed | Computed as user_shares / total_shares × amount |

### Identified Workflows
1. **Register → Login → Dashboard** (see all groups + personal balance summary)
2. **Create Group → Add Members** (by email search)
3. **Create Expense → Choose Split → Submit** (4 split types)
4. **View Group Balances** (who owes whom, pairwise)
5. **Record Settlement** (mark a payment between two users)
6. **Open Expense → Chat** (real-time message exchange)

### Product Assumptions Made
- All group members are included in an equal split by default
- For unequal/percentage/share splits, the user selects which members are involved
- "Paid by" can be any group member (not just the logged-in user)
- Balances are computed dynamically (not cached)
- One currency (INR) throughout — no conversion
- No email verification → open registration

---

## 2. ARCHITECTURE

### Tech Stack
| Layer | Tool | Reason |
|---|---|---|
| Frontend | React (Vite) + Tailwind CSS | Fast DX, utility-first styling, Vite for HMR |
| Backend | Django REST Framework | Mature, batteries-included, DRF for API |
| Real-time | Django Channels + WebSockets | Native Django integration |
| Database | PostgreSQL (Neon) | Relational constraint required by assignment |
| Auth | JWT (SimpleJWT) | Stateless, pairs well with React SPA |
| Deployment: FE | Vercel | Zero-config for Vite apps |
| Deployment: BE | Render | Supports ASGI (required for Channels) |

---

### Database Schema (Summary)

| Table | Purpose |
|---|---|
| `users` | Custom user model (UUID PK, name, email, password) |
| `groups` | Group entity with admin (created_by) |
| `group_members` | Many-to-many: user ↔ group with join timestamp |
| `expenses` | Expense with title, amount, paid_by, split_type |
| `expense_splits` | Per-user owed_amount derived from split_type |
| `settlements` | Separate payment entity between two users in a group |
| `messages` | Expense-scoped chat messages (persisted) |

**All PKs are UUID. No sequential integer IDs exposed.**

#### Split Computation Rules
| Split Type | `owed_amount` | `share_value` |
|---|---|---|
| Equal | `amount / N` | `null` |
| Unequal | Entered directly | `null` |
| Percentage | `amount × (pct / 100)` | percentage value |
| Share | `amount × (shares / total_shares)` | integer share count |

---

### API Design (Summary)

**Prefix:** `/api/v1/`

| Domain | Key Endpoints |
|---|---|
| Auth | `POST /auth/register/`, `POST /auth/login/`, `GET /auth/me/`, `GET /auth/users/search/` |
| Groups | `GET/POST /groups/`, `GET/DELETE /groups/:id/`, `POST/DELETE /groups/:id/members/` |
| Expenses | `GET/POST /groups/:gid/expenses/`, `GET/DELETE /groups/:gid/expenses/:id/` |
| Balances | `GET /groups/:gid/balances/`, `GET /balances/summary/` |
| Settlements | `GET/POST /groups/:gid/settlements/` |
| Chat (HTTP) | `GET /expenses/:eid/messages/` |
| Chat (WS) | `ws://.../ws/expense/:eid/?token=<jwt>` |

All endpoints except `/auth/register/` and `/auth/login/` require `Authorization: Bearer <token>`.

---

### Frontend Structure

```
src/
├── api/              # Axios instance + per-domain API functions
│   ├── axios.js      # Base instance with interceptors
│   ├── auth.js
│   ├── groups.js
│   ├── expenses.js
│   ├── balances.js
│   ├── settlements.js
│   └── messages.js
├── context/
│   ├── AuthContext.jsx
│   └── GroupContext.jsx
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── GroupDetail.jsx
│   ├── ExpenseDetail.jsx
│   ├── CreateExpense.jsx
│   ├── CreateGroup.jsx
│   └── Settle.jsx
├── components/
│   ├── Navbar.jsx
│   ├── GroupCard.jsx
│   ├── ExpenseCard.jsx
│   ├── BalanceRow.jsx
│   ├── SplitTypeSelector.jsx
│   ├── SplitInputTable.jsx
│   ├── ChatBox.jsx
│   └── SettlementForm.jsx
├── hooks/
│   └── useWebSocket.js
├── utils/
│   └── formatCurrency.js
├── App.jsx
└── main.jsx
```

---

### Deployment Approach

```
┌──────────────┐     HTTPS      ┌──────────────────┐
│   Vercel     │ ─────────────► │   Render (ASGI)  │
│  React SPA   │                │  Django + Channels│
│  (static)    │     WSS        │                  │
│              │ ─────────────► │                  │
└──────────────┘                └────────┬─────────┘
                                         │ SQL (TLS)
                                         ▼
                                ┌──────────────────┐
                                │  Neon PostgreSQL  │
                                │  (managed)        │
                                └──────────────────┘
```

- Frontend speaks to backend via `VITE_API_BASE_URL` and `VITE_WS_BASE_URL`
- Backend uses `daphne` as ASGI server (supports HTTP + WebSockets)
- All DB traffic is TLS-encrypted (Neon requires `sslmode=require`)

---

## 3. AI COLLABORATION PROCESS

### How I Instructed the AI
- Used the required initial prompt verbatim
- Instructed AI to behave as a junior engineer who does not assume requirements
- AI was told to ask questions before building, and update `AI_CONTEXT.md` after each answer
- AI was told not to recommend solutions — only facilitate my thinking

### What Questions the AI Asked
1. User personas and primary use cases
2. MVP feature priority and what to cut
3. What is explicitly out of scope
4. Registration fields and email verification need
5. JWT storage strategy
6. User search mechanism (email vs username)
7. Group admin model (creator vs democratic)
8. Expense visibility for late joiners
9. Expense deletion permissions
10. Share split semantics (proportional vs fixed ratio)
11. Debt simplification preference
12. Settlement as expense vs separate entity
13. Currency support
14. Chat scope (per expense vs per group)
15. Chat message persistence requirement
16. Deployment targets for frontend, backend, database

### How the Plan Evolved
- Started with open questions; answers shaped the data model
- "No debt simplification" → simpler balance query (pairwise only)
- "Separate Settlement entity" → dedicated table, not an expense subtype
- "All group members visible to late joiners" → no join-date filter on expense queries
- "Admin = creator" → no role table needed; just a `created_by` FK check

### How AI_CONTEXT.md Was Maintained
- Created after the interview phase with all decisions captured
- Will be updated after every schema change, API change, or implementation decision
- Structured as: Overview → Schema → API → Frontend → Deployment → Decisions → Change Log

---

## 4. TRADEOFFS

### What Was Simplified
| Feature | Simplification | Justification |
|---|---|---|
| Balance calculation | On-the-fly, no cache | Small dataset; avoids consistency bugs |
| Debt graph | No simplification | Pairwise is sufficient for MVP |
| Auth | No email verification | Reduces setup complexity |
| Chat auth | JWT in WS query param | Simpler than cookie-based WS auth |
| Testing | Manual FE testing only | Timeline constraint |
| Split participants | All members for equal; selectable for others | Matches Splitwise default UX |

### What Was Hardcoded
- Currency: INR only (no user selection)
- Token storage: `localStorage` (no httpOnly cookie)
- Channel layer: In-Memory for dev, Redis for prod (Render env var)

### What Was Avoided
- Debt simplification (would require graph traversal logic)
- Email notifications (requires SMTP/SES setup)
- Activity feed (extra model, out of scope)
- Profile pictures (file storage complexity)
- Pagination (acceptable for MVP dataset size)

### What Would Be Improved With More Time
1. Add Redis-backed channel layer for scalable WebSockets
2. Add email verification on registration
3. Add pagination on expense and message endpoints
4. Add a balance cache with invalidation on expense/settlement creation
5. Add soft delete for expenses (audit trail)
6. Add debt simplification as an optional toggle
7. Replace localStorage JWT with httpOnly cookie + CSRF
8. Add comprehensive automated tests (unit + integration)
9. Add group-level activity feed
10. Add expense editing (not just delete)

---

## 5. IMPLEMENTATION PHASES

### Phase 1: Backend Foundation (Day 1, Morning)
- [ ] Django project setup with DRF
- [ ] Custom User model
- [ ] JWT auth endpoints (register, login, refresh, me, search)
- [ ] Group model + CRUD + member management
- [ ] Expense model + CRUD + split logic for all 4 types

### Phase 2: Backend — Balances, Settlements, Chat (Day 1, Afternoon)
- [ ] Balance calculation logic (pairwise, on-the-fly)
- [ ] Settlement model + endpoints
- [ ] Django Channels setup (ASGI)
- [ ] WebSocket consumer for expense chat
- [ ] Message persistence

### Phase 3: Frontend Foundation (Day 1, Evening – Day 2, Morning)
- [ ] Vite + React + Tailwind setup
- [ ] Axios instance with JWT interceptors
- [ ] AuthContext (login, register, logout, token refresh)
- [ ] Login + Register pages
- [ ] Dashboard with group list and balance summary

### Phase 4: Frontend — Core Features (Day 2)
- [ ] Group detail page (expenses tab, balances tab, settlements tab)
- [ ] Create expense form (all 4 split types with dynamic input table)
- [ ] Expense detail page
- [ ] ChatBox with WebSocket
- [ ] Settlement form
- [ ] BalanceRow component

### Phase 5: Deployment & Polish (Day 2, Afternoon)
- [ ] Deploy backend to Render (configure env vars, daphne start command)
- [ ] Deploy frontend to Vercel (configure env vars)
- [ ] Smoke test all flows on deployed app
- [ ] Write README.md
- [ ] Final AI_CONTEXT.md update

---

## 6. FOLDER STRUCTURE

### Full Project
```
splitwise-clone/
├── backend/
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── users/
│   │   │   ├── models.py        # Custom User (AbstractBaseUser)
│   │   │   ├── serializers.py
│   │   │   ├── views.py         # register, login, me, search
│   │   │   ├── urls.py
│   │   │   └── admin.py
│   │   ├── groups/
│   │   │   ├── models.py        # Group, GroupMember
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── permissions.py   # IsGroupAdmin
│   │   │   └── urls.py
│   │   ├── expenses/
│   │   │   ├── models.py        # Expense, ExpenseSplit
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── split_logic.py   # compute_splits()
│   │   │   └── urls.py
│   │   ├── balances/
│   │   │   ├── views.py         # balance calculation views
│   │   │   ├── calculator.py    # compute_group_balances(), compute_summary()
│   │   │   └── urls.py
│   │   ├── settlements/
│   │   │   ├── models.py        # Settlement
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   └── chat/
│   │       ├── models.py        # Message
│   │       ├── serializers.py
│   │       ├── consumers.py     # WebSocket consumer
│   │       ├── routing.py       # WebSocket URL routing
│   │       └── views.py         # GET message history
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js
    │   │   ├── auth.js
    │   │   ├── groups.js
    │   │   ├── expenses.js
    │   │   ├── balances.js
    │   │   ├── settlements.js
    │   │   └── messages.js
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── GroupContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── GroupDetail.jsx
    │   │   ├── ExpenseDetail.jsx
    │   │   ├── CreateExpense.jsx
    │   │   ├── CreateGroup.jsx
    │   │   └── Settle.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── GroupCard.jsx
    │   │   ├── ExpenseCard.jsx
    │   │   ├── BalanceRow.jsx
    │   │   ├── SplitTypeSelector.jsx
    │   │   ├── SplitInputTable.jsx
    │   │   ├── ChatBox.jsx
    │   │   └── SettlementForm.jsx
    │   ├── hooks/
    │   │   └── useWebSocket.js
    │   ├── utils/
    │   │   └── formatCurrency.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```
