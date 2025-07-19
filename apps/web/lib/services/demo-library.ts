export interface DemoItem {
  id: string
  name: string
  duration: string
  file: string
  description: string
  mood: string
  instruments: string[]
  generation_params: {
    style: string
    tempo: string
    cultural_blend: string
  }
  use_cases: string[]
  licensing: string
  attribution: string
}

export interface DemoPlaylist {
  id: string
  name: string
  duration: string
  file: string
  description: string
  tracks: number
  mood: string
  generation_params: {
    style: string
    flow: string
    variation: string
  }
  use_cases: string[]
  licensing: string
  attribution: string
}

export interface DemoSubcategory {
  title: string
  description: string
  sound_logos: DemoItem[]
  playlists?: DemoPlaylist[]
  social_clips?: DemoItem[]
  long_form?: DemoItem[]
}

export interface DemoCategory {
  title: string
  description: string
  subcategories: Record<string, DemoSubcategory>
}

export interface CaseStudy {
  id: string
  title: string
  business_type: string
  location: string
  industry: string
  size: string
  challenge: string
  solution: Record<string, string>
  implementation_timeline: string
  results: Record<string, { value: number; label: string }>
  testimonial: {
    quote: string
    author: string
    title: string
    business: string
    rating: number
    photo: string
  }
  before_after: {
    before: {
      title: string
      description: string
      metrics: string[]
    }
    after: {
      title: string
      description: string
      metrics: string[]
    }
  }
  usage_stats: Record<string, string | number>
  roi_breakdown: {
    monthly_cost: string
    revenue_increase: string
    roi_percentage: string
    payback_period: string
  }
}

export interface DemoLibraryData {
  library_version: string
  last_updated: string
  categories: Record<string, DemoCategory>
  case_studies: CaseStudy[]
  licensing_terms: {
    personal: {
      price: string
      usage: string
      attribution: string
      downloads: string
      commercial_rights: boolean
    }
    commercial: {
      price: string
      usage: string
      attribution: string
      downloads: string
      commercial_rights: boolean
      revenue_sharing: string
    }
    enterprise: {
      price: string
      usage: string
      attribution: string
      downloads: string
      commercial_rights: boolean
      revenue_sharing: string
      custom_generation: boolean
    }
  }
}

class DemoLibraryService {
  private baseUrl = '/demo-audio'
  private metadataCache: DemoLibraryData | null = null

  async getMetadata(): Promise<DemoLibraryData> {
    if (this.metadataCache) {
      return this.metadataCache
    }

    try {
      const response = await fetch('/api/demo-library/metadata')
      if (!response.ok) {
        throw new Error('Failed to fetch demo metadata')
      }
      this.metadataCache = await response.json()
      return this.metadataCache!
    } catch (error) {
      console.error('Error fetching demo metadata:', error)
      throw error
    }
  }

  async getCategories(): Promise<Record<string, DemoCategory>> {
    const metadata = await this.getMetadata()
    return metadata.categories
  }

  async getCaseStudies(): Promise<CaseStudy[]> {
    const metadata = await this.getMetadata()
    return metadata.case_studies
  }

  async getCaseStudy(id: string): Promise<CaseStudy | null> {
    const caseStudies = await this.getCaseStudies()
    return caseStudies.find(study => study.id === id) || null
  }

  async getDemosByCategory(categoryId: string, subcategoryId?: string): Promise<DemoSubcategory | null> {
    const categories = await this.getCategories()
    const category = categories[categoryId]
    
    if (!category) {
      return null
    }

    if (subcategoryId) {
      return category.subcategories[subcategoryId] || null
    }

    // Return first subcategory if no specific subcategory requested
    const firstSubcategoryKey = Object.keys(category.subcategories)[0]
    return category.subcategories[firstSubcategoryKey] || null
  }

  getAudioUrl(file: string): string {
    return `${this.baseUrl}/${file}`
  }

  async downloadDemo(demoId: string, file: string): Promise<void> {
    try {
      const url = this.getAudioUrl(file)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to download demo file')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${demoId}-demo.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error downloading demo:', error)
      throw error
    }
  }

  async generateSimilar(demoId: string): Promise<{ success: boolean; message: string; trackId?: string }> {
    try {
      const response = await fetch('/api/demo-library/generate-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ demoId })
      })

      if (!response.ok) {
        throw new Error('Failed to generate similar track')
      }

      return await response.json()
    } catch (error) {
      console.error('Error generating similar track:', error)
      return {
        success: false,
        message: 'Failed to generate similar track. Please try again.'
      }
    }
  }

  async trackPlayback(demoId: string, duration: number): Promise<void> {
    try {
      await fetch('/api/demo-library/track-playback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ demoId, duration })
      })
    } catch (error) {
      console.error('Error tracking playback:', error)
      // Non-critical error, don't throw
    }
  }

  async addToFavorites(demoId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/demo-library/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ demoId })
      })

      return response.ok
    } catch (error) {
      console.error('Error adding to favorites:', error)
      return false
    }
  }

  async removeFromFavorites(demoId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/demo-library/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ demoId })
      })

      return response.ok
    } catch (error) {
      console.error('Error removing from favorites:', error)
      return false
    }
  }

  async getFavorites(): Promise<string[]> {
    try {
      const response = await fetch('/api/demo-library/favorites')
      if (!response.ok) {
        return []
      }
      const data = await response.json()
      return data.favorites || []
    } catch (error) {
      console.error('Error fetching favorites:', error)
      return []
    }
  }
}

export const demoLibraryService = new DemoLibraryService()