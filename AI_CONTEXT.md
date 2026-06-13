# AI_CONTEXT.md
## Splitwise Clone — Full Working Context
> This file is the single source of truth for the entire project.
> Another developer or AI agent should be able to paste this file and recreate a near-identical app.

---

## 1. PROJECT OVERVIEW

| Field | Value |
|---|---|
| Assignment | Build a simplified Splitwise clone |
| Timeline | 2 days |
| Role | Product Manager + Developer |
| Primary AI Tool | Claude (Anthropic) |
| Last Updated | Day 1 — Architecture phase |

---

## 2. PRODUCT UNDERSTANDING

### What Splitwise Does (Reverse Engineered)
- Lets users form groups and log shared expenses
- Automatically calculates who owes whom
- Supports multiple split strategies (equal, unequal, percentage, shares)
- Tracks running balances per user pair within a group
- Allows debt settlement via recorded payments
- Provides individual and group-level balance summaries

### Primary Use Cases (MVP)
1. Friends splitting trip/travel expenses
2. Roommates sharing household bills
3. Small group ad-hoc expenses (meals, events)

### Out of Scope (Explicitly Excluded)
- Currency conversion (INR only)
- Email notifications
- Activity feed / audit log
- Profile pictures / avatars
- Recurring expenses
- Receipt scanning / OCR
- Debt simplification across chains (A→B→C does NOT simplify to A→C)

---

## 3. PRODUCT SCOPE

### Feature List (MVP)

#### Auth
- [x] Register with Name, Email, Password
- [x] Login with Email, Password
- [x] JWT authentication (access + refresh tokens)
- [x] No email verification required
- [x] Search users by email (for group invites)

#### Groups
- [x] Create group (creator becomes admin)
- [x] Admin can add members (search by email)
- [x] Admin can remove members
- [x] View group members list
- [x] View group expenses
- [x] View group-level balance summary

#### Expenses
- [x] Create expense within a group
- [x] Expense has: title, amount (INR), date, paid_by, split_type, notes (optional)
- [x] Split types:
  - **Equal**: amount / N members
  - **Unequal**: manually enter each person's share (must sum to total)
  - **Percentage**: enter % per person (must sum to 100%)
  - **By Share**: enter integer shares per person; proportional calculation
- [x] Only expense creator or group admin can delete an expense
- [x] Expense-level chat (real-time, persisted in DB)

#### Balances
- [x] Pairwise balances — direct user-to-user (no simplification)
- [x] Group balance summary: per member, net owed/owes
- [x] Individual balance summary: across all groups

#### Settlements
- [x] Record a payment from user A to user B (within a group)
- [x] Stored as a separate Settlement entity (not an expense)
- [x] Updates pairwise balances accordingly

#### Chat
- [x] Per-expense chat only
- [x] Real-time via WebSockets (Django Channels)
- [x] Messages persisted in PostgreSQL
- [x] Sender name + timestamp displayed

---

## 4. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Django REST Framework (Python) |
| Database | PostgreSQL (Neon hosted) |
| Authentication | JWT (djangorestframework-simplejwt) |
| Real-time | Django Channels + WebSockets |
| Channel Layer | Redis (Render hosted) or In-Memory (dev) |
| Frontend Host | Vercel |
| Backend Host | Render |
| DB Host | Neon PostgreSQL |

### Neon PostgreSQL
- Connection string: `postgresql://neondb_owner:npg_CDB4vVEQ5Uhd@ep-lively-union-adgs3ubm.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`

---

## 5. DATABASE SCHEMA

### Table: `users`
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,  -- hashed (Django default)
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Table: `groups`
```sql
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Table: `group_members`
```sql
CREATE TABLE group_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
```

### Table: `expenses`
```sql
CREATE TABLE expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  amount      DECIMAL(12, 2) NOT NULL,
  paid_by     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  split_type  VARCHAR(20) NOT NULL CHECK (split_type IN ('equal','unequal','percentage','share')),
  notes       TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Table: `expense_splits`
