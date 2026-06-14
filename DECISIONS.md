# Architectural Decisions Document (ADD)

This document details the key technical, algorithmic, and database design decisions made during the implementation of the Shared Expenses App, listing the options considered and the rationale behind each choice.

---

## 1. Dynamic Roommate Timelines (Temporal Boundaries)

### Problem
Roommates joined and left the flat at different times (Meera left at the end of March, Sam joined mid-April, Dev joined for a short trip). Hardcoding dates is fragile and errors occur if expense dates do not match the assumed windows.

### Options Considered
*   **Option A: Hardcode membership dates in application config:** Write static dictionaries mapping users to their active date ranges in Python settings.
*   **Option B: Database-backed dynamic intervals (Chosen):** Create a database schema associating active intervals with each membership.

### Why We Chose What We Chose
We chose **Option B** because it enables dynamic administrative configuration. Group admins can join/leave roommates via the UI, and the CSV importer automatically queries the database state (`membership_history` table) at any given expense date. This ensures split participant exclusions are verified dynamically without redeploying the app.

---

## 2. Multi-Currency Split Auditability

### Problem
Priya requested that USD transactions from travel be accurately converted and audited, preventing the app from "pretending a dollar is a rupee" or relying on hardcoded magic values.

### Options Considered
*   **Option A: Convert instantly to INR and discard original values:** Convert USD to INR in the frontend during input and store only the resulting INR value in the database.
*   **Option B: Audit-trail currency storage (Chosen):** Store both the original currency/amount, the exchange rate applied, and the converted final value in INR.

### Why We Chose What We Chose
We chose **Option B** to ensure transparency. By storing `original_amount`, `currency`, and `exchange_rate` inside the `expenses` table, the app maintains a complete audit trail. Roommates can inspect exactly how a USD transaction was converted, preventing disputes over exchange rate discrepancies.

---

## 3. Duplicate Confidence Scoring

### Problem
Meera wants to review and approve duplicate deletions. Simple deduplication (exact matches only) misses duplicates with minor title or date typos, while fuzzy duplicate detection raises false positives.

### Options Considered
*   **Option A: Direct database primary key constraints:** Throw database unique constraint errors if the same amount is logged on the same date.
*   **Option B: Multi-factor confidence-scored staging (Chosen):** Process every imported row against existing logs and stage duplicate conflicts with confidence scores (e.g., 95% same day/amount/payer, 70% same amount/close dates).

### Why We Chose What We Chose
We chose **Option B** to give the user ultimate control. Rather than silently deleting rows or failing the entire import, this approach flags potential duplicates in a review pipeline with a confidence badge (95%, 80%, 70%), allowing the user to make the final choice (e.g. skip or import anyway).

---

## 4. In-Memory SQLite Testing Configuration

### Problem
Django unit tests create a temporary database at the start of a test run. When configured to connect to the Neon cloud PostgreSQL database, creating a test database requires high admin privileges (often unavailable to standard connection pool roles) and adds latency.

### Options Considered
*   **Option A: Run tests against the cloud PostgreSQL database:** Grant temporary database creation privileges to the production role on the Neon console.
*   **Option B: Override testing database to in-memory SQLite (Chosen):** Programmatically override database configuration to SQLite when running unit tests.

### Why We Chose What We Chose
We chose **Option B** because it eliminates cloud dependencies during testing. Overriding the database in `settings.py` when `'test' in sys.argv` directs the test runner to use a local, local-only SQLite instance. This executes test suites in milliseconds, bypasses Neon permission bottlenecks, and requires zero network roundtrips.

---

## 5. Greedy Debt Simplification Algorithm

### Problem
Aisha requested "one number per person: who pays whom, how much, done." Direct pairwise calculations create complex circles of debt (e.g., A owes B, B owes C, C owes A).

### Options Considered
*   **Option A: Render raw pairwise debts only:** Keep the debt graph unmodified, showing direct participant relationships.
*   **Option B: Greedy Debt Simplification Engine (Chosen):** Calculate net positions (credits minus debits) and iteratively pair the largest debtor with the largest creditor.

### Why We Chose What We Chose
We chose **Option B** but implemented it as an **interactive toggle**. This respects both Aisha's request for minimal transactions and Rohan's request for direct auditability. Roommates can toggle between the simplified graph (which minimizes overall transactions) and the raw chronological splits ledger.
