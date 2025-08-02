import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ name?: string }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ name?: string }>) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error caught by ErrorBoundary (${this.props.name || 'Unknown'}):`, error)
    console.error('Error Info:', errorInfo)
    console.error('Stack Trace:', error.stack)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-red-300 bg-red-50 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-4">
            Error in {this.props.name || 'Component'}
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-red-700">Error Message:</h3>
              <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded">
                {this.state.error?.message}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-red-700">Stack Trace:</h3>
              <pre className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded overflow-auto max-h-40">
                {this.state.error?.stack}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-red-700">Component Stack:</h3>
              <pre className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded overflow-auto max-h-40">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}