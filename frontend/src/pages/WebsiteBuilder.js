import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { generateModularCode } from "./CodeGenerator";
import {
  FiPlus,
  FiTrash2,
  FiEye,
  FiSave,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiHelpCircle,
  FiEdit3,
  FiRefreshCw,
  FiDownload,
} from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "https://crm-1-5el5.onrender.com";

// Website Templates
const WEBSITE_TEMPLATES = {
  portfolio: {
    name: "Portfolio",
    description: "Showcase your work and projects",
    icon: "🎨",
    sections: [
      {
        id: "navbar-0",
        type: "navbar",
        title: "Navigation",
        content: "My Portfolio",
        logo: "🎨",
        backgroundColor: "#1f2937",
        textColor: "#ffffff",
        items: [
          { id: "nav-1", type: "link", content: "Home", properties: {} },
          { id: "nav-2", type: "link", content: "About", properties: {} },
          { id: "nav-3", type: "link", content: "Work", properties: {} },
          { id: "nav-4", type: "link", content: "Contact", properties: {} },
        ],
        order: 0,
      },
    ],
  },
  ecommerce: {
    name: "E-Commerce",
    description: "Sell your products online",
    icon: "🛍️",
    sections: [
      {
        id: "navbar-0",
        type: "navbar",
        title: "Store",
        content: "Shop",
        backgroundColor: "#dc2626",
        textColor: "#ffffff",
        items: [
          { id: "nav-1", type: "link", content: "Shop", properties: {} },
          { id: "nav-2", type: "link", content: "Categories", properties: {} },
          { id: "nav-3", type: "link", content: "Cart", properties: {} },
          { id: "nav-4", type: "link", content: "Account", properties: {} },
        ],
        order: 0,
      },
    ],
  },
  blog: {
    name: "Blog",
    description: "Share your thoughts and stories",
    icon: "📝",
    sections: [
      {
        id: "navbar-0",
        type: "navbar",
        title: "Blog",
        content: "My Blog",
        backgroundColor: "#3b82f6",
        textColor: "#ffffff",
        items: [
          { id: "nav-1", type: "link", content: "Home", properties: {} },
          { id: "nav-2", type: "link", content: "Articles", properties: {} },
          { id: "nav-3", type: "link", content: "Categories", properties: {} },
          { id: "nav-4", type: "link", content: "Contact", properties: {} },
        ],
        order: 0,
      },
    ],
  },
  service: {
    name: "Service",
    description: "Offer your professional services",
    icon: "🏢",
    sections: [
      {
        id: "navbar-0",
        type: "navbar",
        title: "Services",
        content: "Professional Services",
        backgroundColor: "#059669",
        textColor: "#ffffff",
        items: [
          { id: "nav-1", type: "link", content: "Home", properties: {} },
          { id: "nav-2", type: "link", content: "Services", properties: {} },
          { id: "nav-3", type: "link", content: "Pricing", properties: {} },
          { id: "nav-4", type: "link", content: "Contact", properties: {} },
        ],
        order: 0,
      },
    ],
  },
};

// Available Section Types
const SECTION_TYPES = {
  navbar: {
    name: "Navbar",
    icon: "🔗",
    description: "Navigation bar at the top",
    defaultContent: {
      type: "navbar",
      title: "Navigation",
      content: "Brand Name",
      logo: "🎨",
      backgroundColor: "#1f2937",
      textColor: "#ffffff",
      items: [
        { id: "nav-1", type: "link", content: "Home", properties: {} },
        { id: "nav-2", type: "link", content: "About", properties: {} },
        { id: "nav-3", type: "link", content: "Services", properties: {} },
        { id: "nav-4", type: "link", content: "Contact", properties: {} },
      ],
    },
  },
  hero: {
    name: "Hero",
    icon: "🎯",
    description: "Large headline banner section",
    defaultContent: {
      type: "hero",
      title: "Your Headline Here",
      content: "Add your subtitle or description",
      backgroundColor: "#3b82f6",
      textColor: "#ffffff",
      items: [],
    },
  },
  about: {
    name: "About",
    icon: "👋",
    description: "About company or author",
    defaultContent: {
      type: "about",
      title: "About Us",
      content: "Tell your story here...",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      items: [],
    },
  },
  services: {
    name: "Services",
    icon: "💼",
    description: "Showcase your services",
    defaultContent: {
      type: "services",
      title: "Our Services",
      content: "What we offer",
      backgroundColor: "#f3f4f6",
      textColor: "#000000",
      items: [
        { id: "svc-1", type: "card", content: "Service 1", properties: {} },
        { id: "svc-2", type: "card", content: "Service 2", properties: {} },
        { id: "svc-3", type: "card", content: "Service 3", properties: {} },
      ],
    },
  },
  features: {
    name: "Features",
    icon: "⭐",
    description: "Highlight key features",
    defaultContent: {
      type: "features",
      title: "Why Choose Us",
      content: "Our best features",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      items: [
        { id: "feat-1", type: "card", content: "Feature 1", properties: {} },
        { id: "feat-2", type: "card", content: "Feature 2", properties: {} },
        { id: "feat-3", type: "card", content: "Feature 3", properties: {} },
      ],
    },
  },
  testimonials: {
    name: "Testimonials",
    icon: "⭐⭐⭐",
    description: "Customer reviews and feedback",
    defaultContent: {
      type: "testimonials",
      title: "What Clients Say",
      content: "Real feedback from our customers",
      backgroundColor: "#f3f4f6",
      textColor: "#000000",
      items: [
        {
          id: "test-1",
          type: "card",
          content: '"Great product!" - Customer 1',
          properties: {},
        },
        {
          id: "test-2",
          type: "card",
          content: '"Highly recommended!" - Customer 2',
          properties: {},
        },
        {
          id: "test-3",
          type: "card",
          content: '"Best service ever!" - Customer 3',
          properties: {},
        },
      ],
    },
  },
  pricing: {
    name: "Pricing",
    icon: "💰",
    description: "Display pricing plans",
    defaultContent: {
      type: "pricing",
      title: "Our Plans",
      content: "Choose what works for you",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      items: [
        {
          id: "price-1",
          type: "card",
          content: "Basic - $9/mo",
          properties: {},
        },
        {
          id: "price-2",
          type: "card",
          content: "Pro - $29/mo",
          properties: {},
        },
        { id: "price-3", type: "card", content: "Enterprise", properties: {} },
      ],
    },
  },
  faq: {
    name: "FAQ",
    icon: "❓",
    description: "Frequently asked questions",
    defaultContent: {
      type: "faq",
      title: "Frequently Asked Questions",
      content: "Get answers to common questions",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      items: [
        { id: "faq-1", type: "card", content: "Question 1?", properties: {} },
        { id: "faq-2", type: "card", content: "Question 2?", properties: {} },
        { id: "faq-3", type: "card", content: "Question 3?", properties: {} },
      ],
    },
  },
  contact: {
    name: "Contact",
    icon: "📧",
    description: "Contact form and info",
    defaultContent: {
      type: "contact",
      title: "Get In Touch",
      content: "Contact us for more information",
      backgroundColor: "#1f2937",
      textColor: "#ffffff",
      items: [],
    },
  },
  footer: {
    name: "Footer",
    icon: "🔗",
    description: "Footer with links",
    defaultContent: {
      type: "footer",
      title: "Footer",
      content: "© 2024 Your Company",
      backgroundColor: "#1f2937",
      textColor: "#ffffff",
      items: [
        {
          id: "foot-1",
          type: "link",
          content: "Privacy Policy",
          properties: {},
        },
        { id: "foot-2", type: "link", content: "Terms", properties: {} },
        { id: "foot-3", type: "link", content: "Contact", properties: {} },
      ],
    },
  },
  cta: {
    name: "Call to Action",
    icon: "🚀",
    description: "Action button section",
    defaultContent: {
      type: "cta",
      title: "Ready to Get Started?",
      content: "Join thousands of happy customers",
      backgroundColor: "#dc2626",
      textColor: "#ffffff",
      items: [],
    },
  },
};

