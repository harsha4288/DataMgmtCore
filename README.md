# Generic Data Management Platform - Multi-Prototype Repository

> **🎯 For Everyone:** This README serves developers, AI assistants, and project stakeholders  
> **🗺️ Need specific documentation?** See [`DOCUMENTATION_MAP.md`](./DOCUMENTATION_MAP.md)

## 🚀 Quick Start (Choose Your Path)

### 👨‍💻 **For Developers**
```bash
cd prototypes/react-web-platform  # Current active prototype
npm install && npm run dev
```
**Next:** Read `prototypes/react-web-platform/README.md` for setup details

### 🤖 **For AI Assistants**
**Current Context:**
- **Active Prototype:** React Web Platform (Phase 2 - 45% complete, major progress achieved)
- **Tech Stack:** React 18 + TypeScript + Vite + Tailwind + TanStack Query + Zustand
- **Architecture:** Three-layer system (Data Engine → Behavior → Render) - ✅ VALIDATED with working components
- **Achievement:** Stock domain + DataTable component demonstrate architecture effectiveness
- **Focus:** Real API integration, News domain demo, component library expansion

**Key Implementation Files:**
- Stock Domain: `prototypes/react-web-platform/src/domains/stocks/StockDashboard.tsx`
- Reusable Components: `prototypes/react-web-platform/src/components/behaviors/DataTable.tsx`
- UI Components: `prototypes/react-web-platform/src/components/ui/` (Button, Input, Modal)
- Entity System: `prototypes/react-web-platform/src/core/entity/`
- Progress Tracking: `prototypes/react-web-platform/PROGRESS.md`

### 📊 **For Project Managers**
- **Current Status:** [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)
- **Progress Comparison:** [`docs/project-management/prototype-comparison.md`](./docs/project-management/prototype-comparison.md)
- **Next Milestones:** Complete News Demo, User Directory, Product Catalog

## 🏗️ Project Architecture

### **What We're Building**
Configuration-driven data management platform that adapts to different business needs:
- **Volunteer Management** - Event scheduling, resource allocation
- **Student Data Systems** - Academic records, parent portals  
- **Alumni Networks** - Professional profiles, mentorship
- **Event Management** - Registration, analytics, communication

### **How We're Building It**
Multiple prototype implementations to find optimal technical approaches:

| Prototype | Status | Technology | Focus |
|-----------|--------|------------|--------|
| **React Web** | 🔄 Active (45%) | React 18 + TypeScript + Vite | Web-first, PWA capable |
| **React Native** | 📋 Planned | React Native + Expo | Mobile-first, offline |
| **Next.js Enterprise** | 📋 Planned | Next.js 14 + SSR | Enterprise, SEO |
| **Vue Lightweight** | 📋 Planned | Vue 3 + Composition API | Minimal bundle |

### **Core Architecture Principles**
1. **Three-Layer System:** Data Engine → Behavior → Render
2. **Configuration-Driven:** UI/logic through config, not code
3. **Platform-Adaptive:** Mobile/tablet/desktop responsive
4. **Component Reusability:** Build once, use across domains

## 📋 Development Guidelines

### **For All Contributors:**
- **TypeScript First:** 100% type coverage required
- **Performance Critical:** Leverage modern framework features
- **Mobile-First:** Touch interactions, responsive design
- **Documentation:** Update relevant .md files as you implement

### **Common Development Tasks:**
1. **Adding Data Adapters:** Follow patterns in `prototypes/react-web-platform/src/core/data-adapters/base-adapter.ts`
2. **Creating Demo Domains:** Use `src/domains/stocks/` as template
3. **Updating Progress:** Modify `prototypes/{name}/PROGRESS.md` + `PROJECT_STATUS.md`
4. **Architecture Changes:** Document in `docs/architecture/`

## 📚 Essential Documentation

### **Planning & Requirements**
- [`REQUIREMENTS.md`](./REQUIREMENTS.md) - Business requirements (all prototypes)
- [`IMPLEMENTATION_STRATEGY.md`](./IMPLEMENTATION_STRATEGY.md) - Shared phases & milestones
- [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) - Current progress dashboard

### **Implementation Guides**
- [`prototypes/react-web-platform/IMPLEMENTATION_PLAN.md`](./prototypes/react-web-platform/IMPLEMENTATION_PLAN.md) - React technical details
- [`docs/architecture/`](./docs/architecture/) - Shared architectural patterns
- [`docs/development/`](./docs/development/) - Coding standards & best practices

### **Complete Navigation**
- [`DOCUMENTATION_MAP.md`](./DOCUMENTATION_MAP.md) - Full documentation index

## 🎯 Current Priorities (Updated - Foundation Complete, Architecture Validated)
1. **✅ COMPLETED: Stock Domain** - Successfully extracted to dedicated `src/domains/stocks/StockDashboard.tsx`
2. **✅ COMPLETED: Component Library** - DataTable + UI components built and working
3. **✅ COMPLETED: Environment Setup** - API configuration ready (.env.local created)
4. **✅ VALIDATED: Architecture Effectiveness** - Three-layer reusability proven with working components

### **🔥 Next Priorities:**
1. **Real API Integration** - Add Alpha Vantage API key for live data
2. **News Domain Demo** - Build second domain using established DataTable patterns
3. **Component Library Expansion** - Add pagination, filtering, form components

---

*This repository uses a multi-prototype approach to validate the best technical strategy for different deployment scenarios. Each prototype implements the same business requirements using different technical approaches.*