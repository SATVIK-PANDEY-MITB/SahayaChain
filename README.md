# SahayaChain

SahayaChain is a community-finance prototype for organizing community membership and peer-to-peer loan workflows. It contains a React single-page application and an Express/MongoDB API with user, community, loan, and chatbot route modules.

> **Project status:** The API and data models demonstrate core workflows, but the browser UI is not yet integrated end-to-end with those APIs. Several screens use hard-coded demonstration data. This repository should be treated as a development prototype, not a production lending, identity-verification, or payment service.

## Project At A Glance

| Measure | Current repository |
| --- | --- |
| Frontend routes | 6 |
| Backend route modules | 5 |
| Declared Express route handlers | 41 |
| Mongoose domain models | 3 |
| Development frontend port | 3000 |
| Development API port | 5000 |
| Automated test suites | 0 configured |

Route-handler count is based on the route declarations in `backend/routes/`; some routers are mounted more than once for nested resources.

## Implemented Scope

### Backend capabilities

- JWT bearer-token registration and login, role checks, profile updates, and password hashing with bcrypt.
- OTP and password-reset endpoints. These currently provide development/demo behavior; they are not connected to an SMS or email provider.
- Community discovery, search, pagination, membership requests, role fields, announcements, and geospatial indexes in the MongoDB schema.
- Loan request, approval/rejection, payment, and status workflow handlers, with loan and payment schedule fields in the schema.
- A rule-based financial FAQ endpoint with suggestions personalized from the signed-in user's stored profile.
- Socket.IO community rooms and message broadcasting.

### Frontend screens

The React app declares `/`, `/login`, `/dashboard`, `/communities`, `/about`, and `/contact`. Login currently uses a mock Quick Dev Login; phone OTP is simulated. The community cards, dashboard metrics, and recent activity are static sample content rather than API responses.

## Technology

| Layer | Technologies |
| --- | --- |
| Client | React 19, Vite 7, React Router 7, Axios |
| API | Node.js, Express 4, Mongoose 6, MongoDB |
| Authentication | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| Realtime | Socket.IO 4 on the Node HTTP server |
| Middleware | CORS, Morgan, dotenv |

The repository does not currently use Redux Toolkit, Material UI, `socket.io-client`, or a hosted AI model. The chatbot implementation is rule-based.

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

Loan schema constraints include a minimum principal of **₹1,000**, a maximum interest rate of **30%**, and a term of **1–60 months**. The default interest rate is **10%** and default term is **12 months**. The schedule helper calculates equal monthly installments using the standard amortization formula; it does not represent an external payment transaction.

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

The API listens at `http://localhost:5000`. If MongoDB is unavailable, the server logs a warning and still starts, but database-backed endpoints will not work.

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

The backend's production static-file configuration points to `backend/client/build`, while Vite emits its build to the root `dist/` directory by default. Configure static hosting or align these paths before using that backend production fallback.

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

**Current limitations:** community chat messages are broadcast in memory and are not persisted; socket connections do not currently authenticate or authorize community membership. Do not use this transport for sensitive production communication without adding those controls.

## Development Notes And Limitations

- The OTP handler returns the OTP in development and does not send an SMS. Password reset returns a reset URL rather than sending email.
- The chatbot uses keyword/rule matching and has no LLM or external AI integration.
- `contractHash` and `contractAddress` are model fields only. There is no blockchain client, smart contract, or on-chain transaction flow in this repository.
- Verification/document fields exist in the API and schema, but there is no connected KYC provider in this project.
- Dashboard values, community examples, and recent activity in the frontend are static. The login page's Quick Dev Login stores a mock token locally and is not API authentication.
- There is no configured automated test suite. The backend `test` script is a placeholder that exits with an error.
- Configure a real production CORS origin, secure secrets, database access controls, rate limiting, request validation, and authenticated socket handling before deployment.

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

The root frontend package declares the ISC license, while the backend package declares MIT. Confirm the intended project-wide license before redistributing the combined repository.