import { useState, useEffect, useMemo } from "react";
import React from "react";
import { 
  Search, LogOut, Bell, Settings, Plus, Edit, Trash2, 
  LayoutDashboard, FileText, User as UserIcon, LogIn,
  BookOpen, Calendar, FileCheck, Menu, X, ChevronRight,
  Home, Info, ShieldCheck, GripVertical, Save, Image as ImageIcon,
  Link as LinkIcon, Type, Layers, Phone, PhoneCall, Megaphone,
  Folder, ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { 
  Shortcut, NewsItem, UserProfile, UserRole, 
  SGQDocument, Article, HospitalEvent, PhoneExtension,
  Role, Permissions
} from "./types";
import { cn } from "./lib/utils";

type View = 'sistemas' | 'sgq' | 'artigos' | 'eventos' | 'ramais' | 'admin';

const viewTitles: Record<View, string> = {
  sistemas: 'Santa Casa Conecta',
  sgq: 'Documentos SGQ',
  artigos: 'Artigos',
  eventos: 'Eventos',
  ramais: 'Ramais',
  admin: 'Painel Administrativo'
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [documents, setDocuments] = useState<SGQDocument[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<HospitalEvent[]>([]);
  const [extensions, setExtensions] = useState<PhoneExtension[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState({ message: "", enabled: false });
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  
  const [activeView, setActiveView] = useState<View>('sistemas');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const sgqFolders = useMemo(() => {
    const categories = new Set(documents.map(doc => doc.category));
    return Array.from(categories).sort();
  }, [documents]);

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auth check
  useEffect(() => {
    fetch("/api/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, []);

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      const [sRes, nRes, dRes, aRes, eRes, cRes, exRes, setRes] = await Promise.all([
        fetch("/api/shortcuts"),
        fetch("/api/news"),
        fetch("/api/documents"),
        fetch("/api/articles"),
        fetch("/api/events"),
        fetch("/api/categories"),
        fetch("/api/extensions"),
        fetch("/api/settings")
      ]);
      
      if (sRes.ok) setShortcuts(await sRes.json());
      if (nRes.ok) setNews(await nRes.json());
      if (dRes.ok) setDocuments(await dRes.json());
      if (aRes.ok) setArticles(await aRes.json());
      if (eRes.ok) setEvents(await eRes.json());
      if (cRes.ok) setAvailableCategories(await cRes.json());
      if (exRes.ok) setExtensions(await exRes.json());
      if (setRes.ok) {
        const settings = await setRes.json();
        if (settings.logoUrl) setLogoUrl(settings.logoUrl);
        
        const annMsg = settings.announcementMessage || "";
        const annEnabled = settings.announcementEnabled === "true";
        setAnnouncement({ message: annMsg, enabled: annEnabled });
        
        // Show announcement if enabled and not seen in this session
        if (annEnabled && !sessionStorage.getItem('announcementSeen')) {
          setShowAnnouncement(true);
        }
      }
    };
    fetchData();
  }, []);

  // Fetch admin data when user changes
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.permissions?.users) {
        fetch("/api/users").then(res => res.ok ? res.json() : []).then(setUsers);
      }
      if (user.role === 'admin' || user.permissions?.roles) {
        fetch("/api/roles").then(res => res.ok ? res.json() : []).then(setRoles);
      }
    }
  }, [user]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    setActiveView('sistemas');
  };

  const categories = useMemo(() => {
    // Group shortcuts by category
    const cats: Record<string, Shortcut[]> = {};
    const sortedShortcuts = [...shortcuts].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    sortedShortcuts.forEach(s => {
      if (!cats[s.category]) cats[s.category] = [];
      cats[s.category].push(s);
    });

    // Use availableCategories to maintain the defined order
    return availableCategories
      .filter(name => cats[name]) // Only include categories that have shortcuts
      .map(name => ({ name, shortcuts: cats[name] }));
  }, [shortcuts, availableCategories]);

  const handleReorder = async (newShortcuts: Shortcut[]) => {
    setShortcuts(newShortcuts);
    if (user?.role === 'admin') {
      await fetch("/api/shortcuts/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOrder: newShortcuts.map(s => s.id) })
      });
    }
  };

  const refreshData = async () => {
    const [sRes, nRes, dRes, aRes, eRes, cRes, uRes, exRes, setRes, rRes] = await Promise.all([
      fetch("/api/shortcuts"),
      fetch("/api/news"),
      fetch("/api/documents"),
      fetch("/api/articles"),
      fetch("/api/events"),
      fetch("/api/categories"),
      fetch("/api/users"),
      fetch("/api/extensions"),
      fetch("/api/settings"),
      fetch("/api/roles")
    ]);
    
    if (sRes.ok) setShortcuts(await sRes.json());
    if (nRes.ok) setNews(await nRes.json());
    if (dRes.ok) setDocuments(await dRes.json());
    if (aRes.ok) setArticles(await aRes.json());
    if (eRes.ok) setEvents(await eRes.json());
    if (cRes.ok) setAvailableCategories(await cRes.json());
    if (uRes.ok) setUsers(await uRes.json());
    if (exRes.ok) setExtensions(await exRes.json());
    if (rRes.ok) setRoles(await rRes.json());
    if (setRes.ok) {
      const settings = await setRes.json();
      if (settings.logoUrl) setLogoUrl(settings.logoUrl);
      
      const annMsg = settings.announcementMessage || "";
      const annEnabled = settings.announcementEnabled === "true";
      setAnnouncement({ message: annMsg, enabled: annEnabled });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex overflow-hidden relative">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-100 transition-all duration-500 flex flex-col z-50 fixed top-0 left-0 h-full overflow-hidden border-r border-slate-200 shadow-2xl",
        isSidebarOpen ? "w-80 translate-x-0" : "w-80 md:w-28 -translate-x-full md:translate-x-0"
      )}>
        <div className="p-8 flex items-center gap-4 border-b border-slate-200 overflow-hidden min-h-[100px] bg-slate-50/50">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-primary/20">
            <ShieldCheck size={28} className="text-white" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-slate-900 leading-none">Santa Casa</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hospitalar</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-10 px-6 space-y-4 overflow-y-auto">
          <NavItem 
            icon={<Home size={22} />} 
            label="Início" 
            active={activeView === 'sistemas'} 
            collapsed={!isSidebarOpen}
            onClick={() => { setActiveView('sistemas'); setSearchTerm(""); }}
          />
          <NavItem 
            icon={<Phone size={22} />} 
            label="Ramais" 
            active={activeView === 'ramais'} 
            collapsed={!isSidebarOpen}
            onClick={() => { setActiveView('ramais'); setSearchTerm(""); }}
          />
          <NavItem 
            icon={<FileCheck size={22} />} 
            label="Documentos SGQ" 
            active={activeView === 'sgq'} 
            collapsed={!isSidebarOpen}
            onClick={() => { setActiveView('sgq'); setSearchTerm(""); }}
          />
          <NavItem 
            icon={<BookOpen size={22} />} 
            label="Artigos" 
            active={activeView === 'artigos'} 
            collapsed={!isSidebarOpen}
            onClick={() => { setActiveView('artigos'); setSearchTerm(""); }}
          />
          <NavItem 
            icon={<Calendar size={22} />} 
            label="Eventos" 
            active={activeView === 'eventos'} 
            collapsed={!isSidebarOpen}
            onClick={() => { setActiveView('eventos'); setSearchTerm(""); }}
          />
          
          {user && (user.role === 'admin' || Object.values(user.permissions || {}).some(v => v)) && (
            <div className="pt-10 mt-10 border-t border-slate-200">
              <NavItem 
                icon={<Settings size={22} />} 
                label="Administração" 
                active={activeView === 'admin'} 
                collapsed={!isSidebarOpen}
                onClick={() => { setActiveView('admin'); setSearchTerm(""); }}
              />
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-slate-200 hidden md:block bg-slate-50/50">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full p-4 hover:bg-white rounded-2xl flex items-center justify-center transition-all text-slate-400 hover:text-primary shadow-sm hover:shadow-md"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && window.innerWidth <= 768 && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden pb-16 md:pb-0 transition-all duration-300",
        isSidebarOpen ? "md:ml-80" : "md:ml-28"
      )}>
        {/* Header */}
        {activeView !== 'sgq' && (
          <header className="bg-white border-b border-slate-50 h-24 flex items-center justify-between px-8 md:px-16 shrink-0 sticky top-0 z-40">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 hover:bg-slate-50 rounded-2xl md:hidden text-slate-400"
              >
                <Menu size={24} />
              </button>
              
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-14 w-auto object-contain" />
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <ShieldCheck size={18} className="text-white" />
                      </div>
                      <span className="font-black text-xl text-slate-900 tracking-tight">Portal SGQ</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-11 -mt-1">Gestão da Qualidade</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              {activeView !== 'sistemas' && (
                <div className="hidden lg:flex items-center gap-3 text-slate-300 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
                  <span className="text-xs tracking-[0.2em] uppercase">{viewTitles[activeView]}</span>
                </div>
              )}

              {user ? (
                <div className="flex items-center gap-6 pl-8 border-l border-slate-50">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-slate-900 leading-none">{user.displayName}</p>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">{user.role}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                    <UserIcon size={24} className="text-slate-300" />
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-2xl transition-all"
                  >
                    <LogOut size={22} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-2xl text-sm font-black hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
                >
                  <span>Acesso Restrito</span>
                </button>
              )}
            </div>
          </header>
        )}

        {/* Floating Toggle if Header is hidden (Mobile) */}
        {activeView === 'sgq' && !isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-6 left-6 z-50 p-3 bg-white shadow-xl rounded-2xl text-slate-400 md:hidden border border-slate-100 transition-all active:scale-95"
          >
            <Menu size={24} />
          </button>
        )}

        {/* View Content */}
        <main className={cn(
          "flex-1 overflow-y-auto",
          activeView === 'sgq' ? "p-0" : "p-8 md:p-16"
        )}>
          <AnimatePresence mode="wait">
            {activeView === 'sistemas' && (
              <motion.div 
                key="sistemas"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto space-y-20 pb-40"
              >
                {/* Banner Section */}
                <div className="relative rounded-[48px] overflow-hidden shadow-2xl aspect-[2/1] md:aspect-[3/1] lg:aspect-[4/1] bg-dark group">
                  <img 
                    src={news[0]?.imageUrl || "https://picsum.photos/seed/hospital-banner/1200/400"} 
                    alt="Banner Principal" 
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[3000ms] ease-out"
                  />
                  <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end text-white bg-gradient-to-t from-dark/95 via-dark/20 to-transparent">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Notícia</span>
                      <div className="h-[1px] w-12 bg-white/20"></div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight max-w-4xl">{news[0]?.title || "Bem-vindo ao Portal Santa Casa"}</h1>
                    <p className="text-sm md:text-lg opacity-90 max-w-2xl font-medium line-clamp-2 md:line-clamp-none">{news[0]?.content || "Sua plataforma central para sistemas, ramais e documentação de qualidade."}</p>
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="space-y-24">
                  {categories.map((cat) => (
                    <div key={cat.name} className="space-y-10">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.5em] flex items-center justify-center gap-8">
                        <div className="h-[2px] w-16 bg-primary/20 rounded-full"></div>
                        {cat.name}
                        <div className="h-[2px] w-16 bg-primary/20 rounded-full"></div>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-10">
                        {cat.shortcuts.map((s) => (
                          <div key={s.id} className="relative group/card">
                            <a 
                              href={s.link}
                              className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-primary/10 hover:-translate-y-3 transition-all duration-700 group text-center flex flex-col items-center h-full"
                            >
                              <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center mb-6 group-hover:bg-red-50 transition-colors duration-700 overflow-hidden shadow-inner">
                                <img src={s.iconUrl} alt={s.title} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700" />
                              </div>
                              <span className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors duration-300 leading-tight tracking-tight">{s.title}</span>
                            </a>
                            {user?.role === 'admin' && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActiveView('admin');
                                }}
                                className="absolute -top-2 -right-2 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-primary opacity-0 group-hover/card:opacity-100 transition-opacity z-10 hover:bg-red-50"
                              >
                                <Edit size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeView === 'ramais' && (
              <motion.div 
                key="ramais"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-6xl mx-auto space-y-12"
              >
                {/* Clean Header Area */}
                <div className="text-center space-y-4 pt-4">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                    Lista de Ramais
                  </h2>
                  <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
                    Consulte os contatos e ramais internos de todos os departamentos da Santa Casa.
                  </p>

                  <div className="pt-8 max-w-2xl mx-auto">
                    <div className="relative group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={24} />
                      <input 
                        type="text" 
                        placeholder="Pesquisar por nome, setor ou ramal..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 focus:border-primary rounded-[24px] text-lg transition-all outline-none shadow-sm focus:shadow-xl focus:shadow-primary/5"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left min-w-[600px] md:min-w-0">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">
                        <th className="px-8 py-6">Nome / Setor</th>
                        <th className="px-8 py-6">Departamento</th>
                        <th className="px-8 py-6">Ramal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {extensions.filter(ex => 
                        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        ex.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        ex.number.includes(searchTerm)
                      ).map(ex => (
                        <tr key={ex.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-6 font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">{ex.name}</td>
                          <td className="px-8 py-6 text-xs text-slate-400 uppercase font-black tracking-widest">{ex.department}</td>
                          <td className="px-8 py-6">
                            <span className="flex items-center gap-3 text-primary font-mono font-black text-base">
                              <Phone size={16} />
                              {ex.number}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeView === 'sgq' && (
              <motion.div 
                key="sgq"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full bg-white overflow-hidden"
              >
                <iframe 
                  src="https://sgq.santacasago.com.br" 
                  className="w-full h-full border-0"
                  style={{ height: '100dvh' }}
                  title="Documentos SGQ"
                />
              </motion.div>
            )}

            {activeView === 'artigos' && (
              <motion.div key="artigos" className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">Artigos</h2>
                    <p className="text-slate-500">Conhecimento e atualizações para a equipe</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar artigos..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all outline-none w-full md:w-80 shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {articles.filter(article => 
                    article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    article.author.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(article => (
                    <div key={article.id} className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 hover:border-red-200 transition-all duration-300">
                      <p className="text-[10px] font-bold text-primary uppercase mb-3 tracking-wider">{article.date}</p>
                      <h3 className="text-xl font-bold text-slate-800 mb-3 leading-tight">{article.title}</h3>
                      <p className="text-sm text-slate-500 mb-6 line-clamp-3 leading-relaxed">{article.summary}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="text-xs font-medium text-slate-400">Por {article.author}</span>
                        <button className="text-xs font-bold text-primary hover:text-red-700 transition-colors">Ler mais</button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeView === 'eventos' && (
              <motion.div key="eventos" className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">Eventos</h2>
                    <p className="text-slate-500">Acompanhe a agenda da Santa Casa</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar eventos..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-primary rounded-xl text-sm transition-all outline-none w-full md:w-80 shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {events.filter(event => 
                    event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.location.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(event => (
                    <div key={event.id} className="bg-white rounded-[24px] p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-red-200 transition-all duration-300 group">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-primary shrink-0 group-hover:bg-red-50 transition-colors">
                        <span className="text-2xl font-bold leading-none">{event.date.split('-')[2]}</span>
                        <span className="text-xs font-bold uppercase tracking-wider mt-1">ABR</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">{event.title}</h3>
                        <p className="text-sm text-slate-500 mb-3">{event.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
                          <span className="flex items-center gap-1.5"><Calendar size={14} /> {event.date}</span>
                          <span className="flex items-center gap-1.5"><Home size={14} /> {event.location}</span>
                        </div>
                      </div>
                      <button className="w-full md:w-auto px-6 py-3 bg-slate-50 hover:bg-red-50 hover:text-primary rounded-xl text-sm font-bold text-slate-600 transition-colors">Inscrever-se</button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeView === 'admin' && user && (
              <AdminPanel 
                user={user} 
                shortcuts={shortcuts} 
                news={news} 
                documents={documents}
                articles={articles}
                events={events}
                users={users}
                roles={roles}
                categories={availableCategories}
                extensions={extensions}
                logoUrl={logoUrl}
                announcement={announcement}
                onRefresh={refreshData}
                onReorder={handleReorder}
                onReorderCategories={async (newOrder) => {
                  const res = await fetch("/api/categories/reorder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ newOrder })
                  });
                  if (res.ok) refreshData();
                }}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around px-2 md:hidden z-50">
          <MobileNavItem 
            icon={<Home size={24} />} 
            active={activeView === 'sistemas'} 
            onClick={() => { setActiveView('sistemas'); setSearchTerm(""); }}
          />
          <MobileNavItem 
            icon={<Phone size={24} />} 
            active={activeView === 'ramais'} 
            onClick={() => { setActiveView('ramais'); setSearchTerm(""); }}
          />
          <MobileNavItem 
            icon={<FileCheck size={24} />} 
            active={activeView === 'sgq'} 
            onClick={() => { setActiveView('sgq'); setSearchTerm(""); }}
          />
          <MobileNavItem 
            icon={<BookOpen size={24} />} 
            active={activeView === 'artigos'} 
            onClick={() => { setActiveView('artigos'); setSearchTerm(""); }}
          />
          {user && (user.role === 'admin' || Object.values(user.permissions || {}).some(v => v)) && (
            <MobileNavItem 
              icon={<Settings size={24} />} 
              active={activeView === 'admin'} 
              onClick={() => { setActiveView('admin'); setSearchTerm(""); }}
            />
          )}
        </div>
      </div>

      {/* Announcement Modal */}
      <AnnouncementModal 
        message={announcement.message} 
        isOpen={showAnnouncement} 
        onClose={() => {
          setShowAnnouncement(false);
          sessionStorage.setItem('announcementSeen', 'true');
        }} 
      />

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsLoginOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-center mb-8">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="max-h-24 w-auto object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                      <ShieldCheck size={32} className="text-white" />
                    </div>
                  )}
                </div>
                {!logoUrl && <h3 className="text-2xl font-bold text-center text-slate-800 mb-2">Santa Casa Conecta</h3>}
                <p className="text-center text-slate-500 text-sm mb-8">Entre com suas credenciais de colaborador</p>
                
                <LoginForm onSuccess={(u) => { setUser(u); setIsLoginOpen(false); }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active, collapsed, onClick }: { icon: any, label: string, active: boolean, collapsed: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group",
        active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
      )}
    >
      <div className={cn("shrink-0 transition-transform duration-300", active ? "scale-110 text-white" : "group-hover:scale-110")}>{icon}</div>
      {!collapsed && <span className="text-sm font-bold tracking-tight">{label}</span>}
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute left-0 w-1.5 h-8 bg-white/40 rounded-r-full"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
        />
      )}
    </button>
  );
}

function AnnouncementModal({ message, isOpen, onClose }: { message: string, isOpen: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-primary">
                <Megaphone size={40} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Aviso Importante</h2>
              <div className="text-slate-600 text-lg leading-relaxed mb-10 whitespace-pre-wrap">
                {message}
              </div>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:opacity-90 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Entendi, vamos lá!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function MobileNavItem({ icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
        active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400"
      )}
    >
      {icon}
    </button>
  );
}

function LoginForm({ onSuccess }: { onSuccess: (u: UserProfile) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        onSuccess(await res.json());
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao fazer login");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Usuário</label>
        <input 
          type="text" 
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none transition-all"
          placeholder="Ex: thiago.pacheco"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Senha</label>
        <input 
          type="password" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none transition-all"
          placeholder="••••••••"
          required
        />
      </div>
      
      {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}

      <button 
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-red-700 transition-all disabled:opacity-50 mt-4"
      >
        {loading ? "Entrando..." : "Acessar Portal"}
      </button>
    </form>
  );
}

function AdminPanel({ user, shortcuts, news, documents, articles, events, users, roles, categories, extensions, logoUrl, announcement, onRefresh, onReorder, onReorderCategories }: { 
  user: UserProfile, 
  shortcuts: Shortcut[], 
  news: NewsItem[], 
  documents: SGQDocument[],
  articles: Article[],
  events: HospitalEvent[],
  users: UserProfile[],
  roles: Role[],
  categories: string[],
  extensions: PhoneExtension[],
  logoUrl: string,
  announcement: { message: string, enabled: boolean },
  onRefresh: () => void,
  onReorder: (s: Shortcut[]) => void,
  onReorderCategories: (c: string[]) => void
}) {
  const [tab, setTab] = useState<string>('shortcuts');
  const [editingShortcut, setEditingShortcut] = useState<Partial<Shortcut> | null>(null);
  const [editingNews, setEditingNews] = useState<Partial<NewsItem> | null>(null);
  const [editingDocument, setEditingDocument] = useState<Partial<SGQDocument> | null>(null);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<HospitalEvent> | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<UserProfile & { password?: string }> | null>(null);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
  const [editingExtension, setEditingExtension] = useState<Partial<PhoneExtension> | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [annMsg, setAnnMsg] = useState(announcement.message);
  const [annEnabled, setAnnEnabled] = useState(announcement.enabled);

  const availableTabs = useMemo(() => {
    const tabs = [
      { id: 'shortcuts', label: 'Atalhos', icon: <LinkIcon size={18} /> },
      { id: 'news', label: 'Avisos', icon: <Bell size={18} /> },
      { id: 'categories', label: 'Categorias', icon: <Layers size={18} /> },
      { id: 'sgq', label: 'SGQ', icon: <FileCheck size={18} /> },
      { id: 'articles', label: 'Artigos', icon: <BookOpen size={18} /> },
      { id: 'events', label: 'Eventos', icon: <Calendar size={18} /> },
      { id: 'ramais', label: 'Ramais', icon: <Phone size={18} /> },
      { id: 'users', label: 'Usuários', icon: <UserIcon size={18} /> },
      { id: 'roles', label: 'Perfis de Acesso', icon: <ShieldCheck size={18} /> },
      { id: 'settings', label: 'Configurações', icon: <Settings size={18} /> },
    ];

    if (user.role === 'admin') return tabs;
    
    return tabs.filter(t => {
      if (t.id === 'categories') return user.permissions?.categories;
      if (t.id === 'roles') return user.permissions?.roles;
      return user.permissions?.[t.id as keyof Permissions];
    });
  }, [user]);

  useEffect(() => {
    if (!availableTabs.find(t => t.id === tab)) {
      setTab(availableTabs[0]?.id || 'shortcuts');
    }
  }, [availableTabs]);

  useEffect(() => {
    setAnnMsg(announcement.message);
    setAnnEnabled(announcement.enabled);
  }, [announcement]);

  const handleSaveAnnouncement = async () => {
    await Promise.all([
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "announcementMessage", value: annMsg })
      }),
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "announcementEnabled", value: annEnabled ? "true" : "false" })
      })
    ]);
    onRefresh();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'shortcut' | 'news' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        if (type === 'shortcut' && editingShortcut) {
          setEditingShortcut({ ...editingShortcut, iconUrl: url });
        } else if (type === 'news' && editingNews) {
          setEditingNews({ ...editingNews, imageUrl: url });
        } else if (type === 'logo') {
          handleSaveLogo(url);
        }
      }
    } catch (err) {
      console.error("Erro no upload:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveShortcut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShortcut) return;
    
    const method = editingShortcut.id ? "PUT" : "POST";
    const url = editingShortcut.id ? `/api/shortcuts/${editingShortcut.id}` : "/api/shortcuts";
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingShortcut)
    });
    
    if (res.ok) {
      setEditingShortcut(null);
      onRefresh();
    }
  };

  const handleDeleteShortcut = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este atalho?")) return;
    const res = await fetch(`/api/shortcuts/${id}`, { method: "DELETE" });
    if (res.ok) onRefresh();
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews) return;
    
    const method = editingNews.id ? "PUT" : "POST";
    const url = editingNews.id ? `/api/news/${editingNews.id}` : "/api/news";
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingNews)
    });
    
    if (res.ok) {
      setEditingNews(null);
      onRefresh();
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta notícia?")) return;
    const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
    if (res.ok) onRefresh();
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;
    const method = editingDocument.id ? "PUT" : "POST";
    const url = editingDocument.id ? `/api/documents/${editingDocument.id}` : "/api/documents";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingDocument)
    });
    if (res.ok) { setEditingDocument(null); onRefresh(); }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) onRefresh();
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    const method = editingArticle.id ? "PUT" : "POST";
    const url = editingArticle.id ? `/api/articles/${editingArticle.id}` : "/api/articles";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingArticle)
    });
    if (res.ok) { setEditingArticle(null); onRefresh(); }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este artigo?")) return;
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (res.ok) onRefresh();
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    const method = editingEvent.id ? "PUT" : "POST";
    const url = editingEvent.id ? `/api/events/${editingEvent.id}` : "/api/events";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingEvent)
    });
    if (res.ok) { setEditingEvent(null); onRefresh(); }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) onRefresh();
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const method = editingUser.id ? "PUT" : "POST";
    const url = editingUser.id ? `/api/users/${editingUser.id}` : "/api/users";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingUser)
    });
    if (res.ok) { setEditingUser(null); onRefresh(); }
    else {
      const data = await res.json();
      alert(data.error || "Erro ao salvar usuário");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) onRefresh();
    else {
      const data = await res.json();
      alert(data.error || "Erro ao excluir usuário");
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    const isNew = !roles.find(r => r.name === editingRole.name);
    const method = isNew ? "POST" : "PUT";
    const url = isNew ? "/api/roles" : `/api/roles/${editingRole.name}`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingRole)
    });
    if (res.ok) { setEditingRole(null); onRefresh(); }
    else {
      const data = await res.json();
      alert(data.error || "Erro ao salvar perfil");
    }
  };

  const handleDeleteRole = async (name: string) => {
    if (!confirm("Tem certeza que deseja excluir este perfil?")) return;
    const res = await fetch(`/api/roles/${name}`, { method: "DELETE" });
    if (res.ok) onRefresh();
    else {
      const data = await res.json();
      alert(data.error || "Erro ao excluir perfil");
    }
  };

  const handleSaveExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExtension) return;
    const method = editingExtension.id ? "PUT" : "POST";
    const url = editingExtension.id ? `/api/extensions/${editingExtension.id}` : "/api/extensions";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingExtension)
    });
    if (res.ok) { setEditingExtension(null); onRefresh(); }
  };

  const handleSaveLogo = async (url: string) => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "logoUrl", value: url })
    });
    onRefresh();
  };

  const handleDeleteExtension = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ramal?")) return;
    const res = await fetch(`/api/extensions/${id}`, { method: "DELETE" });
    if (res.ok) onRefresh();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim().toUpperCase() })
    });
    if (res.ok) {
      setNewCategoryName('');
      onRefresh();
    }
  };

  const handleDeleteCategory = async (name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) return;
    const res = await fetch(`/api/categories/${name}`, { method: "DELETE" });
    if (res.ok) onRefresh();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit overflow-x-auto max-w-full">
        {availableTabs.map((t) => (
          <button 
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
              tab === t.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-slate-50"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'shortcuts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Gerenciar Atalhos</h2>
              <p className="text-sm text-slate-500">Arraste para organizar a ordem de exibição</p>
            </div>
            <button 
              onClick={() => setEditingShortcut({ title: '', iconUrl: '', link: '', category: categories[0] || 'SISTEMAS' })}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              <span>Novo Atalho</span>
            </button>
          </div>

          <Reorder.Group axis="y" values={shortcuts} onReorder={onReorder} className="space-y-3">
            {shortcuts.map((s) => (
              <Reorder.Item 
                key={s.id} 
                value={s}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-red-200 transition-colors"
              >
                <div className="text-gray-300"><GripVertical size={20} /></div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  <img src={s.iconUrl} alt={s.title} className="w-8 h-8 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate">{s.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{s.link}</p>
                </div>
                <div className="px-3 py-1 bg-surface rounded-lg text-[10px] font-bold text-slate-500 uppercase">{s.category}</div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setEditingShortcut(s)}
                    className="p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteShortcut(s.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {tab === 'news' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Gerenciar Comunicação</h2>
              <p className="text-sm text-slate-500">Banners e avisos para os colaboradores</p>
            </div>
            <button 
              onClick={() => setEditingNews({ title: '', content: '', date: new Date().toISOString().split('T')[0] })}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              <span>Novo Aviso</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {news.map((n, index) => (
              <div key={n.id} className={cn(
                "bg-white p-6 rounded-2xl border shadow-sm flex items-start gap-6 transition-all",
                index === 0 ? "border-red-200 ring-1 ring-red-100" : "border-slate-100"
              )}>
                {n.imageUrl && (
                  <div className="w-32 h-20 rounded-xl overflow-hidden shrink-0">
                    <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-primary text-[10px] font-bold rounded uppercase">Banner Principal</span>
                    )}
                    <h4 className="font-bold text-slate-800 truncate">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 font-bold">{n.date}</span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">{n.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  {index !== 0 && (
                    <button 
                      onClick={async () => {
                        const newOrder = [n.id, ...news.filter(item => item.id !== n.id).map(item => item.id)];
                        const res = await fetch("/api/news/reorder", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ newOrder })
                        });
                        if (res.ok) onRefresh();
                      }}
                      className="p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"
                      title="Definir como Banner Principal"
                    >
                      <Layers size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => setEditingNews(n)}
                    className="p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteNews(n.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'categories' && availableTabs.some(t => t.id === 'categories') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Gerenciar Categorias</h2>
              <p className="text-sm text-slate-500">Crie ou remova categorias de atalhos</p>
            </div>
          </div>

          <form onSubmit={handleAddCategory} className="flex gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <input 
              type="text" 
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="Nome da nova categoria..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none"
              required
            />
            <button type="submit" className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all">
              Adicionar
            </button>
          </form>

          <Reorder.Group axis="y" values={categories} onReorder={onReorderCategories} className="space-y-3">
            {categories.map(cat => (
              <Reorder.Item 
                key={cat} 
                value={cat}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-red-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-gray-300"><GripVertical size={20} /></div>
                  <span className="font-bold text-slate-700 uppercase tracking-wide">{cat}</span>
                </div>
                <button 
                  onClick={() => handleDeleteCategory(cat)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {tab === 'ramais' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Gerenciar Ramais</h2>
              <p className="text-sm text-slate-500">Cadastre e organize os ramais internos</p>
            </div>
            <button 
              onClick={() => setEditingExtension({ name: '', number: '', department: '' })}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              <span>Novo Ramal</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            <table className="w-full text-left min-w-[600px] md:min-w-0">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Nome / Setor</th>
                  <th className="px-6 py-4">Departamento</th>
                  <th className="px-6 py-4">Ramal</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {extensions.map(ex => (
                  <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-slate-800">{ex.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 uppercase font-bold">{ex.department}</td>
                    <td className="px-6 py-4 font-mono font-bold text-primary">{ex.number}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingExtension(ex)}
                          className="p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteExtension(ex.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shortcut Edit Modal */}
      <AnimatePresence>
        {editingShortcut && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingShortcut(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveShortcut} className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{editingShortcut.id ? 'Editar Atalho' : 'Novo Atalho'}</h3>
                  <button type="button" onClick={() => setEditingShortcut(null)} className="text-slate-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2"><Type size={14} /> Título</label>
                    <input 
                      type="text" 
                      value={editingShortcut.title}
                      onChange={e => setEditingShortcut({...editingShortcut, title: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2"><Layers size={14} /> Categoria</label>
                      <select 
                        value={editingShortcut.category}
                        onChange={e => setEditingShortcut({...editingShortcut, category: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                        <ImageIcon size={14} /> Ícone (URL ou Upload)
                        <span className="ml-auto text-[10px] text-gray-300 normal-case font-normal">Sugerido: 512x512px</span>
                      </label>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={editingShortcut.iconUrl}
                          onChange={e => setEditingShortcut({...editingShortcut, iconUrl: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none text-sm"
                          placeholder="https://..."
                        />
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={e => handleFileUpload(e, 'shortcut')}
                            className="hidden"
                            id="shortcut-upload"
                          />
                          <label 
                            htmlFor="shortcut-upload"
                            className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-primary hover:text-primary cursor-pointer transition-all"
                          >
                            {uploading ? "Enviando..." : "Ou clique para Upload"}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2"><LinkIcon size={14} /> Link de Acesso</label>
                    <input 
                      type="text" 
                      value={editingShortcut.link}
                      onChange={e => setEditingShortcut({...editingShortcut, link: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none"
                      placeholder="https://..."
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} />
                  <span>Salvar Atalho</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* News Edit Modal */}
      <AnimatePresence>
        {editingNews && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingNews(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveNews} className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{editingNews.id ? 'Editar Aviso' : 'Novo Aviso'}</h3>
                  <button type="button" onClick={() => setEditingNews(null)} className="text-slate-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Título</label>
                    <input 
                      type="text" 
                      value={editingNews.title}
                      onChange={e => setEditingNews({...editingNews, title: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Conteúdo</label>
                    <textarea 
                      value={editingNews.content}
                      onChange={e => setEditingNews({...editingNews, content: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none min-h-[100px]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Data</label>
                      <input 
                        type="date" 
                        value={editingNews.date}
                        onChange={e => setEditingNews({...editingNews, date: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase mb-2 block">
                        <span>Imagem (URL ou Upload)</span>
                        <span className="text-[10px] text-gray-300 normal-case font-normal">Sugerido: 1200x300px (4:1)</span>
                      </label>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={editingNews.imageUrl || ''}
                          onChange={e => setEditingNews({...editingNews, imageUrl: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none text-sm"
                          placeholder="https://..."
                        />
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={e => handleFileUpload(e, 'news')}
                            className="hidden"
                            id="news-upload"
                          />
                          <label 
                            htmlFor="news-upload"
                            className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-primary hover:text-primary cursor-pointer transition-all"
                          >
                            {uploading ? "Enviando..." : "Ou clique para Upload"}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} />
                  <span>Salvar Aviso</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SGQ Edit Modal */}
      <AnimatePresence>
        {editingDocument && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingDocument(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveDocument} className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{editingDocument.id ? 'Editar Documento' : 'Novo Documento'}</h3>
                  <button type="button" onClick={() => setEditingDocument(null)} className="text-slate-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Título</label>
                      <input type="text" value={editingDocument.title} onChange={e => setEditingDocument({...editingDocument, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Código</label>
                      <input type="text" value={editingDocument.code || ''} onChange={e => setEditingDocument({...editingDocument, code: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" placeholder="Ex: POP-001" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Categoria</label>
                      <input type="text" value={editingDocument.category} onChange={e => setEditingDocument({...editingDocument, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" list="category-options" required />
                      <datalist id="category-options">
                        <option value="MANUAL" />
                        <option value="POP" />
                        <option value="INSTRUÇÃO" />
                        <option value="FORMULÁRIO" />
                      </datalist>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Versão</label>
                      <input type="text" value={editingDocument.version} onChange={e => setEditingDocument({...editingDocument, version: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">URL do Documento</label>
                    <input type="text" value={editingDocument.url} onChange={e => setEditingDocument({...editingDocument, url: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" placeholder="https://..." required />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} />
                  <span>Salvar Documento</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Article Edit Modal */}
      <AnimatePresence>
        {editingArticle && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingArticle(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveArticle} className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{editingArticle.id ? 'Editar Artigo' : 'Novo Artigo'}</h3>
                  <button type="button" onClick={() => setEditingArticle(null)} className="text-slate-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Título</label>
                    <input type="text" value={editingArticle.title} onChange={e => setEditingArticle({...editingArticle, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Resumo</label>
                    <input type="text" value={editingArticle.excerpt} onChange={e => setEditingArticle({...editingArticle, excerpt: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Conteúdo (Markdown)</label>
                    <textarea value={editingArticle.content} onChange={e => setEditingArticle({...editingArticle, content: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none min-h-[200px]" required />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} />
                  <span>Salvar Artigo</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Edit Modal */}
      <AnimatePresence>
        {editingEvent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingEvent(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveEvent} className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{editingEvent.id ? 'Editar Evento' : 'Novo Evento'}</h3>
                  <button type="button" onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Título</label>
                    <input type="text" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Data</label>
                      <input type="date" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Hora</label>
                      <input type="time" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Local</label>
                    <input type="text" value={editingEvent.location} onChange={e => setEditingEvent({...editingEvent, location: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} />
                  <span>Salvar Evento</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {tab === 'sgq' && availableTabs.some(t => t.id === 'sgq') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Gerenciar Documentos SGQ</h2>
              <p className="text-sm text-slate-500">Adicione ou remova documentos do sistema</p>
            </div>
            <button 
              onClick={() => setEditingDocument({ title: '', category: 'MANUAL', url: '', version: '1.0', date: new Date().toISOString().split('T')[0] })}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              <span>Novo Documento</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {documents.map(doc => (
              <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-50 text-primary rounded-lg flex items-center justify-center">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{doc.title}</h4>
                    <p className="text-xs text-slate-400 uppercase font-bold">{doc.category} • v{doc.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingDocument(doc)} className="p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'articles' && availableTabs.some(t => t.id === 'articles') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Gerenciar Artigos</h2>
              <p className="text-sm text-slate-500">Publicações e informativos técnicos</p>
            </div>
            <button 
              onClick={() => setEditingArticle({ title: '', excerpt: '', content: '', author: user.displayName, date: new Date().toISOString().split('T')[0], category: 'SAÚDE' })}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              <span>Novo Artigo</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {articles.map(art => (
              <div key={art.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{art.title}</h4>
                    <p className="text-xs text-slate-400 font-bold">{art.author} • {art.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingArticle(art)} className="p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteArticle(art.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'events' && availableTabs.some(t => t.id === 'events') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Gerenciar Eventos</h2>
              <p className="text-sm text-slate-500">Calendário de atividades do hospital</p>
            </div>
            <button 
              onClick={() => setEditingEvent({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: '08:00', location: '', category: 'TREINAMENTO' })}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              <span>Novo Evento</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {events.map(ev => (
              <div key={ev.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{ev.title}</h4>
                    <p className="text-xs text-slate-400 font-bold">{ev.date} às {ev.time} • {ev.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingEvent(ev)} className="p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteEvent(ev.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && availableTabs.some(t => t.id === 'settings') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Configurações do Sistema</h2>
              <p className="text-sm text-slate-500">Personalize a aparência do portal</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Logo do Sistema</label>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                <div className="w-32 h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Preview" className="w-full h-full object-contain p-4" />
                  ) : (
                    <ShieldCheck size={48} className="text-gray-200" />
                  )}
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-700">URL da Imagem</p>
                    <input 
                      type="text" 
                      value={logoUrl}
                      onChange={e => handleSaveLogo(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none"
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'logo')}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label 
                      htmlFor="logo-upload"
                      className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-primary hover:text-primary cursor-pointer transition-all"
                    >
                      {uploading ? "Enviando..." : "Ou clique para Upload"}
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400">Tamanho recomendado: 512x512px. Formatos aceitos: PNG, JPG, SVG.</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-primary">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Aviso de Boas-vindas (Popup)</h3>
                    <p className="text-xs text-slate-500">Exibe uma mensagem importante ao acessar o portal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAnnEnabled(!annEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    annEnabled ? "bg-primary" : "bg-slate-200"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    annEnabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>

              <div className="space-y-4">
                <textarea 
                  value={annMsg}
                  onChange={e => setAnnMsg(e.target.value)}
                  placeholder="Escreva aqui a mensagem do aviso..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none min-h-[120px] text-sm"
                />
                <button 
                  onClick={handleSaveAnnouncement}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-red-700 transition-all flex items-center gap-2"
                >
                  <Save size={18} />
                  <span>Salvar Aviso</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && availableTabs.some(t => t.id === 'users') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Gerenciar Usuários</h2>
              <p className="text-sm text-slate-500">Controle de acesso e permissões</p>
            </div>
            <button 
              onClick={() => setEditingUser({ username: '', displayName: '', email: '', role: roles[0]?.name || 'user', password: '' })}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              <span>Novo Usuário</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {users.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 text-gray-600 rounded-lg flex items-center justify-center">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{u.displayName}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{u.username} • {u.role} • {u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingUser(u)} className="p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'roles' && availableTabs.some(t => t.id === 'roles') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Perfis de Acesso</h2>
              <p className="text-sm text-slate-500">Gerencie os perfis e suas permissões</p>
            </div>
            <button 
              onClick={() => setEditingRole({ name: '', permissions: { shortcuts: false, news: false, sgq: false, articles: false, events: false, ramais: false, users: false, settings: false, roles: false, categories: false } })}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} />
              <span>Novo Perfil</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {roles.map(r => (
              <div key={r.name} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 text-gray-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{r.name}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                      {Object.entries(r.permissions).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'Nenhuma permissão'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingRole(r)} className="p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"><Edit size={18} /></button>
                  {r.name !== 'admin' && (
                    <button onClick={() => handleDeleteRole(r.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingUser(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                  <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nome de Exibição</label>
                    <input type="text" value={editingUser.displayName} onChange={e => setEditingUser({...editingUser, displayName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Usuário (Login)</label>
                      <input type="text" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Permissão (Role)</label>
                      <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none">
                        {roles.map(r => (
                          <option key={r.name} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">E-mail</label>
                    <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">{editingUser.id ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}</label>
                    <input type="password" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" required={!editingUser.id} />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} />
                  <span>Salvar Usuário</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {editingRole && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingRole(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <form onSubmit={handleSaveRole} className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{roles.find(r => r.name === editingRole.name) ? 'Editar Perfil' : 'Novo Perfil'}</h3>
                  <button type="button" onClick={() => setEditingRole(null)} className="text-slate-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nome do Perfil</label>
                    <input 
                      type="text" 
                      value={editingRole.name} 
                      onChange={e => setEditingRole({...editingRole, name: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" 
                      required 
                      disabled={!!roles.find(r => r.name === editingRole.name)} // Disable if editing existing
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-4 block">Permissões de Acesso</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(editingRole.permissions || {}).map((permKey) => (
                        <label key={permKey} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={editingRole.permissions?.[permKey as keyof Permissions] || false}
                            onChange={(e) => setEditingRole({
                              ...editingRole, 
                              permissions: {
                                ...editingRole.permissions,
                                [permKey]: e.target.checked
                              } as Permissions
                            })}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-[#c8323c]"
                          />
                          <span className="font-medium text-slate-700 capitalize">{permKey}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} />
                  <span>Salvar Perfil</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {editingExtension && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setEditingExtension(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveExtension} className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{editingExtension.id ? 'Editar Ramal' : 'Novo Ramal'}</h3>
                  <button type="button" onClick={() => setEditingExtension(null)} className="text-slate-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nome / Setor</label>
                    <input 
                      type="text" 
                      value={editingExtension.name} 
                      onChange={e => setEditingExtension({...editingExtension, name: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" 
                      placeholder="Ex: Recepção Central"
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Departamento</label>
                    <input 
                      type="text" 
                      value={editingExtension.department} 
                      onChange={e => setEditingExtension({...editingExtension, department: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" 
                      placeholder="Ex: ATENDIMENTO"
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Número do Ramal</label>
                    <input 
                      type="text" 
                      value={editingExtension.number} 
                      onChange={e => setEditingExtension({...editingExtension, number: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-primary outline-none" 
                      placeholder="Ex: 2001"
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  <Save size={20} />
                  <span>Salvar Ramal</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
