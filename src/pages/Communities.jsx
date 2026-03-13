import { Link } from 'react-router-dom'
import './Communities.css'

function Communities() {
    const communities = [
        { id: 1, name: 'Mumbai Entrepreneurs', members: 156, loans: 45, rating: 4.8 },
        { id: 2, name: 'Delhi Teachers Network', members: 89, loans: 23, rating: 4.6 },
        { id: 3, name: 'Gujarat Farmers Collective', members: 234, loans: 78, rating: 4.9 },
        { id: 4, name: 'Bangalore Tech Workers', members: 312, loans: 92, rating: 4.7 },
        { id: 5, name: 'Chennai Healthcare Workers', members: 128, loans: 34, rating: 4.5 },
        { id: 6, name: 'Kolkata Artists Guild', members: 67, loans: 12, rating: 4.4 }
    ]

    return (
        <div className="communities-page">
            <div className="communities-header">
                <h1>Find Your Community</h1>
                <p>Join trusted groups for peer-to-peer lending</p>
            </div>

            <div className="communities-grid">
                {communities.map((community) => (
                    <div key={community.id} className="community-card">
                        <div className="community-avatar">
                            {community.name.charAt(0)}
                        </div>
                        <h3>{community.name}</h3>
                        <div className="community-stats">
                            <div>
                                <i className="fas fa-users"></i>
                                <span>{community.members} members</span>
                            </div>
                            <div>
                                <i className="fas fa-handshake"></i>
                                <span>{community.loans} loans</span>
                            </div>
                            <div>
                                <i className="fas fa-star"></i>
                                <span>{community.rating}</span>
                            </div>
                        </div>
                        <button className="btn-join">Join Community</button>
                    </div>
                ))}
            </div>

            <div className="create-community">
                <h2>Can't find your community?</h2>
                <p>Start your own lending circle with people you trust</p>
                <button className="btn btn-primary">Create Community</button>
            </div>
        </div>
    )
}

export default Communities
