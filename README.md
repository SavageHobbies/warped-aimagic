# Warped AI Magic - Inventory Scanner

A Next.js-based web application designed to streamline product inventory management using AI-powered tools. The application enables users to scan, identify, and manage products efficiently, with integrations for AI content generation, image analysis, and multi-platform listing.

## 🚀 Project Status

✅ **Active Development** - Main features implemented and working  
✅ **Build Status** - Compiles successfully  
✅ **Database** - Prisma schema configured with SQLite  
✅ **AI Integration** - Google Gemini API integrated  
✅ **Core Features** - Product scanning, inventory management, and AI content generation  

## 🎯 Core Features

### Product Management
- **Barcode Scanning**: UPC, EAN, GTIN, ISBN, MPN support
- **Image Recognition**: AI-powered product identification from images
- **Inventory Tracking**: Comprehensive product data management
- **Multi-format Export**: Support for CPI templates and eBay listings

### AI-Powered Content Generation
- **Product Descriptions**: Auto-generated SEO-optimized descriptions
- **eBay Titles**: Optimized for search and conversion
- **Key Features & Specifications**: Extracted and formatted automatically
- **Market Research**: Integration with eBay analysis tools

### Platform Integrations
- **Google Gemini AI**: For content generation and vision processing
- **eBay API**: For market research and listing optimization
- **UPC Item DB**: For product lookup and verification

## 🛠 Technology Stack

### Frontend
- **React 19** with **Next.js 15.4.6** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Turbopack** for faster development builds

### Backend & Database
- **Next.js API Routes** for serverless functions
- **Prisma ORM** with **SQLite** database
- **Sharp** for image processing

### AI & External APIs
- **Google Generative AI** (@google/generative-ai)
- **Axios** for HTTP requests
- **React Query** (@tanstack/react-query) for data management

### Development & Testing
- **Jest** for unit testing
- **Playwright** for integration testing
- **ESLint** and **Prettier** for code quality
- **Husky** and **lint-staged** for pre-commit hooks

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# Google Gemini AI (Required for AI features)
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-2.0-flash-exp"
GEMINI_FALLBACK_MODEL="gemini-1.5-flash"

# Optional: UPC ItemDB API
UPCITEMDB_API_KEY="your-upc-api-key"
```

### Installation Steps

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd warped-aimagic-new
npm install
```

2. **Set up Database**
```bash
# Generate Prisma client
npx prisma generate

# Initialize database (if needed)
npx prisma db push
```

3. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── add-product/         # Product creation flows
│   ├── api/                 # API routes
│   │   ├── ai/             # AI content generation
│   │   ├── products/       # Product management
│   │   ├── vision/         # Image processing
│   │   └── optimizer/      # eBay optimization
│   ├── dashboard/          # Main dashboard
│   ├── inventory/          # Inventory management
│   ├── listings/           # Listing management
│   └── scanner/            # Barcode scanner
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components
│   ├── BarcodeScanner.tsx # Barcode scanning component
│   ├── Sidebar.tsx        # Navigation sidebar
│   └── ThemeToggle.tsx    # Dark/light mode toggle
├── contexts/              # React context providers
├── lib/                   # Utility libraries
│   ├── cpi/              # CPI export functionality
│   ├── gemini.ts         # Google AI integration
│   ├── prisma.ts         # Database client
│   └── templates.ts      # Template management
└── prisma/               # Database schema and migrations
```

## 🎮 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Testing
npm run test         # Run Jest unit tests
npm run test:watch   # Run tests in watch mode
npm run test:integration # Run Playwright integration tests
```

## 🗄 Database Schema

The application uses Prisma ORM with SQLite. Key models include:

- **Product**: Core product information with UPC/barcode support
- **ProductImage**: Product images with upload status tracking
- **AIContent**: AI-generated content (titles, descriptions, features)
- **Listing**: Platform-specific listings (eBay, Amazon, etc.)
- **Draft**: Temporary listing drafts
- **Category**: Product categorization system
- **ApiLog**: API call logging for debugging

## 🔧 API Endpoints

### Product Management
- `POST /api/products` - Create new product
- `GET/PUT/DELETE /api/products/[id]` - Manage individual products
- `POST /api/products/lookup` - Lookup products by UPC
- `POST /api/products/search` - Search products

### AI Services
- `POST /api/ai/generate` - Generate AI content for products
- `POST /api/vision/identify` - Identify products from images
- `POST /api/vision/extract-text` - Extract text from images

### Export & Optimization
- `POST /api/export/multi-format` - Export in multiple formats
- `POST /api/optimizer/market-research` - eBay market research
- `POST /api/optimizer/generate-template` - Generate optimized templates

## 🐛 Known Issues & Limitations

### Current Warnings (Non-blocking)
- Dynamic imports in optimizer routes (critical dependency warnings)
- Some unused imports and variables (cleanup in progress)
- Image optimization recommendations (next/image usage)
- React hook dependency array warnings

### Limitations
- **No Authentication System**: Currently operates without user authentication
- **Single User Mode**: Designed for single-user operation
- **SQLite Database**: Not suitable for high-concurrency production use
- **No File Upload Limits**: Image uploads not size-restricted

### Turbopack (Experimental)
- Using Turbopack for faster development builds
- May cause instability - can disable by removing `--turbopack` flag

## 🔒 Security Considerations

- API keys must be secured in environment variables
- Database contains no user authentication
- File uploads should be validated in production
- Rate limiting not implemented for API endpoints

## 🚦 Deployment

### Environment Setup
1. Configure production environment variables
2. Set up production database (PostgreSQL recommended)
3. Configure file upload storage (AWS S3, Cloudinary, etc.)

### Recommended Platforms
- **Vercel**: Optimal for Next.js applications
- **Railway/Render**: Good alternatives with database support
- **AWS/GCP**: For custom deployments

### Pre-deployment Checklist
- [ ] Configure production database
- [ ] Set up file storage service
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting
- [ ] Add authentication system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Last Updated**: August 23, 2025  
**Version**: 0.1.0  
**Build Status**: ✅ Passing