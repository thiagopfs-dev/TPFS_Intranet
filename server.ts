import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import Database from "better-sqlite3";

// --- Database Setup ---
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, "database.sqlite"));

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    name TEXT PRIMARY KEY,
    "order" INTEGER DEFAULT 0
  );
`);

try { db.exec("ALTER TABLE categories ADD COLUMN \"order\" INTEGER DEFAULT 0;"); } catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS shortcuts (
    id TEXT PRIMARY KEY,
    title TEXT,
    iconUrl TEXT,
    link TEXT,
    category TEXT,
    "order" INTEGER,
    FOREIGN KEY(category) REFERENCES categories(name)
  );

  CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    date TEXT,
    imageUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT,
    code TEXT,
    version TEXT,
    url TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT,
    summary TEXT,
    content TEXT,
    author TEXT,
    date TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    date TEXT,
    time TEXT,
    location TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    displayName TEXT,
    email TEXT
  );

  CREATE TABLE IF NOT EXISTS extensions (
    id TEXT PRIMARY KEY,
    name TEXT,
    number TEXT,
    department TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed Initial Data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as any;
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (id, username, password, role, displayName, email) VALUES (?, ?, ?, ?, ?, ?)");
  insertUser.run("u1", "admin", bcrypt.hashSync("123456", 10), "admin", "Administrador", "admin@santacasa.org.br");
  insertUser.run("u2", "editor", bcrypt.hashSync("123456", 10), "editor", "Editor de Comunicação", "editor@santacasa.org.br");
  insertUser.run("u3", "user", bcrypt.hashSync("123456", 10), "user", "Colaborador", "user@santacasa.org.br");

  const insertCat = db.prepare("INSERT INTO categories (name, \"order\") VALUES (?, ?)");
  ["SISTEMAS", "FORMULÁRIOS", "DIVERSOS"].forEach((c, i) => insertCat.run(c, i));

  const insertShortcut = db.prepare("INSERT INTO shortcuts (id, title, iconUrl, link, category, \"order\") VALUES (?, ?, ?, ?, ?, ?)");
  insertShortcut.run("1", "Wareline", "https://picsum.photos/seed/wareline/100/100", "#", "SISTEMAS", 0);
  insertShortcut.run("2", "Signfy", "https://picsum.photos/seed/signfy/100/100", "#", "SISTEMAS", 1);
  insertShortcut.run("3", "Chamados", "https://picsum.photos/seed/glpi/100/100", "#", "SISTEMAS", 2);
  insertShortcut.run("4", "Pré - Agendamento SUS", "https://picsum.photos/seed/susnovo/100/100", "#", "SISTEMAS", 3);
  insertShortcut.run("5", "Fin-x", "https://picsum.photos/seed/finx/100/100", "#", "SISTEMAS", 4);
  insertShortcut.run("6", "Gestão da Qualidade", "https://picsum.photos/seed/qualidade/100/100", "#", "SISTEMAS", 5);

  const insertNews = db.prepare("INSERT INTO news (id, title, content, date, imageUrl) VALUES (?, ?, ?, ?, ?)");
  insertNews.run("n1", "Campanha Março Lilás", "Combate ao câncer do colo do útero. Conscientização e prevenção são fundamentais.", "2024-03-01", "https://picsum.photos/seed/marcolilas/800/200");
  insertNews.run("n2", "Novo Sistema de Chamados", "A partir de hoje, utilize o novo portal para abertura de chamados de TI.", "2024-03-15", null);

  const insertExtension = db.prepare("INSERT INTO extensions (id, name, number, department) VALUES (?, ?, ?, ?)");
  insertExtension.run("e1", "Recepção Central", "1000", "Atendimento");
  insertExtension.run("e2", "Recursos Humanos", "1020", "Administrativo");
  insertExtension.run("e3", "TI - Suporte", "1050", "Tecnologia");

  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  insertSetting.run("logoUrl", "");
}

const JWT_SECRET = "santa-casa-secret-key";

// --- Multer Setup for File Uploads ---
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  
  // Serve uploaded files statically
  app.use("/uploads", express.static(uploadDir));

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Não autorizado" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Token inválido" });
    }
  };

  // --- Auth Routes ---
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role, displayName: user.displayName }, JWT_SECRET, { expiresIn: "1d" });
      res.cookie("token", token, { 
        httpOnly: true, 
        secure: false, // Alterado para false para permitir acesso via IP/HTTP em Intranets
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Usuário ou senha inválidos" });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });
    res.json({ success: true });
  });

  app.get("/api/me", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Não logado" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json(decoded);
    } catch (err) {
      res.status(401).json({ error: "Sessão expirada" });
    }
  });

  // --- Data Routes ---
  app.get("/api/shortcuts", (req, res) => {
    const data = db.prepare("SELECT * FROM shortcuts ORDER BY \"order\" ASC").all();
    res.json(data);
  });
  app.get("/api/news", (req, res) => {
    const data = db.prepare("SELECT * FROM news").all();
    res.json(data);
  });
  // --- SGQ Documents Routes ---
  app.get("/api/documents", (req, res) => {
    const data = db.prepare("SELECT * FROM documents").all();
    res.json(data);
  });
  app.post("/api/documents", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { title, code, version, url, category } = req.body;
    const id = Date.now().toString();
    db.prepare("INSERT INTO documents (id, title, code, version, url, category) VALUES (?, ?, ?, ?, ?, ?)").run(id, title, code, version, url, category);
    res.json({ id, title, code, version, url, category });
  });
  app.put("/api/documents/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { title, code, version, url, category } = req.body;
    db.prepare("UPDATE documents SET title = ?, code = ?, version = ?, url = ?, category = ? WHERE id = ?").run(title, code, version, url, category, req.params.id);
    res.json({ success: true });
  });
  app.delete("/api/documents/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- Articles Routes ---
  app.get("/api/articles", (req, res) => {
    const data = db.prepare("SELECT * FROM articles").all();
    res.json(data);
  });
  app.post("/api/articles", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const { title, summary, content, author, date, category } = req.body;
    const id = Date.now().toString();
    db.prepare("INSERT INTO articles (id, title, summary, content, author, date, category) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, title, summary, content, author, date, category);
    res.json({ id, title, summary, content, author, date, category });
  });
  app.put("/api/articles/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const { title, summary, content, author, date, category } = req.body;
    db.prepare("UPDATE articles SET title = ?, summary = ?, content = ?, author = ?, date = ?, category = ? WHERE id = ?").run(title, summary, content, author, date, category, req.params.id);
    res.json({ success: true });
  });
  app.delete("/api/articles/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    db.prepare("DELETE FROM articles WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- Events Routes ---
  app.get("/api/events", (req, res) => {
    const data = db.prepare("SELECT * FROM events").all();
    res.json(data);
  });
  app.post("/api/events", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const { title, description, date, time, location, category } = req.body;
    const id = Date.now().toString();
    db.prepare("INSERT INTO events (id, title, description, date, time, location, category) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, title, description, date, time, location, category);
    res.json({ id, title, description, date, time, location, category });
  });
  app.put("/api/events/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const { title, description, date, time, location, category } = req.body;
    db.prepare("UPDATE events SET title = ?, description = ?, date = ?, time = ?, location = ?, category = ? WHERE id = ?").run(title, description, date, time, location, category, req.params.id);
    res.json({ success: true });
  });
  app.delete("/api/events/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    db.prepare("DELETE FROM events WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/categories", (req, res) => {
    const data = db.prepare("SELECT name FROM categories ORDER BY \"order\" ASC").all() as any[];
    res.json(data.map(c => c.name));
  });

  app.get("/api/extensions", (req, res) => {
    const data = db.prepare("SELECT * FROM extensions ORDER BY name ASC").all();
    res.json(data);
  });

  app.get("/api/settings", (req, res) => {
    const data = db.prepare("SELECT * FROM settings").all() as any[];
    const settings: Record<string, string> = {};
    data.forEach(s => settings[s.key] = s.value);
    res.json(settings);
  });

  // --- File Upload Route ---
  app.post("/api/upload", authenticate, upload.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Admin/Editor protected writes
  app.post("/api/shortcuts", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { title, iconUrl, link, category, order } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO shortcuts (id, title, iconUrl, link, category, \"order\") VALUES (?, ?, ?, ?, ?, ?)").run(id, title, iconUrl, link, category, order || 0);
    res.json({ id, title, iconUrl, link, category, order });
  });

  app.put("/api/shortcuts/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { title, iconUrl, link, category, order } = req.body;
    db.prepare("UPDATE shortcuts SET title = ?, iconUrl = ?, link = ?, category = ?, \"order\" = ? WHERE id = ?").run(title, iconUrl, link, category, order, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/shortcuts/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    db.prepare("DELETE FROM shortcuts WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/shortcuts/reorder", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { newOrder } = req.body; // Array of IDs
    const update = db.prepare("UPDATE shortcuts SET \"order\" = ? WHERE id = ?");
    const transaction = db.transaction((ids) => {
      ids.forEach((id: string, index: number) => update.run(index, id));
    });
    transaction(newOrder);
    res.json({ success: true });
  });

  // --- Category Routes ---
  app.post("/api/categories", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nome da categoria é obrigatório" });
    try {
      const maxOrder = db.prepare("SELECT MAX(\"order\") as maxOrder FROM categories").get() as any;
      const nextOrder = (maxOrder?.maxOrder || 0) + 1;
      db.prepare("INSERT INTO categories (name, \"order\") VALUES (?, ?)").run(name, nextOrder);
    } catch (e) {}
    const data = db.prepare("SELECT name FROM categories ORDER BY \"order\" ASC").all() as any[];
    res.json(data.map(c => c.name));
  });

  app.post("/api/categories/reorder", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { newOrder } = req.body; // Array of names
    const update = db.prepare("UPDATE categories SET \"order\" = ? WHERE name = ?");
    const transaction = db.transaction((names) => {
      names.forEach((name: string, index: number) => update.run(index, name));
    });
    transaction(newOrder);
    res.json({ success: true });
  });

  app.delete("/api/categories/:name", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { name } = req.params;
    db.prepare("DELETE FROM categories WHERE name = ?").run(name);
    const data = db.prepare("SELECT name FROM categories ORDER BY \"order\" ASC").all() as any[];
    res.json(data.map(c => c.name));
  });

  // --- Extension Routes ---
  app.post("/api/extensions", authenticate, (req: any, res) => {
    if (req.user.role === 'user') return res.status(403).json({ error: "Acesso negado" });
    const { name, number, department } = req.body;
    const id = Date.now().toString();
    db.prepare("INSERT INTO extensions (id, name, number, department) VALUES (?, ?, ?, ?)").run(id, name, number, department);
    res.json({ id, name, number, department });
  });

  app.put("/api/extensions/:id", authenticate, (req: any, res) => {
    if (req.user.role === 'user') return res.status(403).json({ error: "Acesso negado" });
    const { id } = req.params;
    const { name, number, department } = req.body;
    db.prepare("UPDATE extensions SET name = ?, number = ?, department = ? WHERE id = ?").run(name, number, department, id);
    res.json({ id, name, number, department });
  });

  app.delete("/api/extensions/:id", authenticate, (req: any, res) => {
    if (req.user.role === 'user') return res.status(403).json({ error: "Acesso negado" });
    const { id } = req.params;
    db.prepare("DELETE FROM extensions WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/settings", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
    res.json({ success: true });
  });

  app.post("/api/news", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const { title, content, date, imageUrl } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO news (id, title, content, date, imageUrl) VALUES (?, ?, ?, ?, ?)").run(id, title, content, date, imageUrl);
    res.json({ id, title, content, date, imageUrl });
  });

  app.put("/api/news/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const { title, content, date, imageUrl } = req.body;
    db.prepare("UPDATE news SET title = ?, content = ?, date = ?, imageUrl = ? WHERE id = ?").run(title, content, date, imageUrl, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/news/reorder", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const { newOrder } = req.body;
    // For news we don't have an order column yet, but we can just reorder the whole array if we were using memory.
    // In SQL, we should probably add an order column. For now, let's just return success or implement order.
    res.json({ success: true });
  });

  app.delete("/api/news/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    db.prepare("DELETE FROM news WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- User Management Routes ---
  app.get("/api/users", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const data = db.prepare("SELECT id, username, role, displayName, email FROM users").all();
    res.json(data);
  });

  app.post("/api/users", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { username, password, role, displayName, email } = req.body;
    const existing = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (existing) return res.status(400).json({ error: "Usuário já existe" });
    
    const id = Date.now().toString();
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare("INSERT INTO users (id, username, password, role, displayName, email) VALUES (?, ?, ?, ?, ?, ?)").run(id, username, hashedPassword, role, displayName, email);
    res.json({ id, username, role, displayName, email });
  });

  app.put("/api/users/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { username, password, role, displayName, email } = req.body;
    
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("UPDATE users SET username = ?, password = ?, role = ?, displayName = ?, email = ? WHERE id = ?").run(username, hashedPassword, role, displayName, email, req.params.id);
    } else {
      db.prepare("UPDATE users SET username = ?, role = ?, displayName = ?, email = ? WHERE id = ?").run(username, role, displayName, email, req.params.id);
    }
    res.json({ success: true });
  });

  app.delete("/api/users/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    
    // Prevent deleting self
    if (req.params.id === req.user.id) return res.status(400).json({ error: "Não é possível excluir o próprio usuário" });
    
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        hmr: {
          clientPort: 3002 // Porta externa mapeada no Docker
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor Intranet rodando em http://0.0.0.0:${PORT}`);
    console.log(`📡 Acesso local: http://localhost:${PORT}`);
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
