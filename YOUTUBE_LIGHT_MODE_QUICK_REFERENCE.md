# 🚀 YouTube Light Mode - Quick Reference

**Quick access to colors, components, and code snippets for YouTube-inspired Light Mode theme.**

---

## 🎨 Essential Colors

### Backgrounds
```css
var(--background)            /* #FFFFFF - Main background */
var(--sidebar-background)    /* #F8F8F8 - Sidebar */
var(--card)                  /* #FFFFFF - Cards */
var(--hover-background)      /* #F0F0F0 - Hover state */
var(--active-background)     /* #E5E5E5 - Active state */
```

### Text
```css
var(--text-primary)      /* #111111 - Main text */
var(--text-secondary)    /* #555555 - Secondary text */
var(--text-muted)        /* #777777 - Muted text */
```

### Brand
```css
var(--primary)           /* #065FD4 - Primary brand */
var(--primary-hover)     /* #0556C1 - Primary hover */
```

### Borders
```css
var(--border)            /* #E5E5E5 - Default border */
var(--border-light)      /* #F0F0F0 - Light border */
```

---

## 🧩 Component Snippets

### Primary Button
```tsx
<button
  className="px-4 py-2 rounded-full font-medium transition-all"
  style={{
    backgroundColor: 'var(--primary)',
    color: 'var(--primary-foreground)',
  }}
>
  Button Text
</button>
```

### Secondary Button
```tsx
<button
  className="px-4 py-2 rounded-full font-medium transition-all"
  style={{
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }}
>
  Button Text
</button>
```

### Card
```tsx
<div
  className="rounded-lg p-6 transition-all"
  style={{
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
  }}
>
  Card Content
</div>
```

### Sidebar Item (Active)
```tsx
<div
  className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
  style={{
    backgroundColor: 'var(--active-background)',
    color: 'var(--text-primary)',
    fontWeight: 600,
  }}
>
  <Icon />
  <span>Item Label</span>
</div>
```

### Sidebar Item (Hover)
```tsx
<div
  className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors"
  style={{
    color: 'var(--text-secondary)',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--hover-background)'
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent'
  }}
>
  <Icon />
  <span>Item Label</span>
</div>
```

### Input Field
```tsx
<input
  type="text"
  placeholder="Search..."
  className="px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2"
  style={{
    backgroundColor: 'var(--input)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
  }}
/>
```

### Badge
```tsx
<span
  className="px-3 py-1 rounded-full text-xs font-medium"
  style={{
    backgroundColor: 'var(--primary)',
    color: 'var(--primary-foreground)',
  }}
>
  New
</span>
```

---

## 🎯 Common Patterns

### Hover Effect
```tsx
className="transition-colors hover:bg-[var(--hover-background)]"
```

### Focus State
```tsx
className="focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
```

### Card Hover
```tsx
className="transition-shadow hover:shadow-[var(--shadow-card-hover)]"
```

### Text Gradient (YouTube style)
```tsx
<span
  className="font-bold text-transparent bg-clip-text"
  style={{
    backgroundImage: 'linear-gradient(135deg, var(--primary), var(--success))',
  }}
>
  Gradient Text
</span>
```

---

## 📦 Import Components

```tsx
// Theme Toggle
import { ThemeToggle, CompactThemeToggle } from '@/components/ThemeToggle'

// Example Components
import { 
  YouTubeLightSidebar,
  YouTubeLightNavbar,
  YouTubeLightCard,
  YouTubeLightButton,
  YouTubeLightStatsCard,
  YouTubeLightModeDemo
} from '@/components/examples/YouTubeLightModeExamples'
```

---

## 🔄 Theme Switching

### Get Current Theme
```javascript
const theme = document.documentElement.getAttribute('data-theme')
// Returns: 'light' or 'dark'
```

### Set Theme to Light
```javascript
const root = document.documentElement
root.setAttribute('data-theme', 'light')
root.classList.remove('dark')
root.classList.add('light-mode')
root.style.colorScheme = 'light'
localStorage.setItem('theme', 'light')
```

### Set Theme to Dark
```javascript
const root = document.documentElement
root.setAttribute('data-theme', 'dark')
root.classList.add('dark')
root.classList.remove('light-mode')
root.style.colorScheme = 'dark'
localStorage.setItem('theme', 'dark')
```

---

## 🎨 Status Colors

### Success
```tsx
style={{ backgroundColor: 'var(--success)', color: 'var(--success-foreground)' }}
```

### Warning
```tsx
style={{ backgroundColor: 'var(--warning)', color: 'var(--warning-foreground)' }}
```

### Error
```tsx
style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}
```

### Info
```tsx
style={{ backgroundColor: 'var(--info)', color: 'var(--info-foreground)' }}
```

---

## 🌐 Tailwind Utilities (if configured)

```tsx
className="bg-light-background text-light-primary"
className="shadow-youtube-card hover:shadow-youtube-card-hover"
className="rounded-youtube-md"
className="bg-youtube-light-bg-hover"
```

---

## 🔍 Debug Commands

### Check Current Theme
```javascript
console.log('Theme:', document.documentElement.getAttribute('data-theme'))
```

### Get CSS Variable Value
```javascript
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--primary')
console.log('Primary Color:', primaryColor)
```

### Test Color Temporarily
```javascript
document.documentElement.style.setProperty('--primary', '#DC2626')
```

---

## 📏 Layout Values

### Sidebar Width
```css
width: 256px  /* 16rem / w-64 */
```

### Border Radius
```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
```

### Transitions
```css
--transition-fast: 150ms
--transition-base: 200ms
--transition-slow: 300ms
```

---

## ✅ Quick Checklist

When creating a new component:

- [ ] Use CSS variables for colors (not hardcoded values)
- [ ] Add hover states with `var(--hover-background)`
- [ ] Use soft shadows: `var(--shadow-card)`
- [ ] Border radius: `rounded-lg` or `--radius`
- [ ] Transitions: `transition-all duration-200`
- [ ] Test in both Light and Dark modes

---

## 🎯 Common Mistakes to Avoid

❌ **Don't** use hardcoded colors:
```tsx
<div className="bg-white text-black">
```

✅ **Do** use CSS variables:
```tsx
<div style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
```

❌ **Don't** use opacity on text for disabled states:
```tsx
<span className="opacity-50">
```

✅ **Do** use muted text color:
```tsx
<span style={{ color: 'var(--text-muted)' }}>
```

---

## 📞 Quick Help

**Files:**
- Theme CSS: `src/styles/youtube-light-theme.css`
- Color Tokens: `src/styles/youtube-light-tokens.md`
- Integration Guide: `YOUTUBE_LIGHT_MODE_INTEGRATION.md`
- Examples: `src/components/examples/YouTubeLightModeExamples.tsx`

**Change Brand Color:**
Edit `--primary` and `--primary-hover` in `youtube-light-theme.css`

**Toggle Location:**
Add `<ThemeToggle />` to your Navbar or Sidebar

---

**Made with ❤️ for YouTube-style dashboards**
