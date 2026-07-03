# KitchenCraft Testing Documentation

This document contains complete validation and software testing matrices conducted for the **KitchenCraft: Apple-Inspired Smart Modular Kitchen Cost Estimation System**. 

---

## 1. UNIT TESTING (UT)

Unit testing focuses on individual components, utility formulas, and isolated functions.

| Test ID | Module / Function | Input Data | Expected Output | Actual Output | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UT-01** | Sizing Calculation: Area | Length: `10.0`, Width: `8.0` | Area: `80.0` sq ft | Area: `80.0` sq ft | **PASS** |
| **UT-02** | Pricing Engine: Base Cost | Area: `80.0`, Rate: `2200` (BWR Plywood) | Base Cost: `₹1,76,000` | Base Cost: `₹1,76,000` | **PASS** |
| **UT-03** | Taxation Engine: GST | Base Cost: `₹1,76,000`, Tax Rate: `18%` | GST: `₹31,680` | GST: `₹31,680` | **PASS** |
| **UT-04** | Pricing Engine: Grand Total | Base Cost: `₹1,76,000`, GST: `₹31,680` | Total: `₹2,07,680` | Total: `₹2,07,680` | **PASS** |
| **UT-05** | Auth API: Admin Validate | User: `admin`, Pass: `admin123` | Success: `true`, Token returned | Success: `true`, Token returned | **PASS** |
| **UT-06** | Auth API: Bad Password | User: `admin`, Pass: `wrongpassword` | Status `401 Unauthorized` | Status `401 Unauthorized` | **PASS** |

---

## 2. INTEGRATION TESTING (IT)

Integration testing verifies connection flows between UI components, Express API proxies, and DB files.

| Test ID | Integration Scenario | Input Flow | Expected Output | Actual Output | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IT-01** | Login to Dashboard Session | Submit valid credentials on login form | Session state sets token, redirects to dashboard | Session state set, redirected | **PASS** |
| **IT-02** | Customer Addition Sync | Add customer via modal form | Database writes record; UI triggers background fetch | DB updated, UI refreshed list | **PASS** |
| **IT-03** | Dynamic Material Selection | Change material select option in studio | Pricing engine reads new rate, re-calculates | Price calculated instantly | **PASS** |
| **IT-04** | Save Estimate Flow | Click "Save Estimate" in Studio | Estimate saved to DB, redirects to history | Estimate saved, list updated | **PASS** |
| **IT-05** | Cascading Deletion | Delete a customer with ID `1` | Customer deleted, all estimates for ID `1` wiped | Customer and estimates deleted | **PASS** |

---

## 3. VALIDATION TESTING (VT)

Validation testing ensures input constraints are handled correctly without breaking the system.

| Test ID | Validation Rule | Input / Boundary Data | Expected Output | Actual Output | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VT-01** | Mandatory Phone Number | Name: `Alex`, Phone: `""` (Empty) | Error: "Name and Phone are required" | Error alert displayed | **PASS** |
| **VT-02** | Phone Digit Length | Phone: `98765` (5 digits) | Error: "Please enter a valid 10-digit number" | Error shown, submit blocked | **PASS** |
| **VT-03** | Negative Sizing Boundaries | Length: `-5`, Width: `8` | Blanks out preview, blocks submit button | Preview reset, button disabled | **PASS** |
| **VT-04** | Zero Pricing Values | Material Name: `Custom`, Rate: `0` | Error: "Please enter a valid rate greater than 0" | Submit blocked, error displayed | **PASS** |
| **VT-05** | SQL Injection Escape | Name: `Robert'; DROP TABLE users;--` | Escaped safe string insert into database | Written safely as string name | **PASS** |

---

## 4. SYSTEM TESTING (ST)

System testing ensures the entire application runs as a cohesive software product under client load.

| Test ID | System Requirement | Actions Performed | Expected Output | Actual Output | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ST-01** | E2E Quotation Flow | Create customer → Create material → Run estimate → Click PDF | File download matching invoice structure | Premium PDF generated, downloaded | **PASS** |
| **ST-02** | Mobile Responsiveness | Resize browser to iPhone 12 viewport | Layout shifts to bottom tab nav, stacked cards | CSS grids wrap fluidly | **PASS** |
| **ST-03** | PDF Layout Integrity | Generate 50-item large estimation bill | Flowable tables break cleanly over multipage reports | Handled beautifully with pagination | **PASS** |
| **ST-04** | Session Timeout Security | Clear token from local cache, reload tab | Re-directs user to Sign-In page | Redirected automatically | **PASS** |
