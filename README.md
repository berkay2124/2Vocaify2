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

## Cloud Functions & AI Processing

Vocaify includes a comprehensive backend system that automatically processes CVs using OpenAI:

### Architecture

When a CV is uploaded to Firebase Storage, a Cloud Function automatically:
1. Extracts text from PDF/DOCX files
2. Sends text to OpenAI (GPT-4o-mini) for structured data extraction
3. Stores extracted data in Firestore with status tracking
4. Handles errors with automatic retry logic

### Features

**Automatic CV Processing:**
- Triggered automatically on file upload
- Supports PDF, DOCX, and DOC formats
- Maximum file size: 10MB per CV
- Extracts structured data: name, email, phone, skills, experience, education

**AI-Powered Extraction:**
- Uses OpenAI GPT-4o-mini for cost-effective processing
- Extracts 10+ data fields from CVs
- Calculates years of experience automatically
- Generates professional summaries

**Robust Error Handling:**
- Automatic retry logic (3 attempts with exponential backoff)
- Detailed error logging to Firestore
- Status tracking: pending → processing → indexed/error
- Scheduled function to reprocess stuck CVs

**Cost Optimization:**
- Uses GPT-4o-mini (~$0.15 per 1M input tokens)
- Token usage logging for cost monitoring
- Batch processing with concurrency control
- Estimated cost: $0.001-0.003 per CV

### Setup Instructions

**1. Install Firebase CLI**

```bash
npm install -g firebase-tools
firebase login
```

**2. Install Functions Dependencies**

```bash
cd functions
npm install
cd ..
```

**3. Configure OpenAI API Key**

Get your OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

Set the API key in Firebase config:

```bash
firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY"
```

Verify configuration:

```bash
firebase functions:config:get
```

**4. Deploy Cloud Functions**

```bash
firebase deploy --only functions
```

Or deploy specific functions:

```bash
firebase deploy --only functions:onCVUpload
firebase deploy --only functions:reprocessCV
firebase deploy --only functions:processStuckCVs
```

**5. Test Locally with Emulators**

```bash
# Start emulators
firebase emulators:start

# In another terminal, set local config
cd functions
echo '{"openai":{"key":"YOUR_OPENAI_API_KEY"}}' > .runtimeconfig.json
cd ..
```

### Available Cloud Functions

**1. onCVUpload (Storage Trigger)**
- Automatically triggered when CV is uploaded
- Path: `gs://YOUR_BUCKET/cvs/{userId}/{filename}`
- Timeout: 9 minutes
- Memory: 1GB

**2. reprocessCV (Callable)**
- Manually reprocess a failed CV
- Authentication required
- Usage from frontend:
```typescript
const reprocess = httpsCallable(functions, 'reprocessCV');
await reprocess({ cvId: 'DOCUMENT_ID' });
```

**3. processStuckCVs (Scheduled)**
- Runs every 60 minutes
- Finds CVs stuck in "processing" for >30 minutes
- Automatically reprocesses them
- Limit: 50 CVs per run

**4. getProcessingStats (HTTP)**
- GET endpoint for processing statistics
- Returns counts for each status
- No authentication required
- URL: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/getProcessingStats`

### Monitoring & Debugging

**View Logs:**

```bash
# Real-time logs
firebase functions:log --follow

# Filter by function
firebase functions:log --only onCVUpload

