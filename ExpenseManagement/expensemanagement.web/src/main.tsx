
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { Toaster } from 'react-hot-toast'
// Import the generated route tree
import { routeTree } from './routeTree.gen'
import './i18n.ts'
import './styles.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SignalRProvider } from './context/SignalRContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { PreferencesProvider } from './context/PreferencesContext.tsx'

const queryClient = new QueryClient();

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PreferencesProvider>
          <AuthProvider>
          <SignalRProvider>
            <RouterProvider router={router} />
          </SignalRProvider>
          </AuthProvider>
        </PreferencesProvider>
        <Toaster position="top-center" toastOptions={{ className: "app-toast" }} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}
