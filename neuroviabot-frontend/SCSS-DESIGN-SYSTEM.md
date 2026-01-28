# 🎨 NeuroViaBot - Modern SCSS Design System

## 📋 Genel Bakış

NeuroViaBot için tamamen yeniden tasarlanmış, modern, animasyonlu ve glassmorphism efektleri içeren SCSS tabanlı tasarım sistemi.

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle

```bash
cd neuroviabot-frontend
npm install
```

### 2. Development Server'ı Başlat

```bash
npm run dev
```

Site `http://localhost:3001` adresinde çalışacaktır.

## 📁 Dosya Yapısı

```
neuroviabot-frontend/
├── styles/
│   ├── abstracts/
│   │   ├── _variables.scss      # Renk paleti, spacing, typography
│   │   ├── _mixins.scss         # Yeniden kullanılabilir mixinler
│   │   ├── _functions.scss      # SCSS fonksiyonları
│   │   └── _animations.scss     # Keyframe animasyonları
│   │
│   ├── base/
│   │   ├── _reset.scss          # Modern CSS reset
│   │   ├── _typography.scss     # Tipografi sistemi
│   │   └── _global.scss         # Global stiller
│   │
│   ├── components/
│   │   ├── _buttons.scss        # Button componentleri
│   │   ├── _cards.scss          # Card componentleri
│   │   ├── _navbar.scss         # Navbar stili
│   │   └── _forms.scss          # Form elementleri
│   │
│   └── pages/
│       └── _home.scss           # Ana sayfa stilleri
│
├── app/
│   ├── globals.scss             # Ana stil entry point
│   ├── page.tsx                 # Modernleştirilmiş ana sayfa
│   └── dashboard/
│       └── page.tsx             # Dashboard sayfası
│
└── components/
    ├── layout/
    │   └── Navbar.tsx           # Modern navbar
    └── ui/
        ├── Button.tsx           # Button component
        ├── Card.tsx             # Card components
        └── Input.tsx            # Form inputs
```

## 🎨 Tasarım Sistemi Özellikleri

### Renk Paleti

**Primary Colors:**
- Primary: `#5865F2` (Discord Blue)
- Primary Dark: `#4752C4`
- Primary Light: `#7983F5`

**Accent Colors:**
- Purple: `#7C3AED`
- Pink: `#EC4899`
- Cyan: `#06B6D4`
- Green: `#10B981`
- Yellow: `#F59E0B`
- Red: `#EF4444`

**Background Colors (Dark Theme):**
- Primary: `#0F0F14`
- Secondary: `#1A1B23`
- Tertiary: `#25262E`
- Elevated: `#2D2E38`

### Gradient Sistemleri

```scss
$gradient-cyber: linear-gradient(135deg, #5865F2 0%, #7C3AED 50%, #EC4899 100%);
$gradient-aurora: linear-gradient(135deg, #667eea 0%, #06B6D4 50%, #10B981 100%);
$gradient-sunset: linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #EC4899 100%);
```

### Spacing Sistemi (8px grid)

```scss
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
4xl: 96px  (6rem)
```

### Typography

**Font Families:**
- Primary: Inter, gg sans, Noto Sans, sans-serif
- Display: Cal Sans, Inter, sans-serif
- Mono: Fira Code, JetBrains Mono, monospace

**Font Sizes:**
```scss
xs:   12px
sm:   14px
base: 16px
lg:   18px
xl:   20px
2xl:  24px
3xl:  30px
4xl:  36px
5xl:  48px
6xl:  60px
7xl:  72px
```

## 🎭 Animasyonlar

### Fade Animasyonlar
- `fade-in`, `fade-out`
- `fade-in-up`, `fade-in-down`
- `fade-in-left`, `fade-in-right`

### Slide Animasyonlar
- `slide-up`, `slide-down`
- `slide-left`, `slide-right`

### Scale Animasyonlar
- `scale-in`, `scale-out`
- `scale-pulse`

### Özel Efektler
- `glow-pulse` - Işıltılı nabız efekti
- `glow-pulse-rainbow` - Gökkuşağı glow efekti
- `gradient-shift` - Gradient kayma
- `shimmer` - Parıltı efekti
- `float` - Yüzme animasyonu
- `neon-pulse` - Neon ışık efekti

## 🧩 Component Kullanımı

### Buttons

```tsx
import Button from '@/components/ui/Button';

// Primary button
<Button variant="primary">Click me</Button>

// Gradient button with glow
<Button variant="gradient" glow>Get Started</Button>

// Loading button
<Button loading>Processing...</Button>

// Icon button
<Button icon variant="ghost">
  <Icon />
</Button>
```

**Button Variants:**
- `primary` - Ana buton
- `secondary` - İkincil buton
- `gradient` - Gradient buton
- `ghost` - Transparan buton
- `danger` - Tehlike butonu
- `success` - Başarı butonu

**Button Sizes:**
- `sm` - Küçük
- `md` - Orta (default)
- `lg` - Büyük
- `xl` - Ekstra büyük

### Cards

```tsx
import { Card, StatCard, FeatureCard } from '@/components/ui/Card';

// Basic card
<Card hover glow>
  Content here
</Card>

// Glass card
<Card variant="glass">
  Content here
</Card>

// Interactive card with 3D effect
<Card variant="3d" hover>
  Content here
</Card>

// Stat card
<StatCard 
  value={1234} 
  label="Total Users"
  trend={{ value: 12, positive: true }}
/>

// Feature card
<FeatureCard
  icon={<Icon />}
  title="Feature Title"
  description="Feature description"
/>
```

