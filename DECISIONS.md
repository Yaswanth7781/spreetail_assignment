# Architectural Decisions Document (ADD)

This document details the key technical, algorithmic, and database design decisions made during the implementation of the Shared Expenses App.

---

## 1. Dynamic Roommate Timelines (Temporal Boundaries)

### Problem
Roommates joined and left at different times (Meera left at the end of March, Sam joined mid-April, Dev joined for a short trip). Hardcoding dates is highly fragile and errors occur if expense dates do not match the assumed windows.

### Solution
We implemented a **Membership History** design:
*   Added a `membership_history` table tracking a 1-to-many relationship of active intervals per `group_member` (`joined_date` and nullable `left_date`).
*   Added visual date selectors in the frontend CSV Import wizard so the user can easily configure each flatmate's active dates.
*   Enforced database and API serialization validation to exclude inactive roommates from split shares if the expense date falls outside their active window.

---

## 2. Multi-Currency Split Auditability

### Problem
Priya requested that USD transactions from the trip be accurately converted and audited, preventing the app from "pretending a dollar is a rupee" or relying on hardcoded magic values.

### Solution
We added full currency audit capabilities:
*   Instead of converting values offline or using a hardcoded rate, the `expenses` schema stores:
    *   `original_amount` (e.g. 100.00)
    *   `currency` (e.g. 'USD')
    *   `exchange_rate` (e.g. 83.50)
    *   `amount` (converted final value in INR, e.g. 8350.00)
*   The UI displays the conversion parameters directly in both the Import Review interface and the Pairwise Ledger modal (e.g. showing "Conversion Audit: USD 100.00 @ rate of 83.50" under the expense title).

---

## 3. Duplicate Confidence Scoring

### Problem
Meera wants to review and approve duplicate deletions. Simple deduplication (binary matches) leads to false positives if the same person spends the same amount on the same day for different items.

### Solution
We implemented a **Confidence-Scored Staging Pipeline**:
*   Every CSV row is parsed and checked against previously processed rows in the job.
*   Confidence levels are computed using a multi-factor comparison:
    *   **95% Confidence:** Matches title, date, amount, and payer.
    *   **80% Confidence:** Matches date, amount, and payer (different title).
    *   **70% Confidence:** Matches title, amount, and dates within 2 days.
*   Resolutions are staged in the database (`import_issues`) and resolved visually. The user can toggle "Skip Row (Deduplicate)" or override and import.

---

## 4. In-Memory SQLite Testing Configuration

### Problem
Django unit tests create a temporary database at the start of a test run. When configured to connect to the Neon cloud PostgreSQL database, creating a test database requires high admin privileges (often unavailable to standard connection pool roles) and adds latency.

### Solution
We added a condition to the database configuration in `settings.py`:
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
*   This instantly activates an in-memory SQLite database whenever the `test` command is run.
*   Tests run entirely locally, execute in seconds, and require zero cloud PostgreSQL permissions.

---

## 5. Greedy Debt Simplification Algorithm

### Problem
Aisha requested "one number per person: who pays whom, how much, done." Direct pairwise calculations create complex circles of debt (e.g., A owes B, B owes C, C owes A).

### Solution
We implemented a **Greedy Debt Simplification Engine** in `balances/calculator.py`:
1.  Compute net balances for each group member: $\text{Net}_i = \text{Total Paid}_i - \text{Total Owed}_i$.
2.  Categorize members into Creditors ($\text{Net} > 0$) and Debtors ($\text{Net} < 0$).
3.  Sort both groups in descending order of absolute value.
4.  Iterate and greedily match the largest debtor with the largest creditor:
    *   Generate a simplified transaction for $\min(|\text{Debtor}|, \text{Creditor})$.
    *   Deduct the transaction amount from both balances.
    *   Remove fully settled members from the queue and repeat until all balances are zero.
*   The frontend displays a toggle letting the user view Aisha's simplified net balances or Rohan's direct pairwise splits.
