import React, { useState } from 'react'
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
  GitBranch
} from 'lucide-react'
import { mockUsers } from '@/lib/mock-data/auth'

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

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateUsername = (username: string): boolean => {
    // 10-character alphanumeric requirement
    const usernameRegex = /^[a-zA-Z0-9]{10}$/
    return usernameRegex.test(username)
  }

  const validatePassword = (password: string): boolean => {
    // 6-12 characters with mixed types
    return password.length >= 6 && password.length <= 12 && 
           /[a-zA-Z]/.test(password) && 
           /[0-9]/.test(password)
  }

  const handleIdentifierChange = (value: string) => {
    setFormData(prev => ({ ...prev, identifier: value }))
    
    // Real-time validation
    if (value.length === 0) {
      setValidationStatus(prev => ({ ...prev, identifier: undefined }))
      setErrors(prev => ({ ...prev, identifier: undefined }))
      return
    }

    // Auto-detect login method
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
      
      // Simulate checking username format
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
      // Simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Find user in mock data
      const user = mockUsers.find(u => 
        u.email === formData.identifier || u.username === formData.identifier
      )

      if (user && user.profiles.length > 0) {
        // Store authentication state
        localStorage.setItem('authenticated', 'true')
        localStorage.setItem('currentUser', JSON.stringify(user))
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        }

        // Navigate based on profile count
        if (user.profiles.length === 1) {
          // Single profile - go directly to dashboard
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
          // Multiple profiles - go to profile selection
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <GitBranch className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Gita Alumni Connect</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back! Please sign in to your account.
          </p>
          <Badge variant="secondary" className="text-xs">
            Phase 2 Demo - Mock Authentication
          </Badge>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Use your email address or username to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email/Username Field */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="flex items-center gap-2">
                  {loginMethod === 'email' ? (
                    <Mail className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  {loginMethod === 'email' ? 'Email Address' : 'Username'}
                  {validationStatus.identifier === 'checking' && (
                    <Loader2 className="h-3 w-3 animate-spin" />
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
                  placeholder={loginMethod === 'email' ? 'Enter your email' : 'Enter your username'}
                  value={formData.identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  className={
                    validationStatus.identifier === 'valid' ? 'border-green-500 focus:ring-green-500' :
                    validationStatus.identifier === 'invalid' ? 'border-red-500 focus:ring-red-500' :
                    ''
                  }
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
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
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
                    className={
                      validationStatus.password === 'valid' ? 'border-green-500 focus:ring-green-500' :
                      validationStatus.password === 'invalid' ? 'border-red-500 focus:ring-red-500' :
                      ''
                    }
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
                <Button variant="link" className="px-0 text-sm">
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

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>

            <Separator className="my-6" />

            {/* Demo Account Information */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Demo Accounts (Phase 2 Prototype)
              </p>
              <div className="grid gap-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-medium">Member:</span>
                  <code className="bg-background px-2 py-1 rounded">arjun.patel@example.com</code>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-medium">Moderator:</span>
                  <code className="bg-background px-2 py-1 rounded">priya.sharma@example.com</code>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-medium">Admin:</span>
                  <code className="bg-background px-2 py-1 rounded">admin@gitaalumni.org</code>
                </div>
                <p className="text-center text-muted-foreground mt-2">
                  Any password (6+ characters with letters and numbers)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 Gita Alumni Connect. Phase 2 Prototype.</p>
        </div>
      </div>
    </div>
  )
}