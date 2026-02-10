# GymProLuxe — Complete PRD

## PWA + Admin Panel + Backend API

---

## 1. Executive Summary

### 1.1 Purpose
Build a Progressive Web Application (PWA) version of GymProLuxe along with an Admin Panel and shared Backend API. GymProLuxe is a comprehensive fitness platform currently available as a React Native mobile app.

### 1.2 What We're Building

| Application | Description | Users |
|-------------|-------------|-------|
| **PWA** | User-facing fitness app (workouts, community, nutrition, shop) | End users |
| **Admin Panel** | Management dashboard (users, content, analytics, e-commerce) | Admin/staff |
| **Backend API** | Shared REST API serving both apps | Internal |

### 1.3 Target Platforms
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Installable PWA on all platforms
- Admin Panel — Desktop browsers (responsive but desktop-first)

### 1.4 Key Objectives
1. Feature parity with mobile application
2. Responsive design for all screen sizes
3. Offline capability for essential features
4. Native-like performance and user experience
5. SEO optimization for discoverability
6. Full admin control over content and users

---

## 2. Tech Stack

### 2.1 Frontend (PWA + Admin Panel)

| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework with SSR, PWA support |
| TypeScript | Type safety across the codebase |
| Tailwind CSS | Utility-first responsive styling |
| Zustand | Lightweight state management |
| React Query (TanStack Query) | Server state, caching, and data fetching |
| next-pwa | PWA service worker and manifest |
| Framer Motion | Animations and transitions |
| React Hook Form + Zod | Form handling and validation |
| Recharts | Charts for admin analytics |
| Shadcn/ui | Pre-built accessible UI components |

### 2.2 Backend API

| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API server |
| TypeScript | Type safety |
| Prisma ORM | Database queries and migrations |
| PostgreSQL (Neon) | Primary database (free tier, serverless) |
| Redis (Upstash) | Caching and session storage |
| JWT + bcrypt | Authentication |
| Multer + Cloudinary | File/image uploads |
| Zod | Request validation |
| Swagger/OpenAPI | API documentation |
| Jest + Supertest | API testing |

### 2.3 Infrastructure

| Technology | Purpose |
|------------|---------|
| Vercel | Host PWA + Admin Panel |
| Railway / Render | Host Backend API |
| Neon | Serverless PostgreSQL |
| Upstash | Serverless Redis |
| Cloudinary | Image/video CDN and storage |
| GitHub Actions | CI/CD pipeline |
| Turborepo | Monorepo management |

### 2.4 Project Structure (Monorepo)

```
gympro-pwa/
├── apps/
│   ├── web/                # PWA (Next.js)
│   │   ├── app/            # App router pages
│   │   ├── components/     # UI components
│   │   ├── lib/            # Utils, API client, hooks
│   │   ├── public/         # Static assets, PWA manifest
│   │   └── styles/         # Global styles
│   ├── admin/              # Admin Panel (Next.js)
│   │   ├── app/            # Admin pages
│   │   ├── components/     # Admin UI components
│   │   └── lib/            # Admin utils
│   └── api/                # Backend API (Express)
│       ├── src/
│       │   ├── routes/     # API route handlers
│       │   ├── controllers/# Business logic
│       │   ├── middleware/  # Auth, validation, error handling
│       │   ├── services/   # External service integrations
│       │   └── utils/      # Helpers
│       └── tests/          # API tests
├── packages/
│   └── shared/             # Shared types, validation schemas, constants
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # DB migrations
├── turbo.json              # Turborepo config
├── package.json            # Root package.json
└── docs/                   # Documentation
```

---

## 3. Database Schema (Core Models)

### 3.1 Users & Auth

