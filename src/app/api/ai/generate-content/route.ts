import { NextRequest, NextResponse } from 'next/server'
import { detectEbayCategory, getCategorySpec, type EbayCategorySpec } from '@/lib/ebay-categories'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      productId, 
      title, 
      brand, 
      condition, 
      category, 
      features,
      currentDescription,
      productData // Full product data for category detection and character extraction
    } = body

    // Detect eBay category if product data is provided
    let detectedCategory = 'general'
    let categorySpec: EbayCategorySpec | undefined = undefined
    
    if (productData) {
      detectedCategory = detectEbayCategory(productData)
      categorySpec = getCategorySpec(detectedCategory)
    }

    // Extract character and franchise information for better content generation
    const extractedCharacter = extractCharacterFromProductData(productData)
    const extractedFranchise = extractFranchiseFromProductData(productData)
    const extractedSeries = extractSeriesFromProductData(productData, extractedFranchise)

    console.log('AI Content Generation - Processing:', {
      title,
      brand,
      detectedCategory,
      extractedCharacter,
      extractedFranchise,
      extractedSeries
    })

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generate optimized content based on product information and category
    const optimizedTitle = generateOptimizedTitle(title, brand, condition, categorySpec, extractedCharacter, extractedFranchise)
    const description = generateEnhancedDescription(title, brand, features, currentDescription, categorySpec, extractedCharacter, extractedFranchise)
    const bulletPoints = generateBulletPoints(title, brand, features, categorySpec, extractedCharacter, extractedFranchise)
    const itemSpecifics = generateCategorySpecificItemSpecifics(brand, condition, features, categorySpec, productData)
    const seoKeywords = generateSEOKeywords(title, brand, category, features, categorySpec, productData)
    const tags = generateTags(title, brand, category, condition, features, categorySpec, extractedCharacter, extractedFranchise)
    
    return NextResponse.json({
      optimizedTitle,
      ebayTitle: optimizedTitle.substring(0, 80), // eBay has 80 char limit
      description,
      bulletPoints,
      itemSpecifics,
      seoKeywords,
      tags,
      categoryInfo: categorySpec ? {
        detectedCategory,
        categoryName: categorySpec.categoryName,
        categoryPath: categorySpec.categoryPath,
        supportsVariants: categorySpec.supportsVariants
      } : null,
      extractedInfo: {
        character: extractedCharacter,
        franchise: extractedFranchise,
        series: extractedSeries
      },
      success: true
    })
  } catch (error) {
    console.error('Error generating AI content:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI content' },
      { status: 500 }
    )
  }
}

function generateOptimizedTitle(
  title: string, 
  brand?: string, 
  condition?: string, 
  categorySpec?: EbayCategorySpec,
  character?: string,
  franchise?: string
): string {
  const parts = []
  
  // Start with brand if not already in title
  if (brand && !title.toLowerCase().includes(brand.toLowerCase())) {
    parts.push(brand)
  }
  
  // Add character if extracted and not in title
  if (character && !title.toLowerCase().includes(character.toLowerCase())) {
    parts.unshift(character)  // Put character first for better SEO
  }
  
  // Add the main title
  parts.push(title)
  
  // Add franchise context if not already present
  if (franchise && !title.toLowerCase().includes(franchise.toLowerCase()) && 
      !parts.some(part => part.toLowerCase().includes(franchise.toLowerCase()))) {
    parts.push(`- ${franchise}`)
  }
  
  // Add category-specific enhancements
  if (categorySpec) {
    switch (categorySpec.categoryName) {
      case 'Funko Pop!':
        if (!title.toLowerCase().includes('funko') && !title.toLowerCase().includes('pop')) {
          parts.push('Funko Pop!')
        }
        break
      case "Women's Clothing":
      case "Men's Clothing":
        if (!title.toLowerCase().includes('authentic')) {
          parts.push('Authentic')
        }
        break
    }
  }
  
  if (condition && condition !== 'Used') {
    parts.push(`- ${condition}`)
  }
  
  // Add common SEO keywords
  if (!title.toLowerCase().includes('free shipping')) {
    parts.push('- Fast Free Shipping')
  }
  
  return parts.join(' ').substring(0, 78) // Keep under eBay's 80 char limit
}

