# KITCHENCRAFT: SMART MODULAR KITCHEN COST ESTIMATION SYSTEM
### A Mini Project Report Submitted in Partial Fulfillment of the Requirements for the Degree of Master of Computer Applications (MCA)

---

## CHAPTER 1: INTRODUCTION

### 1.1 Abstract
**KitchenCraft** is a premium, minimal, Apple-inspired Web-based Modular Kitchen Cost Estimation System designed to streamline the sales and quotation process for kitchen designers and fabricators. Currently, businesses calculate prices using manual Excel files, scribbled notebooks, and ad-hoc calculations, leading to errors, slow quote times, and inconsistent customer management. 

KitchenCraft resolves these inefficiencies by offering a centralized platform to manage customers, catalog material rates per square foot, configure modular layout models, and calculate estimates dynamically with live graphical guides. The system generates high-resolution, professional PDF quotations including taxes (GST 18%) and corporate policies.

### 1.2 Problem Statement
In the modular kitchen business, generating custom estimates is a primary customer acquisition bottleneck.
* **Manual Estimations:** Employees calculate linear foot and square foot dimensions manually, often producing calculation errors.
* **Lack of Registry:** Customer databases, historic estimates, and contact histories are scattered across paper registers or WhatsApp threads.
* **Inconsistent Material Rates:** Rates for MDF, acrylics, and plywood fluctuate, leading to outdated price calculations.
* **Slow Document Delivery:** Preparing quotation drafts manually in Word or Excel takes hours per customer.

### 1.3 Objectives
1. **Automated Quotation Engine:** Compute area, subtotal, 18% GST, and grand total instantly based on length, width, and layout types.
2. **Centralized Directory:** Store and search customer accounts and details.
3. **Material Pricing Master:** Configure base square-foot rates for varied grades (e.g. MDF, Plywood, Acrylics).
4. **Instant PDF Archival:** Generate high-resolution quotations with terms, logo, and digital signature boxes.
5. **Apple-Inspired UX:** Deliver a premium, minimal, distraction-free interface matching modern design standards.

---

## CHAPTER 2: SOFTWARE PROJECT PLAN

### 2.1 Methodology: Agile SDLC
The development of KitchenCraft was conducted using Agile principles, focusing on rapid module delivery and high-frequency iterations.

```
[Requirement Gathering] ➔ [UI/UX Wireframes] ➔ [DB Schema Design]
          ▲                                         │
          │                                         ▼
[Client Review / Testing] ◀── [Full-Stack Code] ◀───┘
```

### 2.2 Time Schedule (Gantt Milestones)
* **Week 1:** Requirements definition, technology stack selection, and database layout modeling.
* **Week 2:** Backend database schema scripting, server route mappings, and API security setups.
* **Week 3:** UI Component layout creation, React state triggers, and dynamic calculations scripting.
* **Week 4:** PDF generation module compilation, system tests, and documentation writing.

---

## CHAPTER 3: SOFTWARE REQUIREMENT SPECIFICATION (SRS)

### 3.1 Functional Requirements
* **FR-01: Session Auth:** Secure admin login with username and password.
* **FR-02: Customer CRUD:** Create, update, delete, and search client accounts.
* **FR-03: Material Master:** Configure per-square-foot pricing dynamically.
* **FR-04: Sizing Configurator:** Input kitchen length and width; select layout shape.
* **FR-05: Real-Time Preview:** Show calculation updates instantly on screen.
* **FR-06: PDF Compilation:** Generate downloadable vector quotations on demand.

### 3.2 Non-Functional Requirements
* **NFR-01: Speed:** Calculation previews must compute in under 50 milliseconds.
* **NFR-02: Adaptability:** Interface must work seamlessly on mobile, tablet, and desktop screens.
* **NFR-03: Simplicity:** Minimalist design, high whitespace ratio, and no unnecessary dashboard clutter.
* **NFR-04: Stability:** Clean local storage persistence with server synchronization.

---

## CHAPTER 4: SYSTEM ANALYSIS

### 4.1 Use Case Diagram

```
                 ┌───────────────────────────────────────┐
                 │             KITCHENCRAFT              │
                 │                                       │
                 │      ┌────────────────────────┐       │
                 │      │      Manage Auth       │◀──────┼──── [Admin Session]
                 │      └────────────────────────┘       │
                 │                   ▲                   │
                 │                   │ (extends)         │
                 │      ┌────────────────────────┐       │
                 │      │    Manage Customers    │◀──────┼──── [Directory]
                 │      └────────────────────────┘       │
                 │                                       │
   [Admin User] ─┼─────▶┌────────────────────────┐       │
                 │      │    Configure Rates     │◀──────┼──── [Pricing Master]
                 │      └────────────────────────┘       │
                 │                                       │
                 │      ┌────────────────────────┐       │
                 │      │  Calculate Estimates   │◀──────┼──── [Live Sizer]
                 │      └────────────────────────┘       │
                 │                   │                   │
                 │                   ▼ (includes)        │
                 │      ┌────────────────────────┐       │
                 │      │   Generate PDF Quote   │◀──────┼──── [Export Engine]
                 │      └────────────────────────┘       │
                 └───────────────────────────────────────┘
```

### 4.2 Data Flow Diagrams (DFD)

#### Level 0 DFD (Context Level)
```
┌─────────────┐       User Input Credentials / Sizing Sizes        ┌─────────────────────────┐
│             │ ───────────────────────────────────────────▶ │                         │
│ Admin User  │                                              │      KitchenCraft       │
│             │ ◀─────────────────────────────────────────── │  Cost Estimation System  │
└─────────────┘     Calculated Cost Receipt & PDF Invoices    └─────────────────────────┘
```

