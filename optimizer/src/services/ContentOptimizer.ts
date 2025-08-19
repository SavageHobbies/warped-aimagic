// Simple content optimizer for eBay listings
import { ProductDetails, ResearchData, OptimizedContent } from '../models';
import { logger } from '../utils';

export class ContentOptimizer {
  async optimizeContent(productDetails: ProductDetails, researchData: ResearchData): Promise<OptimizedContent> {
    logger.info(`Optimizing content for: ${productDetails.title}`);

    try {
      // Extract keywords from research data
      const keywords = researchData.keywordAnalysis.popularKeywords.slice(0, 5);
      
      // Generate optimized title
      const optimizedTitle = this.generateOptimizedTitle(productDetails.title, keywords);
      
      // Generate optimized description
      const optimizedDescription = this.generateOptimizedDescription(productDetails, researchData);
      
      // Calculate suggested price
      const suggestedPrice = researchData.priceAnalysis.recommendedPrice;
      
      // Generate selling points
      const sellingPoints = this.generateSellingPoints(productDetails, researchData);

      const optimizedContent: OptimizedContent = {
        optimizedTitle,
        optimizedDescription,
        suggestedPrice,
        keywords,
        sellingPoints
      };

      logger.info(`Content optimization completed for: ${productDetails.title}`);
      return optimizedContent;

    } catch (error) {
      logger.error(`Content optimization failed for: ${productDetails.title}`, error);
      throw new Error(`Content optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateOptimizedTitle(originalTitle: string, keywords: string[]): string {
    // Clean up original title
    let cleanTitle = originalTitle
      .replace(/^Details about\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Add keywords to the title if they're not already present
    const titleWords = cleanTitle.toLowerCase().split(' ');
    const missingKeywords = keywords.filter(keyword => 
      !titleWords.some(word => word.includes(keyword.toLowerCase()))
    );

    // Add up to 2 missing keywords to the title
    const keywordsToAdd = missingKeywords.slice(0, 2);
    
    if (keywordsToAdd.length > 0) {
      // Add keywords at the beginning of the title
      cleanTitle = `${keywordsToAdd.join(' ')} ${cleanTitle}`;
    }

    // Ensure title is not too long (eBay has character limits)
    if (cleanTitle.length > 80) {
      cleanTitle = cleanTitle.substring(0, 77) + '...';
    }

    return cleanTitle;
  }

  private generateOptimizedDescription(productDetails: ProductDetails, researchData: ResearchData): string {
    const { description, condition, price, specifications } = productDetails;
    const { priceAnalysis } = researchData;

    // Start with the original description
    let optimizedDescription = description || '';

    // Add key selling points
    optimizedDescription += this.generateSellingPointsSection(productDetails, researchData);

    // Add specifications section
    if (Object.keys(specifications).length > 0) {
      optimizedDescription += this.generateSpecificationsSection(specifications);
    }

    // Add condition information
    if (condition && condition !== 'Unknown') {
      optimizedDescription += this.generateConditionSection(condition);
    }

    // Add pricing information
    optimizedDescription += this.generatePricingSection(price, priceAnalysis);

    // Add call to action
    optimizedDescription += this.generateCallToAction();

    // Clean up the description
    optimizedDescription = optimizedDescription
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return optimizedDescription;
  }

  private generateSellingPointsSection(productDetails: ProductDetails, researchData: ResearchData): string {
    const sellingPoints = this.generateSellingPoints(productDetails, researchData);
    
    if (sellingPoints.length === 0) {
      return '';
    }

    let section = '\n\n✨ KEY FEATURES & BENEFITS:\n';
    section += '─────────────────────────────────────────\n';
    
    sellingPoints.forEach((point, index) => {
      section += `${index + 1}. ${point}\n`;
    });

    return section;
  }

  private generateSpecificationsSection(specifications: Record<string, string>): string {
    const importantSpecs = Object.entries(specifications)
      .filter(([key, value]) => 
        key.length > 2 && 
        value.length > 2 && 
        !key.toLowerCase().includes('description') &&
        !key.toLowerCase().includes('title')
      )
      .slice(0, 8); // Limit to 8 most important specs

    if (importantSpecs.length === 0) {
      return '';
    }

    let section = '\n\n📋 PRODUCT SPECIFICATIONS:\n';
    section += '─────────────────────────────────────────\n';
    
    importantSpecs.forEach(([key, value]) => {
      section += `• ${key}: ${value}\n`;
    });

    return section;
  }

  private generateConditionSection(condition: string): string {
    let conditionText = '';
    
    switch (condition.toLowerCase()) {
      case 'brand new':
        conditionText = 'This item is brand new in original packaging.';
        break;
      case 'like new':
        conditionText = 'This item is in like new condition with minimal signs of use.';
        break;
      case 'very good':
        conditionText = 'This item is in very good condition with normal signs of use.';
        break;
      case 'good':
        conditionText = 'This item is in good condition with visible signs of use.';
        break;
      case 'used':
        conditionText = 'This item is used and shows signs of normal wear.';
        break;
      case 'refurbished':
        conditionText = 'This item has been professionally refurbished and tested.';
        break;
      case 'open box':
        conditionText = 'This item is an open box return in excellent condition.';
        break;
      default:
        conditionText = `Condition: ${condition}`;
    }

    return `\n\n🏷️ CONDITION:\n─────────────────────────────────────────\n${conditionText}`;
  }

  private generatePricingSection(originalPrice: number, priceAnalysis: any): string {
    const { averagePrice, priceRange, recommendedPrice, confidence } = priceAnalysis;
    
    let section = '\n\n💰 PRICING ANALYSIS:\n';
    section += '─────────────────────────────────────────\n';
    section += `• Your Price: $${originalPrice.toFixed(2)}\n`;
    section += `• Market Average: $${averagePrice.toFixed(2)}\n`;
    section += `• Market Range: $${priceRange.min.toFixed(2)} - $${priceRange.max.toFixed(2)}\n`;
    section += `• Recommended Price: $${recommendedPrice.toFixed(2)}\n`;
    section += `• Market Confidence: ${Math.round(confidence * 100)}%\n`;

    // Add pricing advice
    if (recommendedPrice > originalPrice) {
      const difference = recommendedPrice - originalPrice;
      section += `\n💡 Opportunity: You could potentially increase your price by $${difference.toFixed(2)} to match market rates.`;
    } else if (recommendedPrice < originalPrice) {
      const difference = originalPrice - recommendedPrice;
      section += `\n⚠️  Consideration: Your price is $${difference.toFixed(2)} above the recommended market rate.`;
    } else {
      section += `\n✅ Your pricing is well-aligned with the market.`;
    }

    return section;
  }

  private generateCallToAction(): string {
    return '\n\n🛒 READY TO BUY?\n─────────────────────────────────────────\n' +
           'Don\'t miss out on this amazing deal! Add this item to your cart now and secure yours today.\n' +
           'Fast shipping and excellent customer service guaranteed!\n\n' +
           '📞 Questions? Feel free to message us with any inquiries about this product.';
  }

  private generateSellingPoints(productDetails: ProductDetails, researchData: ResearchData): string[] {
    const sellingPoints: string[] = [];
    
    // Extract key features from title
    const titleWords = productDetails.title.toLowerCase().split(' ');
    const importantWords = titleWords.filter(word => 
      word.length > 3 && 
      !/^(the|and|or|for|with|in|on|at|to|a|an|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|may|might|must|can|this|that|these|those)$/.test(word)
    );

    // Add selling points based on important words
    importantWords.slice(0, 3).forEach(word => {
      const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);
      sellingPoints.push(`Premium ${capitalizedWord} quality`);
    });

    // Add condition-based selling points
    switch (productDetails.condition.toLowerCase()) {
      case 'brand new':
        sellingPoints.push('Factory sealed in original packaging');
        sellingPoints.push('Full manufacturer warranty included');
        break;
      case 'like new':
        sellingPoints.push('Excellent condition - barely used');
        sellingPoints.push('No visible signs of wear');
        break;
      case 'refurbished':
        sellingPoints.push('Professionally tested and certified');
        sellingPoints.push('Comes with 90-day warranty');
        break;
    }

    // Add price-based selling points
    if (productDetails.price < researchData.priceAnalysis.averagePrice) {
      sellingPoints.push('Great value - below market average');
      sellingPoints.push('Save money without compromising quality');
    }

    // Add some generic but effective selling points
    const genericPoints = [
      'Fast and secure shipping',
      'Excellent customer service',
      'Quality guaranteed',
      'Hassle-free returns',
      'Authentic product'
    ];

    // Add 1-2 generic points if we don't have enough
    while (sellingPoints.length < 3 && genericPoints.length > 0) {
      const randomPoint = genericPoints[Math.floor(Math.random() * genericPoints.length)];
      if (!sellingPoints.includes(randomPoint)) {
        sellingPoints.push(randomPoint);
      }
    }

    return sellingPoints.slice(0, 5); // Limit to 5 selling points
  }
}
