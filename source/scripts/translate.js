const translations = {
  en: {
    heroTag: "Available for High-Impact Projects",
    heroTitle: "CREATIVE SOFTWARE ENGINEER & TECH ARCHITECT",
    heroSubtitle: "Hi, I'm Martin Manriquez (@holasoymalva). Forward Deployed Engineer (FDE) at Nexcar AI. Building next-gen AI tools, WebGL experiences, and high-performance distributed systems.",
    exploreBtn: "Explore Selected Works",
    terminalBtn: "Launch CLI Shell ~",
    
    ticker1: "META ALUMNI",
    ticker2: "NEXCAR AI FORWARD DEPLOYED ENGINEER",
    ticker3: "BLACKLINE SR SOFTWARE ENGINEER",
    ticker4: "GUROS TECH LEAD",
    ticker5: "CREATIVE CODING & AI AGENTS",

    aboutTag: "01 // ABOUT ME",
    aboutTitle: "Engineering with humor, precision & high speed.",
    aboutP1: "Forward Deployed Engineer based in Mexico City, building at the intersection of AI agents, distributed systems, and creative WebGL.",
    aboutP2: "Passionate about turning hard technical puzzles into fast, elegant, and engaging products — crafted with high precision, humor, and speed.",

    expTag: "02 // CAREER JOURNEY",
    expTitle: "Proven track record at top tech companies.",

    techTag: "03 // TECH STACK TOOLS",
    techTitle: "My tech stack tools.",

    projectsTag: "04 // FEATURED WORKS",
    projectsTitle: "Award-caliber applications & AI tools.",

    resourcesTag: "05 // KNOWLEDGE BASE",
    resourcesTitle: "Guides & Community Resources.",

    contactTag: "06 // GET IN TOUCH",
    contactTitle: "LET'S BUILD SOMETHING CRAZY TOGETHER",
    contactSub: "Have a project, startup idea, or technical challenge? Reach out and let's talk.",

    footerMsg: "Crafted with 🌮, WebGL & Good Vibes in Mexico City."
  },
  es: {
    heroTag: "Disponible para proyectos de alto impacto",
    heroTitle: "CREATIVE SOFTWARE ENGINEER & TECH ARCHITECT",
    heroSubtitle: "Hola, soy Martín Manríquez (@holasoymalva). Forward Deployed Engineer (FDE) en Nexcar AI. Construyendo herramientas de IA de última generación, experiencias WebGL y sistemas distribuidos de alto rendimiento.",
    exploreBtn: "Explorar Trabajos",
    terminalBtn: "Abrir Terminal CLI ~",

    ticker1: "META ALUMNI",
    ticker2: "NEXCAR AI FORWARD DEPLOYED ENGINEER",
    ticker3: "BLACKLINE SR SOFTWARE ENGINEER",
    ticker4: "GUROS TECH LEAD",
    ticker5: "HERRAMIENTAS IA & CLI",

    aboutTag: "01 // SOBRE MÍ",
    aboutTitle: "Ingeniería con precisión, velocidad y buen humor.",
    aboutP1: "Forward Deployed Engineer basado en Ciudad de México, creando en la frontera de agentes de IA, sistemas distribuidos y WebGL interactivo.",
    aboutP2: "Apasionado por transformar problemas técnicos complejos en software rápido, elegante y con personalidad — siempre con humor, precisión y alta velocidad.",

    expTag: "02 // TRAYECTORIA",
    expTitle: "Experiencia comprobada en líderes tecnológicos.",

    techTag: "03 // HERRAMIENTAS DE TECH STACK",
    techTitle: "Mis herramientas de tech stack.",

    projectsTag: "04 // PROYECTOS DESTACADOS",
    projectsTitle: "Aplicaciones de nivel internacional y herramientas de IA.",

    resourcesTag: "05 // KNOWLEDGE BASE",
    resourcesTitle: "Guías y Recursos de Comunidad.",

    contactTag: "06 // CONTACTO",
    contactTitle: "CONSTRUYAMOS ALGO INCREÍBLE JUNTOS",
    contactSub: "¿Tienes un proyecto, idea de startup o reto técnico? Hablemos.",

    footerMsg: "Creado con 🌮, WebGL & Buenas Vibras en Ciudad de México."
  }
};

function setLanguage(lang) {
  const t = translations[lang] || translations.en;
  
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  const langBtn = document.getElementById("languageButton");
  if (langBtn) {
    langBtn.textContent = lang === "en" ? "🇺🇸 EN" : "🇲🇽 ES";
  }

  localStorage.setItem("userLanguage", lang);
}

function initLanguage() {
  const savedLang = localStorage.getItem("userLanguage") || "en";
  setLanguage(savedLang);

  const langBtn = document.getElementById("languageButton");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const currentLang = localStorage.getItem("userLanguage") || "en";
      const nextLang = currentLang === "en" ? "es" : "en";
      setLanguage(nextLang);
    });
  }
}

document.addEventListener("DOMContentLoaded", initLanguage);
