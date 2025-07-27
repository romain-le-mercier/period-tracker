# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a minimalist period tracking Progressive Web App (PWA) built with React and TypeScript. The app follows SOLID principles for maintainable code and emphasizes a calm, sophisticated user experience.

## Development Commands

### Docker Commands
```bash
# Start all services
docker-compose up -d

# Start with build
docker-compose up --build

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Backend Commands
```bash
cd backend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run Prisma migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed database
npm run prisma:seed

# Run tests
npm test

# Run linting
npm run lint
```

### Frontend Commands (to be configured)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Architecture & Code Organization

The project follows a clean architecture with separation of concerns:

```
src/
├── components/           # Reusable UI components
│   ├── Calendar/
│   ├── PeriodEntry/
│   └── common/
├── hooks/               # Custom hooks for business logic
├── services/            # Business logic and data access
├── types/               # TypeScript interfaces
├── utils/               # Pure utility functions
└── constants/           # App constants and config
```

### Key Architectural Patterns

- **Repository Pattern**: Abstract data access layer for persistence
- **Custom Hooks**: Encapsulate business logic (useCycleData, usePredictions, usePeriodEntry)
- **Service Layer**: Separate business logic from UI (cycleCalculator, predictionEngine)
- **Component Composition**: Small, focused components following Single Responsibility Principle

## SOLID Principles Implementation

When adding features or modifying code, ensure adherence to:

- **SRP**: Each component/function has one reason to change
- **OCP**: Design for extension without modification (use strategy pattern for algorithms)
- **LSP**: Maintain consistent interfaces across similar components
- **ISP**: Create small, focused interfaces
- **DIP**: Depend on abstractions (use dependency injection for services)

## Core Data Models

```typescript
interface Period {
  id: string;
  startDate: Date;
  endDate?: Date;
  cycleLength?: number;
}

interface CyclePrediction {
  nextPeriodDate: Date;
  ovulationDate: Date;
  confidenceLevel: 'high' | 'medium' | 'low';
  cycleLength: number;
}
```

## PWA Requirements

- Implement service worker for offline functionality
- Configure manifest.json for installability
- Ensure responsive, mobile-first design
- Use IndexedDB or similar for local data persistence

## Design System

- Primary: Soft teal (#4A9B8E) or sage green (#87A96B)
- Secondary: Warm gray (#8B8680)
- Accent: Muted purple (#A294B8) or soft coral (#E8A87C)
- Background: Off-white (#FAFAFA)
- Text: Dark gray (#2D3748)
- Use Tailwind CSS for styling with consistent spacing scale
- Touch-friendly elements (44px minimum)

## Development Guidelines

1. Use functional components with TypeScript
2. Keep components under 100 lines
3. Implement proper error boundaries
4. Use React.memo, useMemo, and useCallback for performance
5. Follow mobile-first responsive design
6. Ensure WCAG 2.1 AA accessibility compliance

## Current Status

The project has the following infrastructure set up:
- Docker environment with multi-container architecture (Frontend: 7850, Backend: 7851, DB: 7852)
- Backend API with Express, TypeScript, Prisma ORM, and PostgreSQL
- Frontend with React 18, TypeScript, Vite, Tailwind CSS, and PWA configuration
- Complete Prisma schema with User, Period, Cycle, Prediction, and Settings models
- Design system configured with custom colors and Tailwind utilities

## Environment Setup

1. Copy `.env.example` to `.env` and configure your environment variables
2. Ensure Docker is installed and running
3. Run `docker-compose up --build` to start all services
4. Backend API will be available at http://localhost:7851
5. Frontend will be available at http://localhost:7850

## Next Steps

- Implement RESTful API endpoints with Zod validation
- Build core UI components (Calendar, PeriodEntry, Navigation)
- Create authentication flow
- Implement period logging with offline support
- Add intelligent prediction algorithms