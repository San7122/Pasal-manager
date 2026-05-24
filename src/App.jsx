import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './LanguageContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import Landing from './pages/Landing'

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </ErrorBoundary>
  )
}

export default App
