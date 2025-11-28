// Import React core components
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Import React Query for data fetching and caching
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// Import global styles and main app component
import './index.css'
import App from './App.jsx'
// Import authentication provider
import { AuthProvider } from './providers/AuthProvider.jsx'

// Configure React Query with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Disable automatic refetch on window focus
      staleTime: 1000 * 60,         // Consider data fresh for 1 minute
      retry: 1                      // Retry failed requests once
    }
  }
})

// Render the application with all providers
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
