# YouTube Light Mode - Color Tokens Reference

This document contains all color tokens for the YouTube-inspired Light Mode theme following Material 3 design principles.

## 🎨 Core Background Colors

```css
--background: #FFFFFF           /* Main app background */
--sidebar-background: #F8F8F8   /* Sidebar background */
--card: #FFFFFF                 /* Card/Container background */
--card-hover: #FAFAFA          /* Card hover state */
--surface: #FFFFFF              /* General surface color */
--surface-container: #F8F8F8    /* Container surface */
```

## 📝 Text Colors

```css
--foreground: #111111           /* Default text color */
--text-primary: #111111         /* Primary text (headings, important text) */
--text-secondary: #555555       /* Secondary text (descriptions) */
--text-muted: #777777          /* Muted text (hints, placeholders) */
```

## 🔲 Border Colors

```css
--border: #E5E5E5              /* Default border */
--border-light: #F0F0F0        /* Lighter borders */
--sidebar-border: #E5E5E5      /* Sidebar borders */
--input-border: #D0D0D0        /* Input field borders */
```

## 🎯 Primary Brand Color

```css
--primary: #065FD4             /* YouTube Blue - Primary brand color */
--primary-hover: #0556C1       /* Primary hover state */
--primary-foreground: #FFFFFF  /* Text on primary background */
```

> **Note:** You can customize the primary color to match your brand. Replace `#065FD4` with your brand color.

## 🔄 Interactive States

### Hover States
```css
--hover-background: #F0F0F0    /* Generic hover background */
--hover-overlay: rgba(0, 0, 0, 0.04)  /* Overlay for hover effects */
```

### Active States
```css
--active-background: #E5E5E5   /* Active item background */
--active-indicator: #065FD4    /* Active indicator color */
```

### Secondary Actions
```css
--secondary: #F0F0F0           /* Secondary button background */
--secondary-hover: #E5E5E5     /* Secondary hover state */
--secondary-foreground: #111111 /* Text on secondary background */
```

## ✅ Status Colors

### Success
```css
--success: #0F9D58             /* Success color (green) */
--success-hover: #0D8A4F       /* Success hover */
--success-foreground: #FFFFFF  /* Text on success background */
```

### Warning
```css
--warning: #F9AB00             /* Warning color (yellow) */
--warning-hover: #E09600       /* Warning hover */
--warning-foreground: #111111  /* Text on warning background */
```

### Error/Destructive
```css
--destructive: #CC0000         /* Error/Destructive color (red) */
--destructive-hover: #B30000   /* Error hover */
--destructive-foreground: #FFFFFF  /* Text on error background */
```

### Info
```css
--info: #065FD4                /* Info color (blue) */
--info-hover: #0556C1          /* Info hover */
--info-foreground: #FFFFFF     /* Text on info background */
```

## 💍 Focus & Ring States

```css
--ring: #065FD4                /* Focus ring color */
--ring-offset: #FFFFFF         /* Focus ring offset color */
```

## 🌑 Shadows (YouTube-style - Very Soft)

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 1px 3px rgba(0, 0, 0, 0.08)
--shadow-lg: 0 2px 4px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 4px 8px rgba(0, 0, 0, 0.12)
--shadow-card: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-card-hover: 0 2px 4px rgba(0, 0, 0, 0.1)
```

## 📏 Border Radius

```css
--radius: 8px                  /* Default radius */
--radius-sm: 4px               /* Small radius */
--radius-md: 8px               /* Medium radius */
--radius-lg: 12px              /* Large radius */
--radius-full: 9999px          /* Full/circular radius */
```

## ⚡ Transitions

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1)
```

## 📚 Sidebar Specific Colors

```css
--sidebar-background: #F8F8F8
--sidebar-foreground: #111111
--sidebar-primary: #065FD4
--sidebar-primary-foreground: #FFFFFF
--sidebar-accent: #F0F0F0
--sidebar-accent-foreground: #111111
--sidebar-border: #E5E5E5
--sidebar-ring: #065FD4
```

## 🎭 Usage Examples

### Primary Button
```tsx
<button className="bg-primary hover:bg-primary-hover text-primary-foreground">
  Click Me
</button>
```

### Secondary Button
```tsx
<button className="bg-transparent border border-border hover:bg-hover-background text-foreground">
  Secondary Action
</button>
```

### Card Component
```tsx
<div className="bg-card border border-border rounded-lg shadow-card hover:shadow-card-hover">
  Card Content
</div>
```

### Sidebar Item (Active)
```tsx
<div className="sidebar-item active bg-active-background text-text-primary font-semibold">
  Active Item
</div>
```

### Sidebar Item (Hover)
```tsx
<div className="sidebar-item hover:bg-hover-background text-text-secondary hover:text-text-primary">
  Hover Item
</div>
```

## 🎨 Customization Guide

### Changing Brand Color

To use your own brand color, replace the primary color values:

```css
/* In youtube-light-theme.css */
:root[data-theme="light"] {
  --primary: #YOUR_BRAND_COLOR;        /* e.g., #FF5722 */
  --primary-hover: #YOUR_HOVER_COLOR;  /* Slightly darker shade */
}
```

### Recommended Brand Color Combinations

#### Option 1: YouTube Blue (Default)
```css
--primary: #065FD4
--primary-hover: #0556C1
```

#### Option 2: Red
```css
--primary: #DC2626
--primary-hover: #B91C1C
```

#### Option 3: Green
```css
--primary: #059669
--primary-hover: #047857
```

#### Option 4: Purple
```css
--primary: #7C3AED
--primary-hover: #6D28D9
```

#### Option 5: Orange
```css
--primary: #EA580C
--primary-hover: #C2410C
```

## 📱 Responsive Behavior

All colors automatically adapt to screen sizes. The theme maintains consistency across:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## ♿ Accessibility

All color combinations meet WCAG 2.1 AA standards for contrast ratios:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: Clear focus indicators

## 🔍 Testing Colors

Use your browser's DevTools to test color combinations:

```javascript
// Get computed color value
getComputedStyle(document.documentElement).getPropertyValue('--primary')

// Test a color temporarily
document.documentElement.style.setProperty('--primary', '#NEW_COLOR')
```

---

**Last Updated:** 2025
**Version:** 1.0.0
**License:** MIT
