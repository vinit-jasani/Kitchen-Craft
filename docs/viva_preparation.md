# KitchenCraft Viva-Voce Preparation Guide
### 50 Questions & Answers for MCA Project Defense

---

## SECTION 1: SYSTEM ARCHITECTURE & DESIGN (Q1 - Q15)

#### Q1: What is KitchenCraft?
**A:** KitchenCraft is a premium full-stack modular kitchen cost estimation system. It automates dimension calculations, manages customer records, and generates official, tax-compliant PDF quotations for modular kitchen manufacturers.

#### Q2: What technology stack is used in this project?
**A:** The project is designed with a modern, dual-capable stack:
1. **React SPA** with **Tailwind CSS v4** and **Express.js API** on port 3000 (running live in AI Studio).
2. **Python Flask** with **Bootstrap 5** and **SQLite** as a standalone, offline-ready desktop alternative.

#### Q3: Why did you choose SQLite as the database?
**A:** SQLite is a lightweight, serverless, self-contained relational database that stores data in a single file on disk. It is ideal for local business apps, requires zero administrative setup, and is fast for read-intensive tasks.

#### Q4: How is the "Apple-Inspired Design System" implemented?
**A:** We followed Apple’s Human Interface Guidelines (HIG):
* High ratio of neutral whitespace (negative space).
* A clean light color palette (#F5F5F7 backdrops, high-contrast text).
* Glassmorphic menus (`backdrop-filter: blur`).
* High rounded corners (`rounded-3xl` or 24px) and soft shadows.

#### Q5: How many tables are there in your database schema? Name them.
**A:** There are four tables: `users`, `customers`, `materials`, and `estimates`.

#### Q6: Explain the relationship between the `customers` and `estimates` tables.
**A:** It is a **one-to-many** relationship. One customer can have multiple estimates over time. This is represented by storing the `customer_id` as a foreign key in the `estimates` table.

#### Q7: What is the purpose of cascading deletes in the schema?
**A:** Cascading deletes (`ON DELETE CASCADE`) ensure database referential integrity. If a customer is deleted, all their corresponding records in the `estimates` table are automatically removed, preventing orphaned records.

#### Q8: How is the area of a modular kitchen calculated?
**A:** Area is calculated as `Length × Width` of the kitchen counters (in square feet).

#### Q9: What is the pricing calculation formula?
**A:** 
1. `Material Cost = Area × Material Sq-Ft Rate`
2. `GST Tax = Material Cost × 18%`
3. `Grand Total = Material Cost + GST`

#### Q10: How does the "Live Cost Preview" work?
**A:** It listens to input changes (range sliders or dropdowns) and recalculates the area, cost, tax, and total instantly in real-time, updating the UI elements dynamically.

#### Q11: How is the PDF quotation generated?
**A:**
* **React Frontend:** Generates high-resolution client-side vector PDFs using `jsPDF`.
* **Flask Backend:** Generates A4 PDFs using Python's `ReportLab` flowables buffer.

#### Q12: Why is the backend PDF generated in-memory instead of saving to disk?
**A:** Creating PDFs in-memory (using `io.BytesIO()`) prevents disk write fatigue, guarantees security, and allows fast data delivery directly to the client browser.

#### Q13: Explain the structure of the modular project directory.
**A:** It separates views and configurations:
* `server.ts`/`app.py`: Backend REST servers.
* `src/components/`/`templates/`: UI layouts.
* `src/types.ts`: TypeScript data models.
* `database_store.json`/`database.db`: Core database stores.

#### Q14: How does the system handle session security?
**A:**
* **Node App:** Generates a secure authentication token saved in `localStorage`.
* **Flask App:** Employs cryptographically signed cookie sessions (`session["user"]`).

#### Q15: What layout shapes does your system support?
**A:** Straight Kitchen, L-Shape Kitchen, U-Shape Kitchen, and Parallel Kitchen.

---

## SECTION 2: FRONTEND & CLIENT-SIDE LOGIC (Q16 - Q30)

#### Q16: What is a Single Page Application (SPA)?
**A:** An SPA loads a single HTML document and dynamically updates content as the user interacts with the app, offering smoother desktop-like navigation compared to standard multi-page sites.

#### Q17: Why did you use Tailwind CSS over standard CSS?
**A:** Tailwind CSS is a utility-first CSS framework that compiles highly optimized styles and supports rapid, responsive layout creation.

#### Q18: What are React hooks? Which ones did you use?
**A:** React Hooks are functions that let you tap into React state and lifecycle features. We used `useState` for UI state, `useEffect` for data syncing, and `useMemo` for real-time calculations.

#### Q19: Why did you use `useMemo` for calculations in Estimate Studio?
**A:** `useMemo` memoizes computed calculation values, ensuring values are only recalculated when their specific dependencies (length, width, or material rate) change.

#### Q20: What is the purpose of the key prop in React lists?
**A:** The `key` prop helps React identify which items have changed, been added, or been removed, optimizing list rendering.

#### Q21: How are responsive viewports managed in Tailwind?
**A:** By using responsive prefixes like `sm:`, `md:`, and `lg:`, Tailwind dynamically applies different CSS classes based on the screen width.

#### Q22: What are "controlled components" in React forms?
**A:** Components where form input values are driven and synchronized by React state (e.g., `value={username} onChange={(e) => setUsername(e.target.value)}`).

#### Q23: How do you handle phone number validation?
**A:** We strip non-numeric characters using Regex (`replace(/\D/g, "")`) and restrict the field to exactly 10 digits before form submission.

#### Q24: What is `localStorage` used for?
**A:** It persistently stores the user's login session token in the client browser, keeping them signed in even after a page refresh.

#### Q25: How do you prevent layout shift during loading?
**A:** By using skeleton containers and static heights for cards and menus.

#### Q26: What are Lucide-React icons?
**A:** A modern, lightweight, open-source vector icon library designed for React.

#### Q27: How does the custom SVG layout rendering work?
**A:** It renders responsive vector SVG shapes representing different kitchen counter shapes (L, U, straight) based on the user's selected configuration.

#### Q28: How does client-side printing work?
**A:** It utilizes the browser's native `window.print()` or opens a temporary Blob URL with the generated PDF.

#### Q29: What is the difference between client-side and server-side routing?
**A:** Client-side routing intercepts URL changes to swap components instantly, whereas server-side routing requests a new page from the server on every link click.

#### Q30: What is the purpose of the `base.html` template in Flask?
**A:** It acts as a master skeleton containing the shared layout (head, styles, navbar, footer) so other pages can inherit and insert their specific content blocks.

---

## SECTION 3: BACKEND, DATABASE, & SECURITY (Q31 - Q50)

#### Q31: What is Flask?
**A:** Flask is a minimalist, WSGI web application framework written in Python. It provides the core tools needed to build lightweight, fast web servers.

#### Q32: What is the role of `app.secret_key` in Flask?
**A:** It is used to securely sign session cookies, preventing users from tampering with cookie data on the client side.

#### Q33: How does SQLite map tables without a standalone server?
**A:** SQLite is embedded directly into the application process. It reads and writes data directly to a local file (e.g., `database.db`).

#### Q34: What is the difference between `CHAR` and `VARCHAR`/`TEXT` in databases?
**A:** `CHAR` stores fixed-length strings (padded with spaces), while `VARCHAR` and `TEXT` dynamically allocate storage based on string length, saving disk space.

#### Q35: What is a foreign key constraint?
**A:** A constraint that links a column in one table (e.g., `customer_id` in `estimates`) to the primary key of another table, ensuring data integrity across tables.

#### Q36: How does the system prevent SQL injection?
**A:** By using parameterized SQL queries with placeholders (e.g., `execute("SELECT * FROM users WHERE username = ?", (username,))`) instead of raw string concatenation.

#### Q37: What is an ORM? Did you use one?
**A:** An Object-Relational Mapper maps database tables to classes. For simplicity and academic evaluation, we wrote raw parameterized SQL queries, which are faster and demonstrate a strong understanding of database mechanics.

#### Q38: What are DDL and DML SQL statements?
**A:**
* **DDL (Data Definition Language):** Statements like `CREATE TABLE` that define the database structure.
* **DML (Data Manipulation Language):** Statements like `INSERT`, `UPDATE`, and `DELETE` that modify table data.

#### Q39: What is a REST API?
**A:** Representational State Transfer. A standard architectural style for designing networked applications over HTTP using standard methods (GET, POST, PUT, DELETE).

#### Q40: What HTTP methods are used in your Customer API endpoints?
**A:**
* `GET /api/customers`: Retrieve all customers.
* `POST /api/customers`: Create a new customer.
* `PUT /api/customers/:id`: Update customer details.
* `DELETE /api/customers/:id`: Delete a customer.

#### Q41: What does `process.env.NODE_ENV` represent?
**A:** An environment variable that indicates whether the application is running in "development" or "production" mode.

#### Q42: What is the purpose of Vite middleware in the server?
**A:** In development mode, Vite intercepts requests to compile and serve React files dynamically. In production, the server simply serves static built assets.

#### Q43: What is esbuild?
**A:** A fast bundler used to compile our TypeScript server file (`server.ts`) into a single, optimized production file (`server.cjs`).

#### Q44: What are the benefits of using an in-memory BytesIO buffer for PDF generation?
**A:** It is highly efficient, runs entirely in RAM, avoids creating temp files on disk, and speeds up direct HTTP downloads.

#### Q45: How does the system handle database migrations?
**A:** On startup, the system checks if the database file exists. If missing, it automatically creates the tables and seeds them with default values.

#### Q46: What is a relational database index?
**A:** A database structure that speeds up search queries on specific columns at the cost of slightly slower write operations.

#### Q47: What does the code `conn.row_factory = sqlite3.Row` do in Flask?
**A:** It configures SQLite to return query rows as dictionary-like objects, allowing columns to be accessed by name (e.g., `row["name"]`) instead of index numbers.

#### Q48: How is input sanitation handled on the server?
**A:** The server validates that required fields exist, parses numbers safely, and handles malformed payloads gracefully without crashing.

#### Q49: What is dynamic UI synchronization?
**A:** The frontend queries the backend APIs for updates whenever a change is made (e.g., adding a customer), keeping the user interface perfectly in sync with the database.

#### Q50: How can this estimation system scale in the future?
**A:** We could integrate 3D kitchen design tools using WebGL/Three.js, add multi-currency support, or build automated customer portals for project tracking.
