'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Shield, Globe, Users, CheckCircle2, AlertTriangle, Download } from 'lucide-react'

interface LegalDocument {
  id: string
  title: string
  description: string
  required: boolean
  completed: boolean
  lastUpdated?: string
  content?: string
}

interface ComplianceItem {
  id: string
  title: string
  description: string
  status: 'compliant' | 'partial' | 'non-compliant'
  regulation: string
  actions: string[]
}

export function LegalCompliance() {
  const [documents, setDocuments] = useState<LegalDocument[]>([
    {
      id: 'terms-of-service',
      title: 'Terms of Service',
      description: 'Legal terms governing platform usage',
      required: true,
      completed: false,
      content: ''
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      description: 'Data collection and usage policies',
      required: true,
      completed: false,
      content: ''
    },
    {
      id: 'cultural-attribution',
      title: 'Cultural Attribution Guidelines',
      description: 'Requirements for cultural content usage',
      required: true,
      completed: false,
      content: ''
    },
    {
      id: 'licensing-agreement',
      title: 'Licensing Agreement',
      description: 'Terms for audio content licensing',
      required: true,
      completed: false,
      content: ''
    },
    {
      id: 'cookie-policy',
      title: 'Cookie Policy',
      description: 'Cookie usage and consent management',
      required: true,
      completed: false,
      content: ''
    },
    {
      id: 'dmca-policy',
      title: 'DMCA Policy',
      description: 'Copyright infringement procedures',
      required: false,
      completed: false,
      content: ''
    }
  ])

  const [compliance, setCompliance] = useState<ComplianceItem[]>([
    {
      id: 'gdpr',
      title: 'GDPR Compliance',
      description: 'EU data protection regulation compliance',
      status: 'partial',
      regulation: 'GDPR',
      actions: [
        'Implement cookie consent banner',
        'Add data export functionality',
        'Create data deletion processes',
        'Appoint Data Protection Officer'
      ]
    },
    {
      id: 'ccpa',
      title: 'CCPA Compliance',
      description: 'California Consumer Privacy Act compliance',
      status: 'non-compliant',
      regulation: 'CCPA',
      actions: [
        'Add "Do Not Sell" option',
        'Implement data disclosure requests',
        'Create consumer rights portal',
        'Update privacy policy for CCPA'
      ]
    },
    {
      id: 'coppa',
      title: 'COPPA Compliance',
      description: 'Children\'s Online Privacy Protection Act',
      status: 'compliant',
      regulation: 'COPPA',
      actions: [
        'Age verification implemented',
        'Parental consent processes'
      ]
    },
    {
      id: 'accessibility',
      title: 'Accessibility Standards',
      description: 'WCAG 2.1 AA compliance for accessibility',
      status: 'partial',
      regulation: 'WCAG 2.1',
      actions: [
        'Add alt text for all images',
        'Improve keyboard navigation',
        'Enhance color contrast',
        'Add screen reader support'
      ]
    },
    {
      id: 'cultural-rights',
      title: 'Cultural Rights Protection',
      description: 'Indigenous and traditional knowledge protection',
      status: 'partial',
      regulation: 'UNESCO',
      actions: [
        'Implement community approval workflows',
        'Add cultural context requirements',
        'Create attribution standards',
        'Establish benefit-sharing agreements'
      ]
    }
  ])

  const [activeDocument, setActiveDocument] = useState<string | null>(null)

  const toggleDocument = (docId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, completed: !doc.completed, lastUpdated: new Date().toISOString().split('T')[0] }
        : doc
    ))
  }

  const updateDocumentContent = (docId: string, content: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, content }
        : doc
    ))
  }

  const getComplianceStats = () => {
    const requiredDocs = documents.filter(d => d.required)
    const completedDocs = requiredDocs.filter(d => d.completed).length
    const compliantItems = compliance.filter(c => c.status === 'compliant').length
    
    return {
      documentsComplete: Math.round((completedDocs / requiredDocs.length) * 100),
      complianceScore: Math.round((compliantItems / compliance.length) * 100),
      totalRequired: requiredDocs.length,
      totalCompleted: completedDocs
    }
  }

  const stats = getComplianceStats()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600 bg-green-100'
      case 'partial':
        return 'text-orange-600 bg-orange-100'
      case 'non-compliant':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'non-compliant':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 border border-gray-300 rounded" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Legal Compliance</h2>
        <p className="text-muted-foreground">Ensure all legal requirements are met before launch</p>
      </div>

      {/* Compliance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documentsComplete}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCompleted} of {stats.totalRequired} required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceScore}%</div>
            <Badge className={stats.complianceScore >= 80 ? 'bg-green-100 text-green-800' : stats.complianceScore >= 60 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}>
              {stats.complianceScore >= 80 ? 'Good' : stats.complianceScore >= 60 ? 'Fair' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regulations</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compliance.length}</div>
            <p className="text-xs text-muted-foreground">Areas covered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cultural Rights</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {compliance.find(c => c.id === 'cultural-rights')?.status === 'compliant' ? '✓' : '⚠'}
            </div>
            <p className="text-xs text-muted-foreground">Protection status</p>
          </CardContent>
        </Card>
      </div>

      {/* Legal Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Legal Documents</CardTitle>
          <CardDescription>Required legal documents for platform operation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id}>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      {doc.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{doc.title}</h4>
                          {doc.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                        {doc.lastUpdated && (
                          <p className="text-xs text-muted-foreground">Last updated: {doc.lastUpdated}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={doc.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {doc.completed ? 'Complete' : 'Draft'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveDocument(activeDocument === doc.id ? null : doc.id)}
                    >
                      {activeDocument === doc.id ? 'Close' : 'Edit'}
                    </Button>
                    <Button
                      size="sm"
                      variant={doc.completed ? "destructive" : "default"}
                      onClick={() => toggleDocument(doc.id)}
                    >
                      {doc.completed ? 'Mark Draft' : 'Mark Complete'}
                    </Button>
                  </div>
                </div>
                
                {activeDocument === doc.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Edit {doc.title}</h5>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                      <Textarea
                        placeholder={`Enter the content for ${doc.title}...`}
                        value={doc.content || ''}
                        onChange={(e) => updateDocumentContent(doc.id, e.target.value)}
                        className="min-h-[200px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Items */}
      <Card>
        <CardHeader>
          <CardTitle>Regulatory Compliance</CardTitle>
          <CardDescription>Compliance status for various regulations and standards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {compliance.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge variant="outline">{item.regulation}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace('-', ' ')}
                  </Badge>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Required Actions:</h5>
                  <ul className="space-y-1">
                    {item.actions.map((action, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legal Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Launch Legal Checklist</CardTitle>
          <CardDescription>Essential legal items to complete before going live</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Legal entity established and registered</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              <span className="text-sm">Terms of Service and Privacy Policy published</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              <span className="text-sm">Cookie consent mechanism implemented</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              <span className="text-sm">Cultural attribution guidelines established</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              <span className="text-sm">Data protection impact assessment completed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              <span className="text-sm">Licensing agreements with rights holders signed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              <span className="text-sm">Business insurance and liability coverage active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}