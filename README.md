# Vocaify - AI-Powered CV Search Engine

A beautiful, modern landing page for Vocaify - the AI-powered CV database search engine that helps HR professionals find the perfect candidate with natural language queries.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **TailwindCSS** for beautiful, responsive styling
- **Firebase Authentication** with email/password and Google OAuth
- **Protected routes** with middleware
- **Smooth animations** with fade-in and slide-up effects
- **Toast notifications** for user feedback
- **Mobile responsive** design
- **Production-ready** code quality
- **SEO optimized** with proper metadata

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Static type checking
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Firebase](https://firebase.google.com/) - Authentication and backend services
- [React Hot Toast](https://react-hot-toast.com/) - Toast notifications
- [React](https://react.dev/) - UI library

## Project Structure

```
2Vocaify2/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx     # Login page
│   │   └── signup/page.tsx    # Signup page
│   ├── dashboard/             # Protected dashboard
│   │   ├── page.tsx           # Dashboard home
│   │   └── upload/page.tsx    # CV upload page
│   ├── layout.tsx             # Root layout with metadata
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles and Tailwind imports
├── components/
│   ├── Hero.tsx               # Hero section with tagline and CTA
│   ├── Features.tsx           # Features showcase
│   ├── CTA.tsx                # Call-to-action section
│   ├── CVUpload.tsx           # Drag & drop upload component
│   └── Providers.tsx          # Auth and toast providers
├── contexts/
│   └── AuthContext.tsx        # Firebase auth context
├── lib/
│   ├── firebase.ts            # Firebase configuration
│   ├── storage.ts             # Firebase Storage helpers
│   └── firestore.ts           # Firestore helpers
├── middleware.ts              # Route protection middleware
├── firestore.rules            # Firestore security rules
├── storage.rules              # Storage security rules
├── public/                    # Static assets
├── .env.local.example         # Environment variables template
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
├── next.config.mjs            # Next.js configuration
└── package.json               # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd 2Vocaify2
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up Firebase**

Create a Firebase project and enable required services:

- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project or use an existing one
- **Enable Authentication:**
  - Go to Authentication > Sign-in method
  - Enable "Email/Password" provider
  - Enable "Google" provider (optional)
- **Enable Firestore Database:**
  - Go to Firestore Database
  - Click "Create database"
  - Choose production mode (or test mode for development)
  - Select a region closest to your users
- **Enable Storage:**
  - Go to Storage
  - Click "Get started"
  - Use production mode
  - Select the same region as Firestore
- **Deploy Security Rules:**
  - For Firestore: Copy contents of `firestore.rules` to Firestore Rules tab
  - For Storage: Copy contents of `storage.rules` to Storage Rules tab
  - Click "Publish" for both
- **Get your Firebase configuration:**
  - Go to Project Settings > General
  - Scroll down to "Your apps" and click the web icon (</>)
  - Copy the configuration values

4. **Configure environment variables**

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**⚠️ Important**: Never commit `.env.local` to version control. It's already included in `.gitignore`.

5. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the landing page.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality

## Authentication

Vocaify includes a complete authentication system powered by Firebase:

### Features

- **Email/Password Authentication**: Traditional signup and login
- **Google OAuth**: One-click sign in with Google
- **Password Reset**: Forgot password flow with email
- **Protected Routes**: Dashboard requires authentication
- **Auth State Management**: Global auth context with React Context API
- **Toast Notifications**: User-friendly error and success messages
- **Form Validation**: Client-side validation for all auth forms
- **Loading States**: Visual feedback during auth operations

### Pages

- **`/auth/login`**: Sign in page with email/password and Google OAuth
- **`/auth/signup`**: Create account page with form validation
- **`/dashboard`**: Protected dashboard page (requires authentication)

### Usage

```typescript
// Use the auth context in any component
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, signIn, signUp, logout } = useAuth();

  // user will be null if not authenticated
  // user will be a Firebase User object if authenticated
}
```

### Security Notes

- All authentication is handled securely by Firebase
- Environment variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Protected routes redirect to login if user is not authenticated
- Tokens are managed automatically by Firebase SDK
- Never commit `.env.local` to version control

## CV Upload System

Vocaify includes a comprehensive CV upload system with Firebase Storage and Firestore:

### Features

- **Drag & Drop Interface**: Beautiful, intuitive file upload UI
- **Bulk Upload**: Upload up to 1000 CVs at once
- **File Validation**: Automatic validation for file type (PDF, DOCX) and size (10MB max)
- **Progress Tracking**: Real-time progress bars for each file and overall batch
- **Batch Processing**: Processes 10 files at a time to avoid rate limits
- **Error Handling**: Retry failed uploads and clear error messages
- **Duplicate Detection**: Prevents uploading the same file twice
- **Resume Upload**: Continue from where you left off after interruptions

### Architecture

**Firebase Storage Structure:**
```
/cvs/{userId}/{timestamp}_{filename}
```

**Firestore Collection:**
```typescript
Collection: "cvs"
Document: {
  userId: string
  storagePath: string
  filename: string
  uploadedAt: Timestamp
  status: "pending" | "processing" | "indexed" | "error"
  fileSize: number
  fileType: string
  downloadURL: string
  errorMessage?: string
}
```

### Pages

- **`/dashboard`**: Shows CV count and upload CTA
- **`/dashboard/upload`**: Full upload interface with drag & drop

### Security Rules

The project includes production-ready security rules:

- **Firestore Rules** (`firestore.rules`): Users can only access their own CV documents
- **Storage Rules** (`storage.rules`): Users can only upload to their own folder, with file type and size validation

### Usage

```typescript
// Upload a CV
import { uploadCV } from "@/lib/storage";
import { createCVDocument } from "@/lib/firestore";

const { storagePath, downloadURL } = await uploadCV(
  file,
  userId,
  (progress) => console.log(progress)
);

await createCVDocument({
  userId,
  storagePath,
  filename: file.name,
  uploadedAt: Timestamp.now(),
  status: "pending",
  fileSize: file.size,
  fileType: file.type,
  downloadURL,
});
```

### Edge Cases Handled

- Duplicate filenames (adds timestamp prefix)
- Large batch uploads (100+ files)
- Network interruptions (shows error state, allows retry)
- File size limits (10MB per file)
- Invalid file types (only PDF and DOCX allowed)
- Memory management (no file content stored in state)

## Design Highlights

### Color Scheme

- **Primary Color**: #6366F1 (Indigo)
- Clean, professional palette inspired by Stripe and Linear
- Gradient backgrounds for depth and visual interest

### Key Sections

1. **Hero Section**
   - Eye-catching tagline: "Search 1000 CVs in Seconds"
   - Prominent CTA button: "Start Free Trial"
   - Social proof with user avatars
   - Animated background elements

2. **Features Section**
   - 6 key features with icons
   - Hover effects and smooth animations
   - Stats showcase (2 sec search time, 1000+ CVs, 95% accuracy)
   - Intersection Observer for scroll-triggered animations

3. **CTA Section**
   - Strong call-to-action
   - Trust badges (no credit card, 14-day trial, cancel anytime)
   - 3-step "How it Works" guide
   - Gradient background with decorative elements

4. **Navigation & Footer**
   - Sticky navigation with backdrop blur
   - Responsive mobile menu
   - Comprehensive footer with social links

## Customization

### Changing Colors

Edit `tailwind.config.ts` to modify the color scheme:

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "#6366F1", // Change this to your brand color
        // ... other shades
      },
    },
  },
}
```

### Modifying Content

- **Hero text**: Edit `components/Hero.tsx`
- **Features**: Modify the `features` array in `components/Features.tsx`
- **CTA content**: Update `components/CTA.tsx`

### Adding Pages

Create new files in the `app/` directory following Next.js App Router conventions.

## Production Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository on Vercel
3. Vercel will automatically detect Next.js and configure the build
4. Deploy!

### Other Platforms

- **Netlify**: Configure build command as `npm run build` and publish directory as `.next`
- **AWS/GCP/Azure**: Use the standalone output mode in `next.config.mjs`

## Performance Optimizations

- **Server Components**: Using React Server Components by default for better performance
- **Font Optimization**: Using next/font for automatic font optimization
- **Image Optimization**: Ready for next/image when adding images
- **Code Splitting**: Automatic code splitting with Next.js App Router
- **Lazy Loading**: Components load on demand

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is proprietary and confidential.

## Support

For questions or support, contact [support@vocaify.com](mailto:support@vocaify.com)

---

Built with ❤️ for modern HR teams
