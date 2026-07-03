import os
import sqlite3
from datetime import datetime
from flask import Flask, render_init, render_template, request, redirect, url_for, session, jsonify, send_file
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
import io

app = Flask(__name__)
app.secret_key = "kitchencraft_secure_secret_session_key_mca"
DATABASE = "database.db"

# Database connection helper
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Database schema initialization
def init_db():
    if not os.path.exists(DATABASE):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # TABLE 1: users
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        
        # TABLE 2: customers
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customers (
                customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                address TEXT
            )
        ''')
        
        # TABLE 3: materials
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS materials (
                material_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                rate REAL NOT NULL
            )
        ''')
        
        # TABLE 4: estimates
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS estimates (
                estimate_id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                material_id INTEGER NOT NULL,
                length REAL NOT NULL,
                width REAL NOT NULL,
                area REAL NOT NULL,
                layout_type TEXT NOT NULL,
                material_cost REAL NOT NULL,
                gst REAL NOT NULL,
                total_cost REAL NOT NULL,
                created_date TEXT NOT NULL,
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
                FOREIGN KEY (material_id) REFERENCES materials(material_id)
            )
        ''')
        
        # Seed Default Admin Account
        cursor.execute("INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)", ("admin", "admin123"))
        
        # Seed Default Sample Materials
        cursor.execute("INSERT OR IGNORE INTO materials (name, rate) VALUES (?, ?)", ("MDF", 1200))
        cursor.execute("INSERT OR IGNORE INTO materials (name, rate) VALUES (?, ?)", ("Marine Plywood", 1800))
        cursor.execute("INSERT OR IGNORE INTO materials (name, rate) VALUES (?, ?)", ("BWR Plywood", 2200))
        cursor.execute("INSERT OR IGNORE INTO materials (name, rate) VALUES (?, ?)", ("Acrylic Finish", 2500))
        
        # Seed Sample Customers
        cursor.execute("INSERT OR IGNORE INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)", 
                       ("Vinit Jasani", "9876543210", "vinit@example.com", "Mumbai, Maharashtra"))
        cursor.execute("INSERT OR IGNORE INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)", 
                       ("Ananya Sharma", "8765432109", "ananya@example.com", "Bengaluru, Karnataka"))

        conn.commit()
        conn.close()

# Ensure DB initialized
init_db()

# --- AUTH MIDDLEWARE DECORATOR ---
def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function

# --- CONTROLLER ROUTES ---

@app.route("/")
def home():
    if "user" in session:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))

# login
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password)).fetchone()
        conn.close()
        
        if user:
            session["user"] = username
            return redirect(url_for("dashboard"))
        else:
            return render_template("login.html", error="Invalid username or password.")
            
    return render_template("login.html")

# logout
@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

# dashboard
@app.route("/dashboard")
@login_required
def dashboard():
    conn = get_db_connection()
    total_cust = conn.execute("SELECT COUNT(*) FROM customers").fetchone()[0]
    total_mat = conn.execute("SELECT COUNT(*) FROM materials").fetchone()[0]
    total_est = conn.execute("SELECT COUNT(*) FROM estimates").fetchone()[0]
    revenue = conn.execute("SELECT SUM(total_cost) FROM estimates").fetchone()[0] or 0.0
    
    recent_estimates = conn.execute('''
        SELECT e.*, c.name as customer_name 
        FROM estimates e
        JOIN customers c ON e.customer_id = c.customer_id
        ORDER BY e.estimate_id DESC LIMIT 4
    ''').fetchall()
    
    conn.close()
    
    return render_template("dashboard.html", 
                           total_customers=total_cust, 
                           total_materials=total_mat, 
                           total_estimates=total_est, 
                           revenue=revenue,
                           recent_estimates=recent_estimates)

# customers CRUD
@app.route("/customers")
@login_required
def customers():
    search = request.args.get("search", "")
    conn = get_db_connection()
    if search:
        customers_list = conn.execute(
            "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?", 
            (f"%{search}%", f"%{search}%", f"%{search}%")
        ).fetchall()
    else:
        customers_list = conn.execute("SELECT * FROM customers").fetchall()
    conn.close()
    return render_template("customers.html", customers=customers_list, search=search)

@app.route("/add-customer", methods=["POST"])
@login_required
def add_customer():
    name = request.form.get("name")
    phone = request.form.get("phone")
    email = request.form.get("email")
    address = request.form.get("address")
    
    if name and phone:
        conn = get_db_connection()
        conn.execute("INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)", (name, phone, email, address))
        conn.commit()
        conn.close()
    return redirect(url_for("customers"))

@app.route("/edit-customer/<int:id>", methods=["POST"])
@login_required
def edit_customer(id):
    name = request.form.get("name")
    phone = request.form.get("phone")
    email = request.form.get("email")
    address = request.form.get("address")
    
    conn = get_db_connection()
    conn.execute("UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE customer_id = ?", 
                 (name, phone, email, address, id))
    conn.commit()
    conn.close()
    return redirect(url_for("customers"))

@app.route("/delete-customer/<int:id>")
@login_required
def delete_customer(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM customers WHERE customer_id = ?", (id,))
    # Also delete cascading estimates to maintain SQLite integrity
    conn.execute("DELETE FROM estimates WHERE customer_id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect(url_for("customers"))

# materials CRUD
@app.route("/materials")
@login_required
def materials():
    search = request.args.get("search", "")
    conn = get_db_connection()
    if search:
        materials_list = conn.execute("SELECT * FROM materials WHERE name LIKE ?", (f"%{search}%",)).fetchall()
    else:
        materials_list = conn.execute("SELECT * FROM materials").fetchall()
    conn.close()
    return render_template("materials.html", materials=materials_list, search=search)

@app.route("/add-material", methods=["POST"])
@login_required
def add_material():
    name = request.form.get("name")
    rate = request.form.get("rate")
    
    if name and rate:
        conn = get_db_connection()
        conn.execute("INSERT INTO materials (name, rate) VALUES (?, ?)", (name, float(rate)))
        conn.commit()
        conn.close()
    return redirect(url_for("materials"))

@app.route("/edit-material/<int:id>", methods=["POST"])
@login_required
def edit_material(id):
    name = request.form.get("name")
    rate = request.form.get("rate")
    
    if name and rate:
        conn = get_db_connection()
        conn.execute("UPDATE materials SET name = ?, rate = ? WHERE material_id = ?", (name, float(rate), id))
        conn.commit()
        conn.close()
    return redirect(url_for("materials"))

@app.route("/delete-material/<int:id>")
@login_required
def delete_material(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM materials WHERE material_id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect(url_for("materials"))

# estimate
@app.route("/estimate", methods=["GET", "POST"])
@login_required
def estimate():
    conn = get_db_connection()
    customers_list = conn.execute("SELECT * FROM customers").fetchall()
    materials_list = conn.execute("SELECT * FROM materials").fetchall()
    
    if request.method == "POST":
        customer_id = request.form.get("customer_id")
        material_id = request.form.get("material_id")
        length = float(request.form.get("length", 0))
        width = float(request.form.get("width", 0))
        layout_type = request.form.get("layout_type")
        
        material = conn.execute("SELECT * FROM materials WHERE material_id = ?", (material_id,)).fetchone()
        
        if material and customer_id:
            area = length * width
            material_cost = area * material["rate"]
            gst = material_cost * 0.18
            total_cost = material_cost + gst
            created_date = datetime.now().strftime("%Y-%m-%d")
            
            conn.execute('''
                INSERT INTO estimates (customer_id, material_id, length, width, area, layout_type, material_cost, gst, total_cost, created_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (customer_id, material_id, length, width, area, layout_type, material_cost, gst, total_cost, created_date))
            conn.commit()
            conn.close()
            return redirect(url_for("history"))
            
    conn.close()
    return render_template("estimate.html", customers=customers_list, materials=materials_list)