```sql
CREATE TABLE expense_splits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owed_amount DECIMAL(12, 2) NOT NULL,  -- always stored as final INR amount
  share_value DECIMAL(12, 4),           -- raw input: % or share units (nullable)
  UNIQUE(expense_id, user_id)
);
```

### Table: `settlements`
```sql
CREATE TABLE settlements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paid_to     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      DECIMAL(12, 2) NOT NULL,
  notes       TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Table: `messages`
```sql
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 6. ENTITY RELATIONSHIPS

```
users ─────────────────────────────────────────────────────┐
  │                                                          │
  │ created_by                                               │
  ▼                                                          │
groups ──── group_members ──── users (many-to-many)         │
  │                                                          │
  │ group_id                                                 │
  ▼                                                          │
expenses ──── expense_splits ──── users (per-split share)   │
  │                                                          │
  │ paid_by ─────────────────────────────────────────────────┘
  │
  └──── messages (expense-level chat, per sender)

groups ──── settlements ──── users (paid_by → paid_to)
```

### Key Constraints
- A user can only be in a group once (UNIQUE group_members)
- expense_splits must cover all participating members
- For equal split: all members; unequal/percentage/share: selected members
- Settlement is within a group context
- Chat messages scoped to an expense

---

## 7. BALANCE CALCULATION LOGIC

Balance is computed on-the-fly from expenses and settlements (not stored in a balance table).

### Per Group, Per User Pair (A, B):
```
A_owes_B = SUM(expense_splits.owed_amount WHERE user_id=A AND expenses.paid_by=B)
         - SUM(settlements.amount WHERE paid_by=A AND paid_to=B AND group_id=group)
         + SUM(settlements.amount WHERE paid_by=B AND paid_to=A AND group_id=group)
```

> Balances are always pairwise. No simplification across chains.

### Group Balance Summary (per member):
- Net balance = total_paid - total_owed (across all expenses in group)

### Individual Summary (across all groups):
- Aggregate net balances per user-pair across all groups the logged-in user belongs to

---

## 8. API DESIGN

### Base URL: `/api/v1/`

---

#### AUTH

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register/` | Register new user |
| POST | `/auth/login/` | Login, returns access + refresh JWT |
| POST | `/auth/token/refresh/` | Refresh access token |
| GET | `/auth/me/` | Get current user profile |
| GET | `/auth/users/search/?email=` | Search users by email |

---

#### GROUPS

| Method | Endpoint | Description |
|---|---|---|
| GET | `/groups/` | List all groups for current user |
| POST | `/groups/` | Create a new group |
| GET | `/groups/:id/` | Get group detail + members |
| DELETE | `/groups/:id/` | Delete group (admin only) |
| POST | `/groups/:id/members/` | Add member by email (admin only) |
| DELETE | `/groups/:id/members/:userId/` | Remove member (admin only) |

---

#### EXPENSES

| Method | Endpoint | Description |
|---|---|---|
| GET | `/groups/:groupId/expenses/` | List expenses in a group |
| POST | `/groups/:groupId/expenses/` | Create expense |
| GET | `/groups/:groupId/expenses/:id/` | Get expense detail + splits |
| DELETE | `/groups/:groupId/expenses/:id/` | Delete expense (creator or admin) |

**Create Expense Payload:**
```json
{
  "title": "Hotel stay",
  "amount": 3000.00,
  "paid_by": "<user_uuid>",
  "split_type": "equal",
  "notes": "3 nights",
  "date": "2024-06-01",
  "splits": [
    { "user_id": "<uuid>", "share_value": null }
  ]
}
```

---

#### BALANCES

| Method | Endpoint | Description |
|---|---|---|
| GET | `/groups/:groupId/balances/` | Pairwise balances within group |
| GET | `/balances/summary/` | Individual balance summary (all groups) |

**Balance Response (group):**
```json
{
  "balances": [
    { "from_user": {...}, "to_user": {...}, "amount": 500.00 }
  ]
}
```

---

#### SETTLEMENTS

| Method | Endpoint | Description |
|---|---|---|
| GET | `/groups/:groupId/settlements/` | List settlements in group |
| POST | `/groups/:groupId/settlements/` | Record a settlement |

**Create Settlement Payload:**
```json
{
  "paid_by": "<user_uuid>",
  "paid_to": "<user_uuid>",
  "amount": 500.00,
  "notes": "Cash payment",
  "date": "2024-06-01"
}
```

---

#### CHAT (HTTP — for history)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/expenses/:expenseId/messages/` | Get chat history for expense |