#### Level 1 DFD
```
                 Credentials
┌────────────┐   ───────────▶   ┌──────────────┐
│ Admin User │                  │  1.0 Auth    │ ────▶ [users Table]
└────────────┘                  └--------------┘
      │
      ├────────▶ Customer Form  ▶  ┌──────────────┐
      │                            │ 2.0 Customer │ ────▶ [customers Table]
      │                            └──────────────┘
      │
      ├────────▶ Material Rates ▶  ┌──────────────┐
      │                            │ 3.0 Materials│ ────▶ [materials Table]
      │                            └──────────────┘
      │
      └────────▶ Sizing Specs   ▶  ┌──────────────┐
                                   │ 4.0 Costing  │ ───▶ [estimates Table] ──▶ PDF File
                                   └──────────────┘
```

---

## CHAPTER 5: SYSTEM DESIGN

### 5.1 ER Diagram

```
   ┌─────────────┐             ┌─────────────┐
   │    users    │             │  customers  │
   ├─────────────┤             ├─────────────┤
   │ id (PK)     │             │ cust_id (PK)│
   │ username    │             │ name        │
   │ password    │             │ phone       │
   └─────────────┘             │ email       │
                               │ address     │
                               └──────┬──────┘
                                      │
                                      │ 1 (has)
                                      ▼
   ┌─────────────┐             ┌──────┴──────┐
   │  materials  │             │  estimates  │
   ├─────────────┤             ├─────────────┤
   │ mat_id (PK) │ 1 ────────▶ │ est_id (PK) │
   │ name        │   (uses)    │ customer_id │
   │ rate        │             │ material_id │
   └─────────────┘             │ length      │
                               │ width       │
                               │ area        │
                               │ total_cost  │
                               └─────────────┘
```

### 5.2 Table Design (SQLite Schema)

#### Table: `users`
* `id`: INTEGER, Primary Key, Autoincrement
* `username`: TEXT, Unique, Not Null
* `password`: TEXT, Not Null

#### Table: `customers`
* `customer_id`: INTEGER, Primary Key, Autoincrement
* `name`: TEXT, Not Null
* `phone`: TEXT, Not Null
* `email`: TEXT
* `address`: TEXT

#### Table: `materials`
* `material_id`: INTEGER, Primary Key, Autoincrement
* `name`: TEXT, Not Null
* `rate`: REAL, Not Null

#### Table: `estimates`
* `estimate_id`: INTEGER, Primary Key, Autoincrement
* `customer_id`: INTEGER, Foreign Key (customers)
* `material_id`: INTEGER, Foreign Key (materials)
* `length`: REAL, Not Null
* `width`: REAL, Not Null
* `area`: REAL, Not Null
* `layout_type`: TEXT, Not Null
* `material_cost`: REAL, Not Null
* `gst`: REAL, Not Null
* `total_cost`: REAL, Not Null
* `created_date`: TEXT, Not Null

---

## CHAPTER 6: CODING SNIPPETS

### 6.1 Calculation and Storage Core Flow (Express Endpoint)
The following snippet represents the dynamic area costing and cascading calculation logic running inside the Node.js Express server:

```typescript
app.post("/api/estimates", (req, res) => {
  const { customer_id, material_id, length, width, layout_type } = req.body;
  const db = readDb();
  
  const customer = db.customers.find((c) => c.customer_id === parseInt(customer_id));
  const material = db.materials.find((m) => m.material_id === parseInt(material_id));

  const lVal = parseFloat(length);
  const wVal = parseFloat(width);
  const area = lVal * wVal;
  const material_cost = area * material.rate;
  const gst = material_cost * 0.18; // GST at 18%
  const total_cost = material_cost + gst;

  const newId = db.estimates.length + 1;
  const todayStr = new Date().toISOString().split("T")[0];

  const newEstimate = {
    estimate_id: newId,
    customer_id: parseInt(customer_id),
    material_id: parseInt(material_id),
    length: lVal,
    width: wVal,
    layout_type,
    area,
    material_cost,
    gst,
    total_cost,
    created_date: todayStr
  };

  db.estimates.push(newEstimate);
  writeDb(db);
  res.json(newEstimate);
});
```

---

## CHAPTER 7: TESTING RESULTS

Unit and integration testing verified calculation boundaries, database persistence, and PDF output. All modules successfully compiled and operated under target loads:
* **Sizing Calculators:** Computed precise decimals under multiple configurations.
* **Input Validation:** Intercepted incomplete phone numbers and negative length variables.
* **PDF Vector Generators:** Aligned tables and financial rows accurately across standard layouts.

---

## CHAPTER 8: IMPLEMENTATION NOTES

### 8.1 Problems Faced
1. **Dynamic Scaling of Canvas:** Traditional canvas exports lose vector resolution when resized.
   * *Solution:* Built clean vector SVG layout schematics which scale responsively in the DOM.
2. **Asynchronous PDF Generation:** Bulky client libraries freeze main-thread browser rendering.
   * *Solution:* Implemented lightweight, declarative layouts using jsPDF on the client-side, and ReportLab flowables on the Flask backend.

### 8.2 Lessons Learned
* **Agile Scope Control:** Isolating features to a single, high-fidelity view boosts overall quality.
* **Apple Hig Styling:** Relying on whitespace and solid font pairings creates a premium feel without over-complicating.

---

## CHAPTER 9: FUTURE ENHANCEMENTS

1. **3D Virtual Canvas:** Integrate Three.js to provide interactive 3D visualizations of cabinets.
2. **AI Layout Recommendation:** Train neural models to suggest cabinets and layouts based on window orientations.
3. **Multi-Store Franchising:** Introduce cloud tenant isolation so kitchen brands can scale multiple franchises.
4. **IoT Measurement Scanners:** Wire laser Bluetooth sizing meters to capture measurements directly.
