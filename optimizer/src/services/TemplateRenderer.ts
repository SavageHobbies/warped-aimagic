// Simple template renderer for eBay listings
import { ProductDetails, OptimizedContent } from '../models';
import { logger } from '../utils';

export class TemplateRenderer {
  async renderTemplate(optimizedContent: OptimizedContent, productDetails: ProductDetails, templatePath: string): Promise<string> {
    logger.info(`Rendering template for: ${productDetails.title}`);

    try {
      // Use a simple HTML template
      const html = this.generateHtmlTemplate(optimizedContent, productDetails);
      
      logger.info(`Template rendering completed for: ${productDetails.title}`);
      return html;

    } catch (error) {
      logger.error(`Template rendering failed for: ${productDetails.title}`, error);
      throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateHtmlTemplate(optimizedContent: OptimizedContent, productDetails: ProductDetails): string {
    const { optimizedTitle, optimizedDescription, suggestedPrice, keywords, sellingPoints } = optimizedContent;
    const { price, condition, images, specifications, seller, location } = productDetails;

    // Generate image gallery HTML
    const imageGallery = this.generateImageGallery(images);

    // Generate specifications table
    const specificationsTable = this.generateSpecificationsTable(specifications);

    // Generate keywords meta tags
    const keywordsMeta = keywords.join(', ');

    // Generate seller information
    const sellerInfo = seller !== 'Unknown Seller' ? 
      `<div class="seller-info">
        <h3>Seller Information</h3>
        <p><strong>Seller:</strong> ${seller}</p>
        <p><strong>Location:</strong> ${location}</p>
      </div>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${optimizedDescription.substring(0, 160)}...">
    <meta name="keywords" content="${keywordsMeta}">
    <title>${optimizedTitle}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f9f9f9;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1e88e5, #1565c0);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.2em;
            font-weight: 300;
        }
        .price-section {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #e0e0e0;
        }
        .current-price {
            font-size: 2.5em;
            font-weight: bold;
            color: #2e7d32;
            margin: 10px 0;
        }
        .suggested-price {
            font-size: 1.2em;
            color: #666;
            margin-bottom: 10px;
        }
        .condition {
            display: inline-block;
            background-color: #4caf50;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-top: 10px;
        }
        .content {
            padding: 30px;
        }
        .image-gallery {
            margin-bottom: 30px;
        }
        .main-image {
            width: 100%;
            max-width: 600px;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            margin: 0 auto;
            display: block;
        }
        .description {
            margin-bottom: 30px;
        }
        .description h2 {
            color: #1e88e5;
            border-bottom: 2px solid #e3f2fd;
            padding-bottom: 10px;
        }
        .description p {
            margin-bottom: 15px;
            text-align: justify;
        }
        .features {
            margin-bottom: 30px;
        }
        .features h2 {
            color: #1e88e5;
            border-bottom: 2px solid #e3f2fd;
            padding-bottom: 10px;
        }
        .features ul {
            list-style-type: none;
            padding: 0;
        }
        .features li {
            background-color: #f5f5f5;
            margin-bottom: 10px;
            padding: 12px;
            border-radius: 5px;
            border-left: 4px solid #1e88e5;
        }
        .specs {
            margin-bottom: 30px;
        }
        .specs h2 {
            color: #1e88e5;
            border-bottom: 2px solid #e3f2fd;
            padding-bottom: 10px;
        }
        .specs table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .specs th, .specs td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .specs th {
            background-color: #f5f5f5;
            font-weight: bold;
            color: #1e88e5;
        }
        .seller-info {
            background-color: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .seller-info h3 {
            color: #1e88e5;
            margin-top: 0;
        }
        .cta-section {
            background: linear-gradient(135deg, #4caf50, #388e3c);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px;
            margin-top: 30px;
        }
        .cta-section h2 {
            margin-top: 0;
            font-size: 1.8em;
        }
        .cta-section p {
            font-size: 1.1em;
            margin-bottom: 20px;
        }
        .cta-button {
            display: inline-block;
            background-color: white;
            color: #4caf50;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 1.1em;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .footer {
            background-color: #333;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9em;
        }
        @media (max-width: 768px) {
            .container {
                margin: 10px;
            }
            .content {
                padding: 20px;
            }
            .header h1 {
                font-size: 1.8em;
            }
            .current-price {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${optimizedTitle}</h1>
        </div>
        
        <div class="price-section">
            <div class="current-price">$${price.toFixed(2)}</div>
            <div class="suggested-price">Market Suggested Price: $${suggestedPrice.toFixed(2)}</div>
            <div class="condition">${condition}</div>
        </div>
        
        <div class="content">
            <div class="image-gallery">
                ${imageGallery}
            </div>
            
            <div class="description">
                <h2>Product Description</h2>
                <div>${optimizedDescription.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="features">
                <h2>Key Features & Benefits</h2>
                <ul>
                    ${sellingPoints.map(point => `<li>${point}</li>`).join('')}
                </ul>
            </div>
            
            ${specificationsTable}
            
            ${sellerInfo}
            
            <div class="cta-section">
                <h2>Ready to Purchase?</h2>
                <p>Don't miss out on this amazing deal! Add this item to your cart now and secure yours today.</p>
                <a href="#" class="cta-button">Add to Cart</a>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2025 eBay Listing Optimizer. This is an optimized template for demonstration purposes.</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateImageGallery(images: any[]): string {
    if (!images || images.length === 0) {
      return `
        <div class="main-image">
            <img src="https://via.placeholder.com/600x400/4A90E2/FFFFFF?text=Product+Image" 
                 alt="Product Image" 
                 style="width: 100%; height: auto;">
        </div>
      `;
    }

    // Use the first image as the main image
    const mainImage = images[0];
    const mainImageUrl = mainImage.url || 'https://via.placeholder.com/600x400/4A90E2/FFFFFF?text=Product+Image';
    
    return `
        <div class="main-image">
            <img src="${mainImageUrl}" 
                 alt="${mainImage.altText || 'Product Image'}" 
                 style="width: 100%; height: auto;">
        </div>
    `;
  }

  private generateSpecificationsTable(specifications: Record<string, string>): string {
    const specEntries = Object.entries(specifications);
    
    if (specEntries.length === 0) {
      return '';
    }

    const tableRows = specEntries
      .filter(([key, value]) => 
        key.length > 2 && 
        value.length > 2 && 
        !key.toLowerCase().includes('description') &&
        !key.toLowerCase().includes('title')
      )
      .slice(0, 8) // Limit to 8 most important specs
      .map(([key, value]) => `
        <tr>
            <td><strong>${key}</strong></td>
            <td>${value}</td>
        </tr>
      `).join('');

    return `
        <div class="specs">
            <h2>Product Specifications</h2>
            <table>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
  }
}
