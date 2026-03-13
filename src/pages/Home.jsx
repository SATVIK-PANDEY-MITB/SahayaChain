import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

function Home() {
    const { user } = useAuth()

    const features = [
        { icon: 'fas fa-shield-alt', title: 'Trust-Based', desc: 'Verified communities ensure borrower credibility through social trust.' },
        { icon: 'fas fa-exchange-alt', title: 'Transparent', desc: 'All transactions are recorded and visible to community members.' },
        { icon: 'fas fa-coins', title: 'Affordable', desc: 'Lower interest rates than traditional lenders and microfinance institutions.' },
        { icon: 'fas fa-lock', title: 'Secure', desc: 'Enterprise-grade security protects your data and financial information.' }
    ]

    const steps = [
        { icon: 'fas fa-users', title: 'Join a Community', desc: 'Connect with verified communities in your area or create your own.' },
        { icon: 'fas fa-user-check', title: 'Get Verified', desc: 'Complete your profile and verification process to build trust.' },
        { icon: 'fas fa-hand-holding-usd', title: 'Request a Loan', desc: 'Submit your loan proposal for community members to fund.' },
        { icon: 'fas fa-receipt', title: 'Repay on Schedule', desc: 'Build your credit score by making timely repayments.' }
    ]

    const testimonials = [
        { name: 'Malhar Sharma', role: 'Small Business Owner, Delhi', text: 'I was able to expand my small grocery store with a community loan. The process was simple, and the terms were better than any bank offered.' },
        { name: 'Satvik Patel', role: 'Farmer, Gujarat', text: 'Our farming collective used SahayaChain to access funds for new equipment. The entire community benefited from increased crop yields.' },
        { name: 'Anchit Verma', role: 'Investor, Mumbai', text: "As a lender, I've helped fund 15 small businesses in my community while earning consistent returns on my investment." }
    ]

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content animate">
                    <h1>Community-Based Finance</h1>
                    <p>
                        SahayaChain enables trusted P2P lending within verified communities,
                        providing financial access where traditional banking falls short.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/communities" className="btn btn-primary">Find Communities</Link>
                        <Link to="/about" className="btn btn-secondary">Learn More</Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="features-grid">
                    {features.map((feature, idx) => (
                        <div key={idx} className="feature-card">
                            <i className={feature.icon}></i>
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Quick Access (only for logged in users) */}
            {user && (
                <section className="quick-access section">
                    <h2>Quick Access</h2>
                    <div className="quick-buttons">
                        <Link to="/dashboard" className="quick-btn">
                            <i className="fas fa-tachometer-alt"></i>
                            <span>My Dashboard</span>
                        </Link>
                        <Link to="/communities" className="quick-btn">
                            <i className="fas fa-users"></i>
                            <span>Communities</span>
                        </Link>
                    </div>
                </section>
            )}

            {/* How It Works */}
            <section className="how-it-works section">
                <div className="section-title">
                    <h2>How It Works</h2>
                    <p>Our simple process makes community lending accessible to everyone</p>
                </div>
                <div className="steps-grid">
                    {steps.map((step, idx) => (
                        <div key={idx} className="step-card">
                            <i className={step.icon}></i>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials section">
                <div className="section-title">
                    <h2>Success Stories</h2>
                    <p>See how SahayaChain has transformed lives across India</p>
                </div>
                <div className="testimonials-grid">
                    {testimonials.map((t, idx) => (
                        <div key={idx} className="testimonial-card">
                            <div className="avatar">{t.name.charAt(0)}</div>
                            <p className="quote">"{t.text}"</p>
                            <h4>{t.name}</h4>
                            <span>{t.role}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default Home