function generateEnhancedDescription(
  title: string, 
  brand?: string, 
  features?: string,
  currentDescription?: string,
  categorySpec?: EbayCategorySpec,
  character?: string,
  franchise?: string
): string {
  const sections = []
  
  // Character and franchise-aware opening statement
  if (categorySpec?.categoryName === 'Funko Pop!' && character && franchise) {
    sections.push(`🎯 AUTHENTIC ${character.toUpperCase()} FROM ${franchise.toUpperCase()} FUNKO POP! 🎯\n`)
  } else if (categorySpec?.categoryName === 'Funko Pop!') {
    sections.push(`🎯 AUTHENTIC ${title.toUpperCase()} FUNKO POP! 🎯\n`)
  } else if (categorySpec?.categoryName.includes('Clothing')) {
    sections.push(`👕 ${title.toUpperCase()} - PREMIUM QUALITY 👕\n`)
  } else if (character && franchise) {
    sections.push(`🌟 ${character.toUpperCase()} FROM ${franchise.toUpperCase()} 🌟\n`)
  } else {
    sections.push(`🌟 ${title.toUpperCase()} 🌟\n`)
  }
  
  if (currentDescription) {
    sections.push(currentDescription)
    sections.push('\n')
  }
  
  // Character and franchise context
  if (character && franchise) {
    sections.push(`📖 ABOUT THIS ${character.toUpperCase()}:`)
    sections.push(`This officially licensed ${character} figure comes from the beloved ${franchise} universe. Perfect for fans and collectors alike!\n`)
  }
  
  // Category-specific features section
  sections.push('✅ KEY FEATURES:')
  if (features) {
    const featureList = features.split(',').map(f => `• ${f.trim()}`).join('\n')
    sections.push(featureList)
  } else {
    // Generate category-specific default features
    if (categorySpec?.categoryName === 'Funko Pop!') {
      sections.push('• Official Funko Pop! figure')
      sections.push('• High-quality vinyl construction')
      sections.push('• Perfect for collectors')
      if (character) {
        sections.push(`• Authentic ${character} design`)
      }
      if (franchise) {
        sections.push(`• ${franchise} licensed merchandise`)
      }
    } else if (categorySpec?.categoryName.includes('Clothing')) {
      sections.push('• Premium fabric quality')
      sections.push('• Comfortable fit')
      sections.push('• Carefully inspected')
    } else {
      sections.push('• High-quality construction')
      sections.push('• Authentic product')
      sections.push('• Carefully inspected')
    }
  }
  
  // Category-specific selling points
  if (categorySpec?.categoryName === 'Funko Pop!') {
    sections.push('\n🎮 COLLECTOR\'S DREAM:')
    sections.push('• Perfect for display or gifting')
    sections.push('• Officially licensed merchandise')
    sections.push('• Comes from smoke-free environment')
    if (franchise) {
      sections.push(`• Must-have for ${franchise} fans`)
    }
  } else if (categorySpec?.supportsVariants) {
    sections.push('\n📏 SIZE & FIT:')
    sections.push('• Multiple sizes available')
    sections.push('• See size chart for measurements')
    sections.push('• Contact us for fit questions')
  }
  
  // Character/franchise specific appeal
  if (character && franchise) {
    sections.push(`\n💝 PERFECT GIFT FOR:`)
    sections.push(`• ${franchise} fans`)
    sections.push(`• ${character} enthusiasts`)
    sections.push('• Collectors of all ages')
    sections.push('• Gift-givers looking for something special')
  }
  
  // Why buy from us
  sections.push('\n📦 WHY BUY FROM US?')
  sections.push('• Fast & Free Shipping')
  sections.push('• 30-Day Returns')
  sections.push('• Trusted Seller with 100% Positive Feedback')
  sections.push('• Ships within 24 hours')
  
  // Condition note
  sections.push('\n💯 CONDITION:')
  sections.push('This item has been thoroughly inspected and is guaranteed to be as described.')
  
  // Call to action
  sections.push('\n⚡ Order now and get it fast!')
  sections.push('Click "Buy It Now" to make this yours today!')
  
  return sections.join('\n')
}

function generateBulletPoints(
  title: string, 
  brand?: string, 
  features?: string, 
  categorySpec?: EbayCategorySpec,
  character?: string,
  franchise?: string
): string {
  const bullets = []
  
  if (brand) {
    bullets.push(`✓ Authentic ${brand} product`)
  }
  
  // Character and franchise-specific bullet points
  if (character && franchise) {
    bullets.push(`✓ Official ${character} from ${franchise}`)
    bullets.push(`✓ Licensed ${franchise} merchandise`)
  } else if (character) {
    bullets.push(`✓ Authentic ${character} collectible`)
  } else if (franchise) {
    bullets.push(`✓ Official ${franchise} merchandise`)
  }
  
  // Category-specific bullet points
  if (categorySpec?.categoryName === 'Funko Pop!') {
    bullets.push('✓ Official Funko Pop! collectible')
    bullets.push('✓ Perfect for collectors & fans')
  } else if (categorySpec?.categoryName.includes('Clothing')) {
    bullets.push('✓ Premium quality fabric')
    bullets.push('✓ Multiple sizes available')
  }
  
  if (features) {
    features.split(',').slice(0, 3).forEach(feature => {
      bullets.push(`✓ ${feature.trim()}`)
    })
  }
  
  bullets.push('✓ Fast FREE shipping')
  bullets.push('✓ 30-day return policy')
  bullets.push('✓ Ships within 24 hours')
  
  return bullets.join('\n')
}

function generateCategorySpecificItemSpecifics(
  brand?: string, 
  condition?: string, 
  features?: string, 
  categorySpec?: EbayCategorySpec,
  productData?: any
): Record<string, string> {
  const specifics: Record<string, string> = {}
  
  if (!categorySpec) {
    return generateItemSpecifics(brand, condition, features)
  }
  
  // Extract comprehensive product information
  const extractedCharacter = extractCharacterFromProductData(productData)
  const extractedFranchise = extractFranchiseFromProductData(productData)
  const extractedSeries = extractSeriesFromProductData(productData, extractedFranchise)
  const extractedType = extractProductTypeFromData(productData, categorySpec)
  const extractedAgeGroup = extractAgeGroupFromData(productData)
  const extractedSize = extractSizeFromData(productData)
  
  console.log('AI Content Generation - Extracted Information:', {
    character: extractedCharacter,
    franchise: extractedFranchise,
    series: extractedSeries,
    type: extractedType,
    ageGroup: extractedAgeGroup,
    size: extractedSize
  })
  
  // Generate specifics based on category requirements
  categorySpec.itemSpecifics.forEach(spec => {
    switch (spec.name) {
      case 'Brand':
        specifics[spec.name] = brand || productData?.brand || ''
        break
      case 'Condition':
        specifics[spec.name] = condition || 'New'
        break
      case 'UPC':
        specifics[spec.name] = productData?.upc || ''
        break
      case 'Character':
        specifics[spec.name] = extractedCharacter || productData?.character || ''
        break
      case 'Series':
        specifics[spec.name] = extractedSeries || productData?.series || ''
        break
      case 'Franchise':
        specifics[spec.name] = extractedFranchise || productData?.franchise || productData?.theme || ''
        break
      case 'Type':
        if (extractedType) {
          specifics[spec.name] = extractedType
        } else if (categorySpec.categoryName === 'Funko Pop!') {
          specifics[spec.name] = 'Pop! Vinyl'
        } else {
          specifics[spec.name] = ''
        }
        break
      case 'Material':
        if (categorySpec.categoryName === 'Funko Pop!') {
          specifics[spec.name] = 'Vinyl'
        } else {
          specifics[spec.name] = productData?.material || extractMaterialFromDescription(productData?.description || '')
        }
        break
      case 'Age Level':
        if (extractedAgeGroup) {
          specifics[spec.name] = extractedAgeGroup
        } else if (categorySpec.categoryName === 'Funko Pop!') {
          specifics[spec.name] = '8+'
        } else {
          specifics[spec.name] = productData?.ageGroup || ''
        }
        break
      case 'Color':
        specifics[spec.name] = productData?.color || extractColorFromFeatures(features || '') || extractColorFromDescription(productData?.description || '')
        break
      case 'Size':
        if (extractedSize) {
          specifics[spec.name] = extractedSize
        } else if (categorySpec.categoryName === 'Funko Pop!' && !productData?.size) {
          specifics[spec.name] = '3 3/4 in'  // Default Funko size
        } else {
          specifics[spec.name] = productData?.size || ''
        }
        break
      case 'Department':
        if (categorySpec.categoryName.includes('Women')) {
          specifics[spec.name] = 'Women'
        } else if (categorySpec.categoryName.includes('Men')) {
          specifics[spec.name] = 'Men'
        }
        break
      case 'Country/Region of Manufacture':
        // Intelligent country detection based on brand and product data
        specifics[spec.name] = extractCountryOfOrigin(productData) || 'China'
        break
      case 'Exclusivity':
        specifics[spec.name] = extractExclusivityFromData(productData)
        break
      case 'Features':
        if (spec.type === 'multiselect') {
          specifics[spec.name] = extractFeaturesFromData(productData).join(', ')
        } else {
          specifics[spec.name] = extractFeaturesFromData(productData).join(' | ')
        }
        break
      default:
        specifics[spec.name] = ''
    }
  })
  
  return specifics
}

