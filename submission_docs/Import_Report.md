# CSV Import Anomaly Detection & Resolution Report

This report is automatically produced by the Shared Expenses App to document all anomalies detected during spreadsheet ingestion, the step-by-step resolution actions available, and the resolution details applied for each import job.

---

## 1. Unresolved Payer Resolution Flow (The Three Cases)

When a payer name in the CSV cannot be resolved to an active group member at the time of ingestion, the Shared Expenses App locks the import flow and prompts the user with the following three-action resolution options:

### Case 1: Suggested Match (User already exists in the group)
*   **Scenario:** The CSV payer name matches a group member but contains slight casing or spelling variations (e.g., CSV: `rohan`, Group Member: `Rohan`).
*   **Resolution Option:** `Map to existing group member`
*   **UI Flow:** The wizard displays a suggested match along with their email (e.g., `Rohan (rohan@gmail.com)`) and a confirmation checkbox: **"☐ Confirm this is the correct person"**.
    *   *Checked:* Maps the CSV name to this existing user. No new record or membership is created.
    *   *Unchecked:* Displays Case 2 and Case 3 fallback actions.
*   **Database Action:** Maps all matched expenses to the existing `group_members` ID of the resolved user.
*   **Session Propagation:** The system automatically maps all subsequent occurrences of this CSV name (e.g., `rohan`, `ROHAN`, `Rohan `) to the same user during this import session.

### Case 2: System User Match (User exists globally but not in this group)
*   **Scenario:** Payer exists globally in the system database (e.g., `Sam`) but has not been added to the current group (e.g., `Flatmates`).
*   **Resolution Option:** `Add existing system user to group`
*   **UI Flow:** The wizard displays an email lookup field: **"Search by email: [________________] [Search]"**.
    *   Once a valid user is found, clicking **"Add to Group"** registers their membership.
*   **Database Action:** Creates a new `GroupMembership` (linking the existing `User` and the current `Group`) with a join date matching the earliest expense date.
*   **Session Propagation:** Caches the resolution mapping so all other rows containing this CSV name are automatically resolved to the global user.

### Case 3: Create User (User does not exist anywhere in the system)
*   **Scenario:** Payer name (e.g., `Priya S`) is completely new and has no existing account in the database.
*   **Resolution Option:** `Create new member`
*   **UI Flow:** The wizard renders a creation form with Name (prefilled with `Priya S`) and an optional Email input: **"Create New User: Name [ Priya S ], Email [_______________] [Create User & Add To Group]"**.
*   **Database Action:** Performs a batch transaction that:
    1.  Creates a new `User` record with the provided name and email.
    2.  Creates a corresponding `GroupMembership` to link them to the group.
    3.  Associates the imported expenses with the new user's ID.
*   **Session Propagation:** Propagates this mapping session-wide. All future rows with the CSV name `Priya S` are automatically marked as resolved to this new user.

---

## 2. Ingested Import Jobs & Resolution Logs

### Import Job: 438bf6e5-8659-46a1-bdb0-c006a77cb522
*   **Group:** Flatmates
*   **Uploaded By:** Sam
*   **Uploaded At:** 2026-06-14 14:35:27
*   **Job Status:** fully_imported (All issues resolved)

| Row | Issue Type | Severity | Description | Resolution Applied | Details |
|---|---|---|---|---|---|
| 2 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 3 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 4 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 5 | **fuzzy_name** | `warning` | Payer 'Dev' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'ae9c141c-2593-4e95-9aa1-872beeca332d', 'csv_name': 'Dev'}` |
| 6 | **fuzzy_name** | `warning` | Payer 'Dev' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'ae9c141c-2593-4e95-9aa1-872beeca332d', 'csv_name': 'Dev'}` |
| 6 | **duplicate** | `warning` | Potential duplicate of row 5 (Confidence: 80%). | `ignore` | `{'duplicate_row_num': 5}` |
| 7 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 8 | **fuzzy_name** | `warning` | Payer 'Meera' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '0c4d71eb-047a-4d2e-910f-2c1b0cc47a93', 'csv_name': 'Meera'}` |
| 9 | **fuzzy_name** | `warning` | Payer 'priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'priya'}` |
| 10 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 11 | **missing_data** | `critical` | Payer 'Priya S' does not exist in group or system. | `create_new_user` | `{'name': 'Priya S', 'email': 'priyas@gmail.com'}` |
| 12 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 13 | **missing_data** | `critical` | Missing paid_by/payer field. | `map_user` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'user_name': 'Rohan'}` |
| 14 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 15 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 16 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 17 | **fuzzy_name** | `warning` | Payer 'Meera' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '0c4d71eb-047a-4d2e-910f-2c1b0cc47a93', 'csv_name': 'Meera'}` |
| 18 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 19 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 20 | **fuzzy_name** | `warning` | Payer 'Dev' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'ae9c141c-2593-4e95-9aa1-872beeca332d', 'csv_name': 'Dev'}` |
| 21 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 22 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 23 | **fuzzy_name** | `warning` | Payer 'Dev' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'ae9c141c-2593-4e95-9aa1-872beeca332d', 'csv_name': 'Dev'}` |
| 24 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 25 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 26 | **fuzzy_name** | `warning` | Payer 'Dev' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'ae9c141c-2593-4e95-9aa1-872beeca332d', 'csv_name': 'Dev'}` |
| 26 | **negative_amount** | `warning` | Negative amount found: -30. Select refund, settlement correction, or error fix. | `refund` | `{'original_value': -30.0}` |
| 27 | **invalid_date_format** | `critical` | Invalid or missing date: 'Mar-14' | `date_correction` | `{'fixed_date': '2026-03-14'}` |
| 27 | **fuzzy_name** | `warning` | Payer 'rohan ' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'rohan '}` |
| 28 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 29 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 30 | **fuzzy_name** | `warning` | Payer 'Meera' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '0c4d71eb-047a-4d2e-910f-2c1b0cc47a93', 'csv_name': 'Meera'}` |
| 31 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 32 | **fuzzy_name** | `warning` | Payer 'Meera' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '0c4d71eb-047a-4d2e-910f-2c1b0cc47a93', 'csv_name': 'Meera'}` |
| 33 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 34 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 35 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 36 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 37 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 38 | **clean** | `info` | Clean row | `None` | `N/A` |
| 39 | **clean** | `info` | Clean row | `None` | `N/A` |
| 40 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 41 | **clean** | `info` | Clean row | `None` | `N/A` |
| 42 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 43 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |

