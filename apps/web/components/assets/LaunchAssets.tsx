'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, CheckCircle2, AlertTriangle, Image, Video, FileText, Palette, Share2, Mail } from 'lucide-react'

interface Asset {
  id: string
  name: string
  type: 'logo' | 'image' | 'video' | 'document' | 'template'
  category: string
  description: string
  required: boolean
  completed: boolean
  fileSize?: string
  dimensions?: string
  format?: string
  downloadUrl?: string
}

interface AssetCategory {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  assets: Asset[]
}

export function LaunchAssets() {
  const [categories, setCategories] = useState<AssetCategory[]>([
    {
      id: 'brand',
      title: 'Brand Assets',
      icon: Palette,
      description: 'Logo variations and brand identity materials',
      assets: [
        {
          id: 'logo-primary',
          name: 'Primary Logo',
          type: 'logo',
          category: 'brand',
          description: 'Main logo for light backgrounds',
          required: true,
          completed: false,
          dimensions: '512x512px',
          format: 'SVG, PNG'
        },
        {
          id: 'logo-white',
          name: 'White Logo',
          type: 'logo',
          category: 'brand',
          description: 'Logo for dark backgrounds',
          required: true,
          completed: false,
          dimensions: '512x512px',
          format: 'SVG, PNG'
        },
        {
          id: 'logo-monochrome',
          name: 'Monochrome Logo',
          type: 'logo',
          category: 'brand',
          description: 'Single color version for print',
          required: false,
          completed: false,
          dimensions: '512x512px',
          format: 'SVG, PNG'
        },
        {
          id: 'favicon',
          name: 'Favicon',
          type: 'image',
          category: 'brand',
          description: 'Browser tab icon',
          required: true,
          completed: false,
          dimensions: '32x32px',
          format: 'ICO, PNG'
        },
        {
          id: 'app-icon',
          name: 'App Icon',
          type: 'image',
          category: 'brand',
          description: 'Mobile app and PWA icon',
          required: true,
          completed: false,
          dimensions: '192x192px',
          format: 'PNG'
        }
      ]
    },
    {
      id: 'social',
      title: 'Social Media',
      icon: Share2,
      description: 'Social media assets and templates',
      assets: [
        {
          id: 'og-image',
          name: 'OpenGraph Image',
          type: 'image',
          category: 'social',
          description: 'Default social media preview image',
          required: true,
          completed: false,
          dimensions: '1200x630px',
          format: 'PNG, JPG'
        },
        {
          id: 'twitter-card',
          name: 'Twitter Card Image',
          type: 'image',
          category: 'social',
          description: 'Twitter-specific preview image',
          required: false,
          completed: false,
          dimensions: '1200x600px',
          format: 'PNG, JPG'
        },
        {
          id: 'linkedin-banner',
          name: 'LinkedIn Company Banner',
          type: 'image',
          category: 'social',
          description: 'Company page header image',
          required: false,
          completed: false,
          dimensions: '1128x191px',
          format: 'PNG, JPG'
        },
        {
          id: 'instagram-posts',
          name: 'Instagram Post Templates',
          type: 'template',
          category: 'social',
          description: 'Post templates for Instagram',
          required: false,
          completed: false,
          dimensions: '1080x1080px',
          format: 'PSD, Figma'
        }
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing Materials',
      icon: Video,
      description: 'Promotional content and demos',
      assets: [
        {
          id: 'demo-video',
          name: 'Product Demo Video',
          type: 'video',
          category: 'marketing',
          description: 'Platform walkthrough and features',
          required: true,
          completed: false,
          dimensions: '1920x1080px',
          format: 'MP4, WebM'
        },
        {
          id: 'explainer-video',
          name: 'Explainer Video',
          type: 'video',
          category: 'marketing',
          description: 'Short intro to cultural music monetization',
          required: false,
          completed: false,
          dimensions: '1920x1080px',
          format: 'MP4, WebM'
        },
        {
          id: 'pitch-deck',
          name: 'Pitch Deck',
          type: 'document',
          category: 'marketing',
          description: 'Investor presentation materials',
          required: false,
          completed: false,
          format: 'PDF, PPTX'
        },
        {
          id: 'one-pager',
          name: 'Product One-Pager',
          type: 'document',
          category: 'marketing',
          description: 'Executive summary document',
          required: true,
          completed: false,
          format: 'PDF'
        }
      ]
    },
    {
      id: 'communication',
      title: 'Communication',
      icon: Mail,
      description: 'Email templates and press materials',
      assets: [
        {
          id: 'welcome-email',
          name: 'Welcome Email Template',
          type: 'template',
          category: 'communication',
          description: 'New user onboarding email',
          required: true,
          completed: false,
          format: 'HTML'
        },
        {
          id: 'notification-emails',
          name: 'Notification Email Templates',
          type: 'template',
          category: 'communication',
          description: 'Generation complete, purchase confirmations',
          required: true,
          completed: false,
          format: 'HTML'
        },
        {
          id: 'press-release',
          name: 'Launch Press Release',
          type: 'document',
          category: 'communication',
          description: 'Official launch announcement',
          required: false,
          completed: false,
          format: 'PDF, DOCX'
        },
        {
          id: 'media-kit',
          name: 'Media Kit',
          type: 'document',
          category: 'communication',
          description: 'Press resources and company info',
          required: false,
          completed: false,
          format: 'PDF'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Assets',
      icon: FileText,
      description: 'Documentation and technical resources',
      assets: [
        {
          id: 'api-docs',
          name: 'API Documentation',
          type: 'document',
          category: 'technical',
          description: 'Developer API reference',
          required: false,
          completed: false,
          format: 'HTML, PDF'
        },
        {
          id: 'user-guide',
          name: 'User Guide',
          type: 'document',
          category: 'technical',
          description: 'Platform usage documentation',
          required: true,
          completed: false,
          format: 'PDF, HTML'
        },
        {
          id: 'faq',
          name: 'FAQ Document',
          type: 'document',
          category: 'technical',
          description: 'Frequently asked questions',
          required: true,
          completed: false,
          format: 'HTML, PDF'
        }
      ]
    }
  ])

  const toggleAsset = (categoryId: string, assetId: string) => {
    setCategories(prev => prev.map(category => 
      category.id === categoryId 
        ? {
            ...category,
            assets: category.assets.map(asset => 
              asset.id === assetId 
                ? { ...asset, completed: !asset.completed }
                : asset
            )
          }
        : category
    ))
  }

  const getCompletionStats = () => {
    const allAssets = categories.flatMap(cat => cat.assets)
    const requiredAssets = allAssets.filter(asset => asset.required)
    const completedRequired = requiredAssets.filter(asset => asset.completed).length
    const totalCompleted = allAssets.filter(asset => asset.completed).length
    
    return {
      requiredProgress: Math.round((completedRequired / requiredAssets.length) * 100),
      overallProgress: Math.round((totalCompleted / allAssets.length) * 100),
      requiredTotal: requiredAssets.length,
      requiredCompleted: completedRequired,
      totalAssets: allAssets.length,
      totalCompleted
    }
  }

  const stats = getCompletionStats()

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'logo':
      case 'image':
        return <Image className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'document':
      case 'template':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Launch Assets</h2>
        <p className="text-muted-foreground">Brand materials and marketing content for launch</p>
      </div>

      {/* Asset Progress */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Required Assets</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requiredProgress}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.requiredCompleted} of {stats.requiredTotal} complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overallProgress}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCompleted} of {stats.totalAssets} assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Asset categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Launch Ready</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.requiredProgress === 100 ? 'text-green-600' : 'text-orange-600'}`}>
              {stats.requiredProgress === 100 ? 'Yes' : 'No'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.requiredProgress === 100 ? 'All required assets ready' : 'Missing required assets'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Asset Categories */}
      <div className="space-y-6">
        {categories.map((category) => {
          const Icon = category.icon
          const categoryStats = {
            total: category.assets.length,
            completed: category.assets.filter(asset => asset.completed).length,
            required: category.assets.filter(asset => asset.required).length,
            completedRequired: category.assets.filter(asset => asset.required && asset.completed).length
          }
          const progress = Math.round((categoryStats.completed / categoryStats.total) * 100)

          return (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {category.title}
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {progress}% complete
                  </span>
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(asset.type)}
                          {asset.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium">{asset.name}</h4>
                            {asset.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{asset.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {asset.dimensions && <span>Size: {asset.dimensions}</span>}
                            {asset.format && <span>Format: {asset.format}</span>}
                            {asset.fileSize && <span>Size: {asset.fileSize}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={asset.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {asset.completed ? 'Ready' : 'Pending'}
                        </Badge>
                        
                        <Button size="sm" variant="outline">
                          <Upload className="h-3 w-3 mr-1" />
                          Upload
                        </Button>
                        
                        {asset.downloadUrl && (
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant={asset.completed ? "destructive" : "default"}
                          onClick={() => toggleAsset(category.id, asset.id)}
                        >
                          {asset.completed ? 'Mark Pending' : 'Mark Ready'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Asset Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Guidelines</CardTitle>
          <CardDescription>Best practices for creating launch assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Brand Consistency</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use consistent colors, fonts, and visual style across all assets</li>
                <li>• Maintain logo clear space and minimum size requirements</li>
                <li>• Ensure cultural sensitivity in all visual representations</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Technical Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Provide high-resolution versions for print materials</li>
                <li>• Optimize file sizes for web usage while maintaining quality</li>
                <li>• Include both raster and vector formats where applicable</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Social Media Optimization</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Design for platform-specific dimensions and requirements</li>
                <li>• Include text overlays for accessibility</li>
                <li>• Test preview appearance across different platforms</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}