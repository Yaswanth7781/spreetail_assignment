# AI Usage Documentation

This document describes how the AI coding assistant (Antigravity) was utilized during the development of the Shared Expenses App, highlighting the roles assumed, tools leveraged, and the pair-programming workflow.

---

## 1. Roles Assumed by the AI

The AI functioned across three primary roles:
1.  **Product Manager:** Translated roomate requests (Aisha's settlement graphs, Rohan's audit trails, Priya's multi-currency splits, Sam's temporal boundaries) into clear data validation rules and a staged CSV import pipeline.
2.  **Backend Developer (Django & PostgreSQL):** Designed the relational schema, configured dynamic join/leave timelines, implemented fuzzy name matching and duplicate confidence scoring algorithms, built REST endpoints, and configured local in-memory SQLite database overrides for testing.
3.  **Frontend Developer (React, Tailwind CSS & Vite):** Crafted a modern, visually premium CSV Import Wizard, visual date-range selectors for dynamic intervals, and the chronological debt ledger modal to solve Rohan's request.

---

## 2. Tools & Capabilities Leveraged

The assistant utilized a structured sandbox toolset:
*   `view_file` & `write_to_file`: Used to explore existing source code files and create components (`ImportCSV.jsx`, unit tests in `tests.py`, documentation files) safely.
*   `replace_file_content` & `multi_replace_file_content`: Enabled surgical modifications of routes in `App.jsx`, settings overrides in `settings.py`, and interactive callbacks in `BalanceRow.jsx` / `GroupDetail.jsx`.
*   `run_command`: Proposed commands directly to start development servers (Django on port 8000, Vite on port 5173) and execute test suites asynchronously.
*   `manage_task` & `schedule`: Monitored background tasks and set high-priority reminders to handle latency in DB connections.

---

## 3. Resumption & State Tracking

During the compaction phase of the conversation, the state and progress were preserved using:
*   `task.md` (Checklist tracker marking complete phases).
*   `implementation_plan.md` (Design specifications for import wizard stages).
*   This allowed seamless continuation of backend modifications and UI additions without loss of context.