---

### Import Job: 6b4a05d5-8ca0-4086-8cc7-c445cf9fb64a
*   **Group:** Flatmates
*   **Uploaded By:** Dev
*   **Uploaded At:** 2026-06-14 14:14:21
*   **Job Status:** fully_imported (All issues resolved)

| Row | Issue Type | Severity | Description | Resolution Applied | Details |
|---|---|---|---|---|---|
| 2 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 3 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 4 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 5 | **clean** | `info` | Clean row | `None` | `N/A` |
| 6 | **duplicate** | `warning` | Potential duplicate of row 5 (Confidence: 80%). | `ignore` | `{'duplicate_row_num': 5}` |
| 7 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 8 | **fuzzy_name** | `warning` | Payer 'Meera' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '0c4d71eb-047a-4d2e-910f-2c1b0cc47a93', 'csv_name': 'Meera'}` |
| 9 | **fuzzy_name** | `warning` | Payer 'priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'priya'}` |
| 10 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 11 | **missing_data** | `critical` | Payer 'Priya S' does not exist in group or system. | `create_new_user` | `{'name': 'Priya S', 'email': 'priyas@gmail.com'}` |
| 12 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 13 | **missing_data** | `critical` | Missing paid_by/payer field. | `map_user` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'user_name': 'Priya'}` |
| 14 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 15 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 16 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 17 | **fuzzy_name** | `warning` | Payer 'Meera' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '0c4d71eb-047a-4d2e-910f-2c1b0cc47a93', 'csv_name': 'Meera'}` |
| 18 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 19 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 20 | **clean** | `info` | Clean row | `None` | `N/A` |
| 21 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 22 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 23 | **clean** | `info` | Clean row | `None` | `N/A` |
| 24 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 25 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 26 | **negative_amount** | `warning` | Negative amount found: -30. Select refund, settlement correction, or error fix. | `refund` | `{'original_value': -30.0}` |
| 27 | **invalid_date_format** | `critical` | Invalid or missing date: 'Mar-14' | `date_correction` | `{'fixed_date': '2026-03-14'}` |
| 27 | **fuzzy_name** | `warning` | Payer 'rohan ' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'rohan '}` |
| 28 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 29 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 30 | **fuzzy_name** | `warning` | Payer 'Meera' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '0c4d71eb-047a-4d2e-910f-2c1b0cc47a93', 'csv_name': 'Meera'}` |
| 31 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 32 | **fuzzy_name** | `warning` | Payer 'Meera' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '0c4d71eb-047a-4d2e-910f-2c1b0cc47a93', 'csv_name': 'Meera'}` |
| 33 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 34 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 35 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 36 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 37 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 38 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `add_to_group` | `{'user_id': 'sam_user_uuid', 'user_name': 'Sam', 'user_email': 'sam@gmail.com'}` |
| 39 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `add_to_group` | `{'user_id': 'sam_user_uuid', 'user_name': 'Sam', 'user_email': 'sam@gmail.com'}` |
| 40 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 41 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `add_to_group` | `{'user_id': 'sam_user_uuid', 'user_name': 'Sam', 'user_email': 'sam@gmail.com'}` |
| 42 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 43 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `create_new_user` | `{'name': 'Priya S', 'email': 'priyas@gmail.com'}` |

---

### Import Job: 73b8b24f-ac46-46ee-a391-1fdf030c0a2a
*   **Group:** agra trip
*   **Uploaded By:** Padam Yaswanth Raj
*   **Uploaded At:** 2026-06-14 13:44:29
*   **Job Status:** fully_imported (All issues resolved)

| Row | Issue Type | Severity | Description | Resolution Applied | Details |
|---|---|---|---|---|---|
| 2 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `create_new_user` | `{'name': 'Aisha', 'email': 'aisha@gmail.com'}` |
| 3 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `create_new_user` | `{'name': 'Priya', 'email': 'priya@gmail.com'}` |
| 4 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 5 | **missing_data** | `critical` | Payer 'Dev' does not exist in group or system. | `create_new_user` | `{'name': 'Dev', 'email': 'dev@gmail.com'}` |
| 6 | **missing_data** | `critical` | Payer 'Dev' does not exist in group or system. | `create_new_user` | `{'name': 'Dev', 'email': 'dev@gmail.com'}` |
| 6 | **duplicate** | `warning` | Potential duplicate of row 5 (Confidence: 80%). | `ignore` | `{'duplicate_row_num': 5}` |
| 7 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `create_new_user` | `{'name': 'Aisha', 'email': 'aisha@gmail.com'}` |
| 8 | **missing_data** | `critical` | Payer 'Meera' does not exist in group or system. | `create_new_user` | `{'name': 'Meera', 'email': 'meera@gmail.com'}` |
| 9 | **missing_data** | `critical` | Payer 'priya' does not exist in group or system. | `create_new_user` | `{'name': 'Priya', 'email': 'priya@gmail.com'}` |
| 10 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 11 | **missing_data** | `critical` | Payer 'Priya S' does not exist in group or system. | `create_new_user` | `{'name': 'Priya S', 'email': 'priyas@gmail.com'}` |
| 12 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 13 | **missing_data** | `critical` | Missing paid_by/payer field. | `map_user` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'user_name': 'Rohan'}` |
| 14 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 15 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `create_new_user` | `{'name': 'Aisha', 'email': 'aisha@gmail.com'}` |
| 16 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `create_new_user` | `{'name': 'Aisha', 'email': 'aisha@gmail.com'}` |
| 17 | **missing_data** | `critical` | Payer 'Meera' does not exist in group or system. | `create_new_user` | `{'name': 'Meera', 'email': 'meera@gmail.com'}` |
| 18 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 19 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `create_new_user` | `{'name': 'Aisha', 'email': 'aisha@gmail.com'}` |
| 20 | **missing_data** | `critical` | Payer 'Dev' does not exist in group or system. | `create_new_user` | `{'name': 'Dev', 'email': 'dev@gmail.com'}` |
| 21 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 22 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `create_new_user` | `{'name': 'Priya', 'email': 'priya@gmail.com'}` |
| 23 | **missing_data** | `critical` | Payer 'Dev' does not exist in group or system. | `create_new_user` | `{'name': 'Dev', 'email': 'dev@gmail.com'}` |
| 24 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `create_new_user` | `{'name': 'Aisha', 'email': 'aisha@gmail.com'}` |
| 25 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 26 | **missing_data** | `critical` | Payer 'Dev' does not exist in group or system. | `create_new_user` | `{'name': 'Dev', 'email': 'dev@gmail.com'}` |
| 26 | **negative_amount** | `warning` | Negative amount found: -30. Select refund, settlement correction, or error fix. | `refund` | `{'original_value': -30.0}` |
| 27 | **invalid_date_format** | `critical` | Invalid or missing date: 'Mar-14' | `date_correction` | `{'fixed_date': '2026-03-14'}` |
| 27 | **fuzzy_name** | `warning` | Payer 'rohan ' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'rohan '}` |
| 28 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `create_new_user` | `{'name': 'Priya', 'email': 'priya@gmail.com'}` |
| 29 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `create_new_user` | `{'name': 'Aisha', 'email': 'aisha@gmail.com'}` |
| 30 | **missing_data** | `critical` | Payer 'Meera' does not exist in group or system. | `create_new_user` | `{'name': 'Meera', 'email': 'meera@gmail.com'}` |
| 31 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `create_new_user` | `{'name': 'Priya', 'email': 'priya@gmail.com'}` |
| 32 | **missing_data** | `critical` | Payer 'Meera' does not exist in group or system. | `create_new_user` | `{'name': 'Meera', 'email': 'meera@gmail.com'}` |
| 33 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `create_new_user` | `{'name': 'Aisha', 'email': 'aisha@gmail.com'}` |
| 34 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 35 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `create_new_user` | `{'name': 'Aisha', 'email': 'aisha@gmail.com'}` |
| 36 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `create_new_user` | `{'name': 'Priya', 'email': 'priya@gmail.com'}` |
| 37 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 38 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `create_new_user` | `{'name': 'Sam', 'email': 'sam@gmail.com'}` |
| 39 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `create_new_user` | `{'name': 'Sam', 'email': 'sam@gmail.com'}` |
| 40 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `create_new_user` | `{'name': 'Aisha', 'email': 'aisha@gmail.com'}` |
| 41 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `create_new_user` | `{'name': 'Sam', 'email': 'sam@gmail.com'}` |
| 42 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `create_new_user` | `{'name': 'Aisha', 'email': 'aisha@gmail.com'}` |
| 43 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `create_new_user` | `{'name': 'Priya', 'email': 'priya@gmail.com'}` |
