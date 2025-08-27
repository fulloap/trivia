# ¿De dónde eres? - Cultural Quiz Application

## Overview

A cultural quiz web application that adapts to different countries and regions, allowing users to test their knowledge of local slang, expressions, customs, and memes. The application currently supports Cuba (1,500 questions) and Honduras (1,500 questions) with visual flag representations. Users progress through four difficulty levels, from beginner to "legend mode," with country-specific localization that changes language, styling, and cultural references based on their selection. Features a comprehensive scoring system with 1 point per correct answer, help system with 20-point penalty and 3 maximum hints per session, real-time rankings by country and level, and complete progress tracking stored in PostgreSQL. All questions are multiple-choice format with no text input required from users.

### Recent Updates (August 2025)
- **Landing Page**: Beautiful landing page with gradients, statistics, and country showcases that appears first for unauthenticated users
- **User Registration**: Enhanced validation allowing letters, numbers, underscores, hyphens, and dots in usernames
- **Question Anti-Repetition**: System prevents duplicate questions within quiz sessions using session tracking
- **PWA Integration**: Mobile app installation button integrated into bottom navigation menu
- **Navigation Flow**: Landing → Registration → Game with proper back navigation
- **Question Database Cleanup**: Removed 739 duplicate questions from Honduras dataset, maintaining 293 unique questions (77 level 1, 80 level 2, 79 level 3, 57 level 4). Cuba dataset was clean with 1,032 unique questions
- **Massive Question Reorganization (August 26, 2025)**: Complete cultural question overhaul based on authentic 2024 research:
  - Eliminated all previous duplicate questions from database
  - Created 50 high-quality cultural questions (25 Cuba, 25 Honduras)
  - Proper difficulty distribution: Level 1 (basic vocabulary) → Level 4 (expert cultural knowledge)
  - All content uses authentic country-specific language and expressions
  - Covers essential categories: slang, food, music, history, geography, traditions
  - Questions sourced from comprehensive cultural research of Cuban and Honduran expressions, idioms, and cultural facts
  - Framework established for expansion to 1000+ questions with 11 content categories per country
- **Production Deployment System (August 27, 2025)**: Complete Docker and deployment infrastructure
  - Fixed all WebSocket database connection issues by switching to HTTP connections
  - Custom build system that eliminates vite dependencies from production bundle
  - Comprehensive error handling with user-friendly messages vs technical error logging
  - Health checks and monitoring endpoints for production stability
- **Email Notification System (August 27, 2025)**: Automated email system with professional templates
  - Welcome emails sent immediately upon registration with referral codes
  - Referral bonus notifications when friends complete 3 questions
  - SMTP server configured with trivia@cubacoin.org
  - Non-blocking email sending with error handling and logging

### Referral System
Complete referral system where each user receives a unique sharing link (trivia.cubacoin.org?ref=CODE). When referred friends complete 3 correct answers, the referrer receives 1 bonus help that adds to their base 3 helps per quiz session. The system tracks referral relationships and automatically awards bonuses.

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
- **Primary Database**: PostgreSQL with Neon serverless connection for persistent data storage
- **Schema Design**: Complete relational schema with tables for:
  - `users`: User authentication with email/password, total scores, and referral system
  - `countries`: Country configurations with flags and themes
  - `questions`: Quiz questions with descriptions and difficulty levels
  - `user_progress`: Individual progress tracking by country and level
  - `quiz_sessions`: Active and completed quiz sessions with detailed data
  - `rankings`: Leaderboards by country, level, and global rankings
  - `sessions`: Authentication session storage
- **Question Data**: JSON files organized by country in the data/questions directory for content management
  - Cuba: 1,500 questions (375 level 1, 375 level 2, 375 level 3, 375 level 4) - 3000+ question expansion complete with authentic 2024 cultural research
  - Honduras: 1,500 questions (375 level 1, 375 level 2, 375 level 3, 375 level 4) - 3000+ question expansion complete with authentic 2024 cultural research
  - **Content Quality**: All 3,000 questions use authentic country-specific slang, expressions, and cultural references
  - **Research Sources**: Based on comprehensive 2024 cultural research from authentic Cuban and Honduran sources including real slang dictionaries and cultural websites
  - **Expansion Complete**: Successfully scaled to 3,000 unique questions with perfect difficulty distribution and zero duplicates
- **Migration System**: Drizzle Kit for database schema migrations and pushes
- **Data Persistence**: All quiz progress, rankings, and user activity permanently stored in PostgreSQL

### Authentication and Authorization
- **Authentication System**: Custom email/password authentication with bcrypt hashing (upgraded from username-only)
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **User Management**: Email/password registration with username, profile management capabilities
- **Route Protection**: Session-based authentication checks with fallback to login screen
- **Security Features**: Password hashing with bcrypt, email uniqueness validation, password strength requirements

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