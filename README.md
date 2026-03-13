# Community Finance Platform

A community-based finance platform that enables P2P lending within verified communities, built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **User Authentication**: Secure registration and login with JWT, email, and phone (OTP) verification.
- **Community Management**: Create, join, and manage community-based lending groups.
- **Loan System**: Request, approve, fund, and track loans within communities.
- **Financial Assistant**: AI-powered chatbot to provide financial guidance and assistance.
- **Real-time Communication**: Community chat and notifications using Socket.io.
- **User Verification**: KYC verification system using Aadhar and PAN card.
- **Dashboard & Analytics**: Track loans, payments, and community metrics.

## Tech Stack

### Backend
- **Node.js & Express**: Server framework
- **MongoDB & Mongoose**: Database and ODM
- **Socket.io**: Real-time communication
- **JWT**: Authentication and authorization
- **bcryptjs**: Password hashing

### Frontend
- **React.js**: UI framework
- **Redux Toolkit**: State management
- **Material-UI**: Component library
- **React Router**: Navigation
- **Axios**: API requests
- **Socket.io-client**: Real-time communication

## Installation & Setup

### Prerequisites
- Node.js (v14 or later)
- MongoDB
- npm or yarn

### Backend Setup
1. Clone the repository
   ```
   git clone https://github.com/yourusername/community-finance.git
   cd community-finance
   ```

2. Install dependencies
   ```
   cd backend
   npm install
   ```

3. Create config file
   Create a `config.env` file in the `backend/config` directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/community_finance
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   GEOCODER_PROVIDER=mapquest
   GEOCODER_API_KEY=your_mapquest_api_key_here
   FILE_UPLOAD_PATH=./public/uploads
   MAX_FILE_UPLOAD=1000000
   ```

4. Start the server
   ```
   npm run dev
   ```

### Frontend Setup
1. Install dependencies
   ```
   cd frontend
   npm install
   ```

2. Start the client
   ```
   npm start
   ```

## API Documentation

### Authentication Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/send-otp` - Send OTP for phone verification
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password
- `POST /api/auth/forgotpassword` - Send password reset email
- `PUT /api/auth/resetpassword/:resettoken` - Reset password

### User Routes
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get single user (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `POST /api/users/verify` - Upload verification documents
- `PUT /api/users/:id/verify` - Process user verification (admin only)

### Community Routes
- `GET /api/communities` - Get all communities
- `GET /api/communities/nearby` - Get nearby communities
- `GET /api/communities/:id` - Get single community
- `POST /api/communities` - Create new community
- `PUT /api/communities/:id` - Update community
- `DELETE /api/communities/:id` - Delete community
- `POST /api/communities/:id/join` - Request to join community
- `PUT /api/communities/:id/requests/:requestId` - Process join request
- `DELETE /api/communities/:id/leave` - Leave community
- `PUT /api/communities/:id/members/:userId` - Update member role
- `DELETE /api/communities/:id/members/:userId` - Remove member
- `POST /api/communities/:id/announcements` - Create announcement
- `GET /api/communities/:communityId/members` - Get community members
- `GET /api/communities/:communityId/loans` - Get community loans
- `POST /api/communities/:communityId/loans` - Create loan request

### Loan Routes
- `GET /api/loans` - Get all loans
- `GET /api/loans/:id` - Get single loan
- `PUT /api/loans/:id` - Update loan
- `PUT /api/loans/:id/process` - Process loan (approve, reject, fund, etc.)
- `POST /api/loans/:id/payments` - Record loan payment
- `GET /api/users/:userId/loans` - Get user's loans

### Chatbot Routes
- `POST /api/chatbot/message` - Process chatbot message
- `GET /api/chatbot/suggestions` - Get suggested questions

## Socket.io Events

### Community Chat
- `joinCommunity` - Join a community chat room
- `leaveCommunity` - Leave a community chat room
- `sendMessage` - Send a chat message
- `message` - Receive a chat message

### Chatbot
- `chatbotMessage` - Send a message to the chatbot
- `chatbotResponse` - Receive a response from the chatbot

## License

MIT License 