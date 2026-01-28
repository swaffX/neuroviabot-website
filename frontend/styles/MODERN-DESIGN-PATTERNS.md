# NeuroViaBot Modern Dashboard Design Patterns

## Ana Tasarım Prensipleri

### 1. Glassmorphism Efektleri
- `backdrop-blur-xl` - Bulanık arka plan
- `bg-white/5` - Şeffaf beyaz katmanlar
- `border-white/10` - İnce şeffaf kenarlıklar
- `shadow-xl` - Derin gölge efektleri

### 2. Dark Theme (Discord Palette)
- Primary Background: `#0F0F14` (from-[#0F0F14])
- Secondary Background: `#1A1B23` (via-[#1A1B23])
- Card Background: `from-gray-900/95 to-gray-900/80`
- Text Colors: `text-white`, `text-gray-300`, `text-gray-400`

### 3. Gradient Animasyonları
- Purple-Blue-Pink: `from-purple-400 via-blue-400 to-pink-400`
- Animated Background: `backgroundPosition: ['0%', '100%', '0%']`
- Background Size: `backgroundSize: '200% 100%'`
- Duration: `duration: 3, repeat: Infinity`

### 4. 3D Perspektif Efektleri
- Container: `perspective-1000`
- Hover Transform: `rotateY: 2, rotateX: -15`
- Spring Animation: `type: "spring", stiffness: 400, damping: 17`

## Animasyon Teknikleri

### 1. Staggered Loading
```tsx
transition={{ delay: index * 0.08 }}
transition={{ delay: index * 0.1 + 0.5 }}
```

### 2. Hover Micro-interactions
```tsx
whileHover={{ 
  scale: 1.05, 
  y: -8,
  transition: { type: "spring", stiffness: 400, damping: 17 }
}}
```

### 3. Gradient Background Animations
```tsx
animate={{
  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
}}
transition={{
  duration: 3,
  repeat: Infinity,
  ease: "linear"
}}
style={{ backgroundSize: '200% 200%' }}
```

### 4. Shine Effects
```tsx
<motion.div
  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
  initial={{ x: '-100%' }}
  whileHover={{ x: '100%' }}
  transition={{ duration: 0.6 }}
/>
```

### 5. Pulse Animations
```tsx
animate={{ 
  scale: [1, 1.3, 1],
  opacity: [1, 0.7, 1]
}}
transition={{ 
  duration: 2, 
  repeat: Infinity,
  ease: "easeInOut"
}}
```

### 6. Progress Bars
```tsx
<motion.div
  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500"
  initial={{ width: 0 }}
  animate={{ width: '100%' }}
  transition={{ duration: 1, delay: 0.5 }}
/>
```

## Kart Tasarımı

### 1. Animated Gradient Borders
```tsx
<motion.div 
  className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-all duration-500"
  animate={{
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
  }}
  transition={{
    duration: 3,
    repeat: Infinity,
    ease: "linear"
  }}
  style={{ backgroundSize: '200% 200%' }}
/>
```

### 2. Glow Effects
```tsx
<div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:via-blue-500/5 group-hover:to-pink-500/5 rounded-2xl blur-2xl transition-all duration-500"></div>
```

### 3. 3D Hover Transforms
```tsx
whileHover={{ 
  scale: 1.03, 
  y: -8,
  rotateY: 2,
  transition: { type: "spring", stiffness: 400, damping: 17 }
}}
```

### 4. Status Badges
```tsx
<motion.div 
  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30"
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ delay: index * 0.1 + 0.5 }}
>
  <motion.span 
    className="w-2 h-2 bg-green-400 rounded-full"
    animate={{ 
      scale: [1, 1.3, 1],
      opacity: [1, 0.7, 1]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  ></motion.span>
  <span className="text-green-400 text-sm font-medium">Bot Aktif</span>
</motion.div>
```

### 5. Action Buttons
```tsx
<motion.button
  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 + 0.7 }}
>
  {/* Animated background */}
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"
    initial={{ x: '-100%' }}
    whileHover={{ x: '0%' }}
    transition={{ duration: 0.3 }}
  />
  
  {/* Shine effect */}
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
    initial={{ x: '-100%' }}
    whileHover={{ x: '100%' }}
    transition={{ duration: 0.6 }}
  />
  
  <Cog6ToothIcon className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300 relative z-10" />
  <span className="relative z-10">Yönet</span>
</motion.button>
```

## Renk Paleti

### Primary Colors
- Purple: `#8B5CF6` (purple-500)
- Blue: `#3B82F6` (blue-500)
- Pink: `#EC4899` (pink-500)

### Accent Colors
- Green: `#10B981` (green-500)
- Emerald: `#059669` (emerald-500)
- Rose: `#F43F5E` (rose-500)

### Background Colors
- Primary: `#0F0F14` (from-[#0F0F14])
- Secondary: `#1A1B23` (via-[#1A1B23])
- Card: `from-gray-900/95 to-gray-900/80`

### Border Colors
- Default: `border-white/10`
- Hover: `border-purple-500/30`
- Status: `border-green-500/30`

## Typography

### Headers
- Main Title: `text-5xl font-black text-white`
- Section Title: `text-2xl font-bold text-white`
- Card Title: `text-lg font-bold text-white`

### Body Text
- Primary: `text-gray-300 font-medium`
- Secondary: `text-gray-400 text-sm`
- Muted: `text-gray-500 text-xs`

### Status Text
- Success: `text-green-400 text-sm font-medium`
- Warning: `text-yellow-400 text-sm font-medium`
- Error: `text-red-400 text-sm font-medium`

## Layout Patterns

### Grid Systems
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Stats grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
```

### Flexbox Patterns
```tsx
// Centering
<div className="flex items-center justify-center">

// Space between
<div className="flex items-center justify-between">

// Gap spacing
<div className="flex items-center gap-4">
```

### Container Patterns
```tsx
// Max width container
<div className="max-w-7xl mx-auto px-6 py-12">

// Full width with padding
<div className="w-full max-w-md mx-auto p-6">
```

## Responsive Design

### Breakpoints
- Mobile: `grid-cols-1`
- Tablet: `md:grid-cols-2`
- Desktop: `lg:grid-cols-3`

### Spacing Scale
- Small: `gap-2`, `gap-3`
- Medium: `gap-4`, `gap-6`
- Large: `gap-8`, `gap-12`

### Padding Scale
- Small: `p-2`, `p-3`
- Medium: `p-4`, `p-6`
- Large: `p-8`, `py-12`

## Performance Optimizations

### Animation Performance
- Use `transform` properties for animations
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change: transform` for GPU acceleration

### Loading States
- Skeleton loading with `animate-pulse`
- Staggered animations with delays
- Progressive enhancement

### Memory Management
- Clean up animation listeners
- Use `useCallback` for event handlers
- Optimize re-renders with `React.memo`

## Accessibility

### Focus States
- Visible focus indicators
- Keyboard navigation support
- Screen reader friendly

### Color Contrast
- WCAG AA compliant colors
- High contrast text
- Color-blind friendly palettes

### Motion Preferences
- Respect `prefers-reduced-motion`
- Provide alternative static states
- Graceful degradation

## Implementation Notes

### Framer Motion Best Practices
- Use `initial`, `animate`, `exit` props
- Leverage `transition` for timing control
- Implement `whileHover`, `whileTap` for interactions

### CSS-in-JS Patterns
- Use Tailwind CSS classes
- Custom CSS for complex animations
- CSS variables for theme consistency

### Component Architecture
- Reusable animation components
- Consistent prop interfaces
- TypeScript for type safety

Bu tasarım kalıpları animatik, efektif ve zengin bir görünüm sağlar. Modern web standartlarına uygun, performans odaklı ve erişilebilir bir kullanıcı deneyimi sunar.
