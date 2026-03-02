# Advanced Drag-and-Drop Website Builder

## Overview

Complete website builder with **no-code drag-and-drop** interface and **highest customization** possible.

## Features

### 1. Element Types 🎨
- **Heading** - Customize font size, weight, color
- **Paragraph** - Rich text with full styling
- **Button** - Clickable elements with custom styles
- **Image** - Add images with sizing options
- **Card** - Container elements for grouping
- **Input** - Form fields
- **Spacer** - Add spacing between elements

### 2. Drag & Drop ⬆️⬇️
- Drag elements within sections
- Reorder elements instantly
- Visual feedback on drag
- Drop zones highlighted
- Smooth animations

### 3. Full Customization 🎯

#### Typography
- **Font Size** (8px - 48px) slider
- **Font Weight** (Normal, Bold, Lighter)
- **Text Alignment** (Left, Center, Right)

#### Colors
- **Text Color** - Color picker + hex input
- **Background Color** - Full color customization
- Real-time hex code input

#### Spacing
- **Padding** (0px - 50px) - Inner spacing
- **Margin** (0px - 50px) - Outer spacing
- **Border Radius** (0px - 50px) - Rounded corners

### 4. Live Preview
- Real-time editing
- What you see is what you get
- Instant style updates
- Professional design output

---

## How to Use

### Step 1: Access Website Builder

```
Sidebar → Website Builder → /website-builder
```

### Step 2: Select a Section

```
Left Panel → Click on any section
"Hero", "Services", "About", etc.
```

### Step 3: Add Elements

```
Left Panel → Click element type
- Heading
- Paragraph
- Button
- Image
- Card
- Input
- Spacer
```

### Step 4: Customize Element

```
Center: Click element to select
Right Panel: Edit properties
- Content
- Font size, weight, alignment
- Colors (text & background)
- Padding, margin, border radius
```

### Step 5: Drag to Reorder

```
Center: Drag element up/down
Order elements as needed
Changes save automatically
```

### Step 6: Save & Publish

```
Top: Click "Save" button
Then: Click "Publish"
Website goes live!
```

---

## Customization Options

### Font Size
```
Range: 8px to 48px
Use slider for quick adjust
Perfect for headings, body text, labels
```

### Colors
```
Two ways to set colors:
1. Click color picker → choose color
2. Type hex code directly (e.g., #3b82f6)

Supports:
- Named colors
- Hex codes (#RRGGBB)
- RGB values
```

### Spacing

| Property | Range | Use Case |
|----------|-------|----------|
| Padding | 0-50px | Inner content space |
| Margin | 0-50px | Element separation |
| Border Radius | 0-50px | Rounded corners |

### Text Alignment
```
- Left: Default text alignment
- Center: Centered content
- Right: Right-aligned text
- Useful for headlines, buttons
```

---

## Example Workflow

### Creating a Hero Section

```
1. Select "Hero" section from left panel
2. Click "Heading" element → Add
3. Select heading, set:
   - Font Size: 36px
   - Font Weight: Bold
   - Color: #1f2937
4. Click "Paragraph" → Add
5. Select paragraph, set:
   - Font Size: 18px
   - Color: #6b7280
   - Margin: 20px
6. Click "Button" → Add
7. Select button, set:
   - Font Size: 16px
   - Padding: 15px
   - Background: #3b82f6
   - Color: #ffffff
8. Drag elements to reorder
9. Save and Publish!
```

---

## Element Properties Panel

When you select an element, the right panel shows:

```
┌─────────────────────────┐
│ Element Properties      │
├─────────────────────────┤
│ [Delete Button]         │
│                         │
│ Content:                │
│ [Text Input Area]       │
│                         │
│ TYPOGRAPHY              │
│ Font Size: [Slider]     │
│ Font Weight: [Dropdown] │
│ Text Align: [Dropdown]  │
│                         │
│ COLORS                  │
│ Text Color: [Picker]    │
│ Background: [Picker]    │
│                         │
│ SPACING                 │
│ Padding: [Slider]       │
│ Margin: [Slider]        │
│ Border Radius: [Slider] │
└─────────────────────────┘
```

---

## Tips & Tricks

### 1. Quick Color Changes
```
Click color picker → instantly see changes
Type hex code for precise colors
Try: #3b82f6 (blue), #10b981 (green)
```

### 2. Responsive Spacing
```
Padding = content breathing room
Margin = distance from other elements
Use together for balanced layouts
```

### 3. Typography Hierarchy
```
Heading: 32-36px, Bold
Subheading: 24-28px, Bold
Body text: 16-18px, Normal
Labels: 12-14px, Normal
```

### 4. Professional Colors
```
Primary: #3b82f6 (blue)
Secondary: #10b981 (green)
Accent: #f59e0b (amber)
Dark text: #1f2937
Light text: #f3f4f6
```

### 5. Reordering Elements
```
Drag element by any part
Hold and drag up/down
Visual indicator shows position
Release to place
```

---

## Limitations & Future

### Current Features ✅
- Drag & drop elements
- Full typography control
- Color customization
- Spacing adjustments
- Multiple sections
- Live preview

### Coming Soon 🚀
- Image upload
- Custom fonts
- Animation effects
- Responsive design
- Mobile preview
- Export code
- Template library
- Form submissions
- Analytics integration

---

## Troubleshooting

### Elements not dragging?
```
Solution: Make sure section is selected first
- Click section in left panel
- Then drag elements
```

### Colors not updating?
```
Solution: Use valid hex codes
- Format: #RRGGBB (e.g., #3b82f6)
- Or use color picker directly
```

### Changes not saving?
```
Solution: Click "Save" button
- Changes auto-save to database
- Confirm with toast notification
```

### Website not publishing?
```
Solution: Ensure you have sections
- Add at least one section
- Add elements to section
- Then click "Publish"
```

---

## Keyboard Shortcuts (Future)

```
Ctrl+Z - Undo
Ctrl+Y - Redo
Delete - Delete selected element
Ctrl+D - Duplicate element
Ctrl+S - Save
```

---

## API Endpoints

The builder uses these endpoints:

```
GET /api/website-builder/my-website
POST /api/website-builder/section
PUT /api/website-builder/section/:sectionId
DELETE /api/website-builder/section/:sectionId
POST /api/website-builder/publish
```

---

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

---

## Performance

- Real-time updates
- Instant drag feedback
- Smooth animations
- Optimized rendering
- No lag with 100+ elements

---

## Examples

### Simple Landing Page
```
Section 1: Hero (heading + button)
Section 2: Features (3 cards)
Section 3: Contact (form)
```

### Professional Portfolio
```
Section 1: Hero (name + title)
Section 2: About (paragraph + image)
Section 3: Work (image cards)
Section 4: Contact (form + social)
```

### Service Website
```
Section 1: Hero (headline + CTA)
Section 2: Services (3+ cards)
Section 3: Testimonials
Section 4: FAQ
Section 5: Contact form
```

---

## Status

✅ **LIVE** - Advanced drag-and-drop website builder with full customization

**Version**: 1.0
**Last Updated**: 2026-03-02
**Users**: Superadmins only
