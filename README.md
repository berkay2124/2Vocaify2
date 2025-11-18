# Vocaify - AI-Powered CV Search Engine

A beautiful, modern landing page for Vocaify - the AI-powered CV database search engine that helps HR professionals find the perfect candidate with natural language queries.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **TailwindCSS** for beautiful, responsive styling
- **Smooth animations** with fade-in and slide-up effects
- **Mobile responsive** design
- **Production-ready** code quality
- **SEO optimized** with proper metadata

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Static type checking
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [React](https://react.dev/) - UI library

## Project Structure

```
2Vocaify2/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles and Tailwind imports
├── components/
│   ├── Hero.tsx            # Hero section with tagline and CTA
│   ├── Features.tsx        # Features showcase
│   └── CTA.tsx             # Call-to-action section
├── public/                 # Static assets
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── next.config.mjs         # Next.js configuration
└── package.json            # Dependencies and scripts
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

3. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the landing page.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality

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