/**
 * Extract material from product description
 */
function extractMaterialFromDescription(description: string): string {
  const materials = {
    'Vinyl': ['vinyl', 'pvc'],
    'Plastic': ['plastic', 'abs', 'polystyrene'],
    'Metal': ['metal', 'steel', 'aluminum', 'alloy'],
    'Wood': ['wood', 'wooden', 'bamboo'],
    'Fabric': ['fabric', 'cloth', 'textile'],
    'Cotton': ['cotton', '100% cotton'],
    'Polyester': ['polyester', 'poly'],
    'Leather': ['leather', 'genuine leather'],
    'Rubber': ['rubber', 'silicone'],
    'Glass': ['glass', 'tempered glass'],
    'Ceramic': ['ceramic', 'porcelain']
  }
  
  const lowerDesc = description.toLowerCase()
  for (const [material, keywords] of Object.entries(materials)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        return material
      }
    }
  }
  
  return ''
}

/**
 * Extract country of origin based on brand and product information
 */
function extractCountryOfOrigin(productData: any): string {
  const brand = (productData?.brand || '').toLowerCase()
  const title = (productData?.title || '').toLowerCase()
  const description = (productData?.description || '').toLowerCase()
  
  const countryPatterns = {
    'United States': ['made in usa', 'made in america', 'american made', 'usa made'],
    'Japan': ['made in japan', 'japanese', 'nintendo', 'sony', 'bandai', 'takara'],
    'China': ['made in china', 'made in prc'],
    'Germany': ['made in germany', 'german made'],
    'United Kingdom': ['made in uk', 'made in england', 'british made'],
    'South Korea': ['made in korea', 'korean'],
    'Taiwan': ['made in taiwan'],
    'Mexico': ['made in mexico', 'hecho en mexico']
  }
  
  const searchText = [title, description, brand].join(' ')
  
  for (const [country, patterns] of Object.entries(countryPatterns)) {
    for (const pattern of patterns) {
      if (searchText.includes(pattern)) {
        return country
      }
    }
  }
  
  // Default based on brand knowledge
  const brandCountries: Record<string, string> = {
    'funko': 'China',
    'nike': 'Vietnam',
    'adidas': 'Vietnam',
    'apple': 'China',
    'samsung': 'South Korea',
    'sony': 'Japan',
    'nintendo': 'Japan',
    'lego': 'Denmark',
    'mattel': 'China',
    'hasbro': 'China'
  }
  
  return brandCountries[brand] || ''
}

/**
 * Extract exclusivity information for collectibles
 */
function extractExclusivityFromData(productData: any): string {
  const searchTexts = [
    productData?.title || '',
    productData?.description || '',
    ...(productData?.offers || []).map((o: any) => o.title || '')
  ].join(' ').toLowerCase()
  
  const exclusivityPatterns = {
    'Convention Exclusive': ['convention', 'con exclusive', 'sdcc', 'nycc', 'e3'],
    'Store Exclusive': ['target exclusive', 'walmart exclusive', 'gamestop exclusive', 'hot topic exclusive', 'boxlunch exclusive'],
    'Limited Edition': ['limited edition', 'limited', 'le'],
    'Chase': ['chase', 'chase variant', '1 in 6'],
    'Exclusive': ['exclusive', 'special edition'],
    'Variant': ['variant', 'alternate'],
    'First Edition': ['first edition', '1st edition'],
    'Rare': ['rare', 'hard to find', 'htf']
  }
  
  for (const [exclusivity, patterns] of Object.entries(exclusivityPatterns)) {
    for (const pattern of patterns) {
      if (searchTexts.includes(pattern)) {
        return exclusivity
      }
    }
  }
  
  return 'Common'
}

/**
 * Extract features from product data
 */
function extractFeaturesFromData(productData: any): string[] {
  const features: string[] = []
  const searchTexts = [
    productData?.title || '',
    productData?.description || '',
    productData?.features || ''
  ].join(' ').toLowerCase()
  
  const featurePatterns = {
    'Lights': ['lights', 'led', 'glows', 'illuminated'],
    'Sounds': ['sounds', 'audio', 'speaks', 'music'],
    'Motion': ['motion', 'moves', 'articulated', 'poseable'],
    'Remote Control': ['remote', 'rc', 'remote control'],
    'Educational': ['educational', 'learning', 'teaches'],
    'Interactive': ['interactive', 'responds', 'touch'],
    'Waterproof': ['waterproof', 'water resistant', 'splash proof'],
    'Wireless': ['wireless', 'bluetooth', 'wifi'],
    'Rechargeable': ['rechargeable', 'usb charging', 'battery'],
    'Touchscreen': ['touchscreen', 'touch screen'],
    'HD Video': ['hd', 'high definition', '1080p', '4k'],
    'Fast Charging': ['fast charging', 'quick charge']
  }
  
  for (const [feature, patterns] of Object.entries(featurePatterns)) {
    for (const pattern of patterns) {
      if (searchTexts.includes(pattern)) {
        features.push(feature)
        break
      }
    }
  }
  
  return features
}