**Card Variants:**
- `default` - Standart card
- `glass` - Glassmorphism efekti
- `elevated` - Yükseltilmiş card
- `gradient-border` - Gradient kenarlık
- `interactive` - Etkileşimli (hover efektleriyle)
- `3d` - 3D hover efekti

### Forms

```tsx
import Input, { Textarea, Select } from '@/components/ui/Input';

// Text input
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  required
  fullWidth
/>

// Input with icon
<Input
  label="Search"
  icon={<SearchIcon />}
  placeholder="Search..."
/>

// Textarea
<Textarea
  label="Description"
  placeholder="Enter description"
  rows={5}
/>

// Select
<Select label="Category" fullWidth>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Select>
```

## 🎨 Mixinler Kullanımı

### Glassmorphism

```scss
@use 'styles/abstracts/mixins' as *;

.my-element {
  @include glass(0.1, 12px);
}
```

### Glow Efekti

```scss
.my-element {
  @include glow($color-primary, 0.6);
  
  // Veya hover'da
  @include glow-on-hover($color-primary, 0.7);
}
```

### Gradient Background

```scss
.my-element {
  @include gradient-bg($gradient-cyber);
  
  // Animasyonlu gradient
  @include animated-gradient($gradient-cyber, 8s);
}
```

### Responsive Breakpoints

```scss
.my-element {
  // Mobile first approach
  font-size: 16px;
  
  // Tablet ve üzeri
  @include respond-to('md') {
    font-size: 18px;
  }
  
  // Desktop
  @include respond-to('lg') {
    font-size: 20px;
  }
}
```

### Card Stilleri

```scss
.my-card {
  @include card();
  @include card-hover();
}

// Veya glass card
.my-glass-card {
  @include card-glass(0.1);
}
```

### Button Stilleri

```scss
.my-button {
  @include button-primary();
  
  // Veya gradient button
  @include button-gradient($gradient-cyber);
}
```

## 🎯 Responsive Design

Tüm componentler mobile-first yaklaşımıyla tasarlanmıştır:

**Breakpoints:**
- `xs`: 475px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## ⚡ Performans İpuçları

1. **Animasyonlar:** Animasyonlar GPU-accelerated (transform, opacity)
2. **Backdrop Blur:** Modern tarayıcılarda donanım hızlandırmalı
3. **CSS Containment:** Gerektiğinde `contain` özelliği kullanılmış
4. **Will-change:** Kritik animasyonlarda optimize edilmiş

## 🎨 Özelleştirme

### Renkleri Değiştirme

`styles/abstracts/_variables.scss` dosyasını düzenleyin:

```scss
$color-primary: #YOUR_COLOR;
$color-accent-purple: #YOUR_COLOR;
```

### Yeni Animasyon Ekleme

`styles/abstracts/_animations.scss` dosyasına ekleyin:

```scss
@keyframes my-animation {
  from { /* başlangıç */ }
  to { /* bitiş */ }
}
```

### Yeni Component Stili

`styles/components/_my-component.scss` oluşturun ve `globals.scss`'e import edin:

```scss
@use '../styles/components/my-component';
```

## 📱 Modern Özellikler

### ✅ Glassmorphism Effects
- Backdrop blur ile cam efekti
- Şeffaf arka planlar
- Modern, şık görünüm

### ✅ Gradient Animations
- Akıcı gradient geçişleri
- Rainbow glow efektleri
- Animasyonlu arka planlar

### ✅ 3D Hover Effects
- Perspective transformlar
- Lift ve scale efektleri
- Micro-interactions

### ✅ Glow Effects
- Box-shadow tabanlı ışıltılar
- Neon efektleri
- Text glow

### ✅ Smooth Transitions
- Cubic-bezier easing
- Optimize edilmiş animasyonlar
- 60 FPS performans

### ✅ Responsive Design
- Mobile-first yaklaşım
- Fluid typography
- Adaptive layouts

### ✅ Dark Theme
- Modern dark renkler
- Discord-inspired palette
- High contrast

## 🔧 Troubleshooting

### SCSS Derleme Hatası

```bash
# Cache temizle
rm -rf .next
npm run build
```

### Animasyonlar Çalışmıyor

`framer-motion` kurulu olduğundan emin olun:
```bash
npm install framer-motion
```

### Stilleri Göremiyorum

1. `globals.scss` dosyasının `layout.tsx`'de import edildiğinden emin olun
2. SCSS modüllerinin doğru path'le import edildiğini kontrol edin
3. Tarayıcı cache'ini temizleyin

## 📚 Kaynaklar

- [SCSS Documentation](https://sass-lang.com/documentation)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Discord Design System](https://discord.com/branding)

## 🎉 Özellikler Özeti

✅ **Tamamen SCSS tabanlı** - Güçlü, modüler tasarım sistemi  
✅ **60+ Keyframe animasyon** - Her türlü ihtiyaç için  
✅ **Glassmorphism** - Modern, şık cam efektleri  
✅ **Gradient sistemleri** - Cyber, Aurora, Sunset ve daha fazlası  
✅ **Component library** - Button, Card, Form, Navbar  
✅ **Responsive** - Mobile-first approach  
✅ **Dark theme** - Discord-inspired renk paleti  
✅ **Typography sistemi** - 8 font boyutu, 3 font ailesi  
✅ **Spacing sistemi** - 8px grid sistemi  
✅ **Mixin library** - 30+ hazır mixin  
✅ **Performans odaklı** - GPU-accelerated animasyonlar  

---

**Tasarım ve Geliştirme:** NeuroViaBot Team  
**Versiyon:** 2.0.0  
**Lisans:** MIT