# View errors only
firebase functions:log --only-errors
```

**Check Processing Status in Firestore:**

The `cvs` collection documents include:
```typescript
{
  status: "pending" | "processing" | "indexed" | "error"
  processingStartedAt: Timestamp
  processedAt: Timestamp
  extractedData: {
    name, email, phone, yearsExperience,
    skills[], education[], workHistory[], summary
  }
  extractedText: string // First 5000 chars
  errorMessage?: string
}
```

**Monitor Costs:**

Check function logs for token usage:
```bash
firebase functions:log | grep "OpenAI API call completed"
```

Estimated costs:
- Average CV: 2000-4000 prompt tokens, 500-800 completion tokens
- Cost per CV: ~$0.001-0.003
- 1000 CVs: ~$1-3

### File Structure

```
functions/
├── src/
│   ├── index.ts           # Main Cloud Functions exports
│   ├── processCv.ts       # CV processing pipeline with retry logic
│   ├── extractText.ts     # PDF and DOCX text extraction
│   └── openai.ts          # OpenAI integration for data extraction
├── package.json           # Dependencies (firebase-admin, openai, pdf-parse, mammoth)
├── tsconfig.json          # TypeScript configuration
└── .eslintrc.js          # ESLint rules
```

### Security Considerations

- OpenAI API key stored in Firebase Functions config (never client-side)
- User authentication verified before manual reprocessing
- Firestore security rules enforce user ownership
- Storage rules limit file size and type
- Rate limiting handled by OpenAI SDK
- Sensitive data logged at appropriate levels

### Troubleshooting

**"OpenAI API key not configured" error:**
```bash
firebase functions:config:set openai.key="YOUR_KEY"
firebase deploy --only functions
```

**CVs stuck in "processing" status:**
- Wait for `processStuckCVs` function (runs hourly)
- Or manually trigger: `firebase functions:call reprocessCV --data '{"cvId":"DOC_ID"}'`

**"Rate limit exceeded" error:**
- OpenAI free tier: 3 RPM (requests per minute)
- Paid tier: 3500 RPM
- Function automatically retries after delay

**Local testing issues:**
- Ensure `.runtimeconfig.json` exists in `functions/` folder
- Restart emulators after config changes
- Check emulator UI: http://localhost:4000

### Next Steps

After deploying Cloud Functions:
1. Upload test CVs through the dashboard
2. Monitor processing in Firestore console
3. Check function logs for any errors
4. View extracted data in CV documents
5. Test search functionality with processed CVs

## Semantic Search with Vector Embeddings

Vocaify implements advanced semantic search using OpenAI embeddings and Pinecone vector database for lightning-fast, accurate CV matching.

### Architecture

**Vector Search Pipeline:**
1. **CV Processing**: After extracting data with OpenAI, generate 1536-dimension embedding
2. **Storage**: Store embedding in Pinecone with metadata (skills, experience, location)
3. **Search**: Convert user query to embedding, find similar CVs in Pinecone
4. **Filtering**: Apply metadata filters (experience range, skills, location)
5. **Re-ranking**: Use GPT-4o-mini to re-rank top 20 candidates for relevance

### Setup Instructions

**1. Create Pinecone Index**

Sign up at [pinecone.io](https://app.pinecone.io/) and create a new index:

```bash
Name: vocaify-cvs
Dimensions: 1536
Metric: cosine
Cloud: AWS (or your preference)
Region: us-east-1 (or nearest to you)
```

**2. Configure API Keys**

Copy `.env.local.example` to `.env.local` and add your keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
PINECONE_API_KEY=your_pinecone_api_key
OPENAI_API_KEY=your_openai_api_key
```

**3. Configure Cloud Functions**

Set the Pinecone key for Cloud Functions:

```bash
firebase functions:config:set pinecone.key="YOUR_PINECONE_API_KEY"
```

Verify:
```bash
firebase functions:config:get
# Should show both openai.key and pinecone.key
```

**4. Deploy Updated Functions**

```bash
firebase deploy --only functions
```

### How It Works

**Embedding Generation:**
- Model: `text-embedding-3-small` (1536 dimensions)
- Input: Combined text from name, skills, experience, summary, work history
- Cost: ~$0.00002 per CV (~$0.02 per 1000 CVs)
- Speed: ~200ms per embedding

**Vector Search:**
- Pinecone cosine similarity search
- Sub-100ms query time
- Supports metadata filtering for experience, location
- Returns top 50 similar CVs

**Post-Processing:**
- Apply complex filters (e.g., required skills array matching)
- Take top 20 candidates

**GPT-4 Re-ranking:**
- Send top 20 to GPT-4o-mini for intelligent re-ranking
- Provides match score (0-100) and reasoning
- Returns top 10 with explanations
- Cost: ~$0.001 per search
- Speed: ~1-2 seconds

