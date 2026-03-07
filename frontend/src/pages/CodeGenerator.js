/**
 * Code Generator for Website Builder
 * Generates modular React components with separate files
 */

export const generateModularCode = (website) => {
  if (!website) return {};

  const files = {};
  const navbarSection = website.sections?.find(s => s.type === "navbar");
  const otherSections = website.sections?.filter(s => s.type !== "navbar") || [];
  const componentName = website.title?.replace(/[^a-zA-Z0-9]/g, "") || "Website";

  // ===== NAVBAR FILE =====
  if (navbarSection) {
    // Image tag with empty src (user can add their own image path)
    const logoHTML = navbarSection.logo 
      ? `<div style={{ 
          height: "${navbarSection.logoHeight || 40}px", 
          width: "${navbarSection.logoWidth || 40}px", 
          marginRight: "12px",
          borderRadius: "${navbarSection.logoBorderRadius || 0}%",
          overflow: "hidden",
          opacity: ${navbarSection.logoOpacity || 1},
          boxShadow: "${navbarSection.logoShadow || "none"}",
          border: "${navbarSection.logoBorder ? navbarSection.logoBorder + "px solid " + (navbarSection.logoBorderColor || "#000000") : "none"}",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <img src="" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>`
      : "";

    const navLinks = (navbarSection.items || [])
      .map(item => {
        const style = item.properties || {};
        const linkType = item.linkType || "external";
        const href = item.href || "#";
        const target = item.target || "_self";
        
        let linkCode = "";
        if (linkType === "internal") {
          // Use React Router Link
          linkCode = `<Link 
        to="${href}"
        style={{ fontSize: "${style.fontSize || 16}px", fontWeight: "${style.fontWeight || "normal"}", color: "${style.color || navbarSection.textColor || "#000000"}" }} 
        className="hover:opacity-75 transition">
        ${item.content}
      </Link>`;
        } else if (linkType === "anchor") {
          // Anchor link
          linkCode = `<a 
        href="${href}"
        style={{ fontSize: "${style.fontSize || 16}px", fontWeight: "${style.fontWeight || "normal"}", color: "${style.color || navbarSection.textColor || "#000000"}" }} 
        className="hover:opacity-75 transition cursor-pointer">
        ${item.content}
      </a>`;
        } else {
          // External link
          linkCode = `<a 
        href="${href}" 
        target="${target}"
        rel="${target === "_blank" ? "noopener noreferrer" : ""}"
        style={{ fontSize: "${style.fontSize || 16}px", fontWeight: "${style.fontWeight || "normal"}", color: "${style.color || navbarSection.textColor || "#000000"}" }} 
        className="hover:opacity-75 transition">
        ${item.content}
      </a>`;
        }
        return linkCode;
      })
      .join("\n      ");

    files["Navbar.jsx"] = `import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={{
      backgroundColor: "${navbarSection.backgroundColor || "#ffffff"}",
      color: "${navbarSection.textColor || "#000000"}"
    }} className="sticky top-0 shadow-md">
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          ${logoHTML}
          <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
            ${navbarSection.content}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          ${navLinks}
        </div>
      </div>
    </nav>
  );
}`;

    files["Navbar.css"] = `nav {
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

nav a {
  text-decoration: none;
  transition: opacity 0.2s;
  cursor: pointer;
}

nav a:hover {
  opacity: 0.75;
}`;
  }

  // ===== SECTION FILES =====
  otherSections.forEach((section, idx) => {
    // Skip if section type is missing
    if (!section || !section.type) return;
    
    let itemsHTML = "";
    
    if (section.items && section.items.length > 0) {
      itemsHTML = section.items
        .map(item => {
          const props = item.properties || {};
          const style = {
            fontSize: props.fontSize || 16,
            fontWeight: props.fontWeight || "normal",
            color: props.color || section.textColor || "#000000",
            backgroundColor: props.backgroundColor || "transparent",
            padding: `${props.padding || 0}px`,
            margin: `${props.margin || 0}px`,
          };

          if (item.type === "link") {
            return `<a href="#" style={${JSON.stringify(style)}} className="underline hover:opacity-75">${item.content}</a>`;
          } else if (item.type === "button") {
            return `<button style={${JSON.stringify(style)}} className="px-6 py-2 rounded hover:opacity-80">${item.content}</button>`;
          } else if (item.type === "card") {
            return `<div style={{ padding: "20px", borderRadius: "8px", backgroundColor: "${props.backgroundColor || "#f3f4f6"}", ...${JSON.stringify(style)} }} className="rounded shadow">${item.content}</div>`;
          } else {
            return `<p style={${JSON.stringify(style)}}>${item.content}</p>`;
          }
        })
        .join("\n      ");

      itemsHTML = `<div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "32px" }}>
        ${itemsHTML}
      </div>`;
    }

    const sectionType = section.type || `Section${idx}`;
    const sectionName = sectionType.charAt(0).toUpperCase() + sectionType.slice(1);
    
    files[`${sectionName}.jsx`] = `import React from 'react';

export default function ${sectionName}() {
  return (
    <section style={{
      backgroundColor: "${section.backgroundColor || "#ffffff"}",
      color: "${section.textColor || "#000000"}",
      padding: "40px 20px",
      width: "100%"
    }}>
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
        <h2 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "16px" }}>
          ${section.title || "Section Title"}
        </h2>
        <p style={{ fontSize: "18px", marginBottom: "24px", opacity: 0.9 }}>
          ${section.content || "Section content"}
        </p>
        ${itemsHTML}
      </div>
    </section>
  );
}`;

    files[`${sectionName}.css`] = `section {
  width: 100%;
  padding: 40px 20px;
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
}`;
  });

  // ===== MAIN APP FILE WITH ROUTING =====
  const jsxFiles = Object.keys(files).filter(f => f.endsWith(".jsx"));
  const navbarComponent = jsxFiles.find(f => f === "Navbar.jsx");

  // Generate imports
  const imports = jsxFiles
    .map(f => f.replace(".jsx", ""))
    .map(name => `import ${name} from './${name}';`)
    .join("\n");

  files["App.jsx"] = `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
${imports}
import './App.css';

/**
 * ⚡ Auto-generated Website with Routing
 * Website: ${website.title || "Untitled"}
 * Created: ${new Date().toLocaleString()}
 * 
 * This app includes:
 * - React Router for navigation
 * - Modular components
 * - Reusable sections
 * 
 * TO USE THIS:
 * 1. Make sure react-router-dom is installed: npm install react-router-dom
 * 2. Import this App in your main index.js/main.tsx
 * 3. Customize routes and pages as needed
 */

export default function App() {
  return (
    <Router>
      ${navbarComponent ? '<Navbar />' : ''}
      <Routes>
        <Route 
          path="/" 
          element={
            <div className="app-container">
              {/* ===== ${website.title || "Untitled"} ===== */}
              ${jsxFiles
                .filter(f => f !== "Navbar.jsx")
                .map(f => f.replace(".jsx", ""))
                .map(name => `<${name} />`)
                .join("\n              ")}
            </div>
          } 
        />
        
        {/* Add more routes here */}
        {/* 
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/products" element={<ProductsPage />} />
        */}
      </Routes>
    </Router>
  );
}

/**
 * HOW TO ADD MORE PAGES:
 * 
 * 1. Create a new component file (e.g., AboutPage.jsx):
 *    export default function AboutPage() {
 *      return (
 *        <div>
 *          <Navbar />
 *          {your content here}
 *        </div>
 *      );
 *    }
 * 
 * 2. Import it in App.jsx:
 *    import AboutPage from './AboutPage';
 * 
 * 3. Add a route:
 *    <Route path="/about" element={<AboutPage />} />
 * 
 * 4. Update navbar links to use "/about" as the route
 */`;

  files["App.css"] = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
}`;

  // ===== INDEX FILE (ENTRY POINT) =====
  files["index.js"] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

/**
 * Entry point for the React application
 * 
 * This renders the App component (which includes routing) to the root DOM element.
 * Make sure you have a <div id="root"></div> in your HTML file.
 */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

  return files;
};