# history
@app.route("/history")
@login_required
def history():
    search = request.args.get("search", "")
    conn = get_db_connection()
    
    query = '''
        SELECT e.*, c.name as customer_name, m.name as material_name, m.rate as material_rate
        FROM estimates e
        JOIN customers c ON e.customer_id = c.customer_id
        JOIN materials m ON e.material_id = m.material_id
    '''
    
    if search:
        estimates_list = conn.execute(query + " WHERE c.name LIKE ? OR m.name LIKE ? OR e.layout_type LIKE ?", 
                                      (f"%{search}%", f"%{search}%", f"%{search}%")).fetchall()
    else:
        estimates_list = conn.execute(query + " ORDER BY e.estimate_id DESC").fetchall()
        
    conn.close()
    return render_template("history.html", estimates=estimates_list, search=search)

@app.route("/delete-estimate/<int:id>")
@login_required
def delete_estimate(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM estimates WHERE estimate_id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect(url_for("history"))

# PDF Generation via ReportLab
@app.route("/generate-pdf/<int:id>")
@login_required
def generate_pdf(id):
    conn = get_db_connection()
    est = conn.execute('''
        SELECT e.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address,
               m.name as material_name, m.rate as material_rate
        FROM estimates e
        JOIN customers c ON e.customer_id = c.customer_id
        JOIN materials m ON e.material_id = m.material_id
        WHERE e.estimate_id = ?
    ''', (id,)).fetchone()
    conn.close()
    
    if not est:
        return "Quotation not found", 404
        
    # Create ReportLab Document in Memory Buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom elegant styles for Apple-like invoice layout
    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#1D1D1F")
    )
    subtitle_style = ParagraphStyle(
        "InvoiceSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#6E6E73")
    )
    section_title = ParagraphStyle(
        "SectionTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1D1D1F")
    )
    regular_style = ParagraphStyle(
        "RegularText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1D1D1F")
    )
    bold_style = ParagraphStyle(
        "BoldText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1D1D1F")
    )
    
    # 1. Header Branded Title
    story.append(Paragraph("KitchenCraft", title_style))
    story.append(Paragraph("Smart Modular Kitchen Estimation Suite", subtitle_style))
    story.append(Spacer(1, 15))
    
    # 2. Metadata Columns Block
    meta_data = [
        [Paragraph(f"<b>Quotation Number:</b> KC-EST-{est['estimate_id']:04d}", regular_style), 
         Paragraph(f"<b>Quotation Date:</b> {est['created_date']}", regular_style)],
        [Paragraph("<b>Prepared By:</b> KitchenCraft Admin", regular_style), 
         Paragraph("<b>Terms:</b> Valid 30 Days", regular_style)]
    ]
    meta_table = Table(meta_data, colWidths=[90*mm, 80*mm])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    # 3. Customer Box
    story.append(Paragraph("CLIENT INFORMATION", section_title))
    story.append(Spacer(1, 4))
    
    cust_data = [
        [Paragraph(f"<b>Client Name:</b> {est['customer_name']}", regular_style), 
         Paragraph(f"<b>Phone:</b> +91 {est['customer_phone']}", regular_style)],
        [Paragraph(f"<b>Email:</b> {est['customer_email'] or '—'}", regular_style), 
         Paragraph(f"<b>Site Address:</b> {est['customer_address'] or '—'}", regular_style)]
    ]
    cust_table = Table(cust_data, colWidths=[80*mm, 90*mm])
    cust_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F5F5F7")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#D2D2D7")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(cust_table)
    story.append(Spacer(1, 20))
    
    # 4. Specifications Table
    story.append(Paragraph("KITCHEN SPECIFICATIONS & MATERIALS", section_title))
    story.append(Spacer(1, 6))
    
    spec_headers = [
        Paragraph("<b>Layout Shape</b>", regular_style), 
        Paragraph("<b>Material Grade</b>", regular_style), 
        Paragraph("<b>Dimensions</b>", regular_style), 
        Paragraph("<b>Total Area</b>", regular_style)
    ]
    spec_row = [
        Paragraph(est['layout_type'], regular_style),
        Paragraph(f"{est['material_name']} (₹{est['material_rate']}/sqft)", regular_style),
        Paragraph(f"{est['length']}ft x {est['width']}ft", regular_style),
        Paragraph(f"<b>{est['area']:.1f} sqft</b>", regular_style)
    ]
    spec_table_data = [spec_headers, spec_row]
    
    spec_table = Table(spec_table_data, colWidths=[45*mm, 55*mm, 35*mm, 35*mm])
    spec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1D1D1F")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('PADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D2D2D7")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    # For header textcolor trick
    for i in range(4):
        spec_table_data[0][i].style.textColor = colors.white
        
    story.append(spec_table)
    story.append(Spacer(1, 25))
    
    # 5. Financial Breakdown
    story.append(Paragraph("ESTIMATION BREAKDOWN", section_title))
    story.append(Spacer(1, 6))
    
    financials = [
        [Paragraph("Material Subtotal Cost", regular_style), Paragraph(f"INR {est['material_cost']:,.2f}", bold_style)],
        [Paragraph("GST Taxes (18.00%)", regular_style), Paragraph(f"INR {est['gst']:,.2f}", bold_style)],
        [Paragraph("<b>Grand Total (All-Inclusive)</b>", regular_style), Paragraph(f"<b>INR {est['total_cost']:,.2f}</b>", bold_style)]
    ]
    fin_table = Table(financials, colWidths=[110*mm, 60*mm])
    fin_table.setStyle(TableStyle([
        ('PADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,1), 0.5, colors.HexColor("#E8E8ED")),
        ('BACKGROUND', (0,2), (-1,2), colors.HexColor("#0071E3") if False else colors.HexColor("#F5F5F7")),
        ('LINEBELOW', (0,2), (-1,2), 1.5, colors.HexColor("#0071E3")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(fin_table)
    story.append(Spacer(1, 35))
    
    # 6. Signatures and Notes
    story.append(Paragraph("<b>Terms & Conditions:</b>", bold_style))
    story.append(Paragraph("1. Rates are valid for 30 days from proposal date.", subtitle_style))
    story.append(Paragraph("2. Cost includes modular shutters, carcasses, hinges, drawers and normal handles.", subtitle_style))
    story.append(Paragraph("3. Electric wiring, chimney hub cutout and granite slab cutting is extra.", subtitle_style))
    
    story.append(Spacer(1, 20))
    sig_data = [
        ["", Paragraph("________________________<br/><b>Authorized Signature</b><br/>KitchenCraft Systems", regular_style)]
    ]
    sig_table = Table(sig_data, colWidths=[100*mm, 70*mm])
    story.append(sig_table)
    
    doc.build(story)
    buffer.seek(0)
    
    return send_file(buffer, as_attachment=True, download_name=f"KitchenCraft_Quotation_EST-{est['estimate_id']}.pdf", mimetype="application/pdf")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
