// Import authentication context provider
import { useAuthContext } from '../providers/AuthProvider.jsx'

// Convenience hook to access authentication context
export const useAuth = () => useAuthContext()
