# Beyond The Horizon - Client

![icon](/icon.png)

### Live Page URL [Beyond The Horizon](beyondthehorizon.my)

### Link to Server Repository [Beyond-The-Horizon-Server](https://github.com/manxzo/Beyond-The-Horizon-Server)

### Live Server Shuttle URL [Beyond The Horizon Server](https://bth-server-ywjx.shuttle.app/)

### Planning Materials [Project Planning](https://trello.com/b/TzRrOQ94/project-4-bth)

---

## Overview

The client-side of Beyond The Horizon represents my strategic approach to full-stack development while primarily focusing on learning Rust for the backend. As I dedicated significant time to mastering Rust's concepts and implementing a robust server, I made a conscious decision to leverage AI assistance for certain aspects of the frontend development, particularly in areas that were template-driven or repetitive.

## Development Approach & AI Usage

### Services Layer Implementation

The services layer demonstrates my strategic use of AI while maintaining control over critical functionality:

1. **Core API Configuration**: I personally implemented the foundational API setup, including:

   ```typescript
   const api = axios.create({
     baseURL: API_URL,
     withCredentials: true,
     headers: {
       "Content-Type": "application/json",
     },
     timeout: 10000,
   });

   // Custom error handling in interceptors
   instance.interceptors.response.use(
     (response) => response,
     async (error: AxiosError) => {
       let errorMessage = "An error occurred";
       if (error.response?.data) {
         // Custom error extraction and formatting
       }
       addToast({
         description: errorMessage,
         color: "danger",
         size: "lg",
       });
       return Promise.reject(error);
     }
   );
   ```

2. **Route Services Generation**: After establishing the core configuration, I used AI to help generate the repetitive route service functions, as there were numerous endpoints to cover. This included:
   - Basic CRUD operations for each route
   - File upload handling
   - WebSocket connections
   - Standard error handling patterns

### Page Development Process

My approach to page development involved a strategic combination of AI assistance and custom implementation:

1. **Initial Layouts**: I used AI to generate basic page layouts with:

   - Component structure using HeroUI
   - Placeholder sections
   - Basic responsive design patterns

2. **Custom Implementation**: I personally handled all functional aspects:
   - Integration with custom hooks
   - State management logic
   - Error handling
   - User interactions

For example, in the `Feed.tsx` page:

```typescript
export default function Feed() {
  // Custom hooks for data management
  const { createPost, updatePost, deletePost, likePost } = usePost();
  const { currentUser } = useUser();
  const { getMyGroups } = useSupportGroup();

  // Custom state management
  const [postsWithAuthors, setPostsWithAuthors] = useState<Post[]>([]);
  const [searchTags, setSearchTags] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  // Custom data fetching and processing
  const {
    data: postsResponse,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useQuery({
    queryKey: ['posts', 'filtered', searchTags, sortBy],
    queryFn: async () => {
      const response = await postService.getPosts(1, searchTags, sortBy);
      return response.data;
    },
  });
```

### Custom Hooks & Business Logic

All custom hooks and logic were written entirely by me, including:

- User authentication management
- Real-time messaging system
- Support group interactions
- File upload handling
- State management patterns

## Key Features

1. **Authentication System**

   - JWT-based authentication
   - Token refresh mechanism
   - Session management
   - Protected routes

2. **Real-time Communication**

   - WebSocket integration
   - Private messaging
   - Group chat functionality
   - Message status tracking

3. **Support Group Management**

   - Group creation and joining
   - Meeting scheduling
   - Resource sharing
   - Member management

4. **User Profiles**

   - Custom avatar upload
   - Profile customization
   - Privacy settings
   - Activity tracking

5. **Admin Dashboard**

   - User management
   - Content moderation
   - Analytics tracking
   - Report handling

6. **Sponsor Platform**
   - Sponsor application system
   - Mentee matching algorithm
   - Mentorship management
   - Progress tracking
   - Direct communication channels
   - Activity monitoring

## Technical Implementation

### State Management

- Custom hooks for local state
- Context API for global state
- TanStack Query for server state
- WebSocket state synchronization

### Component Architecture

- HeroUI component library
- Custom styled components
- Responsive layouts
- Accessibility features

### API Integration

- Axios for HTTP requests
- WebSocket for real-time features
- File upload handling
- Error boundary implementation

## Development Process Note

This project demonstrates my strategic approach to learning and development. While focusing intensively on learning Rust and building a robust server, I made a conscious decision to leverage AI for certain frontend tasks. Specifically:

1. **Services Layer**:

   - I personally implemented the core API configuration and error handling
   - Used AI to generate repetitive route service functions
   - Maintained control over critical functionality and security measures

2. **Page Development**:

   - Used AI for initial page layouts and component structure
   - Personally implemented all functional aspects, custom hooks, and business logic
   - Integrated real-time features and state management

3. **Custom Implementation**:
   - All custom hooks and business logic were written by me
   - Security measures and authentication flow were personally implemented
   - Real-time features and state management were custom-built

This approach allowed me to:

- Focus on learning Rust and building a robust server
- Maintain high code quality in the frontend
- Efficiently manage development time
- Ensure security and performance standards

## Dependencies

## Performance Optimizations

