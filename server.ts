import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";

// --- Mock Database ---
let categories = ["SISTEMAS", "FORMULÁRIOS", "DIVERSOS"];

let shortcuts = [
  { id: "1", title: "Wareline", iconUrl: "https://picsum.photos/seed/wareline/100/100", link: "#", category: "SISTEMAS", order: 0 },
  { id: "2", title: "Signfy", iconUrl: "https://picsum.photos/seed/signfy/100/100", link: "#", category: "SISTEMAS", order: 1 },
  { id: "3", title: "Chamados", iconUrl: "https://picsum.photos/seed/glpi/100/100", link: "#", category: "SISTEMAS", order: 2 },
  { id: "4", title: "Pré - Agendamento SUS", iconUrl: "https://picsum.photos/seed/susnovo/100/100", link: "#", category: "SISTEMAS", order: 3 },
  { id: "5", title: "Fin-x", iconUrl: "https://picsum.photos/seed/finx/100/100", link: "#", category: "SISTEMAS", order: 4 },
  { id: "6", title: "Gestão da Qualidade", iconUrl: "https://picsum.photos/seed/qualidade/100/100", link: "#", category: "SISTEMAS", order: 5 },
];

let news = [
  { id: "n1", title: "Campanha Março Lilás", content: "Combate ao câncer do colo do útero. Conscientização e prevenção são fundamentais.", date: "2024-03-01", imageUrl: "https://picsum.photos/seed/marcolilas/800/200" },
  { id: "n2", title: "Novo Sistema de Chamados", content: "A partir de hoje, utilize o novo portal para abertura de chamados de TI.", date: "2024-03-15" },
];

let documents = [
  { id: "d1", title: "Protocolo de Higienização", code: "POP-ENF-001", version: "v2", url: "#", category: "Enfermagem" },
  { id: "d2", title: "Manual de Conduta Ética", code: "MAN-RH-005", version: "v4", url: "#", category: "RH" },
];

let articles = [
  { id: "a1", title: "Inovações na UTI", summary: "Novas tecnologias aplicadas ao cuidado intensivo.", content: "Conteúdo completo do artigo...", author: "Dr. Silva", date: "2024-03-25" },
];

let events = [
  { id: "e1", title: "Workshop de Primeiros Socorros", description: "Treinamento prático para novos colaboradores.", date: "2024-04-10", location: "Auditório Principal" },
];

