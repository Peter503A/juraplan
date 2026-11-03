/*
 * Vorgefüllter Modulkatalog – Fernstudium Online Marketing & E-Commerce (B.A.)
 * ---------------------------------------------------------------------------
 * Jedes Modul hat einen eindeutigen Kurscode (id). Module, die in mehreren
 * Wahlpflichtgruppen vorkommen, werden NUR EINMAL als Katalogeintrag geführt;
 * die Zugehörigkeit zu Gruppen steht in `groups`. So entstehen keine Dubletten.
 *
 * Felder:
 *   id          – Kurscode (eindeutige ID)
 *   name        – Modulname (Teilkurse zusammengefasst, siehe `subCourses`)
 *   ects        – ECTS-Punkte
 *   type        – 'pflicht' | 'wahlpflicht' | 'zusatz'
 *   semester    – Regelsemester (null bei reinen Wahlpflicht-/Zusatzmodulen)
 *   groups      – Liste von Wahlpflichtgruppen-IDs, in denen das Modul wählbar ist
 *   examForm    – Prüfungsform (soweit typisch/bekannt)
 *   subCourses  – optionale Teilkurse (z. B. Marketing I & II)
 *   duplicateOf – markiert einen bewussten Doppeleintrag (z. B. DLBMSM02-02)
 */

// Wahlpflichtgruppen mit ECTS-Sollwert
export const electiveGroups = {
  A: { id: "A", label: "Wahlpflichtbereich A", semester: 5, requiredEcts: 10, note: "10 ECTS auswählen" },
  B: { id: "B", label: "Wahlpflichtbereich B", semester: 5, requiredEcts: 10, note: "10 ECTS auswählen" },
  C: { id: "C", label: "Wahlpflichtbereich C", semester: 6, requiredEcts: 10, note: "10 ECTS auswählen" },
  D: {
    id: "D",
    label: "Wahlpflichtbereich D",
    semester: null,
    requiredEcts: 30,
    note: "30 ECTS – entweder Praktikum ODER alle sechs Module (nur ein Weg zählt)",
    exclusive: true,
  },
};

// Prüfungsstatus-Werte
export const EXAM_STATUS = [
  { id: "offen", label: "Offen", color: "#94a3b8" },
  { id: "begonnen", label: "Begonnen", color: "#f59e0b" },
  { id: "gelernt", label: "Gelernt", color: "#3b82f6" },
  { id: "pruefungsbereit", label: "Prüfungsbereit", color: "#8b5cf6" },
  { id: "bestanden", label: "Bestanden", color: "#22c55e" },
  { id: "angerechnet", label: "Angerechnet", color: "#14b8a6" },
];

// Lernarten für Lernblöcke
export const LEARN_TYPES = [
  "Lesen",
  "Verstehen",
  "Lernen",
  "Wiederholen",
  "Klausurvorbereitung",
  "Hausarbeit/Projekt",
];

