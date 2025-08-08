# ¿De dónde eres? - Cultural Quiz Application

## Overview

A cultural quiz web application that adapts to different countries and regions, allowing users to test their knowledge of local slang, expressions, customs, and memes. The application currently supports Cuba and Honduras, with plans to expand to more Spanish-speaking countries. Users progress through four difficulty levels, from beginner to "legend mode," with country-specific localization that changes language, styling, and cultural references based on their selection.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with authentication-based route protection
- **UI Components**: Custom component system built on Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom country-specific color schemes and CSS variables
- **Fonts**: Nunito as primary font family with Inter for UI elements
- **State Management**: React Query (TanStack Query) for server state with custom hooks for quiz logic
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Server Framework**: Express.js with TypeScript in ESM format
- **Authentication**: Replit Auth with OpenID Connect (OIDC) using Passport.js strategy
- **Session Management**: Express sessions with PostgreSQL store for persistence
- **API Design**: RESTful endpoints with structured error handling and request logging
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Storage Pattern**: Repository pattern with dedicated storage interface for data access abstraction

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless connection
- **Schema Design**: Separate tables for users, countries, questions, user progress, quiz sessions, and session storage
- **Question Data**: JSON files organized by country in the data/questions directory for easy content management
- **Migration System**: Drizzle Kit for database schema migrations and pushes

### Authentication and Authorization
- **Provider**: Replit Auth with OIDC flow
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **User Management**: Automatic user creation/update with profile synchronization
- **Route Protection**: Middleware-based authentication checks with fallback to landing page

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket connections
- **Connection Pooling**: @neondatabase/serverless with ws WebSocket constructor

### Authentication Services
- **Replit Auth**: OAuth/OIDC provider with openid-client library
- **Session Management**: connect-pg-simple for PostgreSQL session storage

### UI and Styling Libraries
- **Component Library**: Extensive Radix UI primitive collection for accessible components
- **Styling Framework**: Tailwind CSS with PostCSS processing
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts (Nunito, Inter) loaded via CDN

### Development and Build Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Development**: TSX for TypeScript execution and hot reloading
- **Production**: ESBuild for server bundling with external package handling
- **Code Quality**: TypeScript strict mode with comprehensive type checking

### Utility Libraries
- **Validation**: Zod for runtime type validation and schema definition
- **Date Handling**: date-fns for localized date manipulation
- **Styling Utilities**: clsx and class-variance-authority for conditional styling
- **Caching**: memoizee for function result memoization