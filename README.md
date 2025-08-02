# QuickDesk - Support Ticket System

A modern support ticket management system built with React, TypeScript, and Supabase.

## Features

- 🔐 **Authentication** - Secure user login and registration
- 🎫 **Ticket Management** - Create, view, and manage support tickets
- 📎 **File Attachments** - Upload images, documents, and files to tickets
- 👥 **User Management** - Admin panel for user management
- 📊 **Analytics** - Dashboard with ticket statistics
- 🏷️ **Categories** - Organize tickets by categories
- 💬 **Comments** - Add comments to tickets
- 👍 **Voting** - Upvote/downvote tickets
- 📱 **Responsive** - Works on desktop and mobile

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel
- **State Management**: React Query, Context API

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ease-ticket-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Update `.env` with your Supabase credentials.

4. **Start development server**
   ```bash
   npm run dev
   ```

## Deployment

The app is configured for deployment on Vercel with proper routing support.

### Vercel Configuration

The `vercel.json` file ensures:
- ✅ Client-side routing works correctly
- ✅ No 404 errors on page refresh
- ✅ Direct URL access works
- ✅ All routes function properly

## File Attachments

The attachment system supports:
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT
- **Videos**: MP4, WebM, OGG
- **Audio**: MP3, WAV, OGG

Maximum file size: 10MB per file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License