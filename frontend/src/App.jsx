import { BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from './app/router'
import './index.css'

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}