// Add Section Modal
const AddSectionModal = ({ onAdd, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Add a Section</h2>
            <button
              onClick={onClose}
              className="text-2xl text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(SECTION_TYPES).map(([key, section]) => (
              <button
                key={key}
                onClick={() => onAdd(key)}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition text-left group"
              >
                <div className="text-4xl mb-3">{section.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                  {section.name}
                </h3>
                <p className="text-sm text-gray-600">{section.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Onboarding Modal
const OnboardingModal = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">
            Welcome to Website Builder
          </h1>
          <p className="text-gray-600 mb-8">
            What type of website would you like to create?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(WEBSITE_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition text-left group"
              >
                <div className="text-5xl mb-4">{template.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                  {template.name}
                </h3>
                <p className="text-gray-600">{template.description}</p>
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-8">
            Don't worry! You can customize everything after selecting a
            template.
          </p>
        </div>
      </div>
    </div>
  );
};

// Main Builder
const WebsiteBuilder = () => {
  const token = useSelector((state) => state.auth.token);
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [syncStatus, setSyncStatus] = useState("ready"); // ready, saving, saved, error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [showCodeExport, setShowCodeExport] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentRoute, setCurrentRoute] = useState("/"); // For preview route testing
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [integrationSettings, setIntegrationSettings] = useState(null);
  const [formSubmissions, setFormSubmissions] = useState([]);

  useEffect(() => {
    initializeWebsite();
  }, []);

  // Clean up localStorage on init
  const cleanupLocalStorage = () => {
    try {
      // Remove old/unnecessary data
      const keysToRemove = [
        "websiteBuilderTourShown", // Not needed
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log("✓ Cleaned localStorage");
    } catch (e) {
      console.log("Cleanup error:", e.message);
    }
  };

  // Initialize website on load
  const initializeWebsite = async () => {
    try {
      console.log("=== INIT START ===");

      // Clean up old data first
      cleanupLocalStorage();

      // Restore preview state
      const savedPreviewState = localStorage.getItem(
        "websiteBuilderPreviewMode",
      );
      if (savedPreviewState === "true") {
        setShowPreview(true);
      }

      // Load from localStorage (instant)
      const cached = localStorage.getItem("websiteBuilderData");
      console.log(
        "LocalStorage data:",
        cached
          ? "EXISTS (" + (cached.length / 1024).toFixed(2) + "KB)"
          : "NOT FOUND",
      );

      if (cached) {
        try {
          const websiteData = JSON.parse(cached);
          console.log("✓ Parsed localStorage:", {
            title: websiteData.title,
            sections: websiteData.sections?.length || 0,
            sectionsType: typeof websiteData.sections,
          });

          // Sanitize sections from localStorage
          if (typeof websiteData.sections === "string") {
            try {
              websiteData.sections = JSON.parse(websiteData.sections);
            } catch {
              websiteData.sections = [];
            }
          }
          if (!Array.isArray(websiteData.sections)) {
            websiteData.sections = [];
          }

          setWebsite(websiteData);
          setLoading(false);

          // Verify with backend in background (don't block UI)
          setTimeout(() => verifyWithBackend(websiteData), 500);
          return;
        } catch (e) {
          console.error("Parse error:", e.message);
          localStorage.removeItem("websiteBuilderData");
        }
      }

      // No cache - try backend
      console.log("No cache, loading from backend...");
      setLoading(true);
      await loadFromBackend();
    } catch (error) {
      console.error("Initialize error:", error);
      setLoading(false);
      setShowOnboarding(true);
    }
  };

  // Load from backend
  const loadFromBackend = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/website-builder/my-website`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data?._id) {
        // Ensure sections is an array, not stringified
        let websiteData = response.data;
        if (typeof websiteData.sections === "string") {
          try {
            websiteData.sections = JSON.parse(websiteData.sections);
          } catch {
            websiteData.sections = [];
          }
        }
        if (!Array.isArray(websiteData.sections)) {
          websiteData.sections = [];
        }

        setWebsite(websiteData);
        localStorage.setItem("websiteBuilderData", JSON.stringify(websiteData));
        console.log("✓ Loaded from backend:", websiteData.title);
        setLastSyncTime(new Date());
        return true;
      }
      return false;
    } catch (error) {
      console.log("Backend load failed:", error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verify current data with backend
  const verifyWithBackend = async (localData) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/website-builder/my-website`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.data?._id) return; // No backend data

      const backendData = response.data;
      console.log("Backend verification:", {
        local: localData.sections?.length,
        backend: backendData.sections?.length,
      });

      // If backend has more sections, merge
      if (backendData.sections?.length > localData.sections?.length) {
        console.log("Backend has newer data, updating...");
        setWebsite(backendData);
        localStorage.setItem("websiteBuilderData", JSON.stringify(backendData));
      }
      setLastSyncTime(new Date());
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  };

  // Auto-save whenever website changes
  useEffect(() => {
    if (!website) return;

    // Save to localStorage immediately
    try {
      const jsonString = JSON.stringify(website);
      localStorage.setItem("websiteBuilderData", jsonString);
      setSyncStatus("ready");
      console.log(
        "✓ Saved to localStorage:",
        website.sections?.length,
        "sections, size:",
        (jsonString.length / 1024).toFixed(2),
        "KB",
      );
    } catch (error) {
      console.error("LocalStorage error:", error.name);

      if (error.name === "QuotaExceededError") {
        // Storage full - clear old cache and try again
        try {
          localStorage.clear(); // Nuclear option
          localStorage.setItem("websiteBuilderData", JSON.stringify(website));
          toast.error("Storage was full, cleared cache. Data saved.", {
            duration: 2000,
          });
          console.log("✓ Cleared storage and saved");
        } catch (e) {
          toast.error("Cannot save - storage full", { duration: 2000 });
          setSyncStatus("error");
        }
      }
    }

    // Debounced backend sync
    if (autoSaveTimer) clearTimeout(autoSaveTimer);

    const timer = setTimeout(() => {
      setSyncStatus("saving");
      syncToBackend();
    }, 2000);

    setAutoSaveTimer(timer);
    return () => clearTimeout(timer);
  }, [website]);

  const handleTemplateSelect = (templateKey) => {
    const template = WEBSITE_TEMPLATES[templateKey];
    console.log("Template selected:", templateKey);
    console.log("Template sections before copy:", template.sections);

    // Deep copy sections to prevent accidental mutation/stringification
    let sectionsCopy;
    try {
      sectionsCopy = JSON.parse(JSON.stringify(template.sections));
      console.log("Deep copy successful, sectionsCopy:", sectionsCopy);
    } catch (e) {
      console.error("Failed to deep copy sections:", e);
      sectionsCopy = template.sections;
    }

    const newWebsite = {
      _id: "new",
      title: `${template.name} Website`,
      description: `Welcome to my ${template.name} website`,
      sections: sectionsCopy,
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        accent: "#f59e0b",
      },
      isPublished: false,
    };
    console.log("New website created with sections:", newWebsite.sections);
    setWebsite(newWebsite);
    setShowOnboarding(false);

    // Save to localStorage immediately
    localStorage.setItem("websiteBuilderData", JSON.stringify(newWebsite));

    // Auto-select navbar section
    const navbarSection = newWebsite.sections.find((s) => s.type === "navbar");
    if (navbarSection) {
      setSelectedElement({ sectionId: navbarSection.id, elementId: null });
    }

    toast.success("Website template loaded! Customize it to your needs.");
  };

  // Smart sync to backend
  const syncToBackend = async () => {
    try {
      setSyncStatus("saving");

      // Only sync essential data to backend (keep localStorage for full data)
      let sections = website.sections;

      console.log("=== SYNC DEBUG ===");
      console.log("Raw sections from website state:", sections);
      console.log("Sections type:", typeof sections);
      console.log("Is array?", Array.isArray(sections));
      if (Array.isArray(sections) && sections.length > 0) {
        console.log("First section:", sections[0]);
        console.log("First section type:", typeof sections[0]);
      }

      // Ensure sections is an array and not stringified
      if (typeof sections === "string") {
        try {
          sections = JSON.parse(sections);
        } catch {
          sections = [];
        }
      }
      if (!Array.isArray(sections)) {
        sections = [];
      }

      // Additional safety: ensure no section is stringified
      sections = sections.map((section, idx) => {
        if (typeof section === "string") {
          console.warn(`Section ${idx} is stringified, attempting to parse...`);
          try {
            return JSON.parse(section);
          } catch (e) {
            console.error(`Failed to parse section ${idx}:`, e);
            return { type: "error", content: "Invalid section" };
          }
        }
        // Ensure it's an object with required fields
        if (typeof section !== "object" || section === null) {
          console.warn(`Section ${idx} is not an object:`, typeof section);
          return { type: "error", content: "Invalid section type" };
        }
        return section;
      });

      const syncData = {
        title: String(website.title || "Untitled"),
        description: String(website.description || ""),
        sections: sections,
        colors: website.colors || {
          primary: "#3b82f6",
          secondary: "#10b981",
          accent: "#f59e0b",
        },
        isPublished: Boolean(website.isPublished),
      };

      console.log("Syncing:", {
        size: (JSON.stringify(syncData).length / 1024).toFixed(2) + "KB",
        sections: syncData.sections.length,
        sectionsType: typeof syncData.sections,
        firstSectionType: typeof syncData.sections[0],
      });

      const response = await axios.put(
        `${API_URL}/api/website-builder/update-full`,
        syncData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      if (response.data?.sections?.length === website.sections?.length) {
        setSyncStatus("saved");
        setLastSyncTime(new Date());
        console.log(
          "✓ Synced to MongoDB:",
          response.data.sections?.length,
          "sections",
        );
      } else {
        console.warn("Sync mismatch, keeping localStorage");
        setSyncStatus("ready");
      }

      setTimeout(() => setSyncStatus("ready"), 2000);
    } catch (error) {
      console.log("Sync error (data safe in localStorage):", error.message);
      setSyncStatus("ready");
    }
  };

  // Manual save with feedback
  const manualSaveWebsite = async () => {
    try {
      setSyncStatus("saving");
      localStorage.setItem("websiteBuilderData", JSON.stringify(website));
      await syncToBackend();
      toast.success("Website saved successfully!");
    } catch (error) {
      setSyncStatus("ready");
      toast.error("Saved locally, sync pending");
    }
  };

  // Load integration settings
  const loadIntegrationSettings = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/website-builder/integration/settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setIntegrationSettings(response.data.integrations);
      loadFormSubmissions();
    } catch (error) {
      console.error("Failed to load integration settings:", error);
      toast.error("Failed to load integration settings");
    }
  };

  // Load form submissions
  const loadFormSubmissions = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/website-builder/integration/submissions?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFormSubmissions(response.data.submissions);
    } catch (error) {
      console.error("Failed to load form submissions:", error);
    }
  };

  // Generate new API key
  const generateNewAPIKey = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/website-builder/integration/generate-api-key`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("API key generated successfully!");
      
      // Copy API key to clipboard
      navigator.clipboard.writeText(response.data.apiKey);
      toast.success("API key copied to clipboard");
      
      // Show modal with secret
      alert(
        `API Secret (save this now, you won't see it again):\n\n${response.data.apiSecret}`
      );
      
      loadIntegrationSettings();
    } catch (error) {
      toast.error("Failed to generate API key");
    }
  };

  // Update form field mappings
  const updateFormMappings = async (mappings) => {
    try {
      await axios.put(
        `${API_URL}/api/website-builder/integration/form-mappings`,
        { formMappings: mappings },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Form mappings updated successfully!");
      loadIntegrationSettings();
    } catch (error) {
      toast.error("Failed to update form mappings");
    }
  };

  // Generate modular React code with separate files
  const generateReactCode = () => {
    return generateModularCode(website);

    const navbarSection = website.sections?.find((s) => s.type === "navbar");
    const otherSections =
      website.sections?.filter((s) => s.type !== "navbar") || [];

    const files = {}; // Will store {filename: content}

    // Generate Navbar Code
    let navbarCode = "";
    if (navbarSection) {
      const navLinks = (navbarSection.items || [])
        .map((item) => {
          const style = item.properties || {};
          return `<a 
                  href="#" 
                  style={{
                    fontSize: "${style.fontSize || 16}px",
                    fontWeight: "${style.fontWeight || "normal"}",
                    color: "${style.color || navbarSection.textColor || "#000000"}"
                  }}
                  className="hover:opacity-75 transition"
                >
                  ${item.content}
                </a>`;
        })
        .join("\n          ");

      // Add logo if it exists
      const logoHTML = navbarSection.logo
        ? `<img 
          src="${navbarSection.logo}" 
          alt="Logo" 
          style={{ height: "40px", width: "auto", marginRight: "12px" }}
        />`
        : "";

      navbarCode = `{/* Navbar Section */}
  <nav style={{
    backgroundColor: "${navbarSection.backgroundColor || "#ffffff"}",
    color: "${navbarSection.textColor || "#000000"}"
  }} className="sticky top-0 shadow-md">
    <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        ${logoHTML}
        <h1 style={{
          fontSize: "24px",
          fontWeight: "bold"
        }}>
          ${navbarSection.content}
        </h1>
      </div>
      <div className="flex gap-6">
        ${navLinks}
      </div>
    </div>
  </nav>`;
    }

    // Generate sections with all items and their exact properties
    let sectionsCode = "";
    if (otherSections.length > 0) {
      const sections = otherSections
        .map((section) => {
          let itemsHTML = "";

          if (section.items && section.items.length > 0) {
            itemsHTML = section.items
              .map((item) => {
                const props = item.properties || {};
                const style = {
                  fontSize: props.fontSize || 16,
                  fontWeight: props.fontWeight || "normal",
                  color: props.color || section.textColor || "#000000",
                  backgroundColor: props.backgroundColor || "transparent",
                  padding: `${props.padding || 0}px`,
                  margin: `${props.margin || 0}px`,
                };

                // Generate based on item type
                if (item.type === "link") {
                  return `<a 
            href="#" 
            style={${JSON.stringify(style)}}
            className="hover:opacity-75 transition underline"
          >
            ${item.content}
          </a>`;
                } else if (item.type === "button") {
                  return `<button 
            style={${JSON.stringify(style)}}
            className="px-6 py-2 rounded-lg hover:opacity-80 transition font-semibold"
          >
            ${item.content}
          </button>`;
                } else if (item.type === "card") {
                  return `<div 
            style={{
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "${props.backgroundColor || "#f3f4f6"}",
              ...${JSON.stringify(style)}
            }}
            className="rounded-lg shadow-md"
          >
            <p>${item.content}</p>
          </div>`;
                } else {
                  return `<p style={${JSON.stringify(style)}} className="mb-4">
            ${item.content}
          </p>`;
                }
              })
              .join("\n\n          ");

            itemsHTML = `<div className="space-y-4 mt-8">
          ${itemsHTML}
        </div>`;
          }

          return `{/* ${section.type} Section */}
  <section style={{
    backgroundColor: "${section.backgroundColor || "#ffffff"}",
    color: "${section.textColor || "#000000"}",
    padding: "40px 20px"
  }} className="w-full">
    <div className="max-w-4xl mx-auto">
      <h2 style={{
        fontSize: "36px",
        fontWeight: "bold",
        marginBottom: "16px"
      }}>
        ${section.title || "Section Title"}
      </h2>
      <p style={{
        fontSize: "18px",
        marginBottom: "24px",
        opacity: 0.9
      }}>
        ${section.content || "Section content"}
      </p>
      ${itemsHTML}
    </div>
  </section>`;
        })
        .join("\n\n  ");

      sectionsCode = sections;
    }

    const componentName =
      website.title?.replace(/[^a-zA-Z0-9]/g, "") || "Website";

    // Generate CSS for the component
    const cssCode = `/* Auto-generated CSS */
:root {
  --primary-color: ${website.colors?.primary || "#3b82f6"};
  --secondary-color: ${website.colors?.secondary || "#10b981"};
  --accent-color: ${website.colors?.accent || "#f59e0b"};
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.${componentName.toLowerCase()}-container {
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
}

nav {
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

nav div {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

nav h1 {
  font-size: 24px;
  font-weight: bold;
}

nav a {
  transition: opacity 0.2s;
}

nav a:hover {
  opacity: 0.75;
}

section {
  width: 100%;
  padding: 40px 20px;
}

section > div {
  max-width: 56rem;
  margin: 0 auto;
}

section h2 {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 16px;
}

section p {
  font-size: 18px;
  margin-bottom: 24px;
  opacity: 0.9;
}

.space-y-4 > * + * {
  margin-top: 16px;
}

.space-y-4 {
  display: flex;
  flex-direction: column;
  margin-top: 32px;
}

button {
  padding: 8px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}

button:hover {
  opacity: 0.8;
}

a {
  text-decoration: none;
  transition: opacity 0.2s;
}

a:hover {
  opacity: 0.75;
}

div[class*="rounded"] {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  nav div {
    flex-direction: column;
    align-items: flex-start;
  }

  section h2 {
    font-size: 28px;
  }

  section p {
    font-size: 16px;
  }
}`;

    // Full React component with inline styles
    const fullCode = `import React from 'react';
import './${componentName}.css'; // Make sure to create this CSS file

/**
 * ⚡ Auto-generated Website Component
 * Website: ${website.title || "Untitled"}
 * Created: ${new Date().toLocaleString()}
 * 
 * This component was generated by Website Builder CRM
 * All styling and layout is included below
 */

export default function ${componentName}() {
  return (
    <div className="${componentName.toLowerCase()}-container">
      {/* ===== ${website.title || "Untitled"} ===== */}
      
      ${navbarCode}

      ${sectionsCode}
    </div>
  );
}

/**
 * STYLING GUIDE:
 * 
 * Colors:
 * - Primary: ${website.colors?.primary || "#3b82f6"}
 * - Secondary: ${website.colors?.secondary || "#10b981"}
 * - Accent: ${website.colors?.accent || "#f59e0b"}
 * 
 * To customize, edit the CSS file: ${componentName}.css
 */`;

    // Return both files
    const result = {
      jsx: fullCode,
      css: cssCode,
      combined: `/* ===== CSS FILE: ${componentName}.css ===== */\n${cssCode}\n\n/* ===== JSX FILE: ${componentName}.jsx ===== */\n${fullCode}`,
    };

    return result.combined;
  };

  const handleAddSection = (sectionTypeKey) => {
    const sectionType = SECTION_TYPES[sectionTypeKey];
    const newSection = {
      id: `${sectionTypeKey}-${Date.now()}`,
      ...sectionType.defaultContent,
      order: (website.sections?.length || 0) + 1,
    };

    setWebsite({
      ...website,
      sections: [...(website.sections || []), newSection],
    });

    setShowAddSection(false);
    toast.success(`${sectionType.name} section added!`);
  };

  const addElement = (type) => {
    const newElement = {
      id: `${type}-${Date.now()}`,
      type,
      content: `New ${type}`,
      properties: {
        fontSize: 16,
        fontWeight: "normal",
        color: "#000000",
        backgroundColor: "#ffffff",
        padding: 15,
        margin: 10,
        textAlign: "left",
        borderRadius: 5,
        width: "100%",
        height: "auto",
        display: "block",
      },
    };

    const updatedSections = website.sections.map((section) => {
      if (section.id === selectedElement?.sectionId) {
        return {
          ...section,
          items: [...(section.items || []), newElement],
        };
      }
      return section;
    });

    setWebsite({ ...website, sections: updatedSections });
    toast.success(`${type} added`);
  };

  const updateElement = (elementId, properties) => {
    const updatedSections = website.sections.map((section) => {
      if (section.id === selectedElement?.sectionId) {
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === elementId
              ? { ...item, properties: { ...item.properties, ...properties } }
              : item,
          ),
        };
      }
      return section;
    });

    setWebsite({ ...website, sections: updatedSections });
  };

  const deleteElement = (elementId) => {
    const updatedSections = website.sections.map((section) => {
      if (section.id === selectedElement?.sectionId) {
        return {
          ...section,
          items: section.items.filter((item) => item.id !== elementId),
        };
      }
      return section;
    });

    setWebsite({ ...website, sections: updatedSections });
    setSelectedElement(null);
    toast.success("Element deleted");
  };

  const updateSectionContent = (sectionId, updates) => {
    const updatedSections = website.sections.map((section) =>
      section.id === sectionId ? { ...section, ...updates } : section,
    );
    setWebsite({ ...website, sections: updatedSections });
  };

  const handleDragStart = (e, element, sectionId) => {
    setDraggedElement({ element, sectionId });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetSectionId) => {
    e.preventDefault();
    if (!draggedElement) return;
    setDraggedElement(null);
    toast.success("Element reordered");
  };

  const startTour = () => {
    toast.info("Tour feature coming soon!");
  };

  if (loading && !website) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Website Builder...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding || !website) {
    return <OnboardingModal onSelect={handleTemplateSelect} />;
  }

  if (showAddSection) {
    return (
      <AddSectionModal
        onAdd={handleAddSection}
        onClose={() => setShowAddSection(false)}
      />
    );
  }

  // Code Export Modal
  if (showCodeExport && website) {
    const files = generateReactCode();
    const fileNames = Object.keys(files).sort();
    const currentFile = selectedFile || fileNames[0];
    const currentCode = files[currentFile] || "";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
            <h2 className="text-2xl font-bold text-gray-800">
              📄 Export Modular React Code
            </h2>
            <button
              onClick={() => {
                setShowCodeExport(false);
                setSelectedFile(null);
              }}
              className="text-2xl text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          {/* File Tabs */}
          <div className="flex gap-1 px-4 py-2 overflow-x-auto border-b border-gray-300 bg-gray-50 flex-shrink-0">
            {fileNames.map((file) => (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`px-3 py-1 text-sm font-medium rounded-t transition whitespace-nowrap ${
                  currentFile === file
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {file}
              </button>
            ))}
          </div>

          {/* Code Display Area */}
          <div className="flex-1 overflow-y-auto bg-gray-900 p-4">
            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap break-words">
              {currentCode}
            </pre>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-300 bg-white flex gap-2 flex-shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentCode);
                toast.success(`${currentFile} copied!`);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              <FiCopy size={18} />
              Copy {currentFile}
            </button>
            <button
              onClick={() => {
                // Download all files as separate files
                fileNames.forEach((file) => {
                  const element = document.createElement("a");
                  const blob = new Blob([files[file]], { type: "text/plain" });
                  element.href = URL.createObjectURL(blob);
                  element.download = file;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                });
                toast.success("All files downloaded!");
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              <FiDownload size={18} />
              Download All
            </button>
            <p className="text-sm text-gray-600 ml-auto my-auto">
              📦 {fileNames.length} files • Copy each file individually or
              download all
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Integration Modal
  if (showIntegrationModal && website) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">🔌 Website Integration</h2>
            <button
              onClick={() => setShowIntegrationModal(false)}
              className="text-2xl text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* API Credentials Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📝 API Credentials</h3>
              
              {integrationSettings?.apiKey ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={integrationSettings.apiKey}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(integrationSettings.apiKey);
                          toast.success("API key copied!");
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={generateNewAPIKey}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                  >
                    🔄 Regenerate API Key
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-700 mb-4">No API credentials yet. Generate them to start receiving form submissions.</p>
                  <button
                    onClick={generateNewAPIKey}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-bold text-lg"
                  >
                    🔑 Generate API Credentials
                  </button>
                </div>
              )}
            </div>

            {/* Field Mappings Section */}
            {integrationSettings?.apiKey && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Form Field Mappings</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Map your form fields to CRM contact fields so submissions are automatically saved as leads.
                </p>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {/* Standard CRM fields for mapping */}
                  {["firstName", "lastName", "email", "phone", "company", "website"].map((crmField) => (
                    <div key={crmField} className="flex gap-2 items-center">
                      <label className="w-32 text-sm font-medium text-gray-700">
                        {crmField.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      <input
                        type="text"
                        placeholder={`Form field name for ${crmField}`}
                        defaultValue={
                          integrationSettings?.formMappings?.find(
                            (m) => m.crmField === crmField
                          )?.fieldName || ""
                        }
                        onChange={(e) => {
                          const newMappings = [...(integrationSettings?.formMappings || [])];
                          const existingIndex = newMappings.findIndex(
                            (m) => m.crmField === crmField
                          );
                          
                          if (e.target.value.trim()) {
                            if (existingIndex >= 0) {
                              newMappings[existingIndex].fieldName = e.target.value;
                            } else {
                              newMappings.push({
                                fieldName: e.target.value,
                                crmField,
                              });
                            }
                          } else if (existingIndex >= 0) {
                            newMappings.splice(existingIndex, 1);
                          }
                          
                          updateFormMappings(newMappings);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code Example Section */}
            {integrationSettings?.apiKey && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📄 Integration Code</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Add this code to your form to submit data to the CRM:
                </p>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const handleFormSubmit = async (formData) => {
  const response = await fetch(
    '${API_URL}/api/website-builder/api/form-submission',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: '${integrationSettings.apiKey}',
        formData: formData,
        source: window.location.href
      })
    }
  );
  return response.json();
};`}
                </pre>
                <button
                  onClick={() => {
                    const code = `const handleFormSubmit = async (formData) => {
  const response = await fetch(
    '${API_URL}/api/website-builder/api/form-submission',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: '${integrationSettings.apiKey}',
        formData: formData,
        source: window.location.href
      })
    }
  );
  return response.json();
};`;
                    navigator.clipboard.writeText(code);
                    toast.success("Code copied!");
                  }}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Copy Code
                </button>
              </div>
            )}

            {/* Submissions Section */}
            {integrationSettings?.apiKey && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">📥 Recent Form Submissions</h3>
                  <span className="text-sm bg-purple-200 text-purple-800 px-2 py-1 rounded">
                    {formSubmissions.length} submissions
                  </span>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formSubmissions.length === 0 ? (
                    <p className="text-gray-600 text-sm text-center py-4">
                      No submissions yet. Once forms are submitted, they'll appear here.
                    </p>
                  ) : (
                    formSubmissions.slice(0, 10).map((submission) => (
                      <div
                        key={submission.submissionId}
                        className="p-3 bg-white border border-gray-200 rounded text-sm"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-800">
                            {submission.data?.email || "No email"}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              submission.processed
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {submission.processed ? "✓ Processed" : "Pending"}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          {JSON.stringify(submission.data)
                            .substring(0, 100)
                            .concat("...")}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(submission.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setShowIntegrationModal(false)}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSection = website.sections.find(
    (s) => s.id === selectedElement?.sectionId,
  );
  const currentElement = currentSection?.items?.find(
    (i) => i.id === selectedElement?.elementId,
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-300 text-gray-900 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">🌐 Website Builder</h1>
          <div className="text-xs px-2 py-1 rounded">
            {syncStatus === "saving" && (
              <span className="text-blue-300 animate-pulse">💾 Saving...</span>
            )}
            {syncStatus === "saved" && (
              <span className="text-green-300">✓ Saved</span>
            )}
            {syncStatus === "error" && (
              <span className="text-red-300">⚠ Check connection</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {!showPreview && (
            <>
              <button
                onClick={manualSaveWebsite}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg transition font-semibold"
                title="Manual save (auto-saves every 2 seconds)"
              >
                💾 Save
              </button>
              {website.sections?.some((s) => s.type === "navbar") && (
                <button
                  onClick={() => {
                    const navbarSection = website.sections.find(
                      (s) => s.type === "navbar",
                    );
                    if (navbarSection) {
                      setSelectedElement({
                        sectionId: navbarSection.id,
                        elementId: null,
                      });
                    }
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition font-semibold"
                  title="Click to edit navbar"
                >
                  🔗 Navbar
                </button>
              )}
            </>
          )}
          <button
            onClick={() => {
              const newPreviewState = !showPreview;
              setShowPreview(newPreviewState);
              localStorage.setItem(
                "websiteBuilderPreviewMode",
                String(newPreviewState),
              );
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transition font-semibold whitespace-nowrap"
            title={showPreview ? "Back to editor" : "Preview website"}
          >
            <FiEye size={18} />
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={() => setShowCodeExport(true)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow-lg transition font-semibold"
            title="Export React code"
          >
            <FiDownload size={18} />
            Code
          </button>
          <button
            onClick={() => {
              setShowIntegrationModal(true);
              loadIntegrationSettings();
            }}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow-lg transition font-semibold"
            title="Integrate with external websites"
          >
            🔌 Integration
          </button>
          <button
            onClick={startTour}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition font-semibold"
            title="Start guided tour"
          >
            <FiHelpCircle size={18} />
            Tour
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {showPreview ? (
          // Preview Mode
          <div className="w-full flex-1 flex flex-col relative">
            {/* Floating Back Button */}
            <button
              onClick={async () => {
                setShowPreview(false);
                localStorage.setItem("websiteBuilderPreviewMode", "false");
              }}
              className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg transition font-semibold"
            >
              ← Back to Edit
            </button>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto bg-white">
              {/* Route Indicator */}
              {currentRoute !== "/" && (
                <div className="sticky top-0 z-40 bg-blue-100 border-b-2 border-blue-500 px-4 py-2">
                  <p className="text-sm font-semibold text-blue-800">
                    📍 Current Route:{" "}
                    <code className="bg-blue-200 px-2 py-1 rounded">
                      {currentRoute}
                    </code>
                    <button
                      onClick={() => setCurrentRoute("/")}
                      className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Home
                    </button>
                  </p>
                </div>
              )}

              {console.log("PREVIEW DEBUG:", {
                hasWebsite: !!website,
                title: website?.title,
                sectionsLength: website?.sections?.length,
                sections: website?.sections?.map((s) => ({
                  type: s.type,
                  id: s.id,
                })),
                currentRoute,
              })}
              {website?.sections && website.sections.length > 0 ? (
                (() => {
                  // Separate navbar and other sections
                  const navbarSection = website.sections.find(
                    (s) => s.type === "navbar",
                  );
                  const otherSections = website.sections.filter(
                    (s) => s.type !== "navbar",
                  );

                  // Render navbar first, then other sections
                  const sectionsToRender = [
                    ...(navbarSection ? [navbarSection] : []),
                    ...otherSections.sort(
                      (a, b) => (a.order || 0) - (b.order || 0),
                    ),
                  ];

                  return sectionsToRender.map((section) => {
                    console.log("Rendering section:", section.type, section.id);
                    // Navbar section
                    if (section.type === "navbar") {
                      return (
                        <nav
                          key={section.id}
                          style={{
                            backgroundColor:
                              section.backgroundColor || "#ffffff",
                            color: section.textColor || "#000000",
                          }}
                          className="sticky top-0 shadow-md"
                        >
                          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {section.logo ? (
                                <div
                                  style={{
                                    height: `${section.logoHeight || 40}px`,
                                    width: `${section.logoWidth || 40}px`,
                                    borderRadius: `${section.logoBorderRadius || 0}%`,
                                    overflow: "hidden",
                                    opacity: section.logoOpacity || 1,
                                    boxShadow: section.logoShadow || "none",
                                    border: section.logoBorder
                                      ? `${section.logoBorder}px solid ${section.logoBorderColor || "#000000"}`
                                      : "none",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <img
                                    src={section.logo}
                                    alt="Logo"
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-opacity-30 rounded flex items-center justify-center text-sm">
                                  📦
                                </div>
                              )}
                              <h1 className="text-xl font-bold">
                                {section.content}
                              </h1>
                            </div>
                            <div className="flex gap-6">
                              {section.items?.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    const href = item.href || "/";
                                    if (item.linkType === "internal") {
                                      setCurrentRoute(href);
                                      toast.success(`Route: ${href}`);
                                    } else if (item.linkType === "anchor") {
                                      // Scroll to anchor
                                      const id = href.replace("#", "");
                                      const element =
                                        document.getElementById(id);
                                      if (element) {
                                        element.scrollIntoView({
                                          behavior: "smooth",
                                        });
                                      }
                                    } else {
                                      // External link
                                      window.open(
                                        href,
                                        item.target === "_blank"
                                          ? "_blank"
                                          : "_self",
                                      );
                                    }
                                  }}
                                  className="hover:opacity-75 transition bg-none border-none cursor-pointer text-inherit p-0"
                                >
                                  {item.content}
                                </button>
                              ))}
                            </div>
                          </div>
                        </nav>
                      );
                    }
                    // Other sections - only render if not a default template section
                    if (
                      section.id &&
                      section.id.match(
                        /^(hero|about|featured|benefits|newsletter|recent|category|services|pricing|cta)-\d+$/,
                      )
                    ) {
                      return null; // Don't render default template sections
                    }

                    // Custom sections added by user
                    return (
                      <div
                        key={section.id}
                        style={{
                          backgroundColor: section.backgroundColor || "#ffffff",
                          color: section.textColor || "#000000",
                        }}
                        className="min-h-screen flex flex-col justify-center items-center px-8"
                      >
                        <div className="max-w-4xl mx-auto w-full">
                          <h1 className="text-4xl font-bold mb-4">
                            {section.title}
                          </h1>
                          <p className="text-xl mb-8 opacity-90">
                            {section.content}
                          </p>
                          {section.items && section.items.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {section.items.map((item) => (
                                <div
                                  key={item.id}
                                  style={item.properties}
                                  className="rounded-lg p-6"
                                >
                                  <p className="font-semibold">
                                    {item.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No sections to display</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Left Sidebar - Elements Panel */}
            <div className="w-64 bg-white shadow-lg overflow-y-auto elements-panel border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Elements
                </h2>
                <div className="space-y-2 element-types">
                  {[
                    "heading",
                    "paragraph",
                    "button",
                    "image",
                    "card",
                    "input",
                    "spacer",
                  ].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        selectedElement?.sectionId && addElement(type)
                      }
                      disabled={!selectedElement?.sectionId}
                      className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded text-sm font-medium transition"
                    >
                      <FiPlus className="inline mr-2" /> {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections List */}
              <div className="p-4 border-b border-gray-200 sections-list">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">
                    Sections
                  </h3>
                  <button
                    onClick={() => setShowAddSection(true)}
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition"
                    title="Add new section"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-2">
                  {website.sections
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((section) => (
                      <div
                        key={section.id}
                        onClick={() =>
                          setSelectedElement({
                            sectionId: section.id,
                            elementId: null,
                          })
                        }
                        className={`p-3 rounded cursor-pointer transition ${
                          selectedElement?.sectionId === section.id
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <p className="font-medium capitalize">{section.type}</p>
                        <p className="text-xs opacity-75">
                          {section.items?.length || 0} elements
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Center - Canvas */}
            <div className="flex-1 overflow-y-auto p-6 canvas-area bg-gray-50">
              {/* Navbar Preview - Always Show */}
              {(() => {
                const navbarSection = website.sections.find(
                  (s) => s.type === "navbar",
                );
                if (!navbarSection) return null;
                return (
                  <div
                    onClick={() =>
                      setSelectedElement({
                        sectionId: navbarSection.id,
                        elementId: null,
                      })
                    }
                    style={{
                      backgroundColor:
                        navbarSection.backgroundColor || "#1f2937",
                      color: navbarSection.textColor || "#ffffff",
                    }}
                    className={`mb-6 p-4 rounded-lg shadow-lg flex justify-between items-center transition cursor-pointer ${
                      selectedElement?.sectionId === navbarSection.id
                        ? "ring-4 ring-blue-400"
                        : "hover:shadow-xl"
                    }`}
                    title="Click to edit navbar"
                  >
                    <div className="flex items-center gap-3">
                      {navbarSection.logo ? (
                        <img
                          src={navbarSection.logo}
                          alt="Logo"
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-opacity-30 rounded flex items-center justify-center text-sm font-bold">
                          📦
                        </div>
                      )}
                      <span className="text-lg font-bold">
                        {navbarSection.content || "Brand Name"}
                      </span>
                    </div>
                    <div className="flex gap-6 items-center">
                      {navbarSection.items?.map((item) => (
                        <span
                          key={item.id}
                          className="hover:opacity-75 cursor-pointer text-sm font-medium"
                        >
                          {item.content}
                        </span>
                      ))}
                      <button
                        className="px-4 py-2 rounded font-semibold text-sm hover:opacity-80 transition"
                        style={{
                          backgroundColor: navbarSection.textColor,
                          color: navbarSection.backgroundColor,
                        }}
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Section Navigation Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-4">
                {website.sections
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((section) => (
                    <button
                      key={section.id}
                      onClick={() =>
                        setSelectedElement({
                          sectionId: section.id,
                          elementId: null,
                        })
                      }
                      className={`px-4 py-2 rounded whitespace-nowrap transition ${
                        selectedElement?.sectionId === section.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                    >
                      {section.type === "navbar" ? "🔗 " : ""}
                      {section.type}
                    </button>
                  ))}
              </div>

              <div className="max-w-4xl mx-auto">
                {currentSection && (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Navbar Preview */}
                    {currentSection.type === "navbar" && (
                      <div
                        style={{
                          backgroundColor:
                            currentSection.backgroundColor || "#ffffff",
                          color: currentSection.textColor || "#000000",
                        }}
                        className="p-4 border-b-4 border-gray-300 sticky top-0 z-40"
                      >
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-opacity-30 rounded flex items-center justify-center text-sm font-bold">
                              Logo
                            </div>
                            <input
                              type="text"
                              value={currentSection.content}
                              onChange={(e) =>
                                updateSectionContent(currentSection.id, {
                                  content: e.target.value,
                                })
                              }
                              className="bg-transparent text-lg font-bold outline-none border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500"
                            />
                          </div>
                          <div className="flex gap-4 items-center">
                            {currentSection.items?.map((item) => (
                              <input
                                key={item.id}
                                type="text"
                                value={item.content}
                                onChange={(e) => {
                                  const updatedSections = website.sections.map(
                                    (section) => {
                                      if (section.id === currentSection.id) {
                                        return {
                                          ...section,
                                          items: section.items.map((i) =>
                                            i.id === item.id
                                              ? {
                                                  ...i,
                                                  content: e.target.value,
                                                }
                                              : i,
                                          ),
                                        };
                                      }
                                      return section;
                                    },
                                  );
                                  setWebsite({
                                    ...website,
                                    sections: updatedSections,
                                  });
                                }}
                                className="bg-transparent outline-none border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 px-2 text-sm hover:opacity-75"
                              />
                            ))}
                            <button
                              className="px-4 py-2 bg-opacity-30 rounded hover:bg-opacity-50 transition"
                              style={{
                                backgroundColor: currentSection.textColor,
                              }}
                            >
                              Sign Up
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        backgroundColor:
                          currentSection.backgroundColor || "#ffffff",
                        color: currentSection.textColor || "#000000",
                      }}
                      className="p-8 min-h-96"
                    >
                      {currentSection.type !== "navbar" && (
                        <>
                          {/* Editable Section Title */}
                          <input
                            type="text"
                            value={currentSection.title}
                            onChange={(e) =>
                              updateSectionContent(currentSection.id, {
                                title: e.target.value,
                              })
                            }
                            className="text-4xl font-bold mb-4 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none w-full cursor-text"
                          />

                          {/* Editable Section Content */}
                          <textarea
                            value={currentSection.content}
                            onChange={(e) =>
                              updateSectionContent(currentSection.id, {
                                content: e.target.value,
                              })
                            }
                            className="text-lg mb-8 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none w-full cursor-text resize-none"
                            rows="3"
                          />
                        </>
                      )}

                      {/* Draggable Elements */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, currentSection.id)}
                        className="space-y-4"
                      >
                        {currentSection.items?.map((item, index) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) =>
                              handleDragStart(e, item, currentSection.id)
                            }
                            onClick={() =>
                              setSelectedElement({
                                sectionId: currentSection.id,
                                elementId: item.id,
                              })
                            }
                            className={`p-4 rounded border-2 cursor-move transition ${
                              index === 0 ? "drag-hint" : ""
                            } ${
                              selectedElement?.elementId === item.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300 hover:border-gray-400 bg-white"
                            }`}
                            style={item.properties}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold">{item.content}</p>
                                <p className="text-xs text-gray-500 capitalize mt-1">
                                  {item.type}
                                </p>
                              </div>
                              {selectedElement?.elementId === item.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteElement(item.id);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!currentSection && (
                  <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-500">
                    Select a section from the left panel to edit
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Properties Panel */}
            <div className="w-80 bg-white shadow-lg overflow-y-auto border-l border-gray-200 properties-panel">
              {currentSection?.type === "navbar" && !currentElement ? (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Navbar Properties
                    </h3>
                  </div>

                  {/* Logo Image */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Logo Image
                    </label>
                    <div className="space-y-3">
                      {currentSection.logo && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                          <img
                            src={currentSection.logo}
                            alt="Logo"
                            className="h-10 w-10 object-contain"
                          />
                          <div className="flex-1 text-sm text-gray-600 truncate">
                            Logo uploaded
                          </div>
                          <button
                            onClick={() =>
                              updateSectionContent(currentSection.id, {
                                logo: null,
                              })
                            }
                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                        <span className="text-sm font-semibold text-blue-600">
                          📤 Choose Logo Image
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                updateSectionContent(currentSection.id, {
                                  logo: event.target?.result,
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500">
                        Recommended: Square image (200x200px or larger)
                      </p>
                    </div>
                  </div>

                  {/* Logo Styling */}
                  {currentSection.logo && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">
                        ✨ Logo Styling
                      </h4>
                      <div className="space-y-3">
                        {/* Logo Width */}
                        <div>
                          <label className="text-xs text-gray-600">
                            Logo Width
                          </label>
                          <input
                            type="range"
                            min="20"
                            max="150"
                            value={currentSection.logoWidth || 40}
                            onChange={(e) =>
                              updateSectionContent(currentSection.id, {
                                logoWidth: parseInt(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                          <span className="text-xs text-gray-500">
                            {currentSection.logoWidth || 40}px
                          </span>
                        </div>

                        {/* Logo Height */}
                        <div>
                          <label className="text-xs text-gray-600">
                            Logo Height
                          </label>
                          <input
                            type="range"
                            min="20"
                            max="150"
                            value={currentSection.logoHeight || 40}
                            onChange={(e) =>
                              updateSectionContent(currentSection.id, {
                                logoHeight: parseInt(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {currentSection.logoHeight || 40}px
                          </span>
                        </div>

                        {/* Logo Border Radius */}
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">
                            Border Radius
                          </label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="range"
                              min="0"
                              max="50"
                              value={currentSection.logoBorderRadius || 0}
                              onChange={(e) =>
                                updateSectionContent(currentSection.id, {
                                  logoBorderRadius: parseInt(e.target.value),
                                })
                              }
                              className="flex-1"
                            />
                            <button
                              onClick={() =>
                                updateSectionContent(currentSection.id, {
                                  logoBorderRadius: 50,
                                })
                              }
                              className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold"
                            >
                              Circle
                            </button>
                          </div>
                          <span className="text-xs text-gray-500">
                            {currentSection.logoBorderRadius || 0}%
                          </span>
                        </div>

                        {/* Logo Opacity */}
                        <div>
                          <label className="text-xs text-gray-600">
                            Opacity
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={(currentSection.logoOpacity || 1) * 100}
                            onChange={(e) =>
                              updateSectionContent(currentSection.id, {
                                logoOpacity: parseInt(e.target.value) / 100,
                              })
                            }
                            className="w-full"
                          />
                          <span className="text-xs text-gray-500">
                            {((currentSection.logoOpacity || 1) * 100).toFixed(
                              0,
                            )}
                            %
                          </span>
                        </div>

                        {/* Logo Shadow */}
                        <div>
                          <label className="text-xs text-gray-600">
                            Shadow Effect
                          </label>
                          <select
                            value={currentSection.logoShadow || "none"}
                            onChange={(e) =>
                              updateSectionContent(currentSection.id, {
                                logoShadow: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="none">None</option>
                            <option value="0 2px 4px rgba(0,0,0,0.1)">
                              Soft
                            </option>
                            <option value="0 4px 8px rgba(0,0,0,0.15)">
                              Medium
                            </option>
                            <option value="0 8px 16px rgba(0,0,0,0.2)">
                              Heavy
                            </option>
                          </select>
                        </div>

                        {/* Logo Border */}
                        <div>
                          <label className="text-xs text-gray-600">
                            Border Width
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            value={currentSection.logoBorder || 0}
                            onChange={(e) =>
                              updateSectionContent(currentSection.id, {
                                logoBorder: parseInt(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                          <span className="text-xs text-gray-500">
                            {currentSection.logoBorder || 0}px
                          </span>
                        </div>

                        {currentSection.logoBorder > 0 && (
                          <div>
                            <label className="text-xs text-gray-600">
                              Border Color
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={
                                  currentSection.logoBorderColor || "#000000"
                                }
                                onChange={(e) =>
                                  updateSectionContent(currentSection.id, {
                                    logoBorderColor: e.target.value,
                                  })
                                }
                                className="h-8 w-12 border border-gray-300 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={
                                  currentSection.logoBorderColor || "#000000"
                                }
                                onChange={(e) =>
                                  updateSectionContent(currentSection.id, {
                                    logoBorderColor: e.target.value,
                                  })
                                }
                                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Brand Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={currentSection.content}
                      onChange={(e) =>
                        updateSectionContent(currentSection.id, {
                          content: e.target.value,
                        })
                      }
                      placeholder="Enter brand name"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  {/* Navbar Style */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Navbar Style
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                      <option>Standard</option>
                      <option>Minimal</option>
                      <option>Bold</option>
                      <option>Transparent</option>
                    </select>
                  </div>

                  {/* Logo Position */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Logo Position
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                      <option>Left</option>
                      <option>Center</option>
                      <option>Right</option>
                    </select>
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Background Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={currentSection.backgroundColor}
                        onChange={(e) =>
                          updateSectionContent(currentSection.id, {
                            backgroundColor: e.target.value,
                          })
                        }
                        className="h-10 w-14 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={currentSection.backgroundColor}
                        onChange={(e) =>
                          updateSectionContent(currentSection.id, {
                            backgroundColor: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={currentSection.textColor}
                        onChange={(e) =>
                          updateSectionContent(currentSection.id, {
                            textColor: e.target.value,
                          })
                        }
                        className="h-10 w-14 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={currentSection.textColor}
                        onChange={(e) =>
                          updateSectionContent(currentSection.id, {
                            textColor: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Navigation Links
                    </label>
                    <div className="space-y-4">
                      {currentSection.items?.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3 border border-gray-200 rounded bg-gray-50"
                        >
                          {/* Link Text */}
                          <div className="mb-2">
                            <label className="text-xs text-gray-600 block mb-1">
                              Link Text
                            </label>
                            <input
                              type="text"
                              value={item.content}
                              onChange={(e) => {
                                const updatedSections = website.sections.map(
                                  (section) => {
                                    if (section.id === currentSection.id) {
                                      return {
                                        ...section,
                                        items: section.items.map((i) =>
                                          i.id === item.id
                                            ? { ...i, content: e.target.value }
                                            : i,
                                        ),
                                      };
                                    }
                                    return section;
                                  },
                                );
                                setWebsite({
                                  ...website,
                                  sections: updatedSections,
                                });
                              }}
                              placeholder={`Link ${idx + 1}`}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>

                          {/* Link Type */}
                          <div className="mb-2">
                            <label className="text-xs text-gray-600 block mb-1">
                              Link Type
                            </label>
                            <select
                              value={item.linkType || "external"}
                              onChange={(e) => {
                                const updatedSections = website.sections.map(
                                  (section) => {
                                    if (section.id === currentSection.id) {
                                      return {
                                        ...section,
                                        items: section.items.map((i) =>
                                          i.id === item.id
                                            ? { ...i, linkType: e.target.value }
                                            : i,
                                        ),
                                      };
                                    }
                                    return section;
                                  },
                                );
                                setWebsite({
                                  ...website,
                                  sections: updatedSections,
                                });
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="external">External URL</option>
                              <option value="internal">
                                Internal Route (React)
                              </option>
                              <option value="anchor">Anchor Link (#)</option>
                            </select>
                          </div>

                          {/* Link URL */}
                          <div className="mb-2">
                            <label className="text-xs text-gray-600 block mb-1">
                              {item.linkType === "internal"
                                ? "Route Path (e.g., /about, /products)"
                                : item.linkType === "anchor"
                                  ? "Section ID (e.g., #features, #pricing)"
                                  : "Full URL (e.g., https://example.com)"}
                            </label>
                            <input
                              type="text"
                              value={item.href || ""}
                              onChange={(e) => {
                                const updatedSections = website.sections.map(
                                  (section) => {
                                    if (section.id === currentSection.id) {
                                      return {
                                        ...section,
                                        items: section.items.map((i) =>
                                          i.id === item.id
                                            ? { ...i, href: e.target.value }
                                            : i,
                                        ),
                                      };
                                    }
                                    return section;
                                  },
                                );
                                setWebsite({
                                  ...website,
                                  sections: updatedSections,
                                });
                              }}
                              placeholder={
                                item.linkType === "internal"
                                  ? "/about"
                                  : item.linkType === "anchor"
                                    ? "#features"
                                    : "https://example.com"
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>

                          {/* Link Target - Only for External */}
                          {item.linkType === "external" && (
                            <div className="mb-2">
                              <label className="text-xs text-gray-600 block mb-1">
                                Open in
                              </label>
                              <select
                                value={item.target || "_self"}
                                onChange={(e) => {
                                  const updatedSections = website.sections.map(
                                    (section) => {
                                      if (section.id === currentSection.id) {
                                        return {
                                          ...section,
                                          items: section.items.map((i) =>
                                            i.id === item.id
                                              ? { ...i, target: e.target.value }
                                              : i,
                                          ),
                                        };
                                      }
                                      return section;
                                    },
                                  );
                                  setWebsite({
                                    ...website,
                                    sections: updatedSections,
                                  });
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="_self">Same Tab</option>
                                <option value="_blank">New Tab</option>
                              </select>
                            </div>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              const updatedSections = website.sections.map(
                                (section) => {
                                  if (section.id === currentSection.id) {
                                    return {
                                      ...section,
                                      items: section.items.filter(
                                        (i) => i.id !== item.id,
                                      ),
                                    };
                                  }
                                  return section;
                                },
                              );
                              setWebsite({
                                ...website,
                                sections: updatedSections,
                              });
                            }}
                            className="w-full px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                          >
                            Delete Link
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const updatedSections = website.sections.map(
                          (section) => {
                            if (section.id === currentSection.id) {
                              return {
                                ...section,
                                items: [
                                  ...(section.items || []),
                                  {
                                    id: `nav-${Date.now()}`,
                                    type: "link",
                                    content: "New Link",
                                    properties: {},
                                  },
                                ],
                              };
                            }
                            return section;
                          },
                        );
                        setWebsite({ ...website, sections: updatedSections });
                      }}
                      className="w-full mt-3 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      + Add Link
                    </button>
                  </div>
                </div>
              ) : currentElement ? (
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      Element Properties
                    </h3>
                    <button
                      onClick={() => {
                        // Remove the element
                        const updatedSections = website.sections.map(
                          (section) => {
                            if (section.id === selectedElement.sectionId) {
                              return {
                                ...section,
                                items: section.items.filter(
                                  (item) => item.id !== currentElement.id,
                                ),
                              };
                            }
                            return section;
                          },
                        );
                        setWebsite({ ...website, sections: updatedSections });
                        setSelectedElement({
                          sectionId: selectedElement.sectionId,
                          elementId: null,
                        });
                        toast.success("Element deleted!");
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-semibold transition"
                      title="Delete this element"
                    >
                      <FiTrash2 size={14} />
                      Delete
                    </button>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      value={currentElement.content}
                      onChange={(e) => {
                        const updatedSections = website.sections.map(
                          (section) => {
                            if (section.id === selectedElement.sectionId) {
                              return {
                                ...section,
                                items: section.items.map((item) =>
                                  item.id === currentElement.id
                                    ? { ...item, content: e.target.value }
                                    : item,
                                ),
                              };
                            }
                            return section;
                          },
                        );
                        setWebsite({ ...website, sections: updatedSections });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      rows="3"
                    />
                  </div>

                  {/* Typography */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Typography
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600">
                          Font Size
                        </label>
                        <input
                          type="range"
                          min="8"
                          max="48"
                          value={currentElement.properties.fontSize}
                          onChange={(e) =>
                            updateElement(currentElement.id, {
                              fontSize: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">
                          {currentElement.properties.fontSize}px
                        </span>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600">
                          Font Weight
                        </label>
                        <select
                          value={currentElement.properties.fontWeight}
                          onChange={(e) =>
                            updateElement(currentElement.id, {
                              fontWeight: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="lighter">Lighter</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Colors</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600">
                          Text Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={currentElement.properties.color}
                            onChange={(e) =>
                              updateElement(currentElement.id, {
                                color: e.target.value,
                              })
                            }
                            className="h-10 w-14 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={currentElement.properties.color}
                            onChange={(e) =>
                              updateElement(currentElement.id, {
                                color: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600">
                          Background
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={currentElement.properties.backgroundColor}
                            onChange={(e) =>
                              updateElement(currentElement.id, {
                                backgroundColor: e.target.value,
                              })
                            }
                            className="h-10 w-14 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={currentElement.properties.backgroundColor}
                            onChange={(e) =>
                              updateElement(currentElement.id, {
                                backgroundColor: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spacing */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Spacing
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600">Padding</label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={currentElement.properties.padding}
                          onChange={(e) =>
                            updateElement(currentElement.id, {
                              padding: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">
                          {currentElement.properties.padding}px
                        </span>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600">Margin</label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={currentElement.properties.margin}
                          onChange={(e) =>
                            updateElement(currentElement.id, {
                              margin: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">
                          {currentElement.properties.margin}px
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Styling */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">
                      ✨ Advanced Styling
                    </h4>
                    <div className="space-y-3">
                      {/* Border Radius */}
                      <div>
                        <label className="text-xs text-gray-600">
                          Border Radius
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={currentElement.properties.borderRadius || 0}
                          onChange={(e) =>
                            updateElement(currentElement.id, {
                              borderRadius: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">
                          {currentElement.properties.borderRadius || 0}px
                        </span>
                      </div>

                      {/* Opacity */}
                      <div>
                        <label className="text-xs text-gray-600">Opacity</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={(currentElement.properties.opacity || 1) * 100}
                          onChange={(e) =>
                            updateElement(currentElement.id, {
                              opacity: parseInt(e.target.value) / 100,
                            })
                          }
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">
                          {(
                            (currentElement.properties.opacity || 1) * 100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>

                      {/* Box Shadow */}
                      <div>
                        <label className="text-xs text-gray-600">
                          Shadow Effect
                        </label>
                        <select
                          value={currentElement.properties.boxShadow || "none"}
                          onChange={(e) =>
                            updateElement(currentElement.id, {
                              boxShadow: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="none">None</option>
                          <option value="0 1px 3px rgba(0,0,0,0.1)">
                            Soft
                          </option>
                          <option value="0 4px 6px rgba(0,0,0,0.15)">
                            Medium
                          </option>
                          <option value="0 10px 25px rgba(0,0,0,0.2)">
                            Heavy
                          </option>
                        </select>
                      </div>

                      {/* Text Alignment */}
                      <div>
                        <label className="text-xs text-gray-600">
                          Text Alignment
                        </label>
                        <div className="flex gap-2 mt-1">
                          {["left", "center", "right"].map((align) => (
                            <button
                              key={align}
                              onClick={() =>
                                updateElement(currentElement.id, {
                                  textAlign: align,
                                })
                              }
                              className={`flex-1 px-2 py-1 text-xs rounded transition ${
                                currentElement.properties.textAlign === align
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {align[0].toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Border */}
                      <div>
                        <label className="text-xs text-gray-600">
                          Border Width
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={currentElement.properties.borderWidth || 0}
                          onChange={(e) =>
                            updateElement(currentElement.id, {
                              borderWidth: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">
                          {currentElement.properties.borderWidth || 0}px
                        </span>
                      </div>

                      {currentElement.type === "image" && (
                        <>
                          {/* Image Width */}
                          <div>
                            <label className="text-xs text-gray-600">
                              Image Width
                            </label>
                            <input
                              type="range"
                              min="50"
                              max="500"
                              value={
                                currentElement.properties.imageWidth || 200
                              }
                              onChange={(e) =>
                                updateElement(currentElement.id, {
                                  imageWidth: parseInt(e.target.value),
                                })
                              }
                              className="w-full"
                            />
                            <span className="text-xs text-gray-500">
                              {currentElement.properties.imageWidth || 200}px
                            </span>
                          </div>

                          {/* Image Height */}
                          <div>
                            <label className="text-xs text-gray-600">
                              Image Height
                            </label>
                            <input
                              type="range"
                              min="50"
                              max="500"
                              value={
                                currentElement.properties.imageHeight || 200
                              }
                              onChange={(e) =>
                                updateElement(currentElement.id, {
                                  imageHeight: parseInt(e.target.value),
                                })
                              }
                              className="w-full"
                            />
                            <span className="text-xs text-gray-500">
                              {currentElement.properties.imageHeight || 200}px
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Select an element to customize
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WebsiteBuilder;
