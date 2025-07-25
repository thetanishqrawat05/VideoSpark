# AI Video Generation Platform

## Overview

This is a comprehensive AI-powered text-to-video generation platform designed to achieve Google Veo 3 level quality using completely free alternatives. The system includes advanced video analysis capabilities to understand reference quality standards and implement professional-grade video generation without expensive paid APIs.

## User Preferences

Preferred communication style: Simple, everyday language.
Cost preference: Completely free system without any API keys or paid services.
Quality goal: Achieve Google Veo 3 level quality using only open-source alternatives.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **Tailwind CSS** for styling with a custom design system
- **shadcn/ui** component library built on Radix UI primitives
- **TanStack Query** for server state management and API caching
- **Wouter** for lightweight client-side routing

### Backend Architecture
- **Express.js** server with TypeScript
- **Drizzle ORM** with PostgreSQL for database operations
- **Neon Database** as the serverless PostgreSQL provider
- RESTful API design with JSON responses
- File upload handling with Multer middleware

### Data Storage
- **PostgreSQL** database hosted on Neon
- **Drizzle ORM** for type-safe database operations
- Database migrations managed through Drizzle Kit
- Schema defined in shared TypeScript files for type consistency

## Key Components

### Database Schema
- **Users**: Authentication, credits, and subscription plans
- **Video Projects**: Video generation requests with settings and status
- **Voice Models**: Available TTS voices from different providers
- **Avatar Models**: AI avatar configurations for video generation
- **Background Music**: Audio tracks categorized by genre
- **Sound Effects**: Audio effects categorized by type

### Free Video Generation Pipeline
1. **Reference Video Analysis**: Advanced video analyzer extracts quality benchmarks from user-provided reference videos
2. **Quality Assessment**: Technical specification analysis including resolution, bitrate, codecs, and visual effects
3. **Free Alternative Selection**: Optimal pipeline recommendation using completely free tools
4. **Professional Implementation**: Step-by-step guide for achieving premium quality without paid services

### Free Technology Stack (Zero Cost Implementation)
- **eSpeak/Festival/Pico TTS**: Free text-to-speech engines (working locally)
- **Rule-based AI Enhancement**: Smart prompt improvement without OpenAI API
- **FFmpeg**: Professional audio/video processing (completely free)
- **Stable Video Diffusion**: Open-source text-to-video generation
- **Coqui TTS & Bark**: Professional voice synthesis alternatives
- **Wav2Lip & SadTalker**: Free lip-syncing and avatar generation
- **Real-ESRGAN**: AI video upscaling and enhancement
- **OpenColorIO**: Industry-standard color management

### Video Analysis System
- **Technical Analysis**: Resolution, bitrate, frame rate, codec detection
- **Quality Assessment**: Motion blur, lighting, color grading evaluation
- **Feature Detection**: Voiceover, background music, sound effects identification
- **Benchmark Generation**: Custom quality targets based on reference videos
- **Free Pipeline Recommendations**: Optimal tool selection for matching quality standards

### Authentication & Authorization
- User-based system with credits for video generation
- Plan-based restrictions (free vs paid tiers)
- Session management for API access

## Data Flow

1. User creates video project with text prompt and settings
2. Backend enhances prompt using OpenAI
3. Text-to-speech conversion via ElevenLabs
4. Avatar video generation with lip-sync
5. Background music and effects added
6. Final video composition and storage
7. Real-time progress updates to frontend

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL hosting
- **OpenAI**: GPT-4o for prompt enhancement
- **ElevenLabs**: Voice synthesis
- **D-ID**: Avatar generation
- **Synthesia**: Alternative avatar service

### Development Tools
- **Vite**: Build tool and dev server
- **Drizzle Kit**: Database migrations
- **ESBuild**: Production bundling
- **TypeScript**: Type safety across the stack

## Deployment Strategy

### Build Process
- Frontend builds to `dist/public` via Vite
- Backend bundles to `dist/index.js` via ESBuild
- Single deployment artifact with static file serving

### Environment Configuration
- Database URL from Neon
- API keys for external services
- Development vs production environment handling

### File Storage
- Temporary uploads to `uploads/temp/`
- Processed videos stored in `uploads/`
- Static file serving for generated content

The architecture supports scalable video generation with a clean separation between frontend, backend, and external services. The shared schema ensures type safety across the full stack, while the modular service design allows for easy integration of additional AI providers.

## Recent Updates (July 2025)

### Premium Multilingual TTS System
- **High-Quality English Voices**: Sarah Professional, David Professional, Emma Natural, Marcus Narrator
- **Premium Hindi Voices**: Priya Hindi, Arjun Hindi, Kavya Professional, Vikram Narrator  
- **Advanced Audio Processing**: Professional harmonics, filtering, and mastering
- **Multiple TTS Engines**: Coqui TTS, Bark AI, Indic TTS with fallback to eSpeak/Festival

### Professional Video Generation
- **4K Ultra Quality**: 3840x2160, 50 Mbps, 60fps, Rec.2020 HDR
- **Cinema-Grade Color Grading**: Professional film look with color curves and vignetting
- **Advanced Compositing**: Multi-layer video processing with motion graphics
- **Broadcast Quality**: Professional mastering with industry-standard codecs

### Enhanced User Experience
- **Language-Specific Interface**: Separate English and Hindi voice selections
- **Premium Quality Indicators**: Visual badges showing high-quality vs standard voices
- **Comprehensive Setup Guide**: Complete installation instructions for all free tools
- **Real-Time Voice Preview**: Test voices before generating videos

All features remain 100% free with no API keys or subscriptions required.