### Search API

**Endpoint:** `POST /api/search`

**Request:**
```typescript
{
  "query": "Senior React developer with 5+ years",
  "userId": "user123",
  "filters": {
    "minExperience": 5,
    "maxExperience": 15,
    "skills": ["React", "TypeScript"],
    "location": "San Francisco"
  },
  "topK": 50,
  "rerank": true
}
```

**Response:**
```typescript
{
  "success": true,
  "results": [
    {
      "id": "cv_abc123",
      "score": 0.89,
      "metadata": {
        "name": "John Doe",
        "yearsExperience": 7,
        "skills": ["React", "TypeScript", "Node.js"],
        "location": "San Francisco"
      },
      "rerankScore": 95,
      "rerankReasoning": "Strong React and TypeScript experience with proven track record"
    }
  ],
  "totalResults": 23,
  "duration": 1432,
  "reranked": true
}
```

### Client-Side Usage

**Using the Vector Search Utility:**

```typescript
import { performVectorSearch } from "@/lib/vectorSearch";

// Perform search
const results = await performVectorSearch({
  query: "Python developer with ML experience",
  userId: user.uid,
  filters: {
    minExperience: 3,
    skills: ["Python", "TensorFlow"],
  },
  topK: 50,
  rerank: true,
});

console.log(`Found ${results.totalResults} candidates in ${results.duration}ms`);
results.results.forEach((result) => {
  console.log(`${result.metadata.name}: ${result.rerankScore}/100`);
  console.log(`Reason: ${result.rerankReasoning}`);
});
```

**Check Search Service Health:**

```typescript
import { checkSearchHealth } from "@/lib/vectorSearch";

const health = await checkSearchHealth();
console.log(`Index has ${health.vectorCount} vectors`);
```

### Features

**Intelligent Filtering:**
- Experience range (min/max years)
- Required skills (array matching)
- Location filtering
- User-scoped search (security)

**Natural Language Understanding:**
- "5+ years React experience" → extracts skills and experience
- "Senior Python ML engineer" → identifies seniority, language, domain
- "Full-stack developer San Francisco" → location extraction

**Result Re-ranking:**
- AI-powered relevance scoring
- Explanation for each match
- Considers context beyond keyword matching
- Balances vector similarity with domain expertise

**Performance Optimization:**
- Client-side result caching (5 min TTL)
- Pinecone metadata filtering (pre-filters in vector DB)
- Post-search filtering for complex queries
- Lazy re-ranking (only when needed)

### Cost Breakdown

**Per CV Processing:**
- Text extraction: Free (pdf-parse, mammoth)
- OpenAI extraction: ~$0.002 (GPT-4o-mini)
- Embedding generation: ~$0.00002 (text-embedding-3-small)
- Pinecone storage: ~$0.000001 per month
- **Total per CV: ~$0.002**

**Per Search:**
- Query embedding: ~$0.00002
- Pinecone search: Free (generous free tier)
- GPT-4 re-ranking: ~$0.001 (optional)
- **Total per search: ~$0.001**

**1000 CVs + 1000 searches/month:**
- CV processing: $2
- Search queries: $1
- Pinecone: Free tier (includes 100K vectors)
- **Total: ~$3/month**

### Monitoring

**View Search Logs:**

```bash
# Next.js API logs (local dev)
npm run dev
# Check console for search logs

# Production logs (Vercel)
vercel logs
```

**Check Pinecone Stats:**

```bash
curl https://YOUR_DOMAIN/api/search
```

Response:
```json
{
  "status": "healthy",
  "index": "vocaify-cvs",
  "vectorCount": 1523,
  "dimension": 1536
}
```

**Monitor Search Performance:**

All searches log:
- Query text
- Number of results
- Duration (ms)
- Whether re-ranking was used
- Filter criteria

### Troubleshooting

**"PINECONE_API_KEY environment variable not set":**
- Ensure `.env.local` exists with `PINECONE_API_KEY=...`
- Restart Next.js dev server after adding env vars

