import './About.css'

function About() {
    return (
        <div className="about-page">
            <section className="about-hero">
                <h1>About SahayaChain</h1>
                <p>Empowering communities through trust-based financial inclusion</p>
            </section>

            <section className="about-content">
                <div className="about-section">
                    <h2>Our Mission</h2>
                    <p>
                        SahayaChain is a peer-to-peer lending platform designed to provide financial
                        access to low-income communities in India. We believe that everyone deserves
                        access to fair and affordable financial services, regardless of their economic
                        background or location.
                    </p>
                </div>

                <div className="about-section">
                    <h2>How We're Different</h2>
                    <div className="diff-grid">
                        <div className="diff-card">
                            <i className="fas fa-users"></i>
                            <h3>Community-Based</h3>
                            <p>Loans are funded and monitored by community members who know borrowers personally.</p>
                        </div>
                        <div className="diff-card">
                            <i className="fas fa-shield-alt"></i>
                            <h3>Trust Scores</h3>
                            <p>Our unique trust scoring system rewards responsible borrowing behavior.</p>
                        </div>
                        <div className="diff-card">
                            <i className="fas fa-percentage"></i>
                            <h3>Fair Rates</h3>
                            <p>Interest rates significantly lower than traditional moneylenders.</p>
                        </div>
                    </div>
                </div>

                <div className="about-section">
                    <h2>Our Impact</h2>
                    <div className="impact-stats">
                        <div className="impact-stat">
                            <h3>50,000+</h3>
                            <p>Loans Funded</p>
                        </div>
                        <div className="impact-stat">
                            <h3>₹500Cr+</h3>
                            <p>Total Disbursed</p>
                        </div>
                        <div className="impact-stat">
                            <h3>1,200+</h3>
                            <p>Communities</p>
                        </div>
                        <div className="impact-stat">
                            <h3>98%</h3>
                            <p>Repayment Rate</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default About
