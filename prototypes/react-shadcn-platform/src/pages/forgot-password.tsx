import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, 
  Phone,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  KeyRound
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'identify' | 'reset' | 'success'>('identify')
  const [method, setMethod] = useState<'userid' | 'details'>('userid')
  
  const [formData, setFormData] = useState({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [errors, setErrors] = useState<any>({})

  const handleUserIdSubmit = async () => {
    if (!formData.userId) {
      setErrors({ userId: 'User ID is required' })
      return
    }
    
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // For demo, accept any non-empty user ID
    if (formData.userId) {
      setStep('reset')
      toast({
        title: "User ID Verified",
        description: "Please enter your new password",
      })
    } else {
      setErrors({ userId: 'Invalid User ID' })
    }
    setIsLoading(false)
  }

  const handleDetailsSubmit = async () => {
    const detailErrors: any = {}
    if (!formData.firstName) detailErrors.firstName = 'First name is required'
    if (!formData.lastName) detailErrors.lastName = 'Last name is required'
    if (!formData.email) detailErrors.email = 'Email is required'
    if (!formData.phone) detailErrors.phone = 'Phone number is required'
    
    if (Object.keys(detailErrors).length > 0) {
      setErrors(detailErrors)
      return
    }
    
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // For demo, accept any filled form
    toast({
      title: "Recovery Email Sent",
      description: "A password reset link has been sent to your registered email address.",
    })
    
    // Simulate receiving the link and clicking it
    setTimeout(() => {
      setStep('reset')
    }, 2000)
    
    setIsLoading(false)
  }

  const handlePasswordReset = async () => {
    const passwordErrors: any = {}
    
    if (!formData.newPassword) {
      passwordErrors.newPassword = 'Password is required'
    } else if (formData.newPassword.length < 6 || formData.newPassword.length > 12) {
      passwordErrors.newPassword = 'Password must be 6-12 characters'
    } else if (!/[a-zA-Z]/.test(formData.newPassword) || !/[0-9]/.test(formData.newPassword)) {
      passwordErrors.newPassword = 'Password must contain letters and numbers'
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      passwordErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (Object.keys(passwordErrors).length > 0) {
      setErrors(passwordErrors)
      return
    }
    
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setStep('success')
    toast({
      title: "Password Reset Successful",
      description: "Your password has been successfully reset.",
    })
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      navigate('/login')
    }, 2000)
    
    setIsLoading(false)
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Password Reset Successful!</h2>
              <p className="text-muted-foreground">
                Your password has been successfully reset. You will be redirected to the login page shortly.
              </p>
              <Button 
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'reset') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Reset Password
            </CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, newPassword: e.target.value }))
                  setErrors((prev: any) => ({ ...prev, newPassword: undefined }))
                }}
              />
              {errors.newPassword && (
                <p className="text-xs text-destructive">{errors.newPassword}</p>
              )}
              <p className="text-xs text-muted-foreground">
                6-12 characters with letters, numbers, and special characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
                  setErrors((prev: any) => ({ ...prev, confirmPassword: undefined }))
                }}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handlePasswordReset}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Forgot Password
          </CardTitle>
          <CardDescription>
            Reset your password using your User ID or account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={method} onValueChange={(v) => setMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="userid">Use User ID</TabsTrigger>
              <TabsTrigger value="details">Use Account Details</TabsTrigger>
            </TabsList>

            <TabsContent value="userid" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter your User ID"
                  value={formData.userId}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, userId: e.target.value }))
                    setErrors((prev: any) => ({ ...prev, userId: undefined }))
                  }}
                />
                {errors.userId && (
                  <p className="text-xs text-destructive">{errors.userId}</p>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleUserIdSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Enter the details you provided during registration
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, firstName: e.target.value }))
                      setErrors((prev: any) => ({ ...prev, firstName: undefined }))
                    }}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, lastName: e.target.value }))
                      setErrors((prev: any) => ({ ...prev, lastName: undefined }))
                    }}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                      setErrors((prev: any) => ({ ...prev, email: undefined }))
                    }}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    className="pl-10"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, phone: e.target.value }))
                      setErrors((prev: any) => ({ ...prev, phone: undefined }))
                    }}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleDetailsSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Recovery Email...
                  </>
                ) : (
                  'Recover Password'
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}