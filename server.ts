import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Dynamically load Firebase Admin credentials to prevent build errors on deployment platforms (e.g. Netlify, Vercel)
let serviceAccount: any = null;

const serviceAccountPath = path.join(process.cwd(), "service-account.json");
if (fs.existsSync(serviceAccountPath)) {
  try {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  } catch (err) {
    console.error("Failed to parse service-account.json:", err);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env variable as JSON:", err);
  }
} else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

const DB_FILE = path.join(process.cwd(), "database_store.json");

// Helper to initialize database with default data
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultDb = {
      users: [
        { id: 1, username: "admin", password: "admin123" }
      ],
      customers: [
        { customer_id: 1, name: "Vinit Jasani", phone: "9876543210", email: "vinit@example.com", address: "Mumbai, Maharashtra" },
        { customer_id: 2, name: "Ananya Sharma", phone: "8765432109", email: "ananya@example.com", address: "Bengaluru, Karnataka" }
      ],
      materials: [
        { material_id: 1, name: "MDF", rate: 1200, image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&h=300&q=80" },
        { material_id: 2, name: "Marine Plywood", rate: 1800, image: "https://images.unsplash.com/photo-1541123437800-1bb1317babca?auto=format&fit=crop&w=400&h=300&q=80" },
        { material_id: 3, name: "BWR Plywood", rate: 2200, image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&h=300&q=80" },
        { material_id: 4, name: "Acrylic Finish", rate: 2500, image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&h=300&q=80" }
      ],
      estimates: [
        {
          estimate_id: 1,
          customer_id: 1,
          material_id: 3,
          length: 10,
          width: 8,
          layout_type: "L Shape Kitchen",
          area: 80,
          material_cost: 176000,
          gst: 31680,
          total_cost: 207680,
          created_date: "2026-06-28"
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
  }
}

// Read database helper
function readDb() {
  initDatabase();
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading database file", e);
    return { users: [], customers: [], materials: [], estimates: [] };
  }
}

// Write database helper
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing database file", e);
  }
}

// --- Firestore Helper Functions ---
async function getAllFromCollection(firestoreDb: any, collectionName: string) {
  const snap = await firestoreDb.collection(collectionName).get();
  const items: any[] = [];
  snap.forEach((doc: any) => {
    items.push(doc.data());
  });
  return items;
}

async function seedDatabase(firestoreDb: any) {
  const usersSnap = await firestoreDb.collection("users").get();
  if (usersSnap.empty) {
    console.log("Seeding default database into Firestore...");
    // Seed user
    await firestoreDb.collection("users").doc("admin").set({ username: "admin", password: "admin123" });

    // Seed customers
    const defaultCustomers = [
      { customer_id: 1, name: "Vinit Jasani", phone: "9876543210", email: "vinit@example.com", address: "Mumbai, Maharashtra" },
      { customer_id: 2, name: "Ananya Sharma", phone: "8765432109", email: "ananya@example.com", address: "Bengaluru, Karnataka" }
    ];
    for (const c of defaultCustomers) {
      await firestoreDb.collection("customers").doc(String(c.customer_id)).set(c);
    }

    // Seed materials
    const defaultMaterials = [
      { material_id: 1, name: "MDF", rate: 1200, image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&h=300&q=80" },
      { material_id: 2, name: "Marine Plywood", rate: 1800, image: "https://images.unsplash.com/photo-1541123437800-1bb1317babca?auto=format&fit=crop&w=400&h=300&q=80" },
      { material_id: 3, name: "BWR Plywood", rate: 2200, image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&h=300&q=80" },
      { material_id: 4, name: "Acrylic Finish", rate: 2500, image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&h=300&q=80" }
    ];
    for (const m of defaultMaterials) {
      await firestoreDb.collection("materials").doc(String(m.material_id)).set(m);
    }

    // Seed estimates
    const defaultEstimates = [
      {
        estimate_id: 1,
        customer_id: 1,
        material_id: 3,
        length: 10,
        width: 8,
        layout_type: "L Shape Kitchen",
        area: 80,
        material_cost: 176000,
        gst: 31680,
        total_cost: 207680,
        created_date: "2026-06-28"
      }
    ];
    for (const e of defaultEstimates) {
      await firestoreDb.collection("estimates").doc(String(e.estimate_id)).set(e);
    }
    console.log("Database seeded successfully!");
  }
}

async function startServer() {
  // Initialize Firebase using applet configuration
  let firestoreDb: any;
  try {
      const firebaseApp = getApps().length === 0
        ? initializeApp({
            credential: cert(serviceAccount as any),
          })
        : getApp();

      firestoreDb = getFirestore(firebaseApp);

      await seedDatabase(firestoreDb);
      console.log("✅ Firebase connected successfully!");
    } catch (err) {
      console.error("❌ Firebase init failed:", err);
  }

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Auth: Login
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!firestoreDb) {
        // Fallback for safety
        if (username === "admin" && password === "admin123") {
          return res.json({ success: true, token: "session_token_admin_kitchencraft", username: "admin" });
        }
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const users = await getAllFromCollection(firestoreDb, "users");
      const user = users.find(
        (u: any) => u.username === username && u.password === password
      );

      if (user) {
        res.json({ success: true, token: "session_token_admin_kitchencraft", username: user.username });
      } else {
        res.status(401).json({ success: false, message: "Invalid username or password" });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Customers API
  app.get("/api/customers", async (req, res) => {
    try {
      if (!firestoreDb) {
        const db = readDb();
        return res.json(db.customers);
      }
      const customers = await getAllFromCollection(firestoreDb, "customers");
      customers.sort((a, b) => a.customer_id - b.customer_id);
      res.json(customers);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const { name, phone, email, address } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ error: "Name and Phone are required" });
      }

      if (!firestoreDb) {
        const db = readDb();
        const newId = db.customers.length > 0 ? Math.max(...db.customers.map((c: any) => c.customer_id)) + 1 : 1;
        const newCustomer = { customer_id: newId, name, phone, email: email || "", address: address || "" };
        db.customers.push(newCustomer);
        writeDb(db);
        return res.json(newCustomer);
      }

      const customers = await getAllFromCollection(firestoreDb, "customers");
      const newId = customers.length > 0 ? Math.max(...customers.map((c: any) => c.customer_id)) + 1 : 1;
      const newCustomer = { customer_id: newId, name, phone, email: email || "", address: address || "" };
      
      await firestoreDb.collection("customers").doc(String(newId)).set(newCustomer);
      res.json(newCustomer);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, phone, email, address } = req.body;

      if (!firestoreDb) {
        const db = readDb();
        const index = db.customers.findIndex((c: any) => c.customer_id === id);
        if (index === -1) {
          return res.status(404).json({ error: "Customer not found" });
        }
        db.customers[index] = { ...db.customers[index], name, phone, email, address };
        writeDb(db);
        return res.json(db.customers[index]);
      }

      const docRef = firestoreDb.collection("customers").doc(String(id));
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const updatedCustomer = { ...docSnap.data(), name, phone, email, address };
      await docRef.set(updatedCustomer);
      res.json(updatedCustomer);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (!firestoreDb) {
        const db = readDb();
        const filteredCustomers = db.customers.filter((c: any) => c.customer_id !== id);
        const filteredEstimates = db.estimates.filter((e: any) => e.customer_id !== id);
        db.customers = filteredCustomers;
        db.estimates = filteredEstimates;
        writeDb(db);
        return res.json({ success: true, message: "Customer and their estimates deleted successfully" });
      }

      await firestoreDb.collection("customers").doc(String(id)).delete();
      const estimates = await getAllFromCollection(firestoreDb, "estimates");
      const estimatesToDelete = estimates.filter((e: any) => e.customer_id === id);
      for (const est of estimatesToDelete) {
        await firestoreDb.collection("estimates").doc(String(est.estimate_id)).delete();
      }
      res.json({ success: true, message: "Customer and their estimates deleted successfully" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Materials API
  app.get("/api/materials", async (req, res) => {
    try {
      if (!firestoreDb) {
        const db = readDb();
        return res.json(db.materials);
      }
      const materials = await getAllFromCollection(firestoreDb, "materials");
      materials.sort((a, b) => a.material_id - b.material_id);
      res.json(materials);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      const { name, rate, image } = req.body;
      if (!name || isNaN(parseFloat(rate))) {
        return res.status(400).json({ error: "Valid Name and Rate are required" });
      }

      if (!firestoreDb) {
        const db = readDb();
        const newId = db.materials.length > 0 ? Math.max(...db.materials.map((m: any) => m.material_id)) + 1 : 1;
        const newMaterial = { material_id: newId, name, rate: parseFloat(rate), image: image || "" };
        db.materials.push(newMaterial);
        writeDb(db);
        return res.json(newMaterial);
      }

      const materials = await getAllFromCollection(firestoreDb, "materials");
      const newId = materials.length > 0 ? Math.max(...materials.map((m: any) => m.material_id)) + 1 : 1;
      const newMaterial = { material_id: newId, name, rate: parseFloat(rate), image: image || "" };
      
      await firestoreDb.collection("materials").doc(String(newId)).set(newMaterial);
      res.json(newMaterial);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, rate, image } = req.body;

      if (!firestoreDb) {
        const db = readDb();
        const index = db.materials.findIndex((m: any) => m.material_id === id);
        if (index === -1) {
          return res.status(404).json({ error: "Material not found" });
        }
        db.materials[index] = { ...db.materials[index], name, rate: parseFloat(rate), image: image || "" };
        writeDb(db);
        return res.json(db.materials[index]);
      }

      const docRef = firestoreDb.collection("materials").doc(String(id));
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: "Material not found" });
      }
      const updatedMaterial = { ...docSnap.data(), name, rate: parseFloat(rate), image: image || "" };
      await docRef.set(updatedMaterial);
      res.json(updatedMaterial);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (!firestoreDb) {
        const db = readDb();
        db.materials = db.materials.filter((m: any) => m.material_id !== id);
        writeDb(db);
        return res.json({ success: true, message: "Material deleted successfully" });
      }

      await firestoreDb.collection("materials").doc(String(id)).delete();
      res.json({ success: true, message: "Material deleted successfully" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Estimates API
  app.get("/api/estimates", async (req, res) => {
    try {
      if (!firestoreDb) {
        const db = readDb();
        const populatedEstimates = db.estimates.map((e: any) => {
          const customer = db.customers.find((c: any) => c.customer_id === e.customer_id);
          const material = db.materials.find((m: any) => m.material_id === e.material_id);
          return {
            ...e,
            customer_name: customer ? customer.name : "Unknown Customer",
            customer_email: customer ? customer.email : "",
            customer_phone: customer ? customer.phone : "",
            customer_address: customer ? customer.address : "",
            material_name: material ? material.name : "Unknown Material",
            material_rate: material ? material.rate : 0
          };
        });
        return res.json(populatedEstimates);
      }

      const estimates = await getAllFromCollection(firestoreDb, "estimates");
      const customers = await getAllFromCollection(firestoreDb, "customers");
      const materials = await getAllFromCollection(firestoreDb, "materials");

      const populatedEstimates = estimates.map((e: any) => {
        const customer = customers.find((c: any) => c.customer_id === e.customer_id);
        const material = materials.find((m: any) => m.material_id === e.material_id);
        return {
          ...e,
          customer_name: customer ? customer.name : "Unknown Customer",
          customer_email: customer ? customer.email : "",
          customer_phone: customer ? customer.phone : "",
          customer_address: customer ? customer.address : "",
          material_name: material ? material.name : "Unknown Material",
          material_rate: material ? material.rate : 0
        };
      });
      populatedEstimates.sort((a: any, b: any) => b.estimate_id - a.estimate_id);
      res.json(populatedEstimates);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/estimates", async (req, res) => {
    try {
      const { customer_id, material_id, length, width, layout_type } = req.body;
      if (!customer_id || !material_id || isNaN(parseFloat(length)) || isNaN(parseFloat(width)) || !layout_type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const custIdInt = parseInt(customer_id);
      const matIdInt = parseInt(material_id);

      if (!firestoreDb) {
        const db = readDb();
        const customer = db.customers.find((c: any) => c.customer_id === custIdInt);
        const material = db.materials.find((m: any) => m.material_id === matIdInt);
        if (!customer || !material) {
          return res.status(400).json({ error: "Customer or Material not found" });
        }
        const lVal = parseFloat(length);
        const wVal = parseFloat(width);
        const area = lVal * wVal;
        const material_cost = area * material.rate;
        const gst = material_cost * 0.18;
        const total_cost = material_cost + gst;

        const newId = db.estimates.length > 0 ? Math.max(...db.estimates.map((e: any) => e.estimate_id)) + 1 : 1;
        const todayStr = new Date().toISOString().split("T")[0];

        const newEstimate = {
          estimate_id: newId,
          customer_id: custIdInt,
          material_id: matIdInt,
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
        return res.json({
          ...newEstimate,
          customer_name: customer.name,
          material_name: material.name,
          material_rate: material.rate
        });
      }

      const customerDoc = await firestoreDb.collection("customers").doc(String(custIdInt)).get();
      const materialDoc = await firestoreDb.collection("materials").doc(String(matIdInt)).get();

      if (!customerDoc.exists || !materialDoc.exists) {
        return res.status(400).json({ error: "Customer or Material not found" });
      }

      const customer = customerDoc.data();
      const material = materialDoc.data();

      const lVal = parseFloat(length);
      const wVal = parseFloat(width);
      const area = lVal * wVal;
      const material_cost = area * material.rate;
      const gst = material_cost * 0.18;
      const total_cost = material_cost + gst;

      const estimates = await getAllFromCollection(firestoreDb, "estimates");
      const newId = estimates.length > 0 ? Math.max(...estimates.map((e: any) => e.estimate_id)) + 1 : 1;
      const todayStr = new Date().toISOString().split("T")[0];

      const newEstimate = {
        estimate_id: newId,
        customer_id: custIdInt,
        material_id: matIdInt,
        length: lVal,
        width: wVal,
        layout_type,
        area,
        material_cost,
        gst,
        total_cost,
        created_date: todayStr
      };

      await firestoreDb.collection("estimates").doc(String(newId)).set(newEstimate);

      res.json({
        ...newEstimate,
        customer_name: customer.name,
        material_name: material.name,
        material_rate: material.rate
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get single estimate details publicly for shareable link
  app.get("/api/share/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid estimate ID" });
      }

      if (!firestoreDb) {
        const db = readDb();
        const est = db.estimates.find((e: any) => e.estimate_id === id);
        if (!est) {
          return res.status(404).json({ error: "Estimate not found" });
        }
        const customer = db.customers.find((c: any) => c.customer_id === est.customer_id);
        const material = db.materials.find((m: any) => m.material_id === est.material_id);
        return res.json({
          ...est,
          customer_name: customer ? customer.name : "Unknown Customer",
          customer_email: customer ? customer.email : "",
          customer_phone: customer ? customer.phone : "",
          customer_address: customer ? customer.address : "",
          material_name: material ? material.name : "Unknown Material",
          material_rate: material ? material.rate : 0
        });
      }

      const estDoc = await firestoreDb.collection("estimates").doc(String(id)).get();
      if (!estDoc.exists) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      const est = estDoc.data();

      const customerDoc = await firestoreDb.collection("customers").doc(String(est.customer_id)).get();
      const materialDoc = await firestoreDb.collection("materials").doc(String(est.material_id)).get();

      const customer = customerDoc.exists ? customerDoc.data() : null;
      const material = materialDoc.exists ? materialDoc.data() : null;

      res.json({
        ...est,
        customer_name: customer ? customer.name : "Unknown Customer",
        customer_email: customer ? customer.email : "",
        customer_phone: customer ? customer.phone : "",
        customer_address: customer ? customer.address : "",
        material_name: material ? material.name : "Unknown Material",
        material_rate: material ? material.rate : 0
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update estimate design/blueprint specs publicly (real-time collaborative updates)
  app.put("/api/share/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid estimate ID" });
      }

      const { length, width, layout_type, material_id, appliances } = req.body;

      if (!firestoreDb) {
        const db = readDb();
        const estIndex = db.estimates.findIndex((e: any) => e.estimate_id === id);
        if (estIndex === -1) {
          return res.status(404).json({ error: "Estimate not found" });
        }
        
        const est = db.estimates[estIndex];
        const matId = material_id ? parseInt(material_id) : est.material_id;
        const material = db.materials.find((m: any) => m.material_id === matId);
        if (!material) {
          return res.status(400).json({ error: "Material not found" });
        }

        const lVal = length !== undefined ? parseFloat(length) : est.length;
        const wVal = width !== undefined ? parseFloat(width) : est.width;
        const layout = layout_type || est.layout_type;

        const area = lVal * wVal;
        const material_cost = area * material.rate;
        const gst = material_cost * 0.18;
        const total_cost = material_cost + gst;

        const updatedEstimate = {
          ...est,
          length: lVal,
          width: wVal,
          layout_type: layout,
          material_id: matId,
          area,
          material_cost,
          gst,
          total_cost,
          appliances: appliances || est.appliances || []
        };

        db.estimates[estIndex] = updatedEstimate;
        writeDb(db);

        const customer = db.customers.find((c: any) => c.customer_id === est.customer_id);

        return res.json({
          ...updatedEstimate,
          customer_name: customer ? customer.name : "Unknown Customer",
          customer_email: customer ? customer.email : "",
          customer_phone: customer ? customer.phone : "",
          customer_address: customer ? customer.address : "",
          material_name: material.name,
          material_rate: material.rate
        });
      }

      const estRef = firestoreDb.collection("estimates").doc(String(id));
      const estDoc = await estRef.get();
      if (!estDoc.exists) {
        return res.status(404).json({ error: "Estimate not found" });
      }
      const est = estDoc.data();

      const matId = material_id ? parseInt(material_id) : est.material_id;
      const materialDoc = await firestoreDb.collection("materials").doc(String(matId)).get();
      if (!materialDoc.exists) {
        return res.status(400).json({ error: "Material not found" });
      }
      const material = materialDoc.data();

      const lVal = length !== undefined ? parseFloat(length) : est.length;
      const wVal = width !== undefined ? parseFloat(width) : est.width;
      const layout = layout_type || est.layout_type;

      const area = lVal * wVal;
      const material_cost = area * material.rate;
      const gst = material_cost * 0.18;
      const total_cost = material_cost + gst;

      const updatedEstimate = {
        ...est,
        length: lVal,
        width: wVal,
        layout_type: layout,
        material_id: matId,
        area,
        material_cost,
        gst,
        total_cost,
        appliances: appliances || est.appliances || []
      };

      await estRef.set(updatedEstimate);

      const customerDoc = await firestoreDb.collection("customers").doc(String(est.customer_id)).get();
      const customer = customerDoc.exists ? customerDoc.data() : null;

      res.json({
        ...updatedEstimate,
        customer_name: customer ? customer.name : "Unknown Customer",
        customer_email: customer ? customer.email : "",
        customer_phone: customer ? customer.phone : "",
        customer_address: customer ? customer.address : "",
        material_name: material.name,
        material_rate: material.rate
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/estimates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (!firestoreDb) {
        const db = readDb();
        db.estimates = db.estimates.filter((e: any) => e.estimate_id !== id);
        writeDb(db);
        return res.json({ success: true, message: "Estimate deleted successfully" });
      }

      await firestoreDb.collection("estimates").doc(String(id)).delete();
      res.json({ success: true, message: "Estimate deleted successfully" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");[cite: 1]
    app.use(express.static(distPath));[cite: 1]
  
    // Make sure this is a catch-all (*) wildcard so React Router can handle nested links
    app.get("*", (req, res) => {[cite: 1]
    res.sendFile(path.join(distPath, "index.html"));[cite: 1]
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KitchenCraft server running on http://localhost:${PORT}`);
  });
}

startServer();