**WebSocket:** `ws://backend/ws/expense/<expenseId>/`
- Auth via JWT token in query param: `?token=<access_token>`
- Send: `{ "content": "message text" }`
- Receive: `{ "sender": { "id": "...", "name": "..." }, "content": "...", "created_at": "..." }`

---

## 9. FRONTEND PAGE STRUCTURE

```
/                          → Redirect to /login or /dashboard
/login                     → Login page
/register                  → Register page
/dashboard                 → Home: all groups + individual balance summary
/groups/new                → Create group form
/groups/:id                → Group detail page
  ├── Expenses tab          → List of expenses + Create button
  ├── Balances tab          → Pairwise group balances
  └── Settlements tab       → Settlement list + Record payment
/groups/:id/expenses/new   → Create expense form (split type selector)
/groups/:id/expenses/:eid  → Expense detail + split breakdown + chat
/groups/:id/settle         → Record settlement form
```

### Key UI Components
- `<Navbar />` — logo, user name, logout
- `<GroupCard />` — group name, member count, your net balance
- `<ExpenseCard />` — title, amount, paid by, date, your share
- `<BalanceRow />` — user A owes user B ₹X
- `<SplitTypeSelector />` — radio tabs: Equal / Unequal / Percentage / Share
- `<SplitInputTable />` — dynamic table of members + input per split type
- `<ChatBox />` — real-time message window (WebSocket)
- `<SettlementForm />` — paid_by, paid_to (dropdowns), amount, date

---

## 10. FRONTEND ARCHITECTURE

- **State management**: React Context API (AuthContext, GroupContext)
- **Routing**: React Router v6
- **HTTP client**: Axios with JWT interceptor (auto-attach Bearer token, refresh on 401)
- **WebSocket**: Native browser WebSocket API (no socket.io)
- **Form handling**: Controlled components (no form library)
- **Styling**: Tailwind CSS utility classes only

### Axios Interceptor Behavior
1. Attach `Authorization: Bearer <access_token>` to every request
2. On 401 response → call `/auth/token/refresh/` with refresh token
3. On success → retry original request with new access token
4. On failure → redirect to `/login`

---

## 11. BACKEND ARCHITECTURE

### Django App Structure
```
backend/
├── config/                  # Django settings, URLs, ASGI
│   ├── settings.py
│   ├── urls.py
│   └── asgi.py
├── apps/
│   ├── users/               # Custom user model, auth views
│   ├── groups/              # Group + GroupMember models + views
│   ├── expenses/            # Expense + ExpenseSplit models + views
│   ├── balances/            # Balance calculation logic (no model)
│   ├── settlements/         # Settlement model + views
│   └── chat/                # Message model + WebSocket consumer
├── manage.py
└── requirements.txt
```

### Django Settings Notes
- `AUTH_USER_MODEL = 'users.User'`
- Custom User model extends AbstractBaseUser
- CORS: `CORS_ALLOWED_ORIGINS` set to Vercel frontend URL
- Channels: ASGI with Redis channel layer (or InMemoryChannelLayer for dev)
- Database: single Neon PostgreSQL connection via `dj-database-url`

---

## 12. DEPLOYMENT PLAN

### Backend (Render)
- Web service: Python / Django
- Build command: `pip install -r requirements.txt && python manage.py migrate`
- Start command: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`
- Env vars: `DATABASE_URL`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DEBUG=False`

### Frontend (Vercel)
- Framework: Vite
- Build command: `npm run build`
- Output dir: `dist`
- Env vars: `VITE_API_BASE_URL`, `VITE_WS_BASE_URL`

### Database (Neon)
- Already provisioned (connection string provided)
- SSL required (`sslmode=require`)

---

