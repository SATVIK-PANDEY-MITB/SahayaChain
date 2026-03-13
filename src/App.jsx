import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Communities from './pages/Communities'
import About from './pages/About'
import Contact from './pages/Contact'

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="login" element={<Login />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="communities" element={<Communities />} />
                        <Route path="about" element={<About />} />
                        <Route path="contact" element={<Contact />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App
