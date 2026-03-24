# AccessEdu - Real-time Sign Language Translation Platform

## Overview
AccessEdu is a web-based sign language translation application that provides real-time bidirectional translation with webcam, video upload, and image upload support. Built with accessibility as a core principle.

## Tech Stack
- **Frontend**: React + Vite, TailwindCSS, Shadcn UI, TanStack Query
- **Backend**: Express.js, WebSocket (ws), Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **ML**: TensorFlow.js (client-side inference simulation)
- **TTS**: Web Speech API

## Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (landing, auth, recognize, history)
│   │   ├── lib/            # Utilities, contexts (theme, auth, accessibility)
│   │   └── hooks/          # Custom React hooks
├── server/                 # Backend Express server
│   ├── routes.ts           # API endpoints and WebSocket server
│   ├── storage.ts          # Database storage layer
│   └── db.ts               # Drizzle database connection
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle schema definitions
└── design_guidelines.md    # Frontend design system
```

## Features
- **Real-time webcam recognition**: Live sign language detection with confidence scores
- **Video upload**: Upload and process video files (.mp4, .webm, .mov)
- **Image upload**: Analyze static sign language images (.jpg, .png)
- **Text-to-Speech**: Hear recognized text spoken aloud
- **Translation history**: Save, search, filter, and manage translations
- **Accessibility**: Font scaling (100%/125%/150%), high contrast mode, reduced motion, ARIA labels

## API Endpoints
- `GET /api/translations` - List all translations (optional: ?userId=xxx)
- `GET /api/translations/:id` - Get single translation
- `POST /api/translations` - Create new translation
- `DELETE /api/translations/:id` - Delete translation
- `POST /api/recognize` - Simulate recognition (for testing)
- `GET /api/health` - Health check endpoint
- `WS /ws` - WebSocket for real-time inference

## Database Schema
- **users**: id, username, password, userType, createdAt
- **translations**: id, userId, text, confidence, inputType, thumbnailPath, audioPath, mediaPath, createdAt

## User Types
- Deaf & Hard of Hearing
- Non-Signer
- Teacher/Administrator
- Elderly/Visually Challenged

## Running the Project
The application runs with `npm run dev` which starts both the Express backend and Vite frontend on port 5000.

## Recent Changes
- Initial implementation of AccessEdu MVP
- Added real-time webcam recognition with simulated TF.js inference
- Implemented video and image upload processing
- Created translation history with CRUD operations
- Added accessibility features (theme, font scaling, high contrast)
- Integrated WebSocket for real-time inference fallback
