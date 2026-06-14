# CSV Import Anomaly Detection & Resolution Report

This report is automatically produced by the Shared Expenses App to document all anomalies detected during spreadsheet ingestion and the resolution action taken for each row.

## Import Job: 438bf6e5-8659-46a1-bdb0-c006a77cb522
*   **Group:** Flatmates
*   **Uploaded By:** Sam
*   **Uploaded At:** 2026-06-14 14:35:27
*   **Job Status:** pending_review

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
| 11 | **missing_data** | `critical` | Payer 'Priya S' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 12 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 13 | **missing_data** | `critical` | Missing paid_by/payer field. | `Skipped/Default` | `N/A` |
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
| 27 | **invalid_date_format** | `critical` | Invalid or missing date: 'Mar-14' | `Skipped/Default` | `N/A` |
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
| 38 | **clean** | `info` | Clean row | `Skipped/Default` | `N/A` |
| 39 | **clean** | `info` | Clean row | `Skipped/Default` | `N/A` |
| 40 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 41 | **clean** | `info` | Clean row | `Skipped/Default` | `N/A` |
| 42 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 43 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |

---

## Import Job: 6b4a05d5-8ca0-4086-8cc7-c445cf9fb64a
*   **Group:** Flatmates
*   **Uploaded By:** Dev
*   **Uploaded At:** 2026-06-14 14:14:21
*   **Job Status:** pending_review

| Row | Issue Type | Severity | Description | Resolution Applied | Details |
|---|---|---|---|---|---|
| 2 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 3 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 4 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 5 | **clean** | `info` | Clean row | `Skipped/Default` | `N/A` |
| 6 | **duplicate** | `warning` | Potential duplicate of row 5 (Confidence: 80%). | `ignore` | `{'duplicate_row_num': 5}` |
| 7 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 8 | **fuzzy_name** | `warning` | Payer 'Meera' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '0c4d71eb-047a-4d2e-910f-2c1b0cc47a93', 'csv_name': 'Meera'}` |
| 9 | **fuzzy_name** | `warning` | Payer 'priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'priya'}` |
| 10 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 11 | **missing_data** | `critical` | Payer 'Priya S' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 12 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 13 | **missing_data** | `critical` | Missing paid_by/payer field. | `Skipped/Default` | `N/A` |
| 14 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 15 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 16 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 17 | **fuzzy_name** | `warning` | Payer 'Meera' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '0c4d71eb-047a-4d2e-910f-2c1b0cc47a93', 'csv_name': 'Meera'}` |
| 18 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 19 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 20 | **clean** | `info` | Clean row | `Skipped/Default` | `N/A` |
| 21 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 22 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |
| 23 | **clean** | `info` | Clean row | `Skipped/Default` | `N/A` |
| 24 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 25 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 26 | **negative_amount** | `warning` | Negative amount found: -30. Select refund, settlement correction, or error fix. | `refund` | `{'original_value': -30.0}` |
| 27 | **invalid_date_format** | `critical` | Invalid or missing date: 'Mar-14' | `Skipped/Default` | `N/A` |
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
| 38 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 39 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 40 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 41 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 42 | **fuzzy_name** | `warning` | Payer 'Aisha' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '4c83bf2a-7e9a-4a40-80ee-709e33b87adb', 'csv_name': 'Aisha'}` |
| 43 | **fuzzy_name** | `warning` | Payer 'Priya' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': 'b5962a1e-34bc-493a-b33c-c7431c5f93c8', 'csv_name': 'Priya'}` |

---

## Import Job: 73b8b24f-ac46-46ee-a391-1fdf030c0a2a
*   **Group:** agra trip
*   **Uploaded By:** Padam Yaswanth Raj
*   **Uploaded At:** 2026-06-14 13:44:29
*   **Job Status:** pending_review

| Row | Issue Type | Severity | Description | Resolution Applied | Details |
|---|---|---|---|---|---|
| 2 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 3 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 4 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 5 | **missing_data** | `critical` | Payer 'Dev' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 6 | **missing_data** | `critical` | Payer 'Dev' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 6 | **duplicate** | `warning` | Potential duplicate of row 5 (Confidence: 80%). | `ignore` | `{'duplicate_row_num': 5}` |
| 7 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 8 | **missing_data** | `critical` | Payer 'Meera' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 9 | **missing_data** | `critical` | Payer 'priya' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 10 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 11 | **missing_data** | `critical` | Payer 'Priya S' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 12 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 13 | **missing_data** | `critical` | Missing paid_by/payer field. | `Skipped/Default` | `N/A` |
| 14 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 15 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 16 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 17 | **missing_data** | `critical` | Payer 'Meera' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 18 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 19 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 20 | **missing_data** | `critical` | Payer 'Dev' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 21 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 22 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 23 | **missing_data** | `critical` | Payer 'Dev' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 24 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 25 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 26 | **missing_data** | `critical` | Payer 'Dev' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 26 | **negative_amount** | `warning` | Negative amount found: -30. Select refund, settlement correction, or error fix. | `refund` | `{'original_value': -30.0}` |
| 27 | **invalid_date_format** | `critical` | Invalid or missing date: 'Mar-14' | `Skipped/Default` | `N/A` |
| 27 | **fuzzy_name** | `warning` | Payer 'rohan ' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'rohan '}` |
| 28 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 29 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 30 | **missing_data** | `critical` | Payer 'Meera' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 31 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 32 | **missing_data** | `critical` | Payer 'Meera' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 33 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 34 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 35 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 36 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 37 | **fuzzy_name** | `warning` | Payer 'Rohan' exists in system but is not in group members. Suggest adding them. | `add_to_group` | `{'user_id': '79c281a8-e54b-4b5a-bafa-73a9fea999f3', 'csv_name': 'Rohan'}` |
| 38 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 39 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 40 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 41 | **missing_data** | `critical` | Payer 'Sam' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 42 | **missing_data** | `critical` | Payer 'Aisha' does not exist in group or system. | `Skipped/Default` | `N/A` |
| 43 | **missing_data** | `critical` | Payer 'Priya' does not exist in group or system. | `Skipped/Default` | `N/A` |

---

