import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  X,
  Plus,
  Info,
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  Target,
  Briefcase,
  GraduationCap,
  Home,
  Stethoscope,
  Code,
  Palette,
  Music,
  Building,
  HelpCircle,
  Heart,
  Clock,
  Mail,
  Phone,
  User,
  FileText,
  Sparkles
} from 'lucide-react'

interface PostingFormData {
  type: 'offer' | 'seek'
  title: string
  category: string
  subcategory: string
  domain: string
  subdomain: string
  description: string
  tags: string[]
  urgency: 'low' | 'medium' | 'high'
  duration: string
  location: string
  locationType: 'remote' | 'in-person' | 'hybrid'
  maxConnections: number
  contactName: string
  contactEmail: string
  contactPhone: string
  preferredContact: 'email' | 'phone' | 'chat'
  expiryDate: string
}

const DOMAINS = {
  'Healthcare': {
    icon: Stethoscope,
    color: 'text-red-500',
    subdomains: ['Medical', 'Pharmacy', 'Dental', 'Behavioral', 'Vision']
  },
  'Engineering': {
    icon: Code,
    color: 'text-blue-500',
    subdomains: ['Computer Science', 'Mechanical', 'Industrial', 'Aerospace', 'Civil', 'Electronics']
  },
  'Arts & Crafts': {
    icon: Palette,
    color: 'text-purple-500',
    subdomains: ['Interior Design', 'Artist', 'Photography', 'Fashion', 'Crafts']
  },
  'Music': {
    icon: Music,
    color: 'text-pink-500',
    subdomains: ['Singer', 'Instruments', 'Composition', 'Production', 'Teaching']
  },
  'Real Estate': {
    icon: Building,
    color: 'text-green-500',
    subdomains: ['Agent', 'Investment', 'Property Management', 'Development', 'Consulting']
  }
}

const CATEGORIES = {
  'offer': [
    { value: 'internship', label: 'Internship Opportunity', icon: Briefcase },
    { value: 'job', label: 'Job Opening', icon: Target },
    { value: 'mentorship', label: 'Mentorship', icon: GraduationCap },
    { value: 'accommodation', label: 'Accommodation', icon: Home },
    { value: 'study-group', label: 'Study Group', icon: Users },
    { value: 'consultation', label: 'Professional Consultation', icon: HelpCircle }
  ],
  'seek': [
    { value: 'internship', label: 'Internship Needed', icon: Briefcase },
    { value: 'job', label: 'Job Seeking', icon: Target },
    { value: 'mentorship', label: 'Mentorship Needed', icon: GraduationCap },
    { value: 'accommodation', label: 'Accommodation Needed', icon: Home },
    { value: 'study-group', label: 'Study Partner', icon: Users },
    { value: 'advice', label: 'Advice & Guidance', icon: HelpCircle }
  ]
}

const PRESET_TAGS = [
  'Remote', 'On-site', 'Flexible', 'Urgent', 'Long-term', 'Short-term',
  'Paid', 'Volunteer', 'Part-time', 'Full-time', 'Weekend', 'Evening',
  'Beginner-friendly', 'Expert-level', 'Student', 'Professional'
]