**"Failed to upsert to Pinecone" in Cloud Functions:**
- Run: `firebase functions:config:set pinecone.key="YOUR_KEY"`
- Redeploy: `firebase deploy --only functions`

**Search returns 0 results:**
- Ensure CVs have been processed (check Firestore `embeddingGenerated: true`)
- Verify Pinecone index name is "vocaify-cvs"
- Check Pinecone dashboard for vector count

**Slow search times (>3 seconds):**
- Disable re-ranking for faster results: `rerank: false`
- Reduce `topK` to 20-30
- Check Pinecone region (use nearest region)

**Re-ranking fails:**
- Falls back to vector scores automatically
- Check OpenAI API quota and limits
- Review logs for GPT-4 errors

### Best Practices

**Query Optimization:**
- Use natural language: "Senior React developer 5 years TypeScript"
- Be specific: "ML engineer Python TensorFlow 3+ years"
- Avoid too many filters (reduces result set)

**Filter Strategy:**
- Use vector search for semantic matching
- Use filters for hard requirements (e.g., location, min experience)
- Combine both for best results

**Re-ranking:**
- Enable for important searches (hiring managers)
- Disable for bulk operations (cost savings)
- Use cached results when possible

**Scaling:**
- Pinecone free tier: 100K vectors (100K CVs)
- Paid tier: Millions of vectors with better performance
- Consider result caching in Redis for high traffic

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

Vocaify includes a complete CI/CD pipeline with GitHub Actions and Firebase Hosting.

### Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project created with Blaze (pay-as-you-go) plan
3. GitHub repository set up

### Initial Setup

**1. Initialize Firebase Hosting**

```bash
firebase login
firebase init hosting
```

Select:
- Use existing project
- Public directory: `out`
- Single-page app: No
- GitHub Actions: Yes

**2. Set up Firebase CLI Token**

```bash
firebase login:ci
```

Copy the token and add it to GitHub Secrets:
- Go to your repo → Settings → Secrets and variables → Actions
- Add secret: `FIREBASE_TOKEN` with the token value

**3. Configure Environment Variables**

Create `.env.production` from `.env.production.example`:

```bash
cp .env.production.example .env.production
# Edit .env.production with production values
```

Add production environment variables to GitHub Secrets:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `OPENAI_API_KEY` (for Cloud Functions)
- `PINECONE_API_KEY` (for Cloud Functions)

**4. Deploy Cloud Functions**

```bash
# Configure Cloud Functions secrets
firebase functions:config:set \
  openai.key="YOUR_OPENAI_KEY" \
  pinecone.key="YOUR_PINECONE_KEY" \
  pinecone.environment="us-east-1-aws" \
  pinecone.index="vocaify-cvs-prod"

# Deploy functions
firebase deploy --only functions
```

**5. Configure CORS for Storage**

```bash
gsutil cors set cors.json gs://YOUR_PROJECT_ID.appspot.com
```

**6. Deploy Security Rules**

```bash
firebase deploy --only firestore:rules,storage:rules
```

### Automatic Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

**On Pull Request:**
- Runs ESLint
- Runs TypeScript type checking
- Builds the application
- Deploys preview to Firebase Hosting (7-day expiration)
- Runs security scans (npm audit, TruffleHog)

**On Push to Main:**
- Runs all checks above
- Deploys functions to Firebase
- Deploys hosting to Firebase
- Production deployment

**Workflow Jobs:**
1. **lint-and-test**: Code quality checks
2. **deploy-functions**: Deploy Cloud Functions
3. **deploy-hosting**: Build and deploy Next.js app
4. **preview-deploy**: Create preview for PRs
5. **security-scan**: Scan for vulnerabilities

### Manual Deployment

**Deploy Everything:**
```bash
npm run build
firebase deploy
```

**Deploy Specific Services:**
```bash
firebase deploy --only hosting      # Frontend only
firebase deploy --only functions    # Backend only
firebase deploy --only firestore    # Security rules only
```

### Custom Domain Setup

