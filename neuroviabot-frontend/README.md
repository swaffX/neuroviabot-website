# 🌐 NeuroViaBot Dashboard (Frontend)

Enterprise-grade, production-ready web dashboard for NeuroViaBot management. Built with Next.js 15, TypeScript, and modern best practices.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ Features

### 🎨 UI/UX
- ✅ Glassmorphism design with smooth animations
- ✅ Fully responsive & mobile-optimized
- ✅ Dark mode optimized
- ✅ Accessibility (WCAG 2.1 AA compliant)
- ✅ Loading states & skeleton screens
- ✅ Error boundaries with graceful fallbacks

### 🔐 Security
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Discord OAuth authentication
- ✅ Environment variable validation
- ✅ Input sanitization & validation

### ⚡ Performance
- ✅ Image optimization (AVIF/WebP)
- ✅ Font optimization with preloading
- ✅ Web Vitals tracking
- ✅ Code splitting & lazy loading
- ✅ Production-ready Dockerfile

### 🧩 Developer Experience
- ✅ Strict TypeScript configuration
- ✅ ESLint + Prettier setup
- ✅ Custom hooks library
- ✅ Reusable UI component library
- ✅ Form validation utilities

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

## 🛠️ Tech Stack

### Core
- **Framework:** Next.js 15.1 (App Router)
- **Language:** TypeScript 5.6 (Strict Mode)
- **Styling:** Tailwind CSS 3.4 + SCSS
- **State Management:** React Context + SWR

### UI & Interactions
- **Components:** Custom component library
- **Animations:** Framer Motion
- **Icons:** Heroicons + React Icons
- **Charts:** Recharts + Chart.js

### Development Tools
- **Linting:** ESLint 9 + Prettier 3
- **Type Checking:** Strict TypeScript
- **Performance:** Web Vitals tracking
- **Error Tracking:** Built-in error boundaries

## 📱 Project Structure

```
neuroviabot-frontend/
├── app/                      # Next.js app router
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Homepage
│   ├── error.tsx             # Global error boundary
│   ├── loading.tsx           # Global loading state
│   ├── dashboard/            # Dashboard pages
│   ├── ozellikler/           # Features page
│   └── globals.scss          # Global styles
├── components/               # React components
│   ├── ui/                   # UI component library
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Dialog.tsx
│   │   ├── Drawer.tsx
│   │   ├── Alert.tsx
│   │   ├── Badge.tsx
│   │   └── Layout.tsx
│   ├── Skeleton.tsx          # Loading skeletons
│   ├── ErrorBoundary.tsx     # Error boundaries
│   ├── FocusTrap.tsx         # Accessibility
│   ├── VisuallyHidden.tsx    # Screen reader support
│   └── OptimizedImage.tsx    # Image optimization
├── hooks/                    # Custom React hooks
│   ├── useForm.ts            # Form management
│   ├── useCommonHooks.ts     # Common utilities
│   └── useAdvancedHooks.ts   # Advanced utilities
├── lib/                      # Utility functions
│   ├── utils.ts              # Common utilities
│   ├── validation.ts         # Form validation
│   ├── vitals.ts             # Performance tracking
│   └── env.ts                # Environment config
├── contexts/                 # React contexts
├── public/                   # Static assets
├── .env.example              # Environment template
├── .eslintrc.json            # ESLint config
├── .prettierrc               # Prettier config
├── Dockerfile                # Production Docker image
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## ⚙️ Configuration

### Environment Variables

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Configure required variables:
```env
# Required
NEXT_PUBLIC_APP_NAME=NeuroVia
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Optional but recommended
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

See `.env.example` for all available options.

### Docker Deployment

```bash
# Build image
docker build -t neuroviabot-frontend .

# Run container
docker run -p 3001:3001 neuroviabot-frontend

# Or use docker-compose
docker-compose up
```

## 📦 Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build files

## 🎨 Features

- ✅ Responsive design
- ✅ Dark mode optimized
- ✅ Discord OAuth authentication
- ✅ Real-time statistics
- ✅ Server management
- ✅ Command analytics
- ✅ User dashboard

## 📄 License

MIT
