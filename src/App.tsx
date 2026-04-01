import { useState, useEffect, useMemo } from "react";
import React from "react";
import { 
  Search, LogOut, Bell, Settings, Plus, Edit, Trash2, 
  LayoutDashboard, FileText, User as UserIcon, LogIn,
  BookOpen, Calendar, FileCheck, Menu, X, ChevronRight,
  Home, Info, ShieldCheck, GripVertical, Save, Image as ImageIcon,
  Link as LinkIcon, Type, Layers, Phone, PhoneCall, Megaphone
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
  const [announcement, setAnnouncement] = useState({ message: "", enabled: false });
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  
  const [activeView, setActiveView] = useState<View>('sistemas');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c8323c]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex overflow-hidden relative">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#1a1a1a] text-white transition-all duration-300 flex flex-col z-50 fixed top-0 left-0 h-full overflow-hidden",
        isSidebarOpen ? "w-80 translate-x-0" : "w-80 md:w-28 -translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center gap-4 border-b border-white/10 overflow-hidden min-h-[88px]">
          <div className="w-10 h-10 bg-[#c8323c] rounded flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight whitespace-nowrap">Santa Casa Conecta</span>}
        </div>

        <nav className="flex-1 py-8 px-4 space-y-3">
          <NavItem 
            icon={<Home size={24} />} 
            label="Início" 
            active={activeView === 'sistemas'} 
            collapsed={!isSidebarOpen}
            onClick={() => { setActiveView('sistemas'); setSearchTerm(""); }}
          />
          <NavItem 
            icon={<Phone size={24} />} 
            label="Ramais" 
            active={activeView === 'ramais'} 
            collapsed={!isSidebarOpen}
            onClick={() => { setActiveView('ramais'); setSearchTerm(""); }}
          />
          <NavItem 
            icon={<FileCheck size={24} />} 
            label="Documentos SGQ" 
            active={activeView === 'sgq'} 
            collapsed={!isSidebarOpen}
            onClick={() => { setActiveView('sgq'); setSearchTerm(""); }}
          />
          <NavItem 
            icon={<BookOpen size={24} />} 
            label="Artigos" 
            active={activeView === 'artigos'} 
            collapsed={!isSidebarOpen}
            onClick={() => { setActiveView('artigos'); setSearchTerm(""); }}
          />
          <NavItem 
            icon={<Calendar size={24} />} 
            label="Eventos" 
            active={activeView === 'eventos'} 
            collapsed={!isSidebarOpen}
            onClick={() => { setActiveView('eventos'); setSearchTerm(""); }}
          />
          
          {user && (user.role === 'admin' || Object.values(user.permissions || {}).some(v => v)) && (
            <div className="pt-8 mt-8 border-t border-white/10">
              <NavItem 
                icon={<Settings size={24} />} 
                label="Administração" 
                active={activeView === 'admin'} 
                collapsed={!isSidebarOpen}
                onClick={() => { setActiveView('admin'); setSearchTerm(""); }}
              />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 hidden md:block">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full p-2 hover:bg-white/5 rounded-lg flex items-center justify-center transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0 relative">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
            >
              <Menu size={20} />
            </button>
            {activeView !== 'sistemas' && (
              <h2 className="text-lg md:text-xl font-bold text-gray-800">{viewTitles[activeView]}</h2>
            )}
          </div>

          {/* Logo positioned closer to sidebar (roughly where the green mark was) */}
          <div className="absolute left-[25%] top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 bg-[#c8323c] rounded flex items-center justify-center shadow-lg shadow-red-900/20">
                <ShieldCheck size={24} className="text-white" />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{user.displayName}</p>
                  <p className="text-[10px] text-[#c8323c] font-bold uppercase tracking-widest">{user.role}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-2 px-5 py-2 bg-[#c8323c] text-white rounded-lg text-sm font-bold hover:bg-[#b02a33] transition-colors shadow-lg shadow-red-900/20"
              >
                <LogIn size={18} />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f9fa]">
          <AnimatePresence mode="wait">
            {activeView === 'sistemas' && (
              <motion.div 
                key="sistemas"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* Banner */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[2/1] md:aspect-[4/1] bg-gray-900 group">
                  <img 
                    src={news[0]?.imageUrl || "https://picsum.photos/seed/hospital/1200/300"} 
                    alt="Banner" 
                    className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-1000 ease-out"
                  />
                  <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end text-white">
                    <h1 className="text-2xl md:text-4xl font-bold mb-2">{news[0]?.title || "Bem-vindo ao Santa Casa Conecta"}</h1>
                    <p className="text-sm md:text-lg opacity-90 max-w-2xl line-clamp-2 md:line-clamp-none">{news[0]?.content || "Sua plataforma central de sistemas e informações."}</p>
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="space-y-12">
                  {categories.map((cat) => (
                    <div key={cat.name} className="space-y-6">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                        {cat.name}
                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {cat.shortcuts.map((s) => (
                          <div key={s.id} className="relative group/card">
                            <a 
                              href={s.link}
                              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-center flex flex-col items-center h-full"
                            >
                              <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-red-50 transition-colors overflow-hidden">
                                <img src={s.iconUrl} alt={s.title} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
                              </div>
                              <span className="text-xs font-bold text-gray-700 group-hover:text-[#c8323c] leading-tight">{s.title}</span>
                            </a>
                            {user?.role === 'admin' && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActiveView('admin');
                                }}
                                className="absolute -top-2 -right-2 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-blue-600 opacity-0 group-hover/card:opacity-100 transition-opacity z-10 hover:bg-blue-50"
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Lista de Ramais</h2>
                    <p className="text-gray-500">Consulte os ramais internos da Santa Casa</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar ramal ou setor..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-gray-200 focus:border-[#c8323c] rounded-xl text-sm transition-all outline-none w-full md:w-80 shadow-sm"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left min-w-[600px] md:min-w-0">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Nome / Setor</th>
                        <th className="px-6 py-4">Departamento</th>
                        <th className="px-6 py-4">Ramal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {extensions.filter(ex => 
                        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        ex.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        ex.number.includes(searchTerm)
                      ).map(ex => (
                        <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-sm text-gray-800">{ex.name}</td>
                          <td className="px-6 py-4 text-xs text-gray-500 uppercase font-bold">{ex.department}</td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-[#c8323c] font-mono font-bold">
                              <PhoneCall size={14} />
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
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Documentos SGQ</h2>
                    <p className="text-gray-500">Gestão da Qualidade e Processos</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar documentos..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-gray-200 focus:border-[#c8323c] rounded-xl text-sm transition-all outline-none w-full md:w-80 shadow-sm"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Código</th>
                        <th className="px-6 py-4">Título do Documento</th>
                        <th className="px-6 py-4">Versão</th>
                        <th className="px-6 py-4">Categoria</th>
                        <th className="px-6 py-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {documents.filter(doc => 
                        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        doc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        doc.category.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-[#c8323c]">{doc.code}</td>
                        <td className="px-6 py-4 font-bold text-sm text-gray-800">{doc.title}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{doc.version}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase">{doc.category}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[#c8323c] font-bold text-xs hover:underline">Visualizar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
            )}

            {activeView === 'artigos' && (
              <motion.div key="artigos" className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Artigos</h2>
                    <p className="text-gray-500">Conhecimento e atualizações para a equipe</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar artigos..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-gray-200 focus:border-[#c8323c] rounded-xl text-sm transition-all outline-none w-full md:w-80 shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {articles.filter(article => 
                    article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    article.author.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(article => (
                    <div key={article.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <p className="text-[10px] font-bold text-[#c8323c] uppercase mb-2">{article.date}</p>
                      <h3 className="text-lg font-bold text-gray-800 mb-3">{article.title}</h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-3">{article.summary}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <span className="text-xs text-gray-400">Por {article.author}</span>
                        <button className="text-xs font-bold text-[#c8323c]">Ler mais</button>
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
                    <h2 className="text-3xl font-bold text-gray-800">Eventos</h2>
                    <p className="text-gray-500">Acompanhe a agenda da Santa Casa</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar eventos..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-gray-200 focus:border-[#c8323c] rounded-xl text-sm transition-all outline-none w-full md:w-80 shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {events.filter(event => 
                    event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.location.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(event => (
                    <div key={event.id} className="bg-white rounded-2xl p-6 flex items-center gap-6 shadow-sm border border-gray-100">
                      <div className="w-16 h-16 bg-red-50 rounded-xl flex flex-col items-center justify-center text-[#c8323c] shrink-0">
                        <span className="text-lg font-bold leading-none">{event.date.split('-')[2]}</span>
                        <span className="text-[10px] font-bold uppercase">ABR</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{event.title}</h3>
                        <p className="text-sm text-gray-500">{event.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {event.date}</span>
                          <span className="flex items-center gap-1"><Home size={12} /> {event.location}</span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600 transition-colors">Inscrever-se</button>
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around px-2 md:hidden z-50">
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
                    <div className="w-16 h-16 bg-[#c8323c] rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                      <ShieldCheck size={32} className="text-white" />
                    </div>
                  )}
                </div>
                {!logoUrl && <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">Santa Casa Conecta</h3>}
                <p className="text-center text-gray-500 text-sm mb-8">Entre com suas credenciais de colaborador</p>
                
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
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active ? "bg-[#c8323c] text-white shadow-lg shadow-red-900/40" : "text-gray-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <div className={cn("shrink-0", active ? "text-white" : "group-hover:text-white")}>{icon}</div>
      {!collapsed && <span className="text-sm font-bold tracking-wide">{label}</span>}
      {active && !collapsed && <ChevronRight size={16} className="ml-auto opacity-60" />}
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
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-[#c8323c]">
                <Megaphone size={40} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Aviso Importante</h2>
              <div className="text-gray-600 text-lg leading-relaxed mb-10 whitespace-pre-wrap">
                {message}
              </div>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-[#c8323c] text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-900/20 hover:bg-[#b02a33] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
        active ? "bg-[#c8323c] text-white shadow-lg shadow-red-900/20" : "text-gray-400"
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
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Usuário</label>
        <input 
          type="text" 
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none transition-all"
          placeholder="Ex: thiago.pacheco"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Senha</label>
        <input 
          type="password" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none transition-all"
          placeholder="••••••••"
          required
        />
      </div>
      
      {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}

      <button 
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-[#c8323c] text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:bg-[#b02a33] transition-all disabled:opacity-50 mt-4"
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
      if (t.id === 'categories') return user.permissions?.shortcuts;
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
      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit overflow-x-auto max-w-full">
        {availableTabs.map((t) => (
          <button 
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
              tab === t.id ? "bg-[#c8323c] text-white shadow-lg shadow-red-900/20" : "text-gray-400 hover:bg-gray-50"
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
              <h2 className="text-xl font-bold text-gray-800">Gerenciar Atalhos</h2>
              <p className="text-sm text-gray-500">Arraste para organizar a ordem de exibição</p>
            </div>
            <button 
              onClick={() => setEditingShortcut({ title: '', iconUrl: '', link: '', category: categories[0] || 'SISTEMAS' })}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
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
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-red-200 transition-colors"
              >
                <div className="text-gray-300"><GripVertical size={20} /></div>
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                  <img src={s.iconUrl} alt={s.title} className="w-8 h-8 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate">{s.title}</h4>
                  <p className="text-xs text-gray-400 truncate">{s.link}</p>
                </div>
                <div className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase">{s.category}</div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setEditingShortcut(s)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
              <h2 className="text-xl font-bold text-gray-800">Gerenciar Comunicação</h2>
              <p className="text-sm text-gray-500">Banners e avisos para os colaboradores</p>
            </div>
            <button 
              onClick={() => setEditingNews({ title: '', content: '', date: new Date().toISOString().split('T')[0] })}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
            >
              <Plus size={18} />
              <span>Novo Aviso</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {news.map((n, index) => (
              <div key={n.id} className={cn(
                "bg-white p-6 rounded-2xl border shadow-sm flex items-start gap-6 transition-all",
                index === 0 ? "border-red-200 ring-1 ring-red-100" : "border-gray-100"
              )}>
                {n.imageUrl && (
                  <div className="w-32 h-20 rounded-xl overflow-hidden shrink-0">
                    <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-[#c8323c] text-[10px] font-bold rounded uppercase">Banner Principal</span>
                    )}
                    <h4 className="font-bold text-gray-800 truncate">{n.title}</h4>
                    <span className="text-[10px] text-gray-400 font-bold">{n.date}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{n.content}</p>
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
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Definir como Banner Principal"
                    >
                      <Layers size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => setEditingNews(n)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
              <h2 className="text-xl font-bold text-gray-800">Gerenciar Categorias</h2>
              <p className="text-sm text-gray-500">Crie ou remova categorias de atalhos</p>
            </div>
          </div>

          <form onSubmit={handleAddCategory} className="flex gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <input 
              type="text" 
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="Nome da nova categoria..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none"
              required
            />
            <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all">
              Adicionar
            </button>
          </form>

          <Reorder.Group axis="y" values={categories} onReorder={onReorderCategories} className="space-y-3">
            {categories.map(cat => (
              <Reorder.Item 
                key={cat} 
                value={cat}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-red-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-gray-300"><GripVertical size={20} /></div>
                  <span className="font-bold text-gray-700 uppercase tracking-wide">{cat}</span>
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
              <h2 className="text-xl font-bold text-gray-800">Gerenciar Ramais</h2>
              <p className="text-sm text-gray-500">Cadastre e organize os ramais internos</p>
            </div>
            <button 
              onClick={() => setEditingExtension({ name: '', number: '', department: '' })}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
            >
              <Plus size={18} />
              <span>Novo Ramal</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left min-w-[600px] md:min-w-0">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Nome / Setor</th>
                  <th className="px-6 py-4">Departamento</th>
                  <th className="px-6 py-4">Ramal</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {extensions.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-gray-800">{ex.name}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 uppercase font-bold">{ex.department}</td>
                    <td className="px-6 py-4 font-mono font-bold text-[#c8323c]">{ex.number}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingExtension(ex)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                  <h3 className="text-xl font-bold text-gray-800">{editingShortcut.id ? 'Editar Atalho' : 'Novo Atalho'}</h3>
                  <button type="button" onClick={() => setEditingShortcut(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2"><Type size={14} /> Título</label>
                    <input 
                      type="text" 
                      value={editingShortcut.title}
                      onChange={e => setEditingShortcut({...editingShortcut, title: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2"><Layers size={14} /> Categoria</label>
                      <select 
                        value={editingShortcut.category}
                        onChange={e => setEditingShortcut({...editingShortcut, category: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
                        <ImageIcon size={14} /> Ícone (URL ou Upload)
                        <span className="ml-auto text-[10px] text-gray-300 normal-case font-normal">Sugerido: 512x512px</span>
                      </label>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={editingShortcut.iconUrl}
                          onChange={e => setEditingShortcut({...editingShortcut, iconUrl: e.target.value})}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none text-sm"
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
                            className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-[#c8323c] hover:text-[#c8323c] cursor-pointer transition-all"
                          >
                            {uploading ? "Enviando..." : "Ou clique para Upload"}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2"><LinkIcon size={14} /> Link de Acesso</label>
                    <input 
                      type="text" 
                      value={editingShortcut.link}
                      onChange={e => setEditingShortcut({...editingShortcut, link: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none"
                      placeholder="https://..."
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-[#c8323c] text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:bg-[#b02a33] transition-all flex items-center justify-center gap-2">
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
                  <h3 className="text-xl font-bold text-gray-800">{editingNews.id ? 'Editar Aviso' : 'Novo Aviso'}</h3>
                  <button type="button" onClick={() => setEditingNews(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Título</label>
                    <input 
                      type="text" 
                      value={editingNews.title}
                      onChange={e => setEditingNews({...editingNews, title: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Conteúdo</label>
                    <textarea 
                      value={editingNews.content}
                      onChange={e => setEditingNews({...editingNews, content: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none min-h-[100px]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Data</label>
                      <input 
                        type="date" 
                        value={editingNews.date}
                        onChange={e => setEditingNews({...editingNews, date: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase mb-2 block">
                        <span>Imagem (URL ou Upload)</span>
                        <span className="text-[10px] text-gray-300 normal-case font-normal">Sugerido: 1200x300px (4:1)</span>
                      </label>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={editingNews.imageUrl || ''}
                          onChange={e => setEditingNews({...editingNews, imageUrl: e.target.value})}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none text-sm"
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
                            className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-[#c8323c] hover:text-[#c8323c] cursor-pointer transition-all"
                          >
                            {uploading ? "Enviando..." : "Ou clique para Upload"}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-[#c8323c] text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:bg-[#b02a33] transition-all flex items-center justify-center gap-2">
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
                  <h3 className="text-xl font-bold text-gray-800">{editingDocument.id ? 'Editar Documento' : 'Novo Documento'}</h3>
                  <button type="button" onClick={() => setEditingDocument(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Título</label>
                    <input type="text" value={editingDocument.title} onChange={e => setEditingDocument({...editingDocument, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Categoria</label>
                      <select value={editingDocument.category} onChange={e => setEditingDocument({...editingDocument, category: e.target.value as any})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none">
                        <option value="MANUAL">Manual</option>
                        <option value="POP">POP</option>
                        <option value="INSTRUÇÃO">Instrução</option>
                        <option value="FORMULÁRIO">Formulário</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Versão</label>
                      <input type="text" value={editingDocument.version} onChange={e => setEditingDocument({...editingDocument, version: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">URL do Documento</label>
                    <input type="text" value={editingDocument.url} onChange={e => setEditingDocument({...editingDocument, url: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" placeholder="https://..." required />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-[#c8323c] text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:bg-[#b02a33] transition-all flex items-center justify-center gap-2">
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
                  <h3 className="text-xl font-bold text-gray-800">{editingArticle.id ? 'Editar Artigo' : 'Novo Artigo'}</h3>
                  <button type="button" onClick={() => setEditingArticle(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Título</label>
                    <input type="text" value={editingArticle.title} onChange={e => setEditingArticle({...editingArticle, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Resumo</label>
                    <input type="text" value={editingArticle.excerpt} onChange={e => setEditingArticle({...editingArticle, excerpt: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Conteúdo (Markdown)</label>
                    <textarea value={editingArticle.content} onChange={e => setEditingArticle({...editingArticle, content: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none min-h-[200px]" required />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-[#c8323c] text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:bg-[#b02a33] transition-all flex items-center justify-center gap-2">
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
                  <h3 className="text-xl font-bold text-gray-800">{editingEvent.id ? 'Editar Evento' : 'Novo Evento'}</h3>
                  <button type="button" onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Título</label>
                    <input type="text" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Data</label>
                      <input type="date" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Hora</label>
                      <input type="time" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Local</label>
                    <input type="text" value={editingEvent.location} onChange={e => setEditingEvent({...editingEvent, location: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-[#c8323c] text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:bg-[#b02a33] transition-all flex items-center justify-center gap-2">
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
              <h2 className="text-xl font-bold text-gray-800">Gerenciar Documentos SGQ</h2>
              <p className="text-sm text-gray-500">Adicione ou remova documentos do sistema</p>
            </div>
            <button 
              onClick={() => setEditingDocument({ title: '', category: 'MANUAL', url: '', version: '1.0', date: new Date().toISOString().split('T')[0] })}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
            >
              <Plus size={18} />
              <span>Novo Documento</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {documents.map(doc => (
              <div key={doc.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{doc.title}</h4>
                    <p className="text-xs text-gray-400 uppercase font-bold">{doc.category} • v{doc.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingDocument(doc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
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
              <h2 className="text-xl font-bold text-gray-800">Gerenciar Artigos</h2>
              <p className="text-sm text-gray-500">Publicações e informativos técnicos</p>
            </div>
            <button 
              onClick={() => setEditingArticle({ title: '', excerpt: '', content: '', author: user.displayName, date: new Date().toISOString().split('T')[0], category: 'SAÚDE' })}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
            >
              <Plus size={18} />
              <span>Novo Artigo</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {articles.map(art => (
              <div key={art.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{art.title}</h4>
                    <p className="text-xs text-gray-400 font-bold">{art.author} • {art.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingArticle(art)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
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
              <h2 className="text-xl font-bold text-gray-800">Gerenciar Eventos</h2>
              <p className="text-sm text-gray-500">Calendário de atividades do hospital</p>
            </div>
            <button 
              onClick={() => setEditingEvent({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: '08:00', location: '', category: 'TREINAMENTO' })}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
            >
              <Plus size={18} />
              <span>Novo Evento</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {events.map(ev => (
              <div key={ev.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{ev.title}</h4>
                    <p className="text-xs text-gray-400 font-bold">{ev.date} às {ev.time} • {ev.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingEvent(ev)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
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
              <h2 className="text-xl font-bold text-gray-800">Configurações do Sistema</h2>
              <p className="text-sm text-gray-500">Personalize a aparência do portal</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Logo do Sistema</label>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                <div className="w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Preview" className="w-full h-full object-contain p-4" />
                  ) : (
                    <ShieldCheck size={48} className="text-gray-200" />
                  )}
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-700">URL da Imagem</p>
                    <input 
                      type="text" 
                      value={logoUrl}
                      onChange={e => handleSaveLogo(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none"
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
                      className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:border-[#c8323c] hover:text-[#c8323c] cursor-pointer transition-all"
                    >
                      {uploading ? "Enviando..." : "Ou clique para Upload"}
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400">Tamanho recomendado: 512x512px. Formatos aceitos: PNG, JPG, SVG.</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-[#c8323c]">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Aviso de Boas-vindas (Popup)</h3>
                    <p className="text-xs text-gray-500">Exibe uma mensagem importante ao acessar o portal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAnnEnabled(!annEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    annEnabled ? "bg-[#c8323c]" : "bg-gray-200"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none min-h-[120px] text-sm"
                />
                <button 
                  onClick={handleSaveAnnouncement}
                  className="px-6 py-3 bg-[#c8323c] text-white rounded-xl font-bold text-sm shadow-lg shadow-red-900/20 hover:bg-[#b02a33] transition-all flex items-center gap-2"
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
              <h2 className="text-xl font-bold text-gray-800">Gerenciar Usuários</h2>
              <p className="text-sm text-gray-500">Controle de acesso e permissões</p>
            </div>
            <button 
              onClick={() => setEditingUser({ username: '', displayName: '', email: '', role: roles[0]?.name || 'user', password: '' })}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
            >
              <Plus size={18} />
              <span>Novo Usuário</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {users.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{u.displayName}</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{u.username} • {u.role} • {u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingUser(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
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
              <h2 className="text-xl font-bold text-gray-800">Perfis de Acesso</h2>
              <p className="text-sm text-gray-500">Gerencie os perfis e suas permissões</p>
            </div>
            <button 
              onClick={() => setEditingRole({ name: '', permissions: { shortcuts: false, news: false, sgq: false, articles: false, events: false, ramais: false, users: false, settings: false, roles: false } })}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
            >
              <Plus size={18} />
              <span>Novo Perfil</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {roles.map(r => (
              <div key={r.name} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{r.name}</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                      {Object.entries(r.permissions).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'Nenhuma permissão'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingRole(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
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
                  <h3 className="text-xl font-bold text-gray-800">{editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                  <button type="button" onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Nome de Exibição</label>
                    <input type="text" value={editingUser.displayName} onChange={e => setEditingUser({...editingUser, displayName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Usuário (Login)</label>
                      <input type="text" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Permissão (Role)</label>
                      <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none">
                        {roles.map(r => (
                          <option key={r.name} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">E-mail</label>
                    <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">{editingUser.id ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}</label>
                    <input type="password" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" required={!editingUser.id} />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-[#c8323c] text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:bg-[#b02a33] transition-all flex items-center justify-center gap-2">
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
                  <h3 className="text-xl font-bold text-gray-800">{roles.find(r => r.name === editingRole.name) ? 'Editar Perfil' : 'Novo Perfil'}</h3>
                  <button type="button" onClick={() => setEditingRole(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Nome do Perfil</label>
                    <input 
                      type="text" 
                      value={editingRole.name} 
                      onChange={e => setEditingRole({...editingRole, name: e.target.value})} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" 
                      required 
                      disabled={!!roles.find(r => r.name === editingRole.name)} // Disable if editing existing
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-4 block">Permissões de Acesso</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(editingRole.permissions || {}).map((permKey) => (
                        <label key={permKey} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
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
                            className="w-5 h-5 rounded border-gray-300 text-[#c8323c] focus:ring-[#c8323c]"
                          />
                          <span className="font-medium text-gray-700 capitalize">{permKey}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-[#c8323c] text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:bg-[#b02a33] transition-all flex items-center justify-center gap-2">
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
                  <h3 className="text-xl font-bold text-gray-800">{editingExtension.id ? 'Editar Ramal' : 'Novo Ramal'}</h3>
                  <button type="button" onClick={() => setEditingExtension(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Nome / Setor</label>
                    <input 
                      type="text" 
                      value={editingExtension.name} 
                      onChange={e => setEditingExtension({...editingExtension, name: e.target.value})} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" 
                      placeholder="Ex: Recepção Central"
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Departamento</label>
                    <input 
                      type="text" 
                      value={editingExtension.department} 
                      onChange={e => setEditingExtension({...editingExtension, department: e.target.value})} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" 
                      placeholder="Ex: ATENDIMENTO"
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Número do Ramal</label>
                    <input 
                      type="text" 
                      value={editingExtension.number} 
                      onChange={e => setEditingExtension({...editingExtension, number: e.target.value})} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#c8323c] outline-none" 
                      placeholder="Ex: 2001"
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-[#c8323c] text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:bg-[#b02a33] transition-all flex items-center justify-center gap-2">
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