```
User
├── id (UUID, PK)
├── email (unique)
├── passwordHash
├── firstName
├── lastName
├── avatarUrl
├── role (USER | TRAINER | ADMIN)
├── isActive
├── profile → UserProfile (1:1)
├── subscriptionStatus (FREE | PREMIUM)
├── createdAt
└── updatedAt

UserProfile
├── id (UUID, PK)
├── userId (FK → User)
├── bio
├── dateOfBirth
├── gender
├── height
├── weight
├── fitnessGoal
├── experienceLevel (BEGINNER | INTERMEDIATE | ADVANCED)
└── preferences (JSON)
```

### 3.2 Workouts & Videos

```
WorkoutCategory
├── id (UUID, PK)
├── name
├── slug
├── description
├── imageUrl
└── sortOrder

WorkoutVideo
├── id (UUID, PK)
├── title
├── description
├── thumbnailUrl
├── videoUrl
├── duration (seconds)
├── difficulty (BEGINNER | INTERMEDIATE | ADVANCED)
├── categoryId (FK → WorkoutCategory)
├── trainerId (FK → User)
├── equipmentNeeded (JSON array)
├── caloriesBurned (estimated)
├── isPremium
├── isPublished
├── viewCount
├── createdAt
└── updatedAt

WorkoutSession (user logs)
├── id (UUID, PK)
├── userId (FK → User)
├── videoId (FK → WorkoutVideo, nullable)
├── customWorkoutId (FK → CustomWorkout, nullable)
├── startedAt
├── completedAt
├── duration (seconds)
├── caloriesBurned
└── notes

CustomWorkout
├── id (UUID, PK)
├── userId (FK → User)
├── name
├── description
├── exercises → CustomWorkoutExercise[]
├── isPublic
├── createdAt
└── updatedAt

CustomWorkoutExercise
├── id (UUID, PK)
├── customWorkoutId (FK)
├── exerciseName
├── sets
├── reps
├── weight
├── restSeconds
├── sortOrder
└── notes
```

### 3.3 Nutrition

```
MealPlan
├── id (UUID, PK)
├── userId (FK → User)
├── name
├── date
├── targetCalories
├── meals → Meal[]
└── createdAt

Meal
├── id (UUID, PK)
├── mealPlanId (FK)
├── type (BREAKFAST | LUNCH | DINNER | SNACK)
├── name
├── items → MealItem[]
└── sortOrder

MealItem
├── id (UUID, PK)
├── mealId (FK)
├── name
├── calories
├── protein (g)
├── carbs (g)
├── fat (g)
├── quantity
├── unit
└── sortOrder
```

### 3.4 Community

```
Post
├── id (UUID, PK)
├── userId (FK → User)
├── content (text)
├── imageUrl (nullable)
├── likesCount
├── commentsCount
├── isPublished
├── createdAt
└── updatedAt

Comment
├── id (UUID, PK)
├── postId (FK → Post)
├── userId (FK → User)
├── content
├── createdAt
└── updatedAt

Like
├── id (UUID, PK)
├── postId (FK → Post)
├── userId (FK → User)
└── createdAt (unique: postId + userId)
```

### 3.5 Activity & Progress

```
ActivityLog
├── id (UUID, PK)
├── userId (FK → User)
├── type (STEPS | WORKOUT | CALORIES_BURNED | WATER)
├── value (numeric)
├── unit
├── date
└── createdAt

Achievement
├── id (UUID, PK)
├── name
├── description
├── iconUrl
├── criteria (JSON — e.g., {type: "workouts_completed", threshold: 10})
└── createdAt

UserAchievement
├── id (UUID, PK)
├── userId (FK → User)
├── achievementId (FK → Achievement)
├── unlockedAt
└── progress (numeric)
```

### 3.6 Leaderboard

```
LeaderboardEntry
├── id (UUID, PK)
├── userId (FK → User)
├── period (WEEKLY | MONTHLY | ALL_TIME)
├── score
├── rank
├── category (WORKOUTS | CALORIES | STREAK)
└── updatedAt
```

---

## 4. Feature Specifications — PWA

### 4.1 Authentication

**Screens:** Sign Up, Sign In, Forgot Password, Reset Password, Email Verification

