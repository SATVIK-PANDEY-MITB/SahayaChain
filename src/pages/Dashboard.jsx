import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

function Dashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!user) {
            navigate('/login')
        }
    }, [user, navigate])

    if (!user) return null

    const stats = [
        { label: 'Active Loans', value: '2', icon: 'fas fa-file-invoice-dollar', color: '#3be4d1' },
        { label: 'Communities', value: '3', icon: 'fas fa-users', color: '#f7b731' },
        { label: 'Trust Score', value: '85%', icon: 'fas fa-shield-alt', color: '#20bf6b' },
        { label: 'Total Borrowed', value: '₹45,000', icon: 'fas fa-rupee-sign', color: '#eb3b5a' }
    ]

    const recentActivity = [
        { type: 'loan', message: 'Loan application approved - ₹15,000', time: '2 hours ago' },
        { type: 'payment', message: 'EMI payment received - ₹2,500', time: '1 day ago' },
        { type: 'community', message: 'Joined "Mumbai Entrepreneurs" community', time: '3 days ago' }
    ]

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Welcome back, {user.name}!</h1>
                    <p>Here's your financial overview</p>
                </div>
                <button onClick={() => { logout(); navigate('/'); }} className="btn-logout">
                    <i className="fas fa-sign-out-alt"></i> Sign Out
                </button>
            </div>

            <div className="stats-grid">
                {stats.map((stat, idx) => (
                    <div key={idx} className="stat-card" style={{ borderLeftColor: stat.color }}>
                        <i className={stat.icon} style={{ color: stat.color }}></i>
                        <div>
                            <h3>{stat.value}</h3>
                            <p>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card">
                    <h2><i className="fas fa-history"></i> Recent Activity</h2>
                    <ul className="activity-list">
                        {recentActivity.map((activity, idx) => (
                            <li key={idx}>
                                <span className="activity-message">{activity.message}</span>
                                <span className="activity-time">{activity.time}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="dashboard-card">
                    <h2><i className="fas fa-bolt"></i> Quick Actions</h2>
                    <div className="action-buttons">
                        <button className="action-btn">
                            <i className="fas fa-hand-holding-usd"></i> Apply for Loan
                        </button>
                        <button className="action-btn">
                            <i className="fas fa-donate"></i> Lend Money
                        </button>
                        <button className="action-btn">
                            <i className="fas fa-users"></i> Join Community
                        </button>
                        <button className="action-btn">
                            <i className="fas fa-credit-card"></i> Make Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
