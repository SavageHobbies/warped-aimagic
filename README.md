# 🚀 Warped AI Magic - Intelligent Inventory Management System

**Next.js-based inventory management application with AI-powered product enhancement, image fetching, and multi-marketplace integration.**

[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.14.0-2D3748)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_Powered-4285F4)](https://ai.google.dev/)

## ✨ Features

### 🤖 AI-Powered Enhancement
- **Smart Product Enhancement**: AI-generated titles, descriptions, and SEO optimization
- **Market Research Integration**: Competitive pricing analysis and suggestions
- **Image Auto-Fetching**: Automatically pulls product images from Amazon, eBay, UPCItemDB
- **Multi-Category Support**: Works with collectibles, electronics, clothing, furniture, books, and more

### 📱 Modern User Experience
- **Dark/Light Mode**: Seamless theme switching
- **Responsive Design**: Works perfectly on desktop and mobile
- **Real-time Updates**: Live progress tracking for bulk operations
- **Inline Editing**: Quick edit products directly in inventory tables

### 🔄 Marketplace Integration
- **Multi-Platform Export**: eBay, Amazon, Walmart CSV formats
- **Bulk Operations**: Process hundreds of products simultaneously
- **CPI Format Support**: Import/export with comprehensive product information
- **Real-time Preview**: See how listings will appear on different platforms

### 🎯 Inventory Management
- **Barcode Scanning**: UPC/EAN product identification
- **Image Management**: Upload, organize, and auto-fetch product images
- **Quality Scoring**: AI-powered data quality assessment
- **Smart Suggestions**: Automated recommendations for product improvements

## 🛠 Technology Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **Next.js 15.4.6** - App Router, Server Components, API Routes
- **TypeScript** - Full type safety and developer experience
- **Tailwind CSS** - Utility-first styling with dark mode support
- **Lucide React** - Beautiful, customizable icons

### Backend & Database
- **Next.js API Routes** - Serverless backend functions
- **Prisma ORM 6.14.0** - Type-safe database access
- **SQLite** - Development database (PostgreSQL recommended for production)

### AI & External Services
- **Google Gemini API** - AI content generation and vision processing
- **Amazon SP-API** - Product catalog and pricing data
- **eBay API** - Market research and competitive analysis
- **UPCItemDB & UPCDatabase** - Product identification and data enrichment

### Development & Testing
- **Jest 30.0.5** - Unit testing framework
- **Playwright 1.54.2** - End-to-end testing
- **ESLint + Prettier** - Code quality and formatting
- **Husky + lint-staged** - Git hooks for quality assurance

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/warped-aimagic-new.git
   cd warped-aimagic-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # AI Services
   GEMINI_API_KEY="your-gemini-api-key"
   GEMINI_MODEL="gemini-2.0-flash-exp"
   GEMINI_FALLBACK_MODEL="gemini-1.5-flash"
   
   # External APIs (Optional but Recommended)
   UPCITEMDB_API_KEY="your-upc-api-key"
   UPC_DATABASE_API_KEY="your-upc-database-key"
   UPC_DATABASE_API_URL="https://api.upcdatabase.org/product"
   
   # Amazon SP-API (Optional)
   AMAZON_CLIENT_ID="your-amazon-client-id"
   AMAZON_CLIENT_SECRET="your-amazon-client-secret"
   AMAZON_REFRESH_TOKEN="your-amazon-refresh-token"
   AMAZON_REGION="us-east-1"
   
   # eBay API (Optional)
   EBAY_APP_ID="your-ebay-app-id"
   EBAY_CERT_ID="your-ebay-cert-id"
   EBAY_ENVIRONMENT="production"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 API Configuration Guide

### Required APIs

#### Google Gemini API (Required)
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add to `.env` as `GEMINI_API_KEY`

### Optional APIs (Highly Recommended)

#### UPCItemDB (Product Data)
1. Sign up at [UPCItemDB](https://www.upcitemdb.com/)
2. Get your API key from the dashboard
3. Add to `.env` as `UPCITEMDB_API_KEY`

#### Amazon SP-API (Product Catalog)
1. Register as Amazon Developer
2. Create SP-API application
3. Add credentials to `.env`

#### eBay API (Market Research)
1. Join eBay Developer Program
2. Create application for Browse API
3. Add credentials to `.env`

## 🎯 Key Features Guide

### Image Auto-Fetching
The system automatically fetches product images from multiple sources:
```typescript
// Automatic during product enhancement
POST /api/ai/enhance-product
{
  "productId": "your-product-id",
  "includeMarketResearch": true,
  "includePricing": true
}
```

### Bulk Operations
Process multiple products simultaneously:
1. Navigate to Inventory page
2. Select products using checkboxes
3. Choose bulk action (Enhance, Export, Delete)
4. Monitor progress in real-time

### AI Enhancement
Transform basic product data into optimized listings:
- **Titles**: SEO-optimized for each marketplace
- **Descriptions**: Engaging, feature-rich content
- **Pricing**: Market-research-based suggestions
- **Images**: Automatically sourced and validated

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:integration

# Run linting
npm run lint
```

## 📦 Building for Production

```bash
# Create production build
npm run build

# Start production server
npm run start
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy automatically

### Alternative Deployment
- **Railway** - Full-stack hosting
- **Render** - Backend + database hosting
- **AWS/GCP** - Custom infrastructure

### Production Database
For production, migrate from SQLite to PostgreSQL:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

## 📖 Documentation

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── inventory/      # Inventory management
│   ├── products/       # Product details
│   └── drafts/         # Listing drafts
├── components/         # Reusable UI components
├── lib/               # Utilities and services
│   ├── gemini.ts      # AI service
│   ├── productDataService.ts  # External API integration
│   └── prisma.ts      # Database client
└── contexts/          # React contexts
```

### Key API Endpoints
- `POST /api/ai/enhance-product` - AI product enhancement
- `POST /api/products/lookup` - UPC product lookup
- `POST /api/products/bulk-import` - CSV import
- `GET /api/export/multi-format` - Marketplace export

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/warped-aimagic-new/issues)
- **Discussions**: Join conversations in [GitHub Discussions](https://github.com/yourusername/warped-aimagic-new/discussions)

## 🔮 Roadmap

### Phase 1: Core Enhancements ✅
- [x] AI-powered product enhancement
- [x] Multi-source image fetching
- [x] Bulk operations with progress tracking
- [x] Search bar improvements

### Phase 2: Advanced Features 🚧
- [ ] Enhanced image management (drag-drop, primary selection)
- [ ] Smart enhancement recommendations
- [ ] Quality scoring system
- [ ] Advanced search filters

### Phase 3: Analytics & Automation 📋
- [ ] Inventory health dashboard
- [ ] Automated enhancement rules
- [ ] Competitive analysis tools
- [ ] Multi-marketplace optimization

---

**Built with ❤️ using Next.js, TypeScript, and AI**