# Dalila Admin Panel

Modern admin panel for Dalila Property Management System.

## Features

- 🔐 Secure authentication with JWT
- 📊 Dashboard with statistics
- 🏠 Property CRUD operations
- 📸 Image upload with drag & drop
- 🎨 Modern UI with shadcn/ui
- 📱 Fully responsive design
- ⚡ Fast development with Vite
- 🔄 Real-time updates with React Query

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file:

```bash
VITE_API_URL=http://localhost:8080/api
```

## Project Structure

```
admin/
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/           # shadcn/ui components
│   │   └── layouts/      # Layout components
│   ├── pages/            # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PropertiesPage.tsx
│   │   └── PropertyFormPage.tsx
│   ├── lib/              # Utilities
│   │   ├── api.ts        # API client
│   │   └── utils.ts      # Helper functions
│   ├── store/            # Zustand stores
│   │   └── authStore.ts  # Auth state
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── package.json          # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features in Detail

### Authentication
- Login with email/password
- JWT token storage
- Automatic token refresh
- Protected routes
- Logout functionality

### Property Management
- List all properties with pagination
- Create new properties
- Edit existing properties
- Delete properties (admin only)
- Upload property images
- Manage photo galleries
- Add videos

### Dashboard
- Total properties count
- Active listings
- Featured properties
- Total portfolio value
- Recent activity

## Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to cPanel

1. Build the application
2. Upload `dist/` contents to `public_html/admin`
3. Configure `.htaccess` for React Router:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /admin/index.html [L]
</IfModule>
```

4. Update API URL in production

## Customization

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layouts/DashboardLayout.tsx`

### Adding UI Components

```bash
# shadcn/ui components can be added individually
# Example: Add dialog component
npx shadcn-ui@latest add dialog
```

### Styling

Tailwind CSS is used for styling. Customize in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
    },
  },
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - All rights reserved