export default function CreatePostingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customTag, setCustomTag] = useState('')
  
  const [formData, setFormData] = useState<PostingFormData>({
    type: 'offer',
    title: '',
    category: '',
    subcategory: '',
    domain: '',
    subdomain: '',
    description: '',
    tags: [],
    urgency: 'medium',
    duration: '',
    location: '',
    locationType: 'remote',
    maxConnections: 5,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    preferredContact: 'email',
    expiryDate: ''
  })

  const [errors, setErrors] = useState<Partial<PostingFormData>>({})

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<PostingFormData> = {}
    
    switch (step) {
      case 1:
        if (!formData.type) newErrors.type = 'Please select posting type' as any
        if (!formData.category) newErrors.category = 'Please select a category'
        if (!formData.title) newErrors.title = 'Title is required'
        if (formData.title && formData.title.length < 10) newErrors.title = 'Title must be at least 10 characters'
        break
      case 2:
        if (!formData.domain) newErrors.domain = 'Please select a domain'
        if (!formData.description) newErrors.description = 'Description is required'
        if (formData.description && formData.description.length < 50) {
          newErrors.description = 'Description must be at least 50 characters'
        }
        if (formData.tags.length === 0) newErrors.tags = [] as any
        break
      case 3:
        if (!formData.location) newErrors.location = 'Location is required'
        if (!formData.duration) newErrors.duration = 'Duration is required'
        if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required'
        break
      case 4:
        if (!formData.contactName) newErrors.contactName = 'Contact name is required'
        if (!formData.contactEmail) newErrors.contactEmail = 'Email is required'
        if (formData.contactEmail && !isValidEmail(formData.contactEmail)) {
          newErrors.contactEmail = 'Please enter a valid email'
        }
        if (formData.preferredContact === 'phone' && !formData.contactPhone) {
          newErrors.contactPhone = 'Phone is required when selected as preferred contact'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleAddTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      handleAddTag(customTag.trim())
      setCustomTag('')
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Success - navigate to dashboard with success message
      navigate('/member-dashboard', { 
        state: { 
          message: 'Your posting has been submitted for moderation. You will be notified once approved.',
          type: 'success'
        }
      })
    } catch (error) {
      console.error('Error submitting posting:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      navigate('/member-dashboard')
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  What would you like to do?
                </Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, type: value as 'offer' | 'seek' }))}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className={`cursor-pointer transition-all ${formData.type === 'offer' ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-6">
                        <RadioGroupItem value="offer" id="offer" className="sr-only" />
                        <Label htmlFor="offer" className="cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                              <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-semibold">Offer Support</p>
                              <p className="text-sm text-muted-foreground">I can help others with...</p>
                            </div>
                          </div>
                        </Label>
                      </CardContent>
                    </Card>

                    <Card className={`cursor-pointer transition-all ${formData.type === 'seek' ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-6">
                        <RadioGroupItem value="seek" id="seek" className="sr-only" />
                        <Label htmlFor="seek" className="cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                              <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-semibold">Seek Support</p>
                              <p className="text-sm text-muted-foreground">I need help with...</p>
                            </div>
                          </div>
                        </Label>
                      </CardContent>
                    </Card>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[formData.type].map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder={formData.type === 'offer' ? 'e.g., Offering Python tutoring for beginners' : 'e.g., Looking for accommodation near downtown'}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={errors.title ? 'border-red-500' : ''}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.title.length}/100 characters
                </p>
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3">Select Domain</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(DOMAINS).map(([domain, info]) => {
                  const Icon = info.icon
                  return (
                    <Card
                      key={domain}
                      className={`cursor-pointer transition-all ${formData.domain === domain ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, domain, subdomain: '' }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center space-y-2">
                          <Icon className={`h-8 w-8 ${info.color}`} />
                          <span className="text-sm font-medium">{domain}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              {errors.domain && (
                <p className="text-sm text-red-500 mt-2">{errors.domain}</p>
              )}
            </div>

            {formData.domain && (
              <div>
                <Label htmlFor="subdomain">Subdomain</Label>
                <Select
                  value={formData.subdomain}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subdomain: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subdomain (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS[formData.domain as keyof typeof DOMAINS].subdomains.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about your posting..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`min-h-[150px] ${errors.description ? 'border-red-500' : ''}`}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.description.length}/5000 characters (minimum 50)
              </p>
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div>
              <Label className="text-base font-semibold mb-3">Tags (Select up to 10)</Label>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map(tag => (
                    <Badge
                      key={tag}
                      variant={formData.tags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        if (formData.tags.includes(tag)) {
                          handleRemoveTag(tag)
                        } else {
                          handleAddTag(tag)
                        }
                      }}
                    >
                      {formData.tags.includes(tag) && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom tag"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomTag}
                    disabled={formData.tags.length >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Selected:</span>
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3">Urgency Level</Label>
              <RadioGroup
                value={formData.urgency}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, urgency: value as 'low' | 'medium' | 'high' }))}
              >
                <div className="grid grid-cols-3 gap-3">
                  <Card className={`cursor-pointer ${formData.urgency === 'low' ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-3 text-center">
                      <RadioGroupItem value="low" id="low" className="sr-only" />
                      <Label htmlFor="low" className="cursor-pointer">
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">Low</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Flexible timing</p>
                      </Label>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer ${formData.urgency === 'medium' ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-3 text-center">
                      <RadioGroupItem value="medium" id="medium" className="sr-only" />
                      <Label htmlFor="medium" className="cursor-pointer">
                        <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">Medium</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Within weeks</p>
                      </Label>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer ${formData.urgency === 'high' ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-3 text-center">
                      <RadioGroupItem value="high" id="high" className="sr-only" />
                      <Label htmlFor="high" className="cursor-pointer">
                        <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20">High</Badge>
                        <p className="text-xs text-muted-foreground mt-1">ASAP</p>
                      </Label>
                    </CardContent>
                  </Card>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, NY or Remote"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && (
                  <p className="text-sm text-red-500 mt-1">{errors.location}</p>
                )}
              </div>

              <div>
                <Label htmlFor="locationType">Location Type</Label>
                <Select
                  value={formData.locationType}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, locationType: value as 'remote' | 'in-person' | 'hybrid' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Duration
                </Label>
                <Input
                  id="duration"
                  placeholder="e.g., 3 months, Ongoing, One-time"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className={errors.duration ? 'border-red-500' : ''}
                />
                {errors.duration && (
                  <p className="text-sm text-red-500 mt-1">{errors.duration}</p>
                )}
              </div>

              <div>
                <Label htmlFor="expiryDate">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Posting Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className={errors.expiryDate ? 'border-red-500' : ''}
                />
                {errors.expiryDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.expiryDate}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="maxConnections">
                <Users className="h-4 w-4 inline mr-1" />
                Maximum Connections Allowed
              </Label>
              <Select
                value={formData.maxConnections.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, maxConnections: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 10, 20, 50].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'person' : 'people'}
                    </SelectItem>
                  ))}
                  <SelectItem value="999">Unlimited</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                How many people can connect with you for this posting
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This information will only be shared with approved connections
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="contactName">
                <User className="h-4 w-4 inline mr-1" />
                Contact Name
              </Label>
              <Input
                id="contactName"
                placeholder="Your full name"
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                className={errors.contactName ? 'border-red-500' : ''}
              />
              {errors.contactName && (
                <p className="text-sm text-red-500 mt-1">{errors.contactName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contactEmail">
                <Mail className="h-4 w-4 inline mr-1" />
                Contact Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="your.email@example.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className={errors.contactEmail ? 'border-red-500' : ''}
              />
              {errors.contactEmail && (
                <p className="text-sm text-red-500 mt-1">{errors.contactEmail}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contactPhone">
                <Phone className="h-4 w-4 inline mr-1" />
                Contact Phone (Optional)
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                className={errors.contactPhone ? 'border-red-500' : ''}
              />
              {errors.contactPhone && (
                <p className="text-sm text-red-500 mt-1">{errors.contactPhone}</p>
              )}
            </div>

            <div>
              <Label className="text-base font-semibold mb-3">Preferred Contact Method</Label>
              <RadioGroup
                value={formData.preferredContact}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, preferredContact: value as 'email' | 'phone' | 'chat' }))}
              >
                <div className="grid grid-cols-3 gap-3">
                  <Card className={`cursor-pointer ${formData.preferredContact === 'email' ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-3 text-center">
                      <RadioGroupItem value="email" id="email-pref" className="sr-only" />
                      <Label htmlFor="email-pref" className="cursor-pointer">
                        <Mail className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-sm">Email</p>
                      </Label>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer ${formData.preferredContact === 'phone' ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-3 text-center">
                      <RadioGroupItem value="phone" id="phone-pref" className="sr-only" />
                      <Label htmlFor="phone-pref" className="cursor-pointer">
                        <Phone className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-sm">Phone</p>
                      </Label>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer ${formData.preferredContact === 'chat' ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-3 text-center">
                      <RadioGroupItem value="chat" id="chat-pref" className="sr-only" />
                      <Label htmlFor="chat-pref" className="cursor-pointer">
                        <FileText className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-sm">In-App Chat</p>
                      </Label>
                    </CardContent>
                  </Card>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Posting Preview
              </h4>
              <div className="space-y-2 text-sm">
                <div><strong>Type:</strong> {formData.type === 'offer' ? 'Offering' : 'Seeking'} Support</div>
                <div><strong>Title:</strong> {formData.title || 'Not provided'}</div>
                <div><strong>Category:</strong> {formData.category || 'Not selected'}</div>
                <div><strong>Domain:</strong> {formData.domain} {formData.subdomain && `> ${formData.subdomain}`}</div>
                <div><strong>Location:</strong> {formData.location} ({formData.locationType})</div>
                <div><strong>Duration:</strong> {formData.duration}</div>
                <div><strong>Urgency:</strong> <Badge variant="outline" className="text-xs">{formData.urgency}</Badge></div>
                <div><strong>Tags:</strong> {formData.tags.length > 0 ? formData.tags.join(', ') : 'None'}</div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Basic Information'
      case 2: return 'Details & Domain'
      case 3: return 'Logistics & Timing'
      case 4: return 'Contact Information'
      default: return ''
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Choose the type and category of your posting'
      case 2: return 'Provide detailed information about your posting'
      case 3: return 'Specify location, duration, and urgency'
      case 4: return 'How can interested members reach you?'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/member-dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-bold">Create New Posting</h1>
            </div>
            <Badge variant="outline">Phase 2 Demo</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm font-medium">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-4">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div
                  key={step}
                  className={`flex flex-col items-center ${
                    step <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      step < currentStep
                        ? 'bg-primary border-primary text-primary-foreground'
                        : step === currentStep
                        ? 'border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>{getStepTitle()}</CardTitle>
              <CardDescription>{getStepDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>

            {/* Navigation */}
            <Separator />
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Save as draft functionality
                      alert('Draft saved! (Demo only)')
                    }}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button onClick={handleNext} disabled={isSubmitting}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit for Review
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Alert className="mt-6">
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Need help?</strong> All postings are reviewed by moderators before going live. 
              This typically takes 1-2 business days. You'll receive a notification once your posting is approved.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  )
}