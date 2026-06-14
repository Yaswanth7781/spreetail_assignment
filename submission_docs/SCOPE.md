# Scope & Data Anomaly Resolution Log

This document lists the 12 data anomalies identified in the spreadsheet export (`expenses_export.csv`) and details how the Shared Expenses App detects, handles, and resolves each anomaly through backend policies and interactive frontend wizards.

---

## 1. Catalog of Anomalies & Resolutions

| # | Anomaly | Category | Detection Method | Backend/UI Resolution |
|---|---------|----------|------------------|----------------------|
| **1** | **USD vs INR Pretence** | Currency | Scans amount column values containing `$` or `USD`. | Staged in `ImportIssue` with `currency_conversion`. User edits the conversion rate in the UI (defaults to ₹83.50/$1). Auditable amounts saved. |
| **2** | **Duplicate Rows** | Deduplication | Computes duplicate confidence (95% same day/amount/payer/desc, 80% same date/amount/payer, 70% same desc/amount ±2 days). | Staged in `ImportIssue`. Displays confidence pills on UI. User can toggle "Skip Row (Recommended)" or "Import anyway". |
| **3** | **Hardcoded Member Intervals** | Membership | Payer or splits contain names not active on the expense date. | Visually maps active timelines for roommates (Aisha, Rohan, Priya, Meera, Sam, Dev) using date inputs on UI. |
| **4** | **Negative Values (Refund/Settlement)** | Integrity | Numeric parser flags values $< 0$. | Selection dropdown: `Refund` (split negative values), `Settlement` (convert to pairwise repayment), `Correction` (convert to positive). |
| **5** | **Missing Critical Data** | Integrity | Validates empty values for title, date, amount, or payer. | Flags row as `critical` severity. Pauses import until user fills in the missing values directly on the web page. |
| **6** | **Fuzzy Roommate Names** | Matching | Edit distance (Levenshtein distance $\le 2$) and substring analysis match names. | User maps spelling errors (e.g. "Rohn") to registered user (Rohan) or triggers "Add new member to group". |
| **7** | **Settlement Logged as Expense** | Categorization | Regex matches keywords like "repay", "paid back", "settle" in title. | Recommends importing row as a `Settlement` instead of `Expense`. |
| **8** | **Rounding Differences in Splits** | Split Math | Checks if sum of split shares matches total transaction amount. | Greedy remainder distribution. Evaluates splits using `compute_splits` and assigns rounding dust to the final split participant. |
| **9** | **Exclusion of Inactive Roommates** | Temporal Split | Compares expense date against `MembershipHistory` active ranges. | Automatically filters split participants so members who left (Meera) or haven't joined (Sam) are not split-charged. |
| **10** | **Name Spelling Variations** | Matching | Matches names with minor differences dynamically. | Dropdown selects user mapping and persists spelling-alias resolutions. |
| **11** | **Unregistered System Users** | Matching | Scans global user directory if name matches but isn't group member. | Displays "System user matches. Suggest adding to group" and creates group member with active interval. |
| **12** | **Zero-Split Inactive Windows** | Split Math | Checks if a temporal filter leaves a split calculation with zero users. | Prevents empty splits by validation middleware and prompts user to assign valid date or active payer. |

---

## 2. Database Schema Definition

We implemented a strictly relational database structure using **PostgreSQL** to record multi-currency splits, audit conversion rates, and map dynamic member active windows.

### 2.1 Core Tables

#### `users` (Custom Auth User)
*   `id` (UUID, Primary Key)
*   `name` (VARCHAR)
*   `email` (VARCHAR, Unique)
*   `password` (VARCHAR)
*   `created_at` (TIMESTAMP)

#### `groups`
*   `id` (UUID, Primary Key)
*   `name` (VARCHAR)
*   `description` (TEXT)
*   `created_by` (FOREIGN KEY to `users`)
*   `created_at` (TIMESTAMP)

#### `group_members`
*   `id` (UUID, Primary Key)
*   `group` (FOREIGN KEY to `groups`)
*   `user` (FOREIGN KEY to `users`)
*   `joined_at` (TIMESTAMP)
*   *Constraint:* Unique combination of `group` and `user`.

#### `membership_history`
*   `id` (UUID, Primary Key)
*   `member` (FOREIGN KEY to `group_members`)
*   `joined_date` (DATE)
*   `left_date` (DATE, Nullable)

---

### 2.2 Expense & Settlement Tables

#### `expenses`
*   `id` (UUID, Primary Key)
*   `group` (FOREIGN KEY to `groups`)
*   `title` (VARCHAR)
*   `original_amount` (DECIMAL, original transaction amount)
*   `currency` (VARCHAR, e.g., 'USD', 'INR')
*   `exchange_rate` (DECIMAL, rate applied)
*   `amount` (DECIMAL, final value in INR)
*   `paid_by` (FOREIGN KEY to `users`)
*   `split_type` (VARCHAR, e.g. 'equal', 'percentage', 'share', 'unequal')
*   `date` (DATE)
*   `created_by` (FOREIGN KEY to `users`)
*   `created_at` (TIMESTAMP)

#### `expense_splits`
*   `id` (UUID, Primary Key)
*   `expense` (FOREIGN KEY to `expenses`)
*   `user` (FOREIGN KEY to `users`)
*   `owed_amount` (DECIMAL, participant share in INR)
*   `share_value` (DECIMAL, raw percentage or share units, Nullable)

#### `settlements`
*   `id` (UUID, Primary Key)
*   `group` (FOREIGN KEY to `groups`)
*   `paid_by` (FOREIGN KEY to `users`)
*   `paid_to` (FOREIGN KEY to `users`)
*   `amount` (DECIMAL, in INR)
*   `date` (DATE)
*   `notes` (TEXT)

---

### 2.3 Staging Import Tables

#### `import_jobs`
*   `id` (UUID, Primary Key)
*   `group` (FOREIGN KEY to `groups`)
*   `uploaded_by` (FOREIGN KEY to `users`)
*   `created_at` (TIMESTAMP)
*   `status` (VARCHAR, e.g., 'pending_review', 'completed', 'failed')

#### `import_issues`
*   `id` (UUID, Primary Key)
*   `import_job` (FOREIGN KEY to `import_jobs`)
*   `row_number` (INTEGER)
*   `row_data` (JSONB, raw row columns)
*   `issue_type` (VARCHAR)
*   `severity` (VARCHAR, e.g., 'critical', 'warning', 'info')
*   `description` (TEXT)
*   `confidence_score` (DECIMAL, Nullable)
*   `resolution_selected` (VARCHAR, Nullable)
*   `resolution_details` (JSONB, Nullable)
*   `approved` (BOOLEAN)
