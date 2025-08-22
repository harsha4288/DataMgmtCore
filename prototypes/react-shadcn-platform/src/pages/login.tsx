import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  Users,
  Trophy,
  Star,
  Clock,
  Heart,
  ArrowRight
} from 'lucide-react'
import { mockUsers } from '@/lib/mock-data/auth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'email' | 'username'>('email')
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  const [errors, setErrors] = useState<{
    identifier?: string
    password?: string
    general?: string
  }>({})
  const [validationStatus, setValidationStatus] = useState<{
    identifier?: 'valid' | 'invalid' | 'checking'
    password?: 'valid' | 'invalid'
  }>({})

  // Animated counter effect for metrics
  const [counters, setCounters] = useState({
    alumni: 0,
    successRate: 0,
    connections: 0,
    responseTime: 0
  })

  useEffect(() => {
    // Animate counters on mount
    const duration = 2000 // 2 seconds
    const steps = 60
    const interval = duration / steps

    const targets = {
      alumni: 2573,
      successRate: 94,
      connections: 1287,
      responseTime: 24
    }

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      
      setCounters({
        alumni: Math.floor(targets.alumni * progress),
        successRate: Math.floor(targets.successRate * progress),
        connections: Math.floor(targets.connections * progress),
        responseTime: Math.floor(targets.responseTime * progress)
      })

      if (currentStep >= steps) {
        clearInterval(timer)
        setCounters(targets)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [])

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9]{10}$/
    return usernameRegex.test(username)
  }

  const validatePassword = (password: string): boolean => {
    return password.length >= 6 && password.length <= 12 && 
           /[a-zA-Z]/.test(password) && 
           /[0-9]/.test(password)
  }

  const handleIdentifierChange = (value: string) => {
    setFormData(prev => ({ ...prev, identifier: value }))
    
    if (value.length === 0) {
      setValidationStatus(prev => ({ ...prev, identifier: undefined }))
      setErrors(prev => ({ ...prev, identifier: undefined }))
      return
    }

    if (value.includes('@')) {
      setLoginMethod('email')
      if (validateEmail(value)) {
        setValidationStatus(prev => ({ ...prev, identifier: 'valid' }))
        setErrors(prev => ({ ...prev, identifier: undefined }))
      } else {
        setValidationStatus(prev => ({ ...prev, identifier: 'invalid' }))
        setErrors(prev => ({ ...prev, identifier: 'Please enter a valid email address' }))
      }
    } else {
      setLoginMethod('username')
      setValidationStatus(prev => ({ ...prev, identifier: 'checking' }))
      
      setTimeout(() => {
        if (validateUsername(value)) {
          setValidationStatus(prev => ({ ...prev, identifier: 'valid' }))
          setErrors(prev => ({ ...prev, identifier: undefined }))
        } else {
          setValidationStatus(prev => ({ ...prev, identifier: 'invalid' }))
          setErrors(prev => ({ ...prev, identifier: 'Username must be exactly 10 alphanumeric characters' }))
        }
      }, 500)
    }
  }

  const handlePasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, password: value }))
    
    if (value.length === 0) {
      setValidationStatus(prev => ({ ...prev, password: undefined }))
      setErrors(prev => ({ ...prev, password: undefined }))
      return
    }

    if (validatePassword(value)) {
      setValidationStatus(prev => ({ ...prev, password: 'valid' }))
      setErrors(prev => ({ ...prev, password: undefined }))
    } else {
      setValidationStatus(prev => ({ ...prev, password: 'invalid' }))
      setErrors(prev => ({ ...prev, password: '6-12 characters with letters and numbers' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({ general: undefined })

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const user = mockUsers.find(u => 
        u.email === formData.identifier || u.username === formData.identifier
      )

      if (user && user.profiles.length > 0) {
        localStorage.setItem('authenticated', 'true')
        localStorage.setItem('currentUser', JSON.stringify(user))
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        }

        if (user.profiles.length === 1) {
          localStorage.setItem('currentProfile', JSON.stringify(user.profiles[0]))
          const profile = user.profiles[0]
          
          switch (profile.role) {
            case 'admin':
              navigate('/admin-dashboard')
              break
            case 'moderator':
              navigate('/moderator-dashboard')
              break
            default:
              navigate('/member-dashboard')
          }
        } else {
          navigate('/profile-selection')
        }
      } else {
        setErrors({ general: 'Invalid credentials. Please check your email/username and password.' })
      }
    } catch (error) {
      setErrors({ general: 'Login failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = validationStatus.identifier === 'valid' && 
                     validationStatus.password === 'valid' && 
                     formData.identifier && 
                     formData.password

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header with animation */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/images/opportunities/sgsgf-logo.png"
              alt="SGS Gita Foundation Logo"
              className="h-16 w-auto"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">SGS Gita Connect</h1>
            <p className="text-muted-foreground text-lg">
              Where alumni help alumni succeed
            </p>
          </div>
          
          {/* Trust Metrics - Professional appearance */}
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="bg-card/50 backdrop-blur border rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div className="text-left">
                  <div className="text-xl font-bold text-foreground">{counters.alumni.toLocaleString()}+</div>
                  <div className="text-xs text-muted-foreground">Active Alumni</div>
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur border rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-4 w-4 text-green-500" />
                <div className="text-left">
                  <div className="text-xl font-bold text-foreground">{counters.successRate}%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur border rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center gap-2">
                <Heart className="h-4 w-4 text-purple-500" />
                <div className="text-left">
                  <div className="text-xl font-bold text-foreground">{counters.connections.toLocaleString()}+</div>
                  <div className="text-xs text-muted-foreground">Connections</div>
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur border rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div className="text-left">
                  <div className="text-xl font-bold text-foreground">{counters.responseTime}hr</div>
                  <div className="text-xs text-muted-foreground">Avg Response</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Card with enhanced styling */}
        <Card className="backdrop-blur bg-card/95 shadow-xl border-border/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
            <CardDescription className="text-sm">
              Sign in to connect with your alumni network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email/Username Field */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="flex items-center gap-2 text-sm font-medium">
                  {loginMethod === 'email' ? (
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                  {loginMethod === 'email' ? 'Email Address' : 'Username'}
                  {validationStatus.identifier === 'checking' && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                  {validationStatus.identifier === 'valid' && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  {validationStatus.identifier === 'invalid' && (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  )}
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={loginMethod === 'email' ? 'name@example.com' : 'username123'}
                  value={formData.identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  className={cn(
                    "transition-colors",
                    validationStatus.identifier === 'valid' && 'border-green-500 focus-visible:ring-green-500',
                    validationStatus.identifier === 'invalid' && 'border-red-500 focus-visible:ring-red-500'
                  )}
                />
                {errors.identifier && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.identifier}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Password
                  {validationStatus.password === 'valid' && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  {validationStatus.password === 'invalid' && (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={cn(
                      "pr-10 transition-colors",
                      validationStatus.password === 'valid' && 'border-green-500 focus-visible:ring-green-500',
                      validationStatus.password === 'invalid' && 'border-red-500 focus-visible:ring-red-500'
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label 
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
                <Button 
                  variant="link" 
                  className="px-0 text-sm font-normal"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot password?
                </Button>
              </div>

              {/* Error Message */}
              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button with enhanced styling */}
              <Button
                type="submit"
                className="w-full h-11 font-medium transition-all hover:shadow-lg"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In Securely
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Demo accounts</span>
              </div>
            </div>

            {/* Demo Account Information - Enhanced */}
            <div className="space-y-2">
              <div className="grid gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({ identifier: 'arjun.patel@example.com', password: 'demo123' })
                    handleIdentifierChange('arjun.patel@example.com')
                    handlePasswordChange('demo123')
                  }}
                  className="flex items-center justify-between p-2.5 bg-muted/50 hover:bg-muted rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">Member</Badge>
                    <span className="text-sm font-medium">arjun.patel@example.com</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({ identifier: 'priya.sharma@example.com', password: 'demo123' })
                    handleIdentifierChange('priya.sharma@example.com')
                    handlePasswordChange('demo123')
                  }}
                  className="flex items-center justify-between p-2.5 bg-muted/50 hover:bg-muted rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">Moderator</Badge>
                    <span className="text-sm font-medium">priya.sharma@example.com</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({ identifier: 'admin@gitaalumni.org', password: 'demo123' })
                    handleIdentifierChange('admin@gitaalumni.org')
                    handlePasswordChange('demo123')
                  }}
                  className="flex items-center justify-between p-2.5 bg-muted/50 hover:bg-muted rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Badge className="text-xs">Admin</Badge>
                    <span className="text-sm font-medium">admin@gitaalumni.org</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Click any account above to auto-fill • Password: demo123
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer with trust indicators */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Secure Login</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Verified Alumni</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>Trusted Platform</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2024 SGS Gita Connect. Alumni Network.
          </p>
        </div>
      </div>
    </div>
  )
}