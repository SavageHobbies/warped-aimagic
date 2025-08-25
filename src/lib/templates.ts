/**
 * Template Management System
 * Handles category-specific default templates and user preferences
 */

import { prisma } from './prisma'
import { getCategorySpec } from './ebay-categories'

export interface CategoryTemplate {
  id: string
  categoryKey: string
  templateName: string
  templateData: Record<string, string>
  isDefault: boolean
  isSystemDefault: boolean
  userId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserPreference {
  id: string
  userId: string
  categoryKey: string
  fieldName: string
  defaultValue: string
}

/**
 * Built-in system templates for common categories
 */
export const SYSTEM_TEMPLATES: Record<string, CategoryTemplate[]> = {
  'funko_pops': [
    {
      id: 'system-funko-standard',
      categoryKey: 'funko_pops',
      templateName: 'Standard Funko Pop',
      templateData: {
        'Type': 'Pop! Vinyl',
        'Material': 'Vinyl',
        'Age Level': '8+',
        'Size': '3 3/4 in',
        'Country/Region of Manufacture': 'China',
        'Condition': 'New'
      },
      isDefault: true,
      isSystemDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'system-funko-6inch',
      categoryKey: 'funko_pops',
      templateName: '6 Inch Funko Pop',
      templateData: {
        'Type': 'Pop! Vinyl',
        'Material': 'Vinyl',
        'Age Level': '8+',
        'Size': '6 in',
        'Country/Region of Manufacture': 'China',
        'Condition': 'New'
      },
      isDefault: false,
      isSystemDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  'womens_clothing': [
    {
      id: 'system-womens-standard',
      categoryKey: 'womens_clothing',
      templateName: 'Standard Women\'s Clothing',
      templateData: {
        'Department': 'Women',
        'Condition': 'New',
        'Country/Region of Manufacture': 'United States',
        'Season': 'All Seasons'
      },
      isDefault: true,
      isSystemDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  'mens_clothing': [
    {
      id: 'system-mens-standard',
      categoryKey: 'mens_clothing',
      templateName: 'Standard Men\'s Clothing',
      templateData: {
        'Department': 'Men',
        'Condition': 'New',
        'Country/Region of Manufacture': 'United States',
        'Fit': 'Regular'
      },
      isDefault: true,
      isSystemDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  'electronics': [
    {
      id: 'system-electronics-standard',
      categoryKey: 'electronics',
      templateName: 'Standard Electronics',
      templateData: {
        'Condition': 'New',
        'Country/Region of Manufacture': 'China'
      },
      isDefault: true,
      isSystemDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
}

/**
 * Get all templates for a category (system + user templates)
 */
export async function getCategoryTemplates(
  categoryKey: string, 
  userId?: string
): Promise<CategoryTemplate[]> {
  try {
    // Get user templates from database
    const userTemplates = await prisma.categoryTemplate.findMany({
      where: {
        categoryKey,
        userId
      },
      orderBy: [
        { isDefault: 'desc' },
        { templateName: 'asc' }
      ]
    })

    // Get system templates
    const systemTemplates = SYSTEM_TEMPLATES[categoryKey] || []

    // Combine and return
    return [
      ...systemTemplates,
      ...userTemplates.map(template => ({
        ...template,
        templateData: template.templateData as Record<string, string>,
        userId: template.userId || undefined
      }))
    ]
  } catch (error) {
    console.error('Error fetching templates:', error)
    return SYSTEM_TEMPLATES[categoryKey] || []
  }
}

/**
 * Get the default template for a category
 */
export async function getDefaultTemplate(
  categoryKey: string,
  userId?: string
): Promise<CategoryTemplate | null> {
  const templates = await getCategoryTemplates(categoryKey, userId)
  return templates.find(t => t.isDefault) || templates[0] || null
}

/**
 * Save a new template
 */
export async function saveTemplate(
  categoryKey: string,
  templateName: string,
  templateData: Record<string, string>,
  userId: string,
  setAsDefault = false
): Promise<CategoryTemplate> {
  try {
    // If setting as default, unset other user defaults
    if (setAsDefault) {
      await prisma.categoryTemplate.updateMany({
        where: {
          categoryKey,
          userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    const template = await prisma.categoryTemplate.upsert({
      where: {
        categoryKey_templateName_userId: {
          categoryKey,
          templateName,
          userId
        }
      },
      create: {
        categoryKey,
        templateName,
        templateData,
        userId,
        isDefault: setAsDefault,
        isSystemDefault: false
      },
      update: {
        templateData,
        isDefault: setAsDefault,
        updatedAt: new Date()
      }
    })

    return {
      ...template,
      templateData: template.templateData as Record<string, string>,
      userId: template.userId || undefined
    }
  } catch (error) {
    console.error('Error saving template:', error)
    throw new Error('Failed to save template')
  }
}

/**
 * Delete a user template
 */
export async function deleteTemplate(
  templateId: string,
  userId: string
): Promise<void> {
  try {
    await prisma.categoryTemplate.deleteMany({
      where: {
        id: templateId,
        userId, // Ensure user can only delete their own templates
        isSystemDefault: false // Prevent deletion of system templates
      }
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    throw new Error('Failed to delete template')
  }
}

/**
 * Set user preference for a specific field
 */
export async function setUserPreference(
  userId: string,
  categoryKey: string,
  fieldName: string,
  defaultValue: string
): Promise<UserPreference> {
  try {
    const preference = await prisma.userPreference.upsert({
      where: {
        userId_categoryKey_fieldName: {
          userId,
          categoryKey,
          fieldName
        }
      },
      create: {
        userId,
        categoryKey,
        fieldName,
        defaultValue
      },
      update: {
        defaultValue,
        updatedAt: new Date()
      }
    })

    return preference
  } catch (error) {
    console.error('Error setting user preference:', error)
    throw new Error('Failed to set user preference')
  }
}

/**
 * Get user preferences for a category
 */
export async function getUserPreferences(
  userId: string,
  categoryKey: string
): Promise<Record<string, string>> {
  try {
    const preferences = await prisma.userPreference.findMany({
      where: {
        userId,
        categoryKey
      }
    })

    const result: Record<string, string> = {}
    preferences.forEach(pref => {
      result[pref.fieldName] = pref.defaultValue
    })

    return result
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return {}
  }
}

/**
 * Apply template data to item specifics
 */
export function applyTemplate(
  template: CategoryTemplate,
  currentSpecifics: Record<string, string>
): Record<string, string> {
  // Create a copy of current specifics
  const result = { ...currentSpecifics }
  
  // Apply template data, but don't overwrite non-empty values
  Object.entries(template.templateData).forEach(([key, value]) => {
    if (!result[key] || result[key].trim() === '') {
      result[key] = value
    }
  })
  
  return result
}

/**
 * Generate smart defaults based on category spec and user preferences
 */
export async function generateSmartDefaults(
  categoryKey: string,
  userId?: string
): Promise<Record<string, string>> {
  const categorySpec = getCategorySpec(categoryKey)
  const defaults: Record<string, string> = {}
  
  // Get user preferences
  const userPrefs = userId ? await getUserPreferences(userId, categoryKey) : {}
  
  // Get default template
  const defaultTemplate = await getDefaultTemplate(categoryKey, userId)
  
  // Apply defaults in order: category spec defaults -> template -> user preferences
  categorySpec.itemSpecifics.forEach(spec => {
    if (spec.type === 'select' && spec.options && spec.options.length > 0) {
      // Use first option as default for selects
      defaults[spec.name] = spec.options[0]
    }
  })
  
  // Apply template defaults
  if (defaultTemplate) {
    Object.assign(defaults, defaultTemplate.templateData)
  }
  
  // Apply user preferences (highest priority)
  Object.assign(defaults, userPrefs)
  
  return defaults
}

/**
 * Get excluded fields that should not be saved in templates
 * These are typically unique per product
 */
export function getExcludedFields(categoryKey: string): string[] {
  const commonExcluded = ['UPC', 'EAN', 'MPN', 'Brand']
  
  switch (categoryKey) {
    case 'funko_pops':
      return [...commonExcluded, 'Character', 'Series', 'Franchise']
    case 'books':
      return [...commonExcluded, 'ISBN', 'Publication Year', 'Publisher']
    case 'electronics':
      return [...commonExcluded, 'Model', 'Storage Capacity']
    default:
      return commonExcluded
  }
}

/**
 * Filter template data to exclude unique fields
 */
export function filterTemplateData(
  categoryKey: string,
  itemSpecifics: Record<string, string>
): Record<string, string> {
  const excluded = getExcludedFields(categoryKey)
  const filtered: Record<string, string> = {}
  
  Object.entries(itemSpecifics).forEach(([key, value]) => {
    if (!excluded.includes(key) && value && value.trim() !== '') {
      filtered[key] = value
    }
  })
  
  return filtered
}