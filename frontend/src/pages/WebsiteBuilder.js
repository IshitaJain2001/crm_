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
} from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const WebsiteBuilder = () => {
  const token = useSelector((state) => state.auth.token);
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const [tourShown, setTourShown] = useState(false);

  useEffect(() => {
    fetchWebsite();
    // Auto-start tour on first visit
    const hasSeenTour = localStorage.getItem("websiteBuilderTourShown");
    if (!hasSeenTour) {
      setTimeout(() => {
        startTour();
        localStorage.setItem("websiteBuilderTourShown", "true");
      }, 1000); // Delay to let UI render
    }
  }, []);

  const fetchWebsite = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/website-builder/my-website`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setWebsite(response.data);
    } catch (error) {
      toast.error("Failed to load website");
    } finally {
      setLoading(false);
    }
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

  const handleDragStart = (e, element, sectionId) => {
    setDraggedElement({ element, sectionId });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetSectionId) => {
    e.preventDefault();
    if (!draggedElement) return;

    const { element, sectionId } = draggedElement;

    if (sectionId === targetSectionId) {
      // Reorder within same section
      toast.success("Element moved");
    }

    setDraggedElement(null);
  };

  const startTour = () => {
    const intro = introJs();
    intro.setOptions({
      steps: [
        {
          element: ".elements-panel",
          intro:
            "👋 Welcome to Website Builder! This panel contains all available elements you can add to your website.",
          position: "right",
          tooltipPosition: "right",
        },
        {
          element: ".element-types",
          intro:
            "📦 These are the different types of elements: heading, paragraph, button, image, card, input, and spacer. First select a section, then click any element to add it.",
          position: "right",
        },
        {
          element: ".sections-list",
          intro:
            "📑 This is your Sections panel. Click on a section to select it. Once selected, you can add elements to that section.",
          position: "right",
        },
        {
          element: ".canvas-area",
          intro:
            "🎨 This is your canvas. After selecting a section, you'll see its content here. You can drag elements to reorder them.",
          position: "left",
        },
        {
          element: ".properties-panel",
          intro:
            "⚙️ This is the Properties panel. Select an element from the canvas to customize its font size, colors, spacing, and more.",
          position: "left",
        },
        {
          element: ".drag-hint",
          intro:
            "✋ You can drag elements within a section to reorder them. The cursor changes to indicate draggable items.",
          position: "left",
        },
      ],
      showProgress: true,
      showBullets: true,
      showStepNumbers: true,
      keyboardNavigation: true,
      scrollToElement: true,
    });

    intro.start();
  };

  if (loading) {
    return <div className="text-center py-8">Loading website builder...</div>;
  }

  if (!website) {
    return (
      <div className="text-center py-8 text-red-600">Website not found</div>
    );
  }

  const currentSection = website.sections.find(
    (s) => s.id === selectedElement?.sectionId,
  );
  const currentElement = currentSection?.items?.find(
    (i) => i.id === selectedElement?.elementId,
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Top Header with Tour Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={startTour}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition"
          title="Start guided tour"
        >
          <FiHelpCircle size={18} /> Tour
        </button>
      </div>

      {/* Left Sidebar - Elements Panel */}
      <div className="w-64 bg-white shadow-lg overflow-y-auto elements-panel">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Elements</h2>

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
                onClick={() => selectedElement?.sectionId && addElement(type)}
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
          <h3 className="font-semibold text-gray-700 mb-3">Sections</h3>
          <div className="space-y-2">
            {website.sections.map((section) => (
              <div
                key={section.id}
                onClick={() =>
                  setSelectedElement({ sectionId: section.id, elementId: null })
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
        <div className="max-w-4xl mx-auto">
          {currentSection && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div
                className="p-8 min-h-96"
                style={{
                  backgroundColor: currentSection.backgroundColor || "#ffffff",
                }}
              >
                <h2
                  className="mb-4 cursor-pointer hover:opacity-75"
                  style={{
                    fontSize: "28px",
                    color: currentSection.textColor || "#000000",
                  }}
                >
                  {currentSection.title}
                </h2>

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
                      className={`p-4 rounded border-2 cursor-move transition ${index === 0 ? "drag-hint" : ""} ${
                        selectedElement?.elementId === item.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400 bg-white"
                      }`}
                      style={{
                        ...item.properties,
                        color: item.properties.color,
                        backgroundColor: item.properties.backgroundColor,
                        padding: `${item.properties.padding}px`,
                        margin: `${item.properties.margin}px`,
                        fontSize: `${item.properties.fontSize}px`,
                        textAlign: item.properties.textAlign,
                        borderRadius: `${item.properties.borderRadius}px`,
                      }}
                    >
                      {item.type === "button" && (
                        <button
                          className="px-6 py-2 bg-blue-600 text-white rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.content}
                        </button>
                      )}
                      {item.type === "image" && (
                        <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center">
                          📷 Image
                        </div>
                      )}
                      {item.type === "card" && (
                        <div className="border rounded p-4 bg-gray-50">
                          <h3 className="font-bold mb-2">{item.content}</h3>
                          <p className="text-sm text-gray-600">Card content</p>
                        </div>
                      )}
                      {["heading", "paragraph", "input"].includes(
                        item.type,
                      ) && <div>{item.content}</div>}
                      {item.type === "spacer" && <div className="h-8" />}
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
        {currentElement ? (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Element Properties
              </h3>
              <button
                onClick={() => deleteElement(currentElement.id)}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mb-4"
              >
                <FiTrash2 className="inline mr-2" /> Delete
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
                  const updatedSections = website.sections.map((section) => {
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
                  });
                  setWebsite({ ...website, sections: updatedSections });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                rows="3"
              />
            </div>

            {/* Typography */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Typography</h4>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Font Size</label>
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
                  <label className="text-xs text-gray-600">Font Weight</label>
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

                <div>
                  <label className="text-xs text-gray-600">Text Align</label>
                  <select
                    value={currentElement.properties.textAlign}
                    onChange={(e) =>
                      updateElement(currentElement.id, {
                        textAlign: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Colors</h4>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Text Color</label>
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
                  <label className="text-xs text-gray-600">Background</label>
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
              <h4 className="font-semibold text-gray-700 mb-3">Spacing</h4>

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

                <div>
                  <label className="text-xs text-gray-600">Border Radius</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={currentElement.properties.borderRadius}
                    onChange={(e) =>
                      updateElement(currentElement.id, {
                        borderRadius: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {currentElement.properties.borderRadius}px
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
    </div>
  );
};

export default WebsiteBuilder;
