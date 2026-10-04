# SahayaChain

SahayaChain is a community-finance platform for organizing trusted communities and peer-to-peer lending workflows. It brings together a React single-page application and an Express/MongoDB API for account, community, loan, and financial-assistant experiences.

## Project At A Glance

| Measure | Project |
| --- | --- |
| Frontend routes | 6 |
| Backend route modules | 5 |
| Declared Express route handlers | 41 |
| Mongoose domain models | 3 |
| Development frontend port | 3000 |
| Development API port | 5000 |

Route-handler count is based on the route declarations in `backend/routes/`; some routers are mounted more than once for nested resources.

## Platform Capabilities

### Backend capabilities

- Account registration and login with JWT bearer tokens, role-based authorization, profile management, bcrypt password hashing, OTP verification, and password recovery workflows.
- Community discovery with search and pagination, membership requests, community roles, announcements, and geospatial location indexing.
- Community-based loan request, review, payment-recording, and status workflows, supported by loan and repayment schedule models.
- A rule-based financial assistant with suggested questions personalized to the signed-in user's profile.
- Realtime community rooms and message broadcasting through Socket.IO.

### Frontend screens

The React app provides six routes: `/`, `/login`, `/dashboard`, `/communities`, `/about`, and `/contact`. The login screen includes a Quick Dev Login for convenient product walkthroughs, while community cards and dashboard activity provide sample content for exploring the experience.

## Technology

| Layer | Technologies |
| --- | --- |
| Client | React 19, Vite 7, React Router 7, Axios |
| API | Node.js, Express 4, Mongoose 6, MongoDB |
| Authentication | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| Realtime | Socket.IO 4 on the Node HTTP server |
| Middleware | CORS, Morgan, dotenv |

The frontend uses React Context for client-side authentication state, and the financial assistant uses a lightweight rule-based response engine.

## Architecture

```text
React SPA (Vite :3000)
       | /api proxy during development
       v
Express API + Socket.IO (:5000)
       |
       v
MongoDB via Mongoose
```

The Vite development server proxies `/api` requests to `http://localhost:5000`. The API is also configured to serve static files from the repository parent directory. Socket.IO is initialized by the backend HTTP server.

### Data model

- **User:** borrower/lender/admin role, unique email and 10-digit phone, password hash, verification status, community and loan references, and a credit score bounded from 300 to 900.
- **Community:** members and roles, join requests, announcements, loan references, settings, metrics, and a GeoJSON `2dsphere` location index.
- **Loan:** borrower, optional lender, community, principal, interest, term, status, repayment schedule, payment records, and optional collateral/guarantor details.

Loan schema constraints include a minimum principal of **₹1,000**, a maximum interest rate of **30%**, and a term of **1–60 months**. The default interest rate is **10%** and default term is **12 months**. The schedule helper calculates equal monthly installments using the standard amortization formula.

## Getting Started

### Prerequisites

- Node.js 20 or later and npm
- MongoDB running locally or a MongoDB connection URI

### 1. Install frontend dependencies

From the repository root:

```bash
npm install
```

### 2. Configure the backend

Create `backend/config/config.env`:

```dotenv
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sahayachain
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=30d
```

`MONGO_URI` and `JWT_SECRET` are required for normal API operation. `PORT` defaults to `5000`; `JWT_EXPIRE` defaults to `30d`. The server loads this file at startup from `backend/config/config.env` when started with `backend` as the working directory.

Install backend dependencies:

```bash
cd backend
npm install
```

### 3. Start the API

In the `backend` directory:

```bash
npm run dev
```

The API listens at `http://localhost:5000` and connects to MongoDB using `MONGO_URI`.

### 4. Start the frontend

Open another terminal at the repository root:

```bash
npm run dev
```

Vite opens the app at `http://localhost:3000` and proxies `/api` calls to the backend.

### Production build

From the repository root:

```bash
npm run build
npm run preview
```

Vite writes the optimized frontend bundle to `dist/`; `npm run preview` serves that build locally for a production-style review.

## API Overview

All API routes are prefixed with `/api`. Protected routes expect:

```http
Authorization: Bearer <jwt>
```

The route modules declare **41 handlers** across five areas. The following are the primary route groups and workflows:

| Prefix | Example operations | Access |
| --- | --- | --- |
| `/api/auth` | `POST /register`, `POST /login`, `POST /send-otp`, `POST /verify-otp`, `GET /me`, `PUT /updatedetails`, `PUT /updatepassword` | Registration/login public; account operations authenticated |
| `/api/users` | `GET /profile`, `PUT /profile`, `POST /verify`; admin user CRUD under `/` and `/:id` | Authenticated; user administration is role-restricted |
| `/api/communities` | `GET /`, `GET /nearby`, `GET /:id`, `POST /`, `POST /:id/join`, `DELETE /:id/leave`, `PUT /:id/requests/:requestId` | Discovery public; changes require authentication and applicable roles |
| `/api/loans` | `GET /`, `GET /:id`, `PUT /:id`, `PUT /:id/process`, `POST /:id/payments` | Authenticated; resource and community-role checks apply |
| `/api/chatbot` | `POST /message`, `GET /suggestions` | Authenticated |

Nested resources are also mounted for community members/loans and user loans. See `backend/server.js` and the files under `backend/routes/` for exact mount paths and route behavior.

## Realtime Events

Socket.IO is served from the backend origin. The server handles `joinCommunity`, `leaveCommunity`, and `sendMessage`; it broadcasts messages as `message` to the `community-<communityId>` room. It also handles `chatbotMessage` and replies with `chatbotResponse`.

## Repository Layout

```text
.
├── backend/
│   ├── config/          # CORS and runtime configuration
│   ├── controllers/     # Request handlers and domain workflows
│   ├── middleware/     # Authentication, roles, and errors
│   ├── models/          # User, community, and loan schemas
│   ├── routes/          # Five Express route modules
│   └── server.js         # Express, Socket.IO, MongoDB startup
├── src/
│   ├── components/      # Shared layout components
│   ├── context/         # Client authentication/demo state
│   └── pages/           # Six routed screens
├── index.html
├── package.json         # Vite frontend scripts and dependencies
└── vite.config.js       # Development server and API proxy
```

## License

The frontend package declares the ISC license. The backend package declares the MIT license.