import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-col">
                    <h3>SahayaChain</h3>
                    <p>
                        Connecting communities through trust and technology.
                        Together, we lend, borrow, and build a sustainable financial future.
                    </p>
                </div>

                <div className="footer-col">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/about">About</Link></li>
                        <li><Link to="/communities">Communities</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h3>Services</h3>
                    <ul>
                        <li><Link to="/login">Sign In</Link></li>
                        <li><Link to="/dashboard">Dashboard</Link></li>
                        <li><Link to="/communities">Find Communities</Link></li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h3>Contact Us</h3>
                    <ul>
                        <li><i className="fas fa-map-marker-alt"></i> 123 Finance St, Mumbai</li>
                        <li><i className="fas fa-phone"></i> +91 (234) 567-8900</li>
                        <li><i className="fas fa-envelope"></i> info@sahayachain.com</li>
                    </ul>
                </div>
            </div>

            <div className="copyright">
                <p>&copy; 2024 SahayaChain. All Rights Reserved.</p>
            </div>
        </footer>
    )
}

export default Footer