/**
 * Enhanced color extraction from description
 */
function extractColorFromDescription(description: string): string {
  const colors = {
    'Black': ['black', 'ebony', 'obsidian', 'charcoal'],
    'White': ['white', 'ivory', 'cream', 'pearl'],
    'Red': ['red', 'crimson', 'scarlet', 'cherry'],
    'Blue': ['blue', 'navy', 'royal blue', 'cobalt'],
    'Green': ['green', 'emerald', 'forest green', 'lime'],
    'Yellow': ['yellow', 'golden', 'amber', 'canary'],
    'Orange': ['orange', 'tangerine', 'coral'],
    'Pink': ['pink', 'rose', 'magenta', 'fuchsia'],
    'Purple': ['purple', 'violet', 'lavender', 'plum'],
    'Brown': ['brown', 'tan', 'bronze', 'chocolate'],
    'Gray': ['gray', 'grey', 'silver', 'platinum'],
    'Gold': ['gold', 'golden', 'metallic gold'],
    'Silver': ['silver', 'metallic silver', 'chrome'],
    'Multicolor': ['multicolor', 'multi-color', 'rainbow', 'various colors']
  }
  
  const lowerDesc = description.toLowerCase()
  for (const [color, variations] of Object.entries(colors)) {
    for (const variation of variations) {
      if (lowerDesc.includes(variation)) {
        return color
      }
    }
  }
  
  return ''
}

/**
 * Advanced product information extraction from Amazon API data and product details
 * Uses intelligent parsing of titles, descriptions, categories, and offers
 */

// Comprehensive character database with aliases and variations
const CHARACTER_DATABASE: Record<string, string[]> = {
  // Marvel Characters
  'Spider-Man': ['spider-man', 'spiderman', 'spider man', 'peter parker', 'web slinger'],
  'Iron Man': ['iron man', 'ironman', 'tony stark'],
  'Captain America': ['captain america', 'cap america', 'steve rogers'],
  'Thor': ['thor', 'god of thunder'],
  'Hulk': ['hulk', 'bruce banner', 'incredible hulk'],
  'Black Widow': ['black widow', 'natasha romanoff'],
  'Wolverine': ['wolverine', 'logan', 'weapon x'],
  'Deadpool': ['deadpool', 'wade wilson'],
  'Venom': ['venom', 'symbiote'],
  'Doctor Strange': ['doctor strange', 'dr strange', 'stephen strange'],
  
  // DC Characters
  'Batman': ['batman', 'dark knight', 'bruce wayne', 'caped crusader'],
  'Superman': ['superman', 'man of steel', 'clark kent', 'kal-el'],
  'Wonder Woman': ['wonder woman', 'diana prince'],
  'The Flash': ['flash', 'barry allen', 'fastest man'],
  'Green Lantern': ['green lantern', 'hal jordan'],
  'Aquaman': ['aquaman', 'arthur curry'],
  'Joker': ['joker', 'clown prince'],
  'Harley Quinn': ['harley quinn', 'harleen quinzel'],
  
  // Disney Characters
  'Mickey Mouse': ['mickey mouse', 'mickey'],
  'Minnie Mouse': ['minnie mouse', 'minnie'],
  'Donald Duck': ['donald duck', 'donald'],
  'Goofy': ['goofy'],
  'Elsa': ['elsa', 'frozen elsa', 'queen elsa'],
  'Anna': ['anna', 'frozen anna', 'princess anna'],
  'Simba': ['simba', 'lion king'],
  'Ariel': ['ariel', 'little mermaid'],
  'Belle': ['belle', 'beauty and beast'],
  'Cinderella': ['cinderella'],
  
  // Pokémon Characters
  'Pikachu': ['pikachu', 'pika'],
  'Charizard': ['charizard'],
  'Blastoise': ['blastoise'],
  'Venusaur': ['venusaur'],
  'Mewtwo': ['mewtwo'],
  'Mew': ['mew'],
  'Lucario': ['lucario'],
  'Rayquaza': ['rayquaza'],
  
  // Nintendo Characters
  'Mario': ['mario', 'super mario'],
  'Luigi': ['luigi'],
  'Princess Peach': ['peach', 'princess peach'],
  'Bowser': ['bowser', 'king koopa'],
  'Link': ['link', 'hero of hyrule'],
  'Zelda': ['zelda', 'princess zelda'],
  'Ganondorf': ['ganondorf', 'ganon'],
  'Samus': ['samus', 'samus aran'],
  'Kirby': ['kirby'],
  
  // Star Wars Characters
  'Darth Vader': ['darth vader', 'vader', 'anakin skywalker'],
  'Luke Skywalker': ['luke skywalker', 'luke'],
  'Princess Leia': ['leia', 'princess leia', 'leia organa'],
  'Han Solo': ['han solo', 'han'],
  'Chewbacca': ['chewbacca', 'chewie'],
  'Yoda': ['yoda', 'master yoda'],
  'Obi-Wan Kenobi': ['obi-wan', 'obi wan', 'ben kenobi'],
  'R2-D2': ['r2-d2', 'r2d2', 'artoo'],
  'C-3PO': ['c-3po', 'c3po', 'threepio'],
  'Kylo Ren': ['kylo ren', 'ben solo'],
  'Rey': ['rey skywalker', 'rey'],
  'Finn': ['finn', 'fn-2187'],
  'Poe Dameron': ['poe', 'poe dameron'],
  
  // Anime Characters
  'Goku': ['goku', 'son goku', 'kakarot'],
  'Vegeta': ['vegeta', 'prince vegeta'],
  'Naruto': ['naruto', 'naruto uzumaki'],
  'Sasuke': ['sasuke', 'sasuke uchiha'],
  'Luffy': ['luffy', 'monkey d luffy'],
  'Ichigo': ['ichigo', 'ichigo kurosaki'],
  'Edward Elric': ['edward elric', 'ed elric', 'fullmetal alchemist'],
  'Sailor Moon': ['sailor moon', 'usagi'],
  'Totoro': ['totoro', 'my neighbor totoro']
}

