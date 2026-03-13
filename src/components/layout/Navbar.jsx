import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const isActive = (path) => location.pathname === path

    return (
        <header className="navbar">
            <div className="navbar-container">
                <Link to="/" className="logo">
                    <img
                        src="https://img.icons8.com/ios-filled/50/ffffff/link--v1.png"
                        alt="Logo"
                    />
                    <span>SahayaChain</span>
                </Link>

                <nav className="nav-links">
                    <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
                    <Link to="/about" className={isActive('/about') ? 'active' : ''}>About</Link>
                    <Link to="/communities" className={isActive('/communities') ? 'active' : ''}>Communities</Link>
                    <Link to="/contact" className={isActive('/contact') ? 'active' : ''}>Contact</Link>

                    {user ? (
                        <>
                            <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
                                Dashboard
                            </Link>
                            <button onClick={handleLogout} className="nav-btn">Sign Out</button>
                        </>
                    ) : (
                        <Link to="/login" className="nav-btn">Sign In</Link>
                    )}
                </nav>
            </div>
        </header>
    )
}

export default Navbar
