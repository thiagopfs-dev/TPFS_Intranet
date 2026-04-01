import { Category, NewsItem } from "./types";

export const CATEGORIES: Category[] = [
  {
    name: "SISTEMAS",
    shortcuts: [
      { id: "1", title: "Wareline", iconUrl: "https://picsum.photos/seed/wareline/100/100", link: "#", category: "SISTEMAS" },
      { id: "2", title: "Signfy", iconUrl: "https://picsum.photos/seed/signfy/100/100", link: "#", category: "SISTEMAS" },
      { id: "3", title: "Chamados", iconUrl: "https://picsum.photos/seed/glpi/100/100", link: "#", category: "SISTEMAS" },
      { id: "4", title: "Pré - Agendamento SUS - NOVO", iconUrl: "https://picsum.photos/seed/susnovo/100/100", link: "#", category: "SISTEMAS" },
      { id: "5", title: "Fin-x", iconUrl: "https://picsum.photos/seed/finx/100/100", link: "#", category: "SISTEMAS" },
      { id: "6", title: "Documentos Gestão da Qualidade", iconUrl: "https://picsum.photos/seed/qualidade/100/100", link: "#", category: "SISTEMAS" },
    ]
  },
  {
    name: "FORMULÁRIOS",
    shortcuts: [
      { id: "7", title: "Notificação Epidemiológica", iconUrl: "https://picsum.photos/seed/epi/100/100", link: "#", category: "FORMULÁRIOS" },
      { id: "8", title: "Notificação de Eventos Adversos", iconUrl: "https://picsum.photos/seed/adversos/100/100", link: "#", category: "FORMULÁRIOS" },
      { id: "9", title: "Indicador de Enfermagem UTI", iconUrl: "https://picsum.photos/seed/uti/100/100", link: "#", category: "FORMULÁRIOS" },
    ]
  },
  {
    name: "DIVERSOS",
    shortcuts: [
      { id: "10", title: "Web Mail", iconUrl: "https://picsum.photos/seed/mail/100/100", link: "#", category: "DIVERSOS" },
      { id: "11", title: "PABX / TELEFONIA", iconUrl: "https://picsum.photos/seed/pabx/100/100", link: "#", category: "DIVERSOS" },
      { id: "12", title: "netPACS", iconUrl: "https://picsum.photos/seed/pacs/100/100", link: "#", category: "DIVERSOS" },
    ]
  }
];

export const NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "Campanha Março Lilás",
    content: "Combate ao câncer do colo do útero. Conscientização e prevenção são fundamentais.",
    date: "2024-03-01",
    imageUrl: "https://picsum.photos/seed/marcolilas/800/200"
  },
  {
    id: "n2",
    title: "Novo Sistema de Chamados",
    content: "A partir de hoje, utilize o novo portal para abertura de chamados de TI.",
    date: "2024-03-15",
  },
  {
    id: "n3",
    title: "Treinamento de Segurança",
    content: "Participe do treinamento obrigatório sobre segurança do paciente no auditório.",
    date: "2024-03-20",
  }
];
