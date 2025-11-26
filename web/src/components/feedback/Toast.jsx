import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [duration])
  
  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }
  
  if (!isVisible) return null
  
  const typeStyles = {
    success: {
      container: 'bg-green-50 border-green-200',
      icon: 'text-green-500',
      text: 'text-green-800'
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-500',
      text: 'text-red-800'
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-500',
      text: 'text-amber-800'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-500',
      text: 'text-blue-800'
    }
  }
  
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }
  
  const styles = typeStyles[type] || typeStyles.info
  const positionClass = positionStyles[position] || positionStyles['top-right']
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'error':
        return <AlertCircle className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }
  
  return (
    <div
      className={`
        fixed ${positionClass} z-50 
        transform transition-all duration-300 ease-in-out
        ${isLeaving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
      `}
    >
      <div className={`
        flex items-center gap-3 min-w-[300px] max-w-md
        rounded-lg border p-4 shadow-lg backdrop-blur-sm
        ${styles.container}
      `}>
        <div className={styles.icon}>
          {getIcon()}
        </div>
        
        <p className={`flex-1 text-sm font-medium ${styles.text}`}>
          {message}
        </p>
        
        <button
          onClick={handleClose}
          className={`flex-shrink-0 ${styles.icon} hover:opacity-75 transition-opacity`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Toast Manager Hook
export const useToast = () => {
  const [toasts, setToasts] = useState([])
  
  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now()
    const newToast = { id, message, type, duration }
    setToasts(prev => [...prev, newToast])
    
    return id
  }
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }
  
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ 
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index 
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
  
  return {
    showToast,
    showSuccess: (message, duration) => showToast(message, 'success', duration),
    showError: (message, duration) => showToast(message, 'error', duration),
    showWarning: (message, duration) => showToast(message, 'warning', duration),
    showInfo: (message, duration) => showToast(message, 'info', duration),
    ToastContainer
  }
}