## 13. TESTING PLAN

### Backend
- Django `TestCase` for each model
- API tests using `APIClient` (DRF)
- Key test scenarios:
  - Register + login → receive JWT
  - Create group → creator is admin
  - Create expense (each split type) → splits sum to total
  - Balance calculation correctness
  - Settlement reduces balance correctly
  - Non-admin cannot remove members
  - Non-creator/non-admin cannot delete expense

### Frontend
- Manual testing for all flows (MVP timeline constraint)
- Key flows to manually verify:
  - Auth flow (register, login, logout, token refresh)
  - Group CRUD
  - Expense creation (all 4 split types)
  - Balance display
  - Settlement recording
  - Real-time chat

---

## 14. TRADEOFFS & DECISIONS

| Decision | Choice | Reason |
|---|---|---|
| Balance storage | Computed on-the-fly | Avoids sync bugs; small dataset |
| Debt simplification | Not implemented | Keeps UX simple; matches scope |
| Channel layer | InMemoryChannelLayer (dev) / Redis (prod) | Redis required for multi-process Render |
| Split participants | All group members by default (equal); selectable for others | Matches Splitwise default |
| UUID primary keys | Yes (all tables) | Avoids enumeration attacks |
| Soft delete | No | Simpler; hard delete with cascade |
| Currency | INR only, DECIMAL(12,2) | Scope constraint |
| Email verification | Not implemented | MVP scope |
| Token storage | localStorage (access) + localStorage (refresh) | Simple; acceptable for MVP |

---

## 15. KNOWN LIMITATIONS

- No email verification → anyone can register with any email
- No activity feed → no audit trail for edits
- Balances recomputed on every request → may be slow at scale (acceptable for MVP)
- WebSocket auth via query param → less secure than cookie-based (acceptable for MVP)
- No pagination on expenses/messages → could be slow with large datasets
- In-memory channel layer on dev → does not persist across restarts

---

## 16. PROMPTS & AI RESPONSES LOG

### Initial Prompt Used
> "You are a junior engineer helping me complete an internship assignment. The assignment is to reverse engineer Splitwise, scope a realistic 3-day version, and build a working deployed app. [full prompt as per assignment]"

### Interview Round 1 — Product Scope
**Q:** User personas?
**A:** General audience — friends on trips, roommates, small groups.

**Q:** MVP priority?
**A:** Expense management → Balances → Settlements → Real-time chat. All required features included.

**Q:** Out of scope?
**A:** Currency conversion, email notifications, activity feed, profile pictures, recurring expenses, OCR.

### Interview Round 2 — Auth
**Q:** Registration fields?
**A:** Name, Email, Password.

**Q:** Email verification?
**A:** Not required for MVP.

**Q:** JWT storage?
**A:** localStorage.

**Q:** User search for invites?
**A:** By email only.

### Interview Round 3 — Groups & Expenses
**Q:** Group admin powers?
**A:** Creator is admin. Admin can add/remove members.

**Q:** Expense visibility for late joiners?
**A:** All group members see all group expenses regardless of join date.

**Q:** Expense deletion?
**A:** Creator or group admin only.

**Q:** Share split meaning?
**A:** Integer shares, proportional (e.g., 2 shares + 1 share = 2/3 and 1/3 of total).

### Interview Round 4 — Balances & Settlements
**Q:** Debt simplification?
**A:** No. Pairwise only.

**Q:** Settlement entity?
**A:** Separate Settlement table (not an expense).

**Q:** Currency?
**A:** INR only.

### Interview Round 5 — Chat
**Q:** Chat scope?
**A:** Per expense only.

**Q:** Message persistence?
**A:** Yes, persisted in PostgreSQL.

### Interview Round 6 — Deployment
**Q:** Deployment targets?
**A:** Frontend → Vercel. Backend → Render. DB → Neon PostgreSQL (already provisioned).

---

## 17. CHANGES LOG

| Version | Change | Reason |
|---|---|---|
| v0.1 | Initial context created | Post-interview architecture phase |

---

*This file must be updated on every architecture, schema, UI, or logic change during implementation.*
