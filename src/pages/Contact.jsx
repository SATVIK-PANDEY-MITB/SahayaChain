import { useState } from 'react'
import './Contact.css'

function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        alert('Thank you for your message! We will get back to you soon.')
        setFormData({ name: '', email: '', subject: '', message: '' })
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <div className="contact-page">
            <section className="contact-hero">
                <h1>Contact Us</h1>
                <p>Have questions? We'd love to hear from you.</p>
            </section>

            <div className="contact-container">
                <div className="contact-info">
                    <h2>Get in Touch</h2>
                    <div className="info-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <div>
                            <h4>Address</h4>
                            <p>123 Finance Street, Mumbai, Maharashtra 400001</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <i className="fas fa-phone"></i>
                        <div>
                            <h4>Phone</h4>
                            <p>+91 (234) 567-8900</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <i className="fas fa-envelope"></i>
                        <div>
                            <h4>Email</h4>
                            <p>info@sahayachain.com</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <i className="fas fa-clock"></i>
                        <div>
                            <h4>Business Hours</h4>
                            <p>Mon - Fri: 9:00 AM - 6:00 PM</p>
                        </div>
                    </div>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <h2>Send us a Message</h2>
                    <div className="form-group">
                        <input
                            type="text"
                            name="name"
                            placeholder="Your Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Your Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="text"
                            name="subject"
                            placeholder="Subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <textarea
                            name="message"
                            placeholder="Your Message"
                            rows="5"
                            value={formData.message}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    )
}

export default Contact
