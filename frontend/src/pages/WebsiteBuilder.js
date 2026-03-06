import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import introJs from "intro.js";
import "intro.js/minified/introjs.min.css";
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

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

  useEffect(() => {
    fetchWebsite();
    
    // Restore preview state from localStorage
    const savedPreviewState = localStorage.getItem("websiteBuilderPreviewMode");
    if (savedPreviewState === "true") {
      setShowPreview(true);
    }
  }, []);

  // Auto-save whenever website changes
  useEffect(() => {
    if (!website) return;

    // Save to localStorage immediately for instant persistence
    try {
      const jsonString = JSON.stringify(website);
      localStorage.setItem("websiteBuilderData", jsonString);
      console.log("✓ Website saved to localStorage", {
        size: (jsonString.length / 1024).toFixed(2) + " KB",
        sections: website.sections?.length || 0,
      });
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.error("LocalStorage quota exceeded");
        toast.error("Storage limit reached");
      } else {
        console.error("Failed to save to localStorage:", error);
      }
    }

    // Clear previous timer
    if (autoSaveTimer) clearTimeout(autoSaveTimer);

    // Set new timer for backend sync (after 2 seconds of inactivity)
    const timer = setTimeout(() => {
      syncToBackend();
    }, 2000);

    setAutoSaveTimer(timer);

    return () => clearTimeout(timer);
  }, [website]);

  const fetchWebsite = async () => {
    try {
      setLoading(true);
      
      // Try to restore from localStorage first
      const cachedWebsite = localStorage.getItem("websiteBuilderData");
      console.log("===== PAGE RELOAD =====");
      console.log("1. Loading from localStorage:", cachedWebsite ? "Found" : "Not found");
      
      if (cachedWebsite) {
        try {
          const websiteData = JSON.parse(cachedWebsite);
          console.log("✓ Restored from localStorage:", websiteData.title, "sections:", websiteData.sections?.length);
          setWebsite(websiteData);
          setLoading(false);
          // No backend fetch on reload - localStorage is source of truth
          return;
        } catch (e) {
          console.error("Error parsing cached website:", e);
          localStorage.removeItem("websiteBuilderData");
          setShowOnboarding(true);
          setLoading(false);
          return;
        }
      }
      
      // If no cache, show onboarding
      console.log("No cached website found, showing onboarding");
      setShowOnboarding(true);
      setLoading(false);
    } catch (error) {
      console.log("Fetch error:", error);
      setLoading(false);
    }
  };

  // Optional: Sync with backend in background (but don't update UI from it)
  const syncWithBackendInBackground = async () => {
    try {
      console.log("Background sync: Fetching from backend...");
      const response = await axios.get(
        `${API_URL}/api/website-builder/my-website`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data && response.data._id && response.data.sections?.length > 0) {
        console.log("✓ Backend has:", response.data.sections?.length, "sections");
      }
    } catch (error) {
      console.log("Background sync error (ignored):", error.message);
    }
  };

  const handleTemplateSelect = (templateKey) => {
    const template = WEBSITE_TEMPLATES[templateKey];
    const newWebsite = {
      _id: "new",
      title: `${template.name} Website`,
      description: `Welcome to my ${template.name} website`,
      sections: template.sections,
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        accent: "#f59e0b",
      },
      isPublished: false,
    };
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

  const syncToBackend = async () => {
    try {
      // Save to backend (works for both new and existing websites)
      const response = await axios.put(
        `${API_URL}/api/website-builder/update-full`,
        {
          title: website.title,
          description: website.description,
          sections: website.sections,
          colors: website.colors,
          isPublished: website.isPublished,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log("✓ Website synced to MongoDB, sections:", response.data.sections?.length);
      return response.data;
    } catch (error) {
      console.error("Backend sync error:", error.message);
      // Data is still safe in localStorage, don't disrupt user
    }
  };

  const autoSaveWebsite = async () => {
    try {
      // Save to localStorage
      localStorage.setItem("websiteBuilderData", JSON.stringify(website));
      
      // Also sync to backend
      await syncToBackend();
    } catch (error) {
      console.error("Auto-save error:", error);
    }
  };

  const manualSaveWebsite = async () => {
    try {
      await autoSaveWebsite();
      toast.success("Website saved!");
    } catch (error) {
      toast.error("Failed to save website");
    }
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
    const intro = introJs();
    intro.setOptions({
      steps: [
        {
          element: ".elements-panel",
          intro:
            "👋 Welcome! This panel contains elements you can add to your sections.",
          position: "right",
        },
        {
          element: ".sections-list",
          intro: "📑 Click any section to select and edit it.",
          position: "right",
        },
        {
          element: ".canvas-area",
          intro:
            "🎨 This is your canvas. Edit content directly or drag elements to reorder.",
          position: "left",
        },
        {
          element: ".properties-panel",
          intro:
            "⚙️ Select an element to customize fonts, colors, spacing, and more.",
          position: "left",
        },
      ],
      showProgress: true,
      showBullets: true,
      keyboardNavigation: true,
      scrollToElement: true,
    });

    intro.start();
  };

  if (loading && !website) {
    console.log("RENDER: Loading spinner (loading=true, website=null)");
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
    console.log("RENDER: Onboarding modal", {
      showOnboarding,
      websiteExists: !!website,
      websiteTitle: website?.title,
    });
    return <OnboardingModal onSelect={handleTemplateSelect} />;
  }

  console.log("RENDER: Website builder with data:", {
    title: website.title,
    sections: website.sections?.length,
  });

  if (showAddSection) {
    return (
      <AddSectionModal
        onAdd={handleAddSection}
        onClose={() => setShowAddSection(false)}
      />
    );
  }

  const currentSection = website.sections.find(
    (s) => s.id === selectedElement?.sectionId,
  );
  const currentElement = currentSection?.items?.find(
    (i) => i.id === selectedElement?.elementId,
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Header */}
      <div className="bg-gray-900 text-white px-6 py-3 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-bold">🌐 Website Builder</h1>
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
              localStorage.setItem("websiteBuilderPreviewMode", String(newPreviewState));
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transition font-semibold whitespace-nowrap"
            title={showPreview ? "Back to editor" : "Preview website"}
          >
            <FiEye size={18} />
            {showPreview ? "Edit" : "Preview"}
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
                await autoSaveWebsite();
                setShowPreview(false);
                localStorage.setItem("websiteBuilderPreviewMode", "false");
              }}
              className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg transition font-semibold"
            >
              ← Back to Edit
            </button>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto bg-white">
              {website.sections
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((section) => {
                  // Navbar section
                  if (section.type === "navbar") {
                    return (
                      <nav
                        key={section.id}
                        style={{
                          backgroundColor: section.backgroundColor || "#ffffff",
                          color: section.textColor || "#000000",
                        }}
                        className="sticky top-0 shadow-md"
                      >
                        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {section.logo ? (
                              <img
                                src={section.logo}
                                alt="Logo"
                                className="h-8 w-8 object-contain"
                              />
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
                              <a
                                key={item.id}
                                href="#"
                                className="hover:opacity-75 transition"
                              >
                                {item.content}
                              </a>
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
                                <p className="font-semibold">{item.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <>
            {/* Left Sidebar - Elements Panel */}
            <div className="w-64 bg-white shadow-lg overflow-y-auto elements-panel">
              <div className="p-4 border-b">
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
              <div className="p-4 border-b sections-list">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">Sections</h3>
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
            <div className="flex-1 overflow-y-auto p-6 canvas-area">
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
            <div className="w-80 bg-white shadow-lg overflow-y-auto border-l properties-panel">
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
                    <div className="space-y-2">
                      {currentSection.items?.map((item, idx) => (
                        <div key={item.id} className="flex gap-2">
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
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
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
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            ✕
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
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Element Properties
                    </h3>
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