// Franchise database with keywords and patterns
const FRANCHISE_DATABASE: Record<string, string[]> = {
  // Comics & Movies
  'Marvel': ['marvel', 'mcu', 'marvel comics', 'marvel universe', 'avengers', 'x-men', 'fantastic four', 'guardians of the galaxy'],
  'DC Comics': ['dc', 'dc comics', 'justice league', 'batman', 'superman', 'wonder woman'],
  'Disney': ['disney', 'walt disney', 'disney princess', 'pixar'],
  'Star Wars': ['star wars', 'jedi', 'sith', 'empire', 'rebel', 'force awakens', 'last jedi', 'rise of skywalker'],
  
  // Gaming
  'Nintendo': ['nintendo', 'super nintendo', 'switch', 'mario bros', 'legend of zelda'],
  'Pokémon': ['pokemon', 'pokémon', 'pocket monsters', 'gotta catch'],
  'Sonic': ['sonic', 'sonic hedgehog', 'sega'],
  'Final Fantasy': ['final fantasy', 'ff', 'square enix'],
  'Call of Duty': ['call of duty', 'cod', 'modern warfare'],
  'Fortnite': ['fortnite', 'battle royale'],
  
  // Anime & Manga
  'Dragon Ball': ['dragon ball', 'dbz', 'dragon ball z', 'dragon ball super'],
  'Naruto': ['naruto', 'naruto shippuden', 'boruto'],
  'One Piece': ['one piece', 'straw hat'],
  'Attack on Titan': ['attack on titan', 'aot', 'shingeki no kyojin'],
  'My Hero Academia': ['my hero academia', 'boku no hero'],
  'Studio Ghibli': ['studio ghibli', 'miyazaki', 'totoro', 'spirited away'],
  'Demon Slayer': ['demon slayer', 'kimetsu no yaiba'],
  
  // TV Shows & Movies
  'Harry Potter': ['harry potter', 'hogwarts', 'wizarding world'],
  'Lord of the Rings': ['lord of the rings', 'lotr', 'hobbit', 'middle earth'],
  'Game of Thrones': ['game of thrones', 'got', 'westeros'],
  'Stranger Things': ['stranger things', 'upside down'],
  'The Mandalorian': ['mandalorian', 'baby yoda', 'grogu'],
  
  // Horror
  'Five Nights at Freddys': ['fnaf', 'five nights', 'freddy fazbear'],
  'IT': ['pennywise', 'stephen king it'],
  'Halloween': ['michael myers', 'halloween'],
  'Friday the 13th': ['jason voorhees', 'friday 13th'],
  
  // Sports
  'WWE': ['wwe', 'world wrestling', 'wrestling'],
  'NBA': ['nba', 'basketball', 'national basketball'],
  'NFL': ['nfl', 'football', 'national football'],
  'MLB': ['mlb', 'baseball', 'major league']
}

// Series extraction patterns
const SERIES_PATTERNS: Record<string, string[]> = {
  // Funko Pop series
  'Pop! Movies': ['movies', 'movie', 'film'],
  'Pop! TV': ['tv', 'television', 'series'],
  'Pop! Games': ['games', 'gaming', 'video game'],
  'Pop! Animation': ['animation', 'animated', 'cartoon'],
  'Pop! Heroes': ['heroes', 'superhero', 'hero'],
  'Pop! Icons': ['icons', 'icon', 'celebrity'],
  'Pop! Rocks': ['rocks', 'music', 'band', 'singer'],
  'Pop! Sports': ['sports', 'athlete', 'player'],
  'Pop! Ad Icons': ['ad icons', 'mascot', 'brand'],
  'Pop! Rides': ['rides', 'vehicle', 'car']
}

/**
 * Enhanced character extraction using comprehensive database and fuzzy matching
 */
function extractCharacterFromProductData(productData: any): string {
  const searchTexts = [
    productData?.title || '',
    productData?.description || '',
    productData?.brand || '',
    ...(productData?.categories || []).map((c: any) => c.category?.name || c.category?.fullPath || ''),
    ...(productData?.offers || []).map((o: any) => o.title || '')
  ].join(' ').toLowerCase()
  
  // Check each character and their aliases
  for (const [character, aliases] of Object.entries(CHARACTER_DATABASE)) {
    for (const alias of aliases) {
      if (searchTexts.includes(alias.toLowerCase())) {
        return character
      }
    }
  }
  
  // Try to extract character names from pattern matching
  const characterPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)\s+(?:figure|pop|vinyl|collectible|action)/i,
    /\b(?:figure|pop|vinyl|collectible|action)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)\b/i,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)\s+(?:from|of)\s+/i
  ]
  
  for (const pattern of characterPatterns) {
    const match = searchTexts.match(pattern)
    if (match && match[1] && match[1].length > 2) {
      return match[1].trim()
    }
  }
  
  return ''
}

/**
 * Enhanced franchise extraction using comprehensive database
 */
function extractFranchiseFromProductData(productData: any): string {
  const searchTexts = [
    productData?.title || '',
    productData?.description || '',
    productData?.brand || '',
    ...(productData?.categories || []).map((c: any) => c.category?.name || c.category?.fullPath || ''),
    ...(productData?.offers || []).map((o: any) => o.title || '')
  ].join(' ').toLowerCase()
  
  // Check each franchise and their keywords
  for (const [franchise, keywords] of Object.entries(FRANCHISE_DATABASE)) {
    for (const keyword of keywords) {
      if (searchTexts.includes(keyword.toLowerCase())) {
        return franchise
      }
    }
  }
  
  return ''
}

/**
 * Extract series information based on franchise and product type
 */
