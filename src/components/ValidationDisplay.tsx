'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Lightbulb,
  Target,
  TrendingUp
} from 'lucide-react'
import { getValidationSummary, ValidationResult } from '@/lib/validation'

interface ValidationDisplayProps {
  platform: string
  draftData: any
  className?: string
}

export default function ValidationDisplay({ platform, draftData, className = '' }: ValidationDisplayProps) {
  const { score, issues, suggestions } = getValidationSummary(platform, draftData)
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const errors = issues.filter(issue => issue.type === 'error')
  const warnings = issues.filter(issue => issue.type === 'warning')

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Listing Quality
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getScoreBgColor(score)}`}>
            <span className={`font-bold ${getScoreColor(score)}`}>{score}/100</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quality Score</span>
            <span className={`font-medium ${getScoreColor(score)}`}>
              {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                score >= 80 ? 'bg-green-500' : 
                score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Validation Issues */}
        {(errors.length > 0 || warnings.length > 0) && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Issues Found</h4>
            
            {/* Errors */}
            {errors.map((error, index) => (
              <div key={`error-${index}`} className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-red-700">Error</div>
                  <div className="text-sm text-red-600">{error.message}</div>
                </div>
              </div>
            ))}

            {/* Warnings */}
            {warnings.map((warning, index) => (
              <div key={`warning-${index}`} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-yellow-700">Warning</div>
                  <div className="text-sm text-yellow-600">{warning.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All Good */}
        {errors.length === 0 && warnings.length === 0 && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <div className="font-medium text-green-700">All Requirements Met</div>
              <div className="text-sm text-green-600">
                Your listing meets all {platform} requirements
              </div>
            </div>
          </div>
        )}

        {/* Optimization Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground flex items-center">
              <Lightbulb className="w-4 h-4 mr-2" />
              Optimization Tips
            </h4>
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-600">{suggestion}</div>
              </div>
            ))}
          </div>
        )}

        {/* Marketplace Guidelines */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="font-medium text-foreground text-sm">
            {platform.toUpperCase()} Guidelines
          </h4>
          {platform.toUpperCase() === 'EBAY' && (
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Title: Maximum 80 characters</li>
              <li>• Images: 1-12 images recommended</li>
              <li>• Price: Minimum $0.99</li>
              <li>• Category: Must be selected</li>
            </ul>
          )}
          {platform.toUpperCase() === 'AMAZON' && (
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Title: Maximum 200 characters</li>
              <li>• Brand: Required field</li>
              <li>• Description: Maximum 2000 characters</li>
              <li>• Images: High quality, 1200x1200+ recommended</li>
            </ul>
          )}
          {platform.toUpperCase() === 'MERCARI' && (
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Title: Maximum 40 characters</li>
              <li>• Description: Required, max 1000 characters</li>
              <li>• Price: Minimum $3</li>
              <li>• Condition: Must be specified</li>
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}