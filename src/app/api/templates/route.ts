import { NextRequest, NextResponse } from 'next/server'
import {
  getCategoryTemplates,
  getDefaultTemplate,
  saveTemplate,
  deleteTemplate,
  setUserPreference,
  getUserPreferences,
  generateSmartDefaults,
  filterTemplateData
} from '@/lib/templates'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryKey = searchParams.get('categoryKey')
    const userId = searchParams.get('userId') || 'default-user' // TODO: Get from session
    const action = searchParams.get('action')

    if (!categoryKey) {
      return NextResponse.json({ error: 'categoryKey is required' }, { status: 400 })
    }

    switch (action) {
      case 'templates':
        const templates = await getCategoryTemplates(categoryKey, userId)
        return NextResponse.json({ templates })

      case 'default':
        const defaultTemplate = await getDefaultTemplate(categoryKey, userId)
        return NextResponse.json({ template: defaultTemplate })

      case 'preferences':
        const preferences = await getUserPreferences(userId, categoryKey)
        return NextResponse.json({ preferences })

      case 'smart-defaults':
        const smartDefaults = await generateSmartDefaults(categoryKey, userId)
        return NextResponse.json({ defaults: smartDefaults })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Template API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, categoryKey, userId = 'default-user' } = body

    if (!categoryKey) {
      return NextResponse.json({ error: 'categoryKey is required' }, { status: 400 })
    }

    switch (action) {
      case 'save-template':
        const { templateName, itemSpecifics, setAsDefault } = body
        
        if (!templateName || !itemSpecifics) {
          return NextResponse.json({ error: 'templateName and itemSpecifics are required' }, { status: 400 })
        }

        // Filter out unique fields that shouldn't be in templates
        const filteredData = filterTemplateData(categoryKey, itemSpecifics)
        
        const savedTemplate = await saveTemplate(
          categoryKey,
          templateName,
          filteredData,
          userId,
          setAsDefault
        )
        
        return NextResponse.json({ template: savedTemplate })

      case 'set-preference':
        const { fieldName, defaultValue } = body
        
        if (!fieldName || defaultValue === undefined) {
          return NextResponse.json({ error: 'fieldName and defaultValue are required' }, { status: 400 })
        }

        const preference = await setUserPreference(userId, categoryKey, fieldName, defaultValue)
        return NextResponse.json({ preference })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Template API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const userId = searchParams.get('userId') || 'default-user'

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
    }

    await deleteTemplate(templateId, userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template API Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}