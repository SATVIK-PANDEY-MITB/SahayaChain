import { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for existing session
        const token = localStorage.getItem('userToken')
        const userData = localStorage.getItem('userData')

        if (token && userData) {
            try {
                setUser(JSON.parse(userData))
            } catch (e) {
                console.error('Error parsing user data:', e)
                localStorage.removeItem('userToken')
                localStorage.removeItem('userData')
            }
        }
        setLoading(false)
    }, [])

    const login = (userData, token) => {
        localStorage.setItem('userToken', token)
        localStorage.setItem('userData', JSON.stringify(userData))
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('userToken')
        localStorage.removeItem('userData')
        setUser(null)
    }

    const quickDevLogin = () => {
        const mockUserData = {
            id: 'test-user-123',
            name: 'Test User',
            email: 'test@example.com',
            phone: '9876543210',
            role: 'borrower',
            verified: true
        }
        login(mockUserData, 'mock-jwt-token-for-testing')
        return mockUserData
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, quickDevLogin }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
