import { AlertCircle, AlertTriangle, Info, X, RefreshCw, ArrowLeft } from 'lucide-react'
import { getErrorSeverity, getErrorAction } from '../../utils/errorHandler'

export const ErrorAlert = ({ 
  error, 
  message, 
  onDismiss, 
  onAction,
  className = '',
  showIcon = true,
  dismissible = true,
  actionButton = true
}) => {
  if (!error && !message) return null
  
  const severity = getErrorSeverity(error)
  const action = actionButton ? getErrorAction(error) : null
  const displayMessage = message || error?.message || 'An error occurred'
  
  const severityStyles = {
    info: {
      container: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-500',
      button: 'text-blue-600 hover:bg-blue-100'
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: 'text-amber-500',
      button: 'text-amber-600 hover:bg-amber-100'
    },
    error: {
      container: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500',
      button: 'text-red-600 hover:bg-red-100'
    },
    critical: {
      container: 'bg-red-100 border-red-300',
      text: 'text-red-900',
      icon: 'text-red-600',
      button: 'text-red-700 hover:bg-red-200'
    }
  }
  
  const styles = severityStyles[severity] || severityStyles.error
  
  const getIcon = () => {
    switch (severity) {
      case 'info':
        return <Info className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'critical':
        return <AlertCircle className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }
  
  const handleAction = () => {
    if (!action || !onAction) return
    
    switch (action.action) {
      case 'retry':
        onAction('retry')
        break
      case 'login':
        window.location.href = '/login'
        break
      case 'back':
        window.history.back()
        break
      default:
        onAction(action.action)
    }
  }
  
  return (
    <div className={`rounded-lg border p-4 ${styles.container} ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <div className={`flex-shrink-0 ${styles.icon}`}>
            {getIcon()}
          </div>
        )}
        
        <div className="flex-1 ml-3">
          <p className={`text-sm font-medium ${styles.text}`}>
            {displayMessage}
          </p>
          
          {action && onAction && (
            <div className="mt-2">
              <button
                onClick={handleAction}
                className={`text-sm font-semibold px-3 py-1 rounded-md transition-colors ${styles.button}`}
              >
                {action.action === 'retry' && <RefreshCw className="inline h-3 w-3 mr-1" />}
                {action.action === 'back' && <ArrowLeft className="inline h-3 w-3 mr-1" />}
                {action.text}
              </button>
            </div>
          )}
        </div>
        
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ml-4 ${styles.icon} hover:opacity-75 transition-opacity`}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