function extractSeriesFromProductData(productData: any, franchise: string): string {
  const searchTexts = [
    productData?.title || '',
    productData?.description || '',
    ...(productData?.offers || []).map((o: any) => o.title || '')
  ].join(' ').toLowerCase()
  
  // For Funko Pops, determine series based on content
  if (searchTexts.includes('funko') || searchTexts.includes('pop')) {
    for (const [series, keywords] of Object.entries(SERIES_PATTERNS)) {
      for (const keyword of keywords) {
        if (searchTexts.includes(keyword.toLowerCase())) {
          return series
        }
      }
    }
    
    // Default Funko series based on franchise
    switch (franchise) {
      case 'Marvel':
      case 'DC Comics':
        return 'Pop! Heroes'
      case 'Disney':
        return 'Pop! Disney'
      case 'Star Wars':
        return 'Pop! Star Wars'
      case 'Pokémon':
      case 'Nintendo':
        return 'Pop! Games'
      case 'Dragon Ball':
      case 'Naruto':
      case 'One Piece':
        return 'Pop! Animation'
      default:
        return 'Pop! Movies'
    }
  }
  
  // Extract numbered series (e.g., "Series 2", "Wave 3")
  const seriesMatch = searchTexts.match(/(?:series|wave|set)\s+(\d+|[ivx]+)/i)
  if (seriesMatch) {
    return `Series ${seriesMatch[1].toUpperCase()}`
  }
  
  return ''
}

/**
 * Extract product type/material based on category and description
 */
function extractProductTypeFromData(productData: any, categorySpec?: any): string {
  const searchTexts = [
    productData?.title || '',
    productData?.description || '',
    ...(productData?.categories || []).map((c: any) => c.category?.name || c.category?.fullPath || '')
  ].join(' ').toLowerCase()
  
  // Category-specific type extraction
  if (categorySpec?.categoryName === 'Funko Pop!') {
    if (searchTexts.includes('rides') || searchTexts.includes('vehicle')) return 'Pop! Rides'
    if (searchTexts.includes('town') || searchTexts.includes('deluxe')) return 'Pop! Town'
    if (searchTexts.includes('moments') || searchTexts.includes('movie moments')) return 'Pop! Moments'
    if (searchTexts.includes('albums') || searchTexts.includes('album covers')) return 'Pop! Albums'
    return 'Pop! Vinyl'
  }
  
  if (categorySpec?.categoryName.includes('Clothing')) {
    const clothingTypes = ['dress', 'shirt', 'blouse', 'pants', 'jeans', 'skirt', 'jacket', 'sweater', 'top']
    for (const type of clothingTypes) {
      if (searchTexts.includes(type)) {
        return type.charAt(0).toUpperCase() + type.slice(1)
      }
    }
  }
  
  return ''
}

/**
 * Extract age group information
 */
function extractAgeGroupFromData(productData: any): string {
  const searchTexts = [
    productData?.title || '',
    productData?.description || '',
    ...(productData?.categories || []).map((c: any) => c.category?.name || c.category?.fullPath || '')
  ].join(' ').toLowerCase()
  
  const agePatterns = {
    '3+': ['3+', 'ages 3', 'toddler', 'preschool'],
    '8+': ['8+', 'ages 8', 'kids', 'children'],
    '12+': ['12+', 'ages 12', 'teen', 'young adult'],
    '14+': ['14+', 'ages 14', 'teen', 'mature'],
    '17+': ['17+', 'ages 17', 'adult', 'mature']
  }
  
  for (const [age, patterns] of Object.entries(agePatterns)) {
    for (const pattern of patterns) {
      if (searchTexts.includes(pattern)) {
        return age
      }
    }
  }
  
  // Default age for common categories
  if (searchTexts.includes('funko') || searchTexts.includes('collectible')) {
    return '8+'
  }
  
  return ''
}

/**
 * Extract size information with better parsing
 */
function extractSizeFromData(productData: any): string {
  const searchTexts = [
    productData?.title || '',
    productData?.description || '',
    productData?.size || ''
  ].join(' ')
  
  // Funko Pop size patterns
  const funkoSizes = {
    '3 3/4 in': ['3.75', '3 3/4', 'standard', 'regular'],
    '6 in': ['6 inch', '6"', 'super sized', 'large'],
    '10 in': ['10 inch', '10"', 'jumbo', 'oversized'],
    '18 in': ['18 inch', '18"', 'mega', 'giant']
  }
  
  const lowerText = searchTexts.toLowerCase()
  for (const [size, patterns] of Object.entries(funkoSizes)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return size
      }
    }
  }
  
  // Extract clothing sizes
  const clothingSizePattern = /\b(XXS|XS|S|M|L|XL|XXL|XXXL|\d{1,2})\b/i
  const sizeMatch = searchTexts.match(clothingSizePattern)
  if (sizeMatch) {
    return sizeMatch[1].toUpperCase()
  }
  
  return productData?.size || ''
}

// Legacy functions for backward compatibility
function extractCharacterFromTitle(title: string): string {
  return extractCharacterFromProductData({ title })
}

function extractFranchiseFromTitle(title: string): string {
  return extractFranchiseFromProductData({ title })
}

function extractColorFromFeatures(features: string): string {
  const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'gray', 'silver', 'gold']
  const lowerFeatures = features.toLowerCase()
  
  for (const color of colors) {
    if (lowerFeatures.includes(color)) {
      return color.charAt(0).toUpperCase() + color.slice(1)
    }
  }
  
  return ''
}

function generateItemSpecifics(brand?: string, condition?: string, features?: string): Record<string, string> {
  const specifics: Record<string, string> = {}
  
  if (brand) {
    specifics['Brand'] = brand
  }
  
  if (condition) {
    specifics['Condition'] = condition
  }
  
  // Parse features to extract common item specifics
  if (features) {
    const lowerFeatures = features.toLowerCase()
    
    // Try to extract color
    const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'gray', 'silver', 'gold']
    for (const color of colors) {
      if (lowerFeatures.includes(color)) {
        specifics['Color'] = color.charAt(0).toUpperCase() + color.slice(1)
        break
      }
    }
    
    // Try to extract material
    const materials = ['plastic', 'metal', 'wood', 'leather', 'cotton', 'polyester', 'steel', 'aluminum']
    for (const material of materials) {
      if (lowerFeatures.includes(material)) {
        specifics['Material'] = material.charAt(0).toUpperCase() + material.slice(1)
        break
      }
    }
  }
  
  // Add common specifics
  specifics['Country/Region of Manufacture'] = 'United States'
  specifics['Type'] = 'Standard'
  
  return specifics
}