**Features:**
- Email + password registration
- Social login (Google, Apple)
- JWT-based auth with refresh tokens
- "Remember me" functionality
- Password strength validation
- Rate limiting on login attempts

**Offline:** Cached auth token allows offline access to previously loaded content.

### 4.2 Home / Dashboard

**Screens:** Home

**Features:**
- Personalized greeting
- Today's workout recommendation
- Quick stats (streak, workouts this week, calories)
- Continue watching (resume videos)
- Featured/trending workouts
- Community highlights
- Pull-to-refresh

### 4.3 Video Workout Library

**Screens:** Browse, Category View, Video Player, Search

**Features:**
- Browse by category (Strength, Cardio, Yoga, HIIT, etc.)
- Filter by difficulty, duration, equipment, trainer
- Search with autocomplete
- Video player with progress tracking
- Mark as complete
- Favorite/bookmark workouts
- Related video recommendations
- Premium content gating

**Offline:** Cache recently watched videos for offline playback (via service worker).

### 4.4 Custom Workout Builder

**Screens:** My Workouts, Create/Edit Workout, Workout Session

**Features:**
- Build custom workouts from exercise database
- Set reps, sets, weight, rest time per exercise
- Reorder exercises via drag-and-drop
- Active workout timer with rest countdown
- Log completed sets during session
- Share custom workouts with community

### 4.5 Nutrition Tracking

**Screens:** Nutrition Dashboard, Meal Log, Add Meal, Meal Plans

**Features:**
- Daily calorie/macro summary
- Log meals (breakfast, lunch, dinner, snacks)
- Food search database
- Create and save meal plans
- Weekly nutrition overview chart
- Water intake tracker
- Barcode scanner (camera API)

**Offline:** Locally cached meal data, sync when online.

### 4.6 Community

**Screens:** Feed, Create Post, Post Detail, User Profile

**Features:**
- Scrollable feed with posts (text + image)
- Create posts with image upload
- Like and comment on posts
- User profiles with post history
- Report inappropriate content
- Infinite scroll pagination

### 4.7 Leaderboard

**Screens:** Leaderboard

**Features:**
- Weekly, monthly, all-time tabs
- Categories (most workouts, calories burned, longest streak)
- Current user's rank highlighted
- Top 3 users featured at top

### 4.8 Activity / Fitness Tracking

**Screens:** Activity Dashboard, Progress History

**Features:**
- Daily step counter (Web Pedometer API where available)
- Workout history calendar view
- Progress charts (weight, measurements, performance)
- Weekly/monthly summary
- Achievement badges and milestones
- Streak tracking

### 4.9 Shop (Product Catalog)

**Screens:** Shop, Product Detail

**Features:**
- Product listing with grid/list view
- Filter by category, sort by price/name
- Product detail with images, description, pricing
- Search products
- Featured/new products section at top

### 4.10 Profile & Settings

**Screens:** Profile, Edit Profile, Settings, Notifications

**Features:**
- View/edit profile (name, avatar, bio, fitness details)
- Change password
- Notification preferences
- Theme toggle (dark/light mode)
- PWA install prompt
- Delete account
- Privacy settings

### 4.11 PWA-Specific Features

- **Service Worker:** Offline caching, background sync
- **Web App Manifest:** Installable on home screen
- **Push Notifications:** Workout reminders, community activity
- **Responsive Design:** Mobile-first, adapts to tablet/desktop
- **Splash Screen:** Branded loading screen on launch

---

## 5. Feature Specifications — Admin Panel

### 5.1 Admin Dashboard
- Total users, active users, new signups (today/week/month)
- Product count overview
- Top videos by views and completions
- Community activity summary
- Quick action buttons

### 5.2 User Management
- List all users with search, filter, pagination
- View user details (profile, activity, subscription)
- Activate/deactivate accounts
- Change user roles (USER, TRAINER, ADMIN)
- View user workout history and engagement