export const modules = [
  // ============ PFLICHTMODULE ============
  // --- 1. Semester ---
  { id: "DLBMAR01", name: "Marketing", ects: 5, type: "pflicht", semester: 1, groups: [], examForm: "Klausur",
    subCourses: ["Marketing I", "Marketing II"] },
  { id: "DLBWIWARW01", name: "Einführung in das wissenschaftliche Arbeiten für Wirtschaft, Management und Kommunikation", ects: 5, type: "pflicht", semester: 1, groups: [], examForm: "Workbook" },
  { id: "DLBDSESTA01", name: "Statistik", ects: 5, type: "pflicht", semester: 1, groups: [], examForm: "Klausur" },
  { id: "DLBMPS01", name: "Konsumentenverhalten", ects: 5, type: "pflicht", semester: 1, groups: [], examForm: "Klausur" },
  { id: "DLBAPM01", name: "Projekt: Agiles Projektmanagement", ects: 5, type: "pflicht", semester: 1, groups: [], examForm: "Projektbericht" },

  // --- 2. Semester ---
  { id: "DLBMDR01", name: "Medienrecht", ects: 5, type: "pflicht", semester: 2, groups: [], examForm: "Klausur" },
  { id: "DLBMSM01", name: "Onlinemarketing", ects: 5, type: "pflicht", semester: 2, groups: [], examForm: "Klausur" },
  { id: "DLBMMF01", name: "Marktforschung", ects: 5, type: "pflicht", semester: 2, groups: [], examForm: "Klausur" },
  { id: "DLBMKP01", name: "Kommunikationspolitik", ects: 5, type: "pflicht", semester: 2, groups: [], examForm: "Klausur" },
  { id: "DLBDT01", name: "Projekt: Design Thinking", ects: 5, type: "pflicht", semester: 2, groups: [], examForm: "Projektbericht" },

  // --- 3. Semester ---
  { id: "DLBMSM02", name: "Social-Media-Marketing", ects: 5, type: "pflicht", semester: 3, groups: [], examForm: "Klausur" },
  { id: "DLBMSM02-02", name: "Social-Media-Marketing (zweiter Eintrag)", ects: 5, type: "pflicht", semester: 3, groups: [], examForm: "Klausur",
    duplicateOf: "DLBMSM02", possibleDuplicate: true },
  { id: "DLBMSEA01", name: "Search Engine Advertising (SEA)", ects: 5, type: "pflicht", semester: 3, groups: [], examForm: "Klausur" },
  { id: "DLBMSEO01", name: "Search Engine Optimization (SEO)", ects: 5, type: "pflicht", semester: 3, groups: [], examForm: "Klausur" },
  { id: "DLBMWA01", name: "Web-Analytics", ects: 5, type: "pflicht", semester: 3, groups: [], examForm: "Klausur" },
  { id: "DLBMSEM01", name: "Projekt: Suchmaschinenmarketing", ects: 5, type: "pflicht", semester: 3, groups: [], examForm: "Projektbericht" },

  // --- 4. Semester ---
  { id: "DLBMDBM01", name: "Projekt: Digitale Business-Modelle", ects: 5, type: "pflicht", semester: 4, groups: [], examForm: "Projektbericht" },
  { id: "DLBKIME01", name: "Seminar: KI im Marketing & E-Commerce", ects: 5, type: "pflicht", semester: 4, groups: [], examForm: "Seminararbeit" },
  { id: "DLBOSM01", name: "Online Sales Management", ects: 5, type: "pflicht", semester: 4, groups: [], examForm: "Klausur" },
  { id: "DLBMCJ01", name: "Projekt: Customer Journey", ects: 5, type: "pflicht", semester: 4, groups: [], examForm: "Projektbericht" },
  { id: "DLBMCRM01", name: "Customer Relationship Management", ects: 5, type: "pflicht", semester: 4, groups: [], examForm: "Klausur" },

  // --- 5. Semester (Pflicht) ---
  { id: "DLBMCMM01", name: "Projekt: Cross Media Marketing", ects: 5, type: "pflicht", semester: 5, groups: [], examForm: "Projektbericht" },

  // --- 6. Semester (Pflicht) ---
  { id: "DLBMGHA01", name: "Projekt: Growth Hack Analyse", ects: 5, type: "pflicht", semester: 6, groups: [], examForm: "Projektbericht" },
  { id: "BBAK01", name: "Bachelorarbeit", ects: 9, type: "pflicht", semester: 6, groups: [], examForm: "Bachelorarbeit" },
  { id: "BKOL01", name: "Kolloquium", ects: 1, type: "pflicht", semester: 6, groups: [], examForm: "Kolloquium" },

  // ============ WAHLPFLICHTBEREICH A (5. Sem, 10 ECTS) ============
  { id: "DLBDFC01", name: "Digital Future Commerce", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "C"], examForm: "Klausur" },
  { id: "DLBINDE01", name: "Innovation im Digital Environment", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A"], examForm: "Klausur" },
  { id: "DLBECI01", name: "E-Commerce I", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "C"], examForm: "Klausur" },
  { id: "DLBSMK01", name: "Projekt: Social Media Kampagne", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "C"], examForm: "Projektbericht" },
  { id: "DLBSOC01", name: "Social Commerce", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "C"], examForm: "Klausur" },
  { id: "DLBGGH01", name: "Grundlagen Growth Hacking", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "C"], examForm: "Klausur" },
  { id: "DLBGHT01", name: "Projekt: Growth Hacking Trends", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "C"], examForm: "Projektbericht" },
  { id: "DLBDSAI01", name: "Artificial Intelligence", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "B"], examForm: "Klausur" },
  { id: "BBUB01", name: "Buchführung und Bilanzierung", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "B", "C"], examForm: "Klausur" },
  { id: "BBWL01", name: "Betriebswirtschaftslehre (BWL)", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "B", "C"], examForm: "Klausur" },
  { id: "BPMG01", name: "Projektmanagement", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "B", "C"], examForm: "Klausur" },
  { id: "DLBKA01", name: "Kollaboratives Arbeiten", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "B", "C", "D"], examForm: "Workbook" },
  { id: "BEBD01", name: "Einkauf, Beschaffung und Distribution", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "B", "C"], examForm: "Klausur" },
  { id: "BINF01", name: "Investition und Finanzierung", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "B", "C"], examForm: "Klausur" },
  { id: "DLBAIF01", name: "Projekt: AI Fluency – Einführung in die generative KI", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "B", "C"], examForm: "Projektbericht" },
  { id: "DLSPEN01", name: "Fremdsprache Englisch", ects: 5, type: "wahlpflicht", semester: 5, groups: ["A", "B", "C"], examForm: "Sprachprüfung" },

  // ============ WAHLPFLICHTBEREICH B (5. Sem, 10 ECTS) ============
  { id: "DLBDHR01", name: "Digital HR", ects: 5, type: "wahlpflicht", semester: 5, groups: ["B", "C"], examForm: "Klausur" },
  { id: "DLBMMA01", name: "Projekt: Marketing Analytics", ects: 5, type: "wahlpflicht", semester: 5, groups: ["B", "C"], examForm: "Projektbericht" },
  { id: "DLBECII01", name: "E-Commerce II", ects: 5, type: "wahlpflicht", semester: 5, groups: ["B", "C"], examForm: "Klausur" },
  { id: "DLBMPP01", name: "Preispolitik", ects: 5, type: "wahlpflicht", semester: 5, groups: ["B", "C"], examForm: "Klausur" },
  { id: "DLBIM01", name: "Influencer Marketing", ects: 5, type: "wahlpflicht", semester: 5, groups: ["B", "C"], examForm: "Klausur" },
  { id: "DLBKMS01", name: "Projekt: Konfliktmanagement und Meinungsbildung in Social Media", ects: 5, type: "wahlpflicht", semester: 5, groups: ["B", "C"], examForm: "Projektbericht" },
  { id: "DLBAGH01", name: "Projekt: Angewandtes Growth Hacking", ects: 5, type: "wahlpflicht", semester: 5, groups: ["B"], examForm: "Projektbericht" },
  { id: "DLBITGH01", name: "Seminar: IT im Growth Hacking", ects: 5, type: "wahlpflicht", semester: 5, groups: ["B", "C"], examForm: "Seminararbeit" },

  // ============ WAHLPFLICHTBEREICH C (6. Sem, 10 ECTS) ============
  { id: "DLBALE01", name: "Advanced Leadership I und II", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur",
    subCourses: ["Advanced Leadership I", "Advanced Leadership II"] },
  { id: "DLBAMVR01", name: "Augmented, Mixed und Virtual Reality", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBCATM01", name: "Category Management", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBCMS01", name: "Content Management Systeme", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBCM01", name: "Content Marketing", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBSFSC01", name: "Projekt: CRM mit der Salesforce Service Cloud", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Projektbericht" },
  { id: "DLBCCD01", name: "Customer-Centered Data", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBCCT01", name: "Customer Centric Transformation", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBDABD01", name: "Data Analytics und Big Data", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBDDM01", name: "Data Driven Marketing", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBDMC01", name: "Digital and Mobile Campaigns", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBDFCO01", name: "Digital Finance und Controlling", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBDKP01", name: "Digitale Konsumentenpsychologie", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBGIM01", name: "Gestaltung interaktiver Medien", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBGEUI01", name: "Gestaltung und Ergonomie von User Interfaces", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBGWP01", name: "Grundlagen der Web-Programmierung", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBIMK01", name: "Internationales Marketing", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBIBM01", name: "Internationales Brand Management", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBCV01", name: "Einführung in Computer Vision", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBSCMP01", name: "KI-basierte Medienproduktion: Synthetic Content", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Projektbericht" },
  { id: "DLBKPR01", name: "Kommunikation und Public Relations", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBMKP02", name: "Marktpsychologie", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBNKP01", name: "Nachhaltigkeit aus Konsumentenperspektive", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBPKP01", name: "Persönlicher Karriereplan", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Portfolio" },
  { id: "DLBPEP01", name: "Persönlicher Elevator Pitch", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Portfolio" },
  { id: "DLBGIMCV01", name: "Internationales Brand Management (alt.)", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBNKPP01", name: "Projekt: Nachhaltigkeit aus Konsumentenperspektive", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Projektbericht" },
  { id: "DLBWSD01", name: "Projekt: Webshop Development", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Projektbericht" },
  { id: "DLBSFF01", name: "Project: Salesforce Fundamentals", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Projektbericht" },
  { id: "DLBATD01", name: "Seminar: Aktuelle Themen der Digitalisierung", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Seminararbeit" },
  { id: "DLBSMM01", name: "Social Media Monitoring", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBSTC01", name: "Statistical Computing", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBSG01", name: "Studium Generale I und II", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Workbook",
    subCourses: ["Studium Generale I", "Studium Generale II"] },
  { id: "DLBWSP01", name: "Webshop und Plattformen", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Klausur" },
  { id: "DLBAWS01", name: "Project: AWS – Cloud Essentials und Cloud Advanced", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Projektbericht",
    subCourses: ["Cloud Essentials", "Cloud Advanced"] },
  { id: "DLSPFR01", name: "Fremdsprache Französisch", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Sprachprüfung" },
  { id: "DLSPIT01", name: "Fremdsprache Italienisch", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Sprachprüfung" },
  { id: "DLSPSP01", name: "Fremdsprache Spanisch", ects: 5, type: "wahlpflicht", semester: 6, groups: ["C"], examForm: "Sprachprüfung" },

  // ============ WAHLPFLICHTBEREICH D (30 ECTS) ============
  // Weg 1: Praktikum
  { id: "DLBPOME01", name: "Praktikum: Online-Marketing & E-Commerce", ects: 30, type: "wahlpflicht", semester: null, groups: ["D"], examForm: "Praktikumsbericht",
    dPath: "praktikum" },
  // Weg 2: Alle sechs Module
  { id: "DLBIKO01", name: "Interaktion und Kommunikation in Organisationen", ects: 5, type: "wahlpflicht", semester: null, groups: ["D"], examForm: "Klausur", dPath: "module" },
  { id: "DLBIEH01", name: "Interkulturelle und ethische Handlungskompetenzen", ects: 5, type: "wahlpflicht", semester: null, groups: ["D"], examForm: "Klausur", dPath: "module" },
  { id: "DLBKAD01", name: "Kollaboratives Arbeiten (WPB D)", ects: 5, type: "wahlpflicht", semester: null, groups: ["D"], examForm: "Workbook", dPath: "module" },
  { id: "DLBPS01", name: "Personal Skills", ects: 5, type: "wahlpflicht", semester: null, groups: ["D"], examForm: "Portfolio", dPath: "module" },
  { id: "DLBPSP01", name: "Projekt: Public Speaking", ects: 5, type: "wahlpflicht", semester: null, groups: ["D"], examForm: "Projektbericht", dPath: "module" },
  { id: "DLBKMM01", name: "Konfliktmanagement und Mediation", ects: 5, type: "wahlpflicht", semester: null, groups: ["D"], examForm: "Klausur", dPath: "module" },

  // ============ ZUSATZANGEBOTE (ohne ECTS für den Bachelor) ============
  { id: "ZUS-IU01", name: "IU mitgestalten", ects: 0, type: "zusatz", semester: null, groups: [], examForm: "—" },
  { id: "ZUS-SPEN", name: "Sprachtraining Englisch", ects: 0, type: "zusatz", semester: null, groups: [], examForm: "—" },
  { id: "ZUS-SPFR", name: "Sprachtraining Französisch", ects: 0, type: "zusatz", semester: null, groups: [], examForm: "—" },
  { id: "ZUS-SPIT", name: "Sprachtraining Italienisch", ects: 0, type: "zusatz", semester: null, groups: [], examForm: "—" },
  { id: "ZUS-SPSP", name: "Sprachtraining Spanisch", ects: 0, type: "zusatz", semester: null, groups: [], examForm: "—" },
];