function generateSEOKeywords(
  title: string, 
  brand?: string, 
  category?: string, 
  features?: string, 
  categorySpec?: EbayCategorySpec,
  productData?: any
): string {
  const keywords = new Set<string>()
  
  // Extract product-specific information for better SEO
  const extractedCharacter = extractCharacterFromProductData(productData)
  const extractedFranchise = extractFranchiseFromProductData(productData)
  const extractedSeries = extractSeriesFromProductData(productData, extractedFranchise)
  
  // Add character-based keywords
  if (extractedCharacter) {
    keywords.add(extractedCharacter.toLowerCase())
    keywords.add(`${extractedCharacter.toLowerCase()} collectible`)
    keywords.add(`${extractedCharacter.toLowerCase()} figure`)
    keywords.add(`${extractedCharacter.toLowerCase()} merchandise`)
    
    // Add character aliases for SEO
    const characterAliases = CHARACTER_DATABASE[extractedCharacter]
    if (characterAliases) {
      characterAliases.forEach(alias => keywords.add(alias))
    }
  }
  
  // Add franchise-based keywords
  if (extractedFranchise) {
    keywords.add(extractedFranchise.toLowerCase())
    keywords.add(`${extractedFranchise.toLowerCase()} merchandise`)
    keywords.add(`${extractedFranchise.toLowerCase()} collectible`)
    keywords.add(`${extractedFranchise.toLowerCase()} fan`)
    
    // Add franchise aliases for SEO
    const franchiseKeywords = FRANCHISE_DATABASE[extractedFranchise]
    if (franchiseKeywords) {
      franchiseKeywords.slice(0, 5).forEach(keyword => keywords.add(keyword))
    }
  }
  
  // Add series-based keywords
  if (extractedSeries) {
    keywords.add(extractedSeries.toLowerCase())
    keywords.add(`${extractedSeries.toLowerCase()} collection`)
  }
  
  // Extract words from title (ignore common words)
  const commonWords = ['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
  const titleWords = title.toLowerCase().split(/\s+/).filter(word => 
    word.length > 2 && !commonWords.includes(word)
  )
  titleWords.forEach(word => keywords.add(word))
  
  // Add brand variations
  if (brand) {
    keywords.add(brand.toLowerCase())
    keywords.add(`${brand.toLowerCase()} authentic`)
    keywords.add(`genuine ${brand.toLowerCase()}`)
    keywords.add(`${brand.toLowerCase()} original`)
    keywords.add(`official ${brand.toLowerCase()}`)
  }
  
  // Add category-specific keywords
  if (categorySpec) {
    switch (categorySpec.categoryName) {
      case 'Funko Pop!':
        keywords.add('funko')
        keywords.add('pop vinyl')
        keywords.add('collectible')
        keywords.add('figure')
        keywords.add('bobblehead')
        keywords.add('funko pop')
        keywords.add('pop culture')
        keywords.add('collector')
        keywords.add('vinyl figure')
        keywords.add('pop collection')
        if (extractedCharacter && extractedFranchise) {
          keywords.add(`${extractedCharacter.toLowerCase()} ${extractedFranchise.toLowerCase()} funko`)
          keywords.add(`${extractedFranchise.toLowerCase()} ${extractedCharacter.toLowerCase()} pop`)
        }
        break
      case "Women's Clothing":
        keywords.add('fashion')
        keywords.add('style')
        keywords.add('trendy')
        keywords.add('outfit')
        keywords.add('apparel')
        keywords.add('womens')
        keywords.add('ladies')
        keywords.add('female fashion')
        break
      case "Men's Clothing":
        keywords.add('menswear')
        keywords.add('style')
        keywords.add('casual')
        keywords.add('fashion')
        keywords.add('apparel')
        keywords.add('mens')
        keywords.add('guys')
        keywords.add('male fashion')
        break
      case 'Electronics':
        keywords.add('tech')
        keywords.add('gadget')
        keywords.add('electronic')
        keywords.add('device')
        keywords.add('technology')
        keywords.add('digital')
        break
      case 'Toys & Games':
        keywords.add('toy')
        keywords.add('game')
        keywords.add('kids')
        keywords.add('children')
        keywords.add('play')
        keywords.add('fun')
        keywords.add('educational')
        break
    }
  }
  
  // Add category-based keywords from product data
  if (category) {
    const categoryKeywords = {
      'toys': ['collectible', 'vintage', 'rare', 'limited edition', 'mint condition', 'toy collector'],
      'electronics': ['wireless', 'bluetooth', 'digital', 'smart', 'portable', 'rechargeable'],
      'clothing': ['fashion', 'style', 'trendy', 'comfortable', 'durable', 'quality'],
      'books': ['paperback', 'hardcover', 'first edition', 'classic', 'bestseller'],
      'home': ['decor', 'modern', 'stylish', 'functional', 'space-saving'],
      'automotive': ['OEM', 'replacement', 'performance', 'durable', 'compatible'],
      'sports': ['professional', 'training', 'outdoor', 'fitness', 'equipment']
    }
    
    const catLower = category.toLowerCase()
    Object.entries(categoryKeywords).forEach(([cat, words]) => {
      if (catLower.includes(cat)) {
        words.forEach(word => keywords.add(word))
      }
    })
  }
  
  // Add condition-based keywords
  keywords.add('fast shipping')
  keywords.add('free shipping')
  keywords.add('authentic')
  keywords.add('genuine')
  keywords.add('quality')
  keywords.add('trusted seller')
  keywords.add('official')
  keywords.add('licensed')
  
  // Extract features as keywords
  if (features) {
    const featureWords = features.split(',').map(f => f.trim().toLowerCase())
    featureWords.forEach(feature => {
      if (feature.length > 2) {
        keywords.add(feature)
      }
    })
  }
  
  // Add product-specific long-tail keywords
  if (extractedCharacter && extractedFranchise) {
    keywords.add(`${extractedCharacter.toLowerCase()} ${extractedFranchise.toLowerCase()}`)
    keywords.add(`${extractedFranchise.toLowerCase()} ${extractedCharacter.toLowerCase()}`)
    keywords.add(`${extractedCharacter.toLowerCase()} collectible`)
    keywords.add(`${extractedFranchise.toLowerCase()} fan gift`)
  }
  
  // Convert to comma-separated string, prioritizing most relevant keywords
  const keywordArray = Array.from(keywords)
  const prioritizedKeywords: string[] = []
  
  // Add character/franchise keywords first (highest priority)
  keywordArray.filter(k => extractedCharacter && k.includes(extractedCharacter.toLowerCase())).forEach(k => prioritizedKeywords.push(k))
  keywordArray.filter(k => extractedFranchise && k.includes(extractedFranchise.toLowerCase())).forEach(k => prioritizedKeywords.push(k))
  
  // Add remaining keywords
  keywordArray.filter(k => !prioritizedKeywords.includes(k)).forEach(k => prioritizedKeywords.push(k))
  
  return prioritizedKeywords.slice(0, 30).join(', ')
}

function generateTags(
  title: string, 
  brand?: string, 
  category?: string, 
  condition?: string, 
  features?: string, 
  categorySpec?: EbayCategorySpec,
  character?: string,
  franchise?: string
): string[] {
  const tags = new Set<string>()
  
  // Add character tags
  if (character) {
    tags.add(character)
    tags.add(`${character} Collectible`)
    tags.add(`${character} Figure`)
    tags.add(`${character} Merchandise`)
    
    // Add character aliases for better discoverability
    const characterAliases = CHARACTER_DATABASE[character]
    if (characterAliases) {
      characterAliases.slice(0, 2).forEach(alias => tags.add(alias))
    }
  }
  
  // Add franchise tags
  if (franchise) {
    tags.add(franchise)
    tags.add(`${franchise} Merchandise`)
    tags.add(`${franchise} Fan`)
    tags.add(`${franchise} Collectible`)
    
    // Add franchise keywords for better SEO
    const franchiseKeywords = FRANCHISE_DATABASE[franchise]
    if (franchiseKeywords) {
      franchiseKeywords.slice(0, 2).forEach(keyword => tags.add(keyword))
    }
  }
  
  // Add character + franchise combination tags
  if (character && franchise) {
    tags.add(`${character} ${franchise}`)
    tags.add(`${franchise} ${character}`)
  }
  
  // Add brand tag
  if (brand) {
    tags.add(brand)
  }
  
  // Add condition tags
  if (condition) {
    tags.add(condition.toLowerCase())
    if (condition === 'New') {
      tags.add('brand new')
      tags.add('unopened')
      tags.add('mint')
    }
  }
  
  // Category-specific tags from eBay spec
  if (categorySpec) {
    tags.add(categorySpec.categoryName)
    
    switch (categorySpec.categoryName) {
      case 'Funko Pop!':
        tags.add('Collectible')
        tags.add('Vinyl Figure')
        tags.add('Pop Culture')
        tags.add('Geek')
        tags.add('Bobblehead')
        tags.add('Funko')
        tags.add('Pop Vinyl')
        if (character) {
          tags.add(`${character} Funko`)
          tags.add(`${character} Pop`)
        }
        if (franchise) {
          tags.add(`${franchise} Funko`)
          tags.add(`${franchise} Pop`)
        }
        break
      case "Women's Clothing":
        tags.add('Fashion')
        tags.add('Style')
        tags.add('Trendy')
        tags.add('Womens')
        tags.add('Apparel')
        tags.add('Ladies Fashion')
        break
      case "Men's Clothing":
        tags.add('Menswear')
        tags.add('Fashion')
        tags.add('Style')
        tags.add('Mens')
        tags.add('Casual')
        tags.add('Male Fashion')
        break
      case 'Electronics':
        tags.add('Tech')
        tags.add('Gadget')
        tags.add('Technology')
        tags.add('Device')
        tags.add('Electronic')
        break
      case 'Toys & Games':
        tags.add('Toy')
        tags.add('Game')
        tags.add('Fun')
        tags.add('Play')
        tags.add('Kids')
        break
      case 'Books':
        tags.add('Book')
        tags.add('Reading')
        tags.add('Literature')
        break
    }
  }
  
  // Category-specific tags from product category
  if (category) {
    const categoryTags = {
      'toys': ['collectible', 'vintage', 'rare', 'toy', 'figurine', 'collectibles'],
      'electronics': ['tech', 'gadget', 'device', 'digital', 'electronic'],
      'clothing': ['fashion', 'apparel', 'style', 'wear', 'clothing'],
      'books': ['book', 'literature', 'reading', 'novel', 'textbook'],
      'home': ['home', 'decor', 'furniture', 'household', 'interior'],
      'automotive': ['auto', 'car', 'vehicle', 'automotive', 'parts'],
      'sports': ['sports', 'fitness', 'outdoor', 'exercise', 'athletic']
    }
    
    const catLower = category.toLowerCase()
    Object.entries(categoryTags).forEach(([cat, catTags]) => {
      if (catLower.includes(cat)) {
        catTags.forEach(tag => tags.add(tag))
      }
    })
  }
  
  // Universal selling tags
  tags.add('fast shipping')
  tags.add('authentic')
  tags.add('quality')
  tags.add('official')
  tags.add('licensed')
  
  // Extract meaningful words from title
  const titleWords = title.toLowerCase().split(/\s+/).filter(word => 
    word.length > 3 && !['with', 'from', 'this', 'that'].includes(word)
  )
  titleWords.slice(0, 3).forEach(word => tags.add(word))
  
  // Add features as tags
  if (features) {
    const featureTags = features.split(',').map(f => f.trim().toLowerCase()).filter(f => f.length > 2)
    featureTags.slice(0, 5).forEach(feature => tags.add(feature))
  }
  
  // Add character and franchise specific appeal tags
  if (character && franchise) {
    tags.add('fan gift')
    tags.add('collector item')
    tags.add('geek culture')
    tags.add('pop culture')
  }
  
  return Array.from(tags).slice(0, 20)
}
