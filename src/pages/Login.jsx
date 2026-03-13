import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

function Login() {
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { quickDevLogin } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')

        if (!phone || !/^\d{10}$/.test(phone)) {
            setError('Please enter a valid 10-digit phone number')
            return
        }

        setLoading(true)
        // Simulate OTP sending
        setTimeout(() => {
            setLoading(false)
            alert('OTP feature coming soon! Use Quick Dev Login for now.')
        }, 1000)
    }

    const handleQuickLogin = () => {
        setLoading(true)
        setTimeout(() => {
            quickDevLogin()
            navigate('/dashboard')
        }, 300)
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <img
                        src="https://img.icons8.com/ios-filled/50/07464c/link--v1.png"
                        alt="Logo"
                    />
                    <h1>SahayaChain</h1>
                </div>

                <h2>Welcome Back</h2>
                <p className="subtitle">Sign in to continue to your account</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <div className="input-group">
                            <span className="input-prefix">+91</span>
                            <input
                                type="tel"
                                id="phone"
                                placeholder="10-digit phone number"
                                maxLength="10"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : 'Send OTP'}
                    </button>
                </form>

                <button onClick={handleQuickLogin} className="btn-quick" disabled={loading}>
                    {loading ? <><i className="fas fa-spinner fa-spin"></i> Logging in...</> : 'Quick Dev Login'}
                </button>

                <p className="login-footer">
                    New to SahayaChain? <a href="#signup">Create an account</a>
                </p>
            </div>
        </div>
    )
}

export default Login