- [Development Setup](#development-setup)
- [Dependencies](#dependencies)
- [Contributing](#contributing)

---

## Attributions

### External Libraries and Frameworks

- HeroUI (v2.7.5) - UI Component Library - [https://heroui.com](https://heroui.com)
- TanStack Query (v5.67.3) - Data Fetching Library - [https://tanstack.com/query](https://tanstack.com/query)
- Framer Motion (v11.15.0) - Animation Library - [https://www.framer.com/motion/](https://www.framer.com/motion/)

### AI Assistance

- OpenAI. (2024). ChatGPT (GPT-4) [Large language model]. Used for code generation and debugging assistance. https://chat.openai.com
- Anthropic. (2024). Claude [Large language model]. Used for architecture planning and code review. https://anthropic.com/claude

### Assets

- Icons provided by Lucide React (v0.482.0) - [https://lucide.dev](https://lucide.dev)
- Charts implemented using Recharts (v2.15.1) - [https://recharts.org](https://recharts.org)

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/beyond-the-horizon-client.git

# Install dependencies
cd beyond-the-horizon-client
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
npm run format       # Format code
```

---

## AI Assistance Note

This project was developed with AI assistance for:

- Frontend template generation
- Service layer implementation
- Component structure
- UI/UX design patterns
- State management patterns
- Websocket Implementation

Most code logic was written and understood by me, with AI serving as a tool to write tedious and simple but large and repetitive code while I focused on mastering Rust for the backend. I also had to use AI to help me understand the proper implementation of Websockets as I had incorrectly implemented it in Project 3 and wanted to learn how to implement it in a more robust and practical way.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Component Library](#component-library)
- [State Management](#state-management)
- [Real-time Features](#real-time-features)
- [Security & Privacy](#security--privacy)
- [Stretch Goals](#stretch-goals)

---

## Features

### User Management

1. **Authentication**

   - Secure login and registration
   - Session management
   - Privacy controls

2. **Profile Management**
   - Personal information settings
   - Privacy mode toggle
   - Skills and interests
   - Support history
   - Resource bookmarks

### Sponsor System

1. **Sponsor Dashboard**

   - Overview statistics
   - Pending mentee requests
   - Active mentees tracking
   - Sponsor status monitoring
   - Quick action shortcuts

2. **Mentee Management**

   - Review and respond to mentee requests
   - Detailed mentee profiles
   - Direct messaging integration
   - Mentoring history tracking
   - Activity monitoring

3. **Sponsor Tools**
   - Mentoring guidelines
   - Communication channels
   - Progress tracking
   - Resource sharing
   - Status reporting

### Support Groups

1. **Group Management**

   - Create and join groups
   - Member management
   - Meeting scheduling
   - Resource sharing
   - Activity tracking
   - Group Chats

2. **Meeting Features**
   - Schedule creation
   - Reminder system

### Resource Center

1. **Content Management**

   - Resource categories
   - Search functionality

2. **Administrative Tools**
   - Content moderation
   - User management
   - Analytics dashboard
   - Report handling
   - System settings

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── groups/         # Support group components
│   ├── meetings/       # Meeting management
│   ├── resources/      # Resource center
│   ├── sponsor/        # Sponsor components
│   └── admin/          # Admin dashboard
├── pages/              # Page components
│   ├── sponsor/       # Sponsor dashboard & management
│   └── admin/         # Admin pages
├── hooks/              # Custom React hooks
├── layouts/            # Layout components
├── interfaces/         # TypeScript interfaces
├── types/              # Type definitions
├── contexts/           # React contexts
├── services/           # API services
├── utils/              # Utility functions
└── config/             # Configuration files
```

### Key Components

1. **Authentication Components**

```typescript
// LoginForm.tsx
export const LoginForm: React.FC = () => {
  // Login form implementation
};
```

2. **Group Components**

```typescript
// GroupCard.tsx
export const SupportGroupDashboard: React.FC<GroupProps> = ({ group }) => {
  // Group display logic
};
```

3. **Sponsor Components**

```typescript
// SponsorDashboard.tsx
export const SponsorDashboard: React.FC = () => {
  // Sponsor dashboard implementation with stats and actions
};
```

---

## Component Library

### HeroUI Integration

- **Core Components**

  - Button variants
  - Form elements
  - Modal dialogs
  - Navigation components
  - Data display elements

## State Management

### Global State

- **Authentication Context**

  - User session
  - Permissions

- **Group Context**
  - Active groups
  - Meeting schedules
  - Member lists
  - Resource access

### Local State

- Form management
- UI interactions
- Component state
- Cache management

---

## Real-time Features

### WebSocket Integration

- Live chat messaging
- Meeting notifications
- Group updates
- Status indicators
- Activity tracking

### Push Notifications

- Meeting reminders
- Resource updates
- Group activities
- System notifications
- Direct messages

---

## Security & Privacy

### Authentication

- JWT token management
- Session handling
- Password security

---

## Stretch Goals

### Enhanced User Experience

- Develop a mobile app version using React Native
- Add voice and video chat capabilities for meetings

### Advanced Features

- Implement AI-powered content moderation
- Add group analytics dashboard for sponsors
- Develop an anonymous posting feature
- Create a resource recommendation system

### Technical Improvements

- Implement server-side rendering (SSR) for better performance
- Add end-to-end encryption for private messages
- Implement WebRTC for peer-to-peer communication

### Community Features

- Create a badge and achievement system
- Implement a mentorship matching algorithm
- Add group event planning tools
- Develop a resource marketplace

### Integration & Expansion

- Add social media integration
- Implement calendar sync with popular providers
- Create an API for third-party integrations