1. Go to Firebase Console → Hosting → Add custom domain
2. Follow verification steps
3. Firebase automatically provisions SSL certificate
4. Update `.env.production`:
   ```env
   NEXT_PUBLIC_APP_URL=https://vocaify.com
   ```
5. Update `cors.json` with production domain
6. Redeploy: `firebase deploy`

### Monitoring & Analytics

**Firebase Console:**
- Performance monitoring: `console.firebase.google.com/project/YOUR_PROJECT/performance`
- Function logs: `console.firebase.google.com/project/YOUR_PROJECT/functions`
- Usage analytics: `console.firebase.google.com/project/YOUR_PROJECT/analytics`

**Command Line Monitoring:**
```bash
# Real-time function logs
firebase functions:log --follow

# View recent errors
firebase functions:log --only-errors

# Check hosting status
firebase hosting:channel:list
```

**Health Checks:**
```bash
# API health
curl https://YOUR_DOMAIN/api/search

# Functions health
curl https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/getProcessingStats
```

### Rollback

**Hosting Rollback:**
```bash
# List versions
firebase hosting:clone YOUR_PROJECT:current YOUR_PROJECT:VERSION_ID

# Or via console
# Firebase Console → Hosting → Release History → Rollback
```

**Functions Rollback:**
```bash
# Redeploy previous version from git
git checkout PREVIOUS_COMMIT
firebase deploy --only functions
git checkout main
```

### Performance Optimization

**1. Enable Caching:**
- Static assets cached for 1 year (configured in `firebase.json`)
- Search results cached client-side (5 min TTL)
- CV metadata cached (10 min TTL)

**2. Image Optimization:**
- Use `next/image` for automatic optimization
- Configured domains in `next.config.mjs`
- Supports AVIF and WebP formats

**3. Bundle Analysis:**
```bash
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

**4. Lighthouse Score:**
```bash
npm install -g lighthouse
lighthouse https://YOUR_DOMAIN --view
```

Target scores:
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >95

### Security Checklist

- [x] HTTPS enforced (Firebase Hosting)
- [x] Security headers configured (next.config.mjs, firebase.json)
- [x] CORS configured (cors.json)
- [x] Firestore security rules deployed
- [x] Storage security rules deployed
- [x] Environment variables secured (GitHub Secrets)
- [x] API keys not exposed client-side
- [x] XSS prevention headers
- [x] CSRF protection
- [x] Rate limiting (TODO: implement in Cloud Functions)

### Cost Monitoring

**Firebase Pricing Calculator:**
https://firebase.google.com/pricing

**Expected Costs (per month):**
- Hosting: Free tier (10GB storage, 360MB/day transfer)
- Firestore: ~$0.06 per 100K reads ($0.60 for 1M reads)
- Storage: ~$0.026 per GB stored
- Functions: Free tier (2M invocations/month)
- OpenAI: ~$2-3 for 1000 CVs
- Pinecone: Free tier (100K vectors)

**Total for 1000 CVs + 1000 searches:** ~$3-5/month

**Monitor Costs:**
```bash
# Firebase usage
firebase projects:list

# OpenAI usage
# Check dashboard: platform.openai.com/usage

# Pinecone usage
# Check dashboard: app.pinecone.io/usage
```

### Troubleshooting Deployment

**Build Fails:**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

**Functions Deploy Fails:**
```bash
# Check quota limits
firebase functions:config:get

# Verify billing enabled
# Firebase Console → Settings → Usage and billing
```

**Hosting Deploy Fails:**
```bash
# Check firebase.json configuration
# Ensure 'out' directory exists
npm run build
ls -la out/

# Manual deploy
firebase deploy --only hosting --debug
```

**CORS Errors:**
```bash
# Verify CORS configuration
gsutil cors get gs://YOUR_PROJECT_ID.appspot.com

# Reapply CORS
gsutil cors set cors.json gs://YOUR_PROJECT_ID.appspot.com
```

### Alternative Deployment (Vercel)

If you prefer Vercel over Firebase Hosting:

1. Push to GitHub
2. Import on Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

Note: You'll still need Firebase for backend services (Auth, Firestore, Storage, Functions)

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