### 5.3 Content Management — Workouts
- CRUD workout categories
- CRUD workout videos (upload, metadata, thumbnail)
- Set videos as premium/free
- Publish/unpublish videos
- Manage trainers
- Bulk actions (publish, unpublish, delete)

### 5.4 Content Management — Nutrition
- Manage food database
- Create/edit preset meal plans
- Featured meal plans

### 5.5 Community Moderation
- View all posts with filters
- Review reported content
- Remove posts/comments
- Ban users from community
- Pin/feature posts

### 5.6 Analytics Dashboard
- User growth chart
- Retention and churn metrics
- Video engagement (views, completion rate, avg watch time)
- Workout completion rates
- Community metrics (posts/day, active posters)
- Product catalog metrics
- Export data as CSV

### 5.7 Product Management
- CRUD products (name, description, price, images, category)
- Set products as featured/active/inactive
- Manage product categories
- Bulk actions (publish, unpublish, delete)
- Product image upload (URL-based)

### 5.8 Settings
- App configuration (feature flags)
- Push notification management (send to all/segments)
- Achievement/badge management
- Leaderboard configuration

---

## 6. API Endpoints Overview

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
GET    /api/auth/me
```

### Users
```
GET    /api/users                    (admin)
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id                (admin)
GET    /api/users/:id/profile
PUT    /api/users/:id/profile
GET    /api/users/:id/activity
GET    /api/users/:id/achievements
```

### Workouts
```
GET    /api/workouts/categories
GET    /api/workouts/videos
GET    /api/workouts/videos/:id
POST   /api/workouts/videos          (admin)
PUT    /api/workouts/videos/:id      (admin)
DELETE /api/workouts/videos/:id      (admin)
GET    /api/workouts/videos/:id/related
POST   /api/workouts/sessions
GET    /api/workouts/sessions
GET    /api/workouts/history
```

### Custom Workouts
```
GET    /api/custom-workouts
POST   /api/custom-workouts
GET    /api/custom-workouts/:id
PUT    /api/custom-workouts/:id
DELETE /api/custom-workouts/:id
```

### Nutrition
```
GET    /api/nutrition/meal-plans
POST   /api/nutrition/meal-plans
GET    /api/nutrition/meal-plans/:id
PUT    /api/nutrition/meal-plans/:id
DELETE /api/nutrition/meal-plans/:id
POST   /api/nutrition/meals
GET    /api/nutrition/daily-summary
GET    /api/nutrition/food-search?q=
```

### Community
```
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/like
DELETE /api/posts/:id/like
GET    /api/posts/:id/comments
POST   /api/posts/:id/comments
DELETE /api/comments/:id
POST   /api/posts/:id/report
```

### Leaderboard
```
GET    /api/leaderboard?period=weekly&category=workouts
GET    /api/leaderboard/my-rank
```

### Activity
```
POST   /api/activity/log
GET    /api/activity/summary
GET    /api/activity/history
```

### Products
```
GET    /api/products                  (public — browse products)
GET    /api/products/:id              (public — product detail)
GET    /api/products/categories       (public — product categories)
POST   /api/products                  (admin — create product)
PUT    /api/products/:id              (admin — update product)
DELETE /api/products/:id              (admin — delete product)
POST   /api/products/categories       (admin — create category)
PUT    /api/products/categories/:id   (admin — update category)
DELETE /api/products/categories/:id   (admin — delete category)
```

### Admin
```
GET    /api/admin/dashboard
GET    /api/admin/analytics
GET    /api/admin/users
PUT    /api/admin/users/:id/status
GET    /api/admin/content/videos
PUT    /api/admin/content/videos/:id/publish
GET    /api/admin/community/reports
PUT    /api/admin/community/posts/:id/moderate
POST   /api/admin/notifications/send
GET    /api/admin/settings
PUT    /api/admin/settings
```

---

## 7. Development Phases

### Phase 0: Project Setup (Week 1)
- Initialize monorepo with Turborepo
- Set up Next.js apps (web + admin)
- Set up Express API
- Configure TypeScript, ESLint, Prettier
- Set up Prisma + PostgreSQL (Neon)
- Configure Tailwind CSS + Shadcn/ui
- Set up GitHub repo + CI/CD
- PWA manifest + service worker base

### Phase 1: MVP — Auth + Workouts (Weeks 2-4)
- User registration and login (API + PWA)
- JWT auth with refresh tokens
- Browse workout categories and videos
- Video player with progress tracking
- Basic user profile
- Admin: Login + User list + Video management
- Deploy MVP to Vercel + Railway

### Phase 2: Custom Workouts + Activity (Weeks 5-6)
- Custom workout builder
- Active workout session with timer
- Workout history and logging
- Activity dashboard and progress charts
- Achievement system (basic)
- Admin: Workout content management

### Phase 3: Nutrition (Weeks 7-8)
- Meal logging and daily summary
- Meal plan creation
- Food search database
- Macro/calorie charts
- Water intake tracker
- Admin: Nutrition content management

### Phase 4: Community (Weeks 9-10)
- Post feed with infinite scroll
- Create posts with image upload
- Likes and comments
- User profiles
- Content reporting
- Admin: Community moderation

### Phase 5: Leaderboard + Achievements (Week 11)
- Weekly/monthly/all-time leaderboards
- Rank categories
- Full achievement system
- Streak tracking

### Phase 6: Product Catalog / Shop (Weeks 12-13)
- Database: Product + ProductCategory models
- API: CRUD products and categories (admin), public listing + detail
- Admin: Product management (add/edit/delete products and categories)
- PWA: Shop page with product grid, search, category filter
- PWA: Product detail page with images, description, pricing
- Seed sample products for demo

### Phase 7: Polish + Launch (Weeks 14-15)
- PWA optimization (offline, caching, performance)
- Push notifications
- Dark/light theme
- SEO optimization
- Accessibility audit
- Admin: Analytics dashboard
- Load testing
- Bug fixes and QA
- Production deployment

---

## 8. Non-Functional Requirements

### Performance
- Lighthouse score > 90 (Performance, Accessibility, Best Practices, SEO)
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- API response time < 200ms (p95)

### Security
- HTTPS everywhere
- JWT with short-lived access tokens (15 min) + refresh tokens (7 days)
- Password hashing with bcrypt (salt rounds: 12)
- Rate limiting on auth endpoints
- Input validation and sanitization (Zod)
- CORS configuration
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React default escaping + CSP headers)
- OWASP Top 10 compliance

### Scalability
- Stateless API (horizontal scaling ready)
- Database connection pooling (Prisma)
- Redis caching for hot data
- CDN for static assets (Vercel Edge)
- Image optimization (Next.js Image component)

### Offline Capabilities
- Cache workout videos for offline playback
- Cache user profile and recent data
- Queue actions (likes, logs) for sync when online
- Show offline indicator

---

## 9. Third-Party Integrations

| Service | Purpose | Cost |
|---------|---------|------|
| Neon | PostgreSQL database | Free tier (0.5 GB) |
| Upstash | Redis cache | Free tier (10K commands/day) |
| Cloudinary | Image/video storage + CDN | Free tier (25 GB) |
| Built-in Product Catalog | E-commerce | Free (self-hosted) |
| Google OAuth | Social login | Free |
| Apple Sign In | Social login | Free (requires Apple Dev account) |
| Vercel | Frontend hosting | Free tier (hobby) |
| Railway | Backend hosting | Free tier ($5 credit/month) |
| Resend | Transactional emails | Free tier (100 emails/day) |
| Web Push (VAPID) | Push notifications | Free |

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse Performance | > 90 |
| User registration rate | Track |
| Video completion rate | > 40% |
| Daily active users | Track |
| Workout sessions/week/user | > 3 |
| Community posts/week | Track |
| PWA install rate | > 20% of visitors |
| Page load time | < 2s |
| API uptime | > 99.5% |