// Mock Users (password is '123456')
let users = [
  { id: "u1", username: "admin", password: bcrypt.hashSync("123456", 10), role: "admin", displayName: "Administrador", email: "admin@santacasa.org.br" },
  { id: "u2", username: "editor", password: bcrypt.hashSync("123456", 10), role: "editor", displayName: "Editor de Comunicação", email: "editor@santacasa.org.br" },
  { id: "u3", username: "user", password: bcrypt.hashSync("123456", 10), role: "user", displayName: "Colaborador", email: "user@santacasa.org.br" },
];

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
    const user = users.find(u => u.username === username);
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
  app.get("/api/shortcuts", (req, res) => res.json(shortcuts));
  app.get("/api/news", (req, res) => res.json(news));
  // --- SGQ Documents Routes ---
  app.get("/api/documents", (req, res) => res.json(documents));
  app.post("/api/documents", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const newDoc = { ...req.body, id: Date.now().toString() };
    documents.push(newDoc);
    res.json(newDoc);
  });
  app.put("/api/documents/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    documents = documents.map(d => d.id === req.params.id ? { ...d, ...req.body } : d);
    res.json({ success: true });
  });
  app.delete("/api/documents/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    documents = documents.filter(d => d.id !== req.params.id);
    res.json({ success: true });
  });

  // --- Articles Routes ---
  app.get("/api/articles", (req, res) => res.json(articles));
  app.post("/api/articles", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const newArticle = { ...req.body, id: Date.now().toString() };
    articles.push(newArticle);
    res.json(newArticle);
  });
  app.put("/api/articles/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    articles = articles.map(a => a.id === req.params.id ? { ...a, ...req.body } : a);
    res.json({ success: true });
  });
  app.delete("/api/articles/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    articles = articles.filter(a => a.id !== req.params.id);
    res.json({ success: true });
  });

  // --- Events Routes ---
  app.get("/api/events", (req, res) => res.json(events));
  app.post("/api/events", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const newEvent = { ...req.body, id: Date.now().toString() };
    events.push(newEvent);
    res.json(newEvent);
  });
  app.put("/api/events/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    events = events.map(e => e.id === req.params.id ? { ...e, ...req.body } : e);
    res.json({ success: true });
  });
  app.delete("/api/events/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    events = events.filter(e => e.id !== req.params.id);
    res.json({ success: true });
  });

  app.get("/api/categories", (req, res) => res.json(categories));

  // --- File Upload Route ---
  app.post("/api/upload", authenticate, upload.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Admin/Editor protected writes
  app.post("/api/shortcuts", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const newShortcut = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
    shortcuts.push(newShortcut);
    res.json(newShortcut);
  });

  app.put("/api/shortcuts/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const index = shortcuts.findIndex(s => s.id === req.params.id);
    if (index !== -1) {
      shortcuts[index] = { ...shortcuts[index], ...req.body };
      res.json(shortcuts[index]);
    } else {
      res.status(404).json({ error: "Não encontrado" });
    }
  });

  app.delete("/api/shortcuts/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    shortcuts = shortcuts.filter(s => s.id !== req.params.id);
    res.json({ success: true });
  });

  app.post("/api/shortcuts/reorder", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { newOrder } = req.body; // Array of IDs
    const reorderedShortcuts = newOrder.map((id: string, index: number) => {
      const s = shortcuts.find(item => item.id === id);
      return s ? { ...s, order: index } : null;
    }).filter(Boolean);
    
    // Update the main shortcuts array with new orders
    shortcuts = shortcuts.map(s => {
      const updated = reorderedShortcuts.find((item: any) => item.id === s.id);
      return updated || s;
    });

    res.json(shortcuts);
  });

  // --- Category Routes ---
  app.post("/api/categories", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nome da categoria é obrigatório" });
    if (!categories.includes(name)) {
      categories.push(name);
    }
    res.json(categories);
  });

  app.delete("/api/categories/:name", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { name } = req.params;
    categories = categories.filter(c => c !== name);
    res.json(categories);
  });

  app.post("/api/news", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const newItem = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
    news.push(newItem);
    res.json(newItem);
  });

  app.put("/api/news/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const index = news.findIndex(n => n.id === req.params.id);
    if (index !== -1) {
      news[index] = { ...news[index], ...req.body };
      res.json(news[index]);
    } else {
      res.status(404).json({ error: "Não encontrado" });
    }
  });

  app.post("/api/news/reorder", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    const { newOrder } = req.body;
    const reorderedNews = newOrder.map((id: string) => news.find(n => n.id === id)).filter(Boolean);
    news = reorderedNews;
    res.json(news);
  });

  app.delete("/api/news/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'editor') return res.status(403).json({ error: "Acesso negado" });
    news = news.filter(n => n.id !== req.params.id);
    res.json({ success: true });
  });

  // --- User Management Routes ---
  app.get("/api/users", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const usersWithoutPasswords = users.map(({ password, ...u }) => u);
    res.json(usersWithoutPasswords);
  });

  app.post("/api/users", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { username, password, role, displayName, email } = req.body;
    if (users.find(u => u.username === username)) return res.status(400).json({ error: "Usuário já existe" });
    
    const newUser = {
      id: Date.now().toString(),
      username,
      password: bcrypt.hashSync(password, 10),
      role,
      displayName,
      email
    };
    users.push(newUser);
    const { password: _, ...u } = newUser;
    res.json(u);
  });

  app.put("/api/users/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Usuário não encontrado" });
    
    const { password, ...updateData } = req.body;
    if (password) {
      users[index].password = bcrypt.hashSync(password, 10);
    }
    users[index] = { ...users[index], ...updateData };
    const { password: _, ...u } = users[index];
    res.json(u);
  });

  app.delete("/api/users/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Usuário não encontrado" });
    
    // Prevent deleting self
    if (users[index].id === req.user.id) return res.status(400).json({ error: "Não é possível excluir o próprio usuário" });
    
    users.splice(index, 1);
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
