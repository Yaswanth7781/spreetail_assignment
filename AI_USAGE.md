# AI Usage Documentation

This document describes how the AI coding assistant (Claude 3.5 Sonnet / Antigravity) was utilized during the development of the Shared Expenses App, highlighting the roles assumed, key prompts, and concrete error resolution cases.

---

## 1. AI Tools Used
*   **Claude 3.5 Sonnet (via Anthropic):** Used for architectural planning, database schema design, and initial codebase generation.
*   **Antigravity (Coding Assistant):** Used for pair programming, file editing, CLI commands execution, bug fixing, and deliverable packaging.

---

## 2. Key Prompts

### Prompt 1: Database Timeline & Schema Design
> *"Design a relational database schema for a Splitwise clone using Django models. We need to support groups, expenses, and settlements. Crucially, roommates join and leave at different times. Design a way to track dynamic active timelines for group members so we only charge them for expenses occurring when they are active. We also need to support 4 split types: equal, unequal, percentage, and shares, and audit USD exchange rates."*

### Prompt 2: CSV Import Anomaly Resolution Algorithm
> *"Write a CSV importer logic in Django to identify anomalies in a roommate expense spreadsheet. Specifically, identify duplicate rows (using similarity thresholds), USD vs INR currencies, fuzzy name spelling variations (using Levenshtein distance), and negative settlement values. Stage these anomalies in a review database so the user can resolve them in a step-by-step React wizard before importing."*

### Prompt 3: WebSocket Real-Time Chat
> *"Create a real-time expense chat using Django Channels. The chat messages should be sent over WebSockets and stored in PostgreSQL. Authenticate connections using simple-jwt tokens passed in the query string."*

---

## 3. Concrete Cases Where the AI Produced Something Wrong

### Case 1: Database Testing Configuration Crash on Cloud PostgreSQL
*   **What the AI did wrong:** The AI initially configured the Django test runner to connect to the Neon cloud PostgreSQL database using the same connection credentials as the production app.
*   **How it was caught:** Running `python manage.py test` threw a `django.db.utils.OperationalError: permission denied to create database` error. Neon serverless databases do not grant standard DB roles superuser permissions to create new temporary databases on the fly.
*   **What we changed:** We added a conditional check in `backend/config/settings.py` to check if a test is running:
    ```python
    import sys
    if 'test' in sys.argv:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': ':memory:',
            }
        }
    ```
    This automatically overrides the database configuration to use a local in-memory SQLite database (`:memory:`) whenever unit tests are run, executing in seconds with zero permissions required.

### Case 2: WebSocket Scheme SyntaxError Page Crash
*   **What the AI did wrong:** The AI constructed the WebSocket connection in React using a raw environment variable URL string without scheme validation (e.g., `new WebSocket(import.meta.env.VITE_WS_BASE_URL + "/ws/...")`).
*   **How it was caught:** When navigating to the Expense Detail page, the screen went completely blank. The browser developer console revealed a `SyntaxError: Failed to construct 'WebSocket'` because the environment variable started with `https://` (which is invalid for WebSocket constructors, which require `wss://` or `ws://`).
*   **What we changed:** We updated the `connect` callback in `frontend/src/hooks/useWebSocket.js` to automatically sanitize the scheme:
    ```javascript
    if (wsBase.startsWith('https://')) {
      wsBase = wsBase.replace('https://', 'wss://');
    } else if (wsBase.startsWith('http://')) {
      wsBase = wsBase.replace('http://', 'ws://');
    }
    ```
    We also wrapped the `new WebSocket(url)` constructor in a `try/catch` block so it logs a console warning and retries rather than crashing the React application tree.

### Case 3: Floating-Point Remainder Dust Mismatch in Splits
*   **What the AI did wrong:** The AI calculated split shares mathematically without correcting for rounding remainders (e.g. splitting ₹100 among 3 people equals ₹33.3333... and storing it resulted in a total sum of ₹99.99, leaving a ₹0.01 mismatch).
*   **How it was caught:** Database transaction integrity checks failed, preventing the expense from saving because the sum of splits (₹99.99) did not match the total transaction amount (₹100.00).
*   **What we changed:** Implemented a greedy remainder distribution method in `backend/expenses/split_logic.py` that calculates the total of all split shares, computes the dust remainder (e.g. ₹0.01), and adds it to the final participant's share to guarantee perfect mathematical totals.
