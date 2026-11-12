# Stitch & Style Co. Backend

A production-ready Node.js/Express backend for the Stitch & Style Co. luxury e-commerce platform.

## Tech Stack

- **Node.js** & **Express.js** - Web framework
- **MongoDB** & **Mongoose** - Database & ODM
- **JWT** - Authentication
- **Stripe** - Payments
- **Zod** - Validation
- **Docker** - Containerization
- **GitHub Actions** - CI/CD

## Features

### Database Models
- Users (with hashed passwords & roles)
- Products (with variants & category references)
- Categories (with nested parent categories)
- Cart (session-based or user-linked)
- Orders (with product snapshots & Stripe integration)
- Reviews
- Wishlist
- Coupons (percentage/fixed discounts)

### REST API Endpoints
- **Auth**: `/register`, `/login`, `/me` (JWT authentication)
- **Products**: Full CRUD with pagination, filtering & sorting
- **Cart & Wishlist**: Complete management
- **Checkout & Payments**: Stripe payment intents & webhooks
- **Admin Analytics**: MongoDB aggregation pipelines for sales/orders/low-stock alerts

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Copy `.env` and fill in your secrets:
   ```
   NODE_ENV=development
   PORT=5002
   MONGO_URI=mongodb+srv://<user>:<pass>@cluster0...
   JWT_SECRET=your-secret-key
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## Project Structure

```
Stitch & Style Co/
├── config/           # Database config
├── controllers/      # Route handlers
├── middleware/       # Auth, validation, error handling
├── models/           # Mongoose schemas
├── routes/           # Express routes
├── utils/            # JWT helpers
├── .github/
│   └── workflows/    # CI/CD
├── Dockerfile
└── server.js
```

## Deployment

Optimized for free hosting platforms:
- **MongoDB**: MongoDB Atlas (free tier)
- **Backend**: Render, Railway, or similar
