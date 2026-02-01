# API Contracts - Smart Expense Tracker

This document defines the REST API endpoints for the Smart Expense Tracker backend.

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.smartexpense.com/api
```

## Authentication

All protected endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Auth Routes (`/api/auth`)

### POST `/auth/register`
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "phone": "9876543210"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

---

### POST `/auth/login`
Authenticate user and get token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

---

### POST `/auth/logout`
Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST `/auth/forgot-password`
Request password reset.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Reset link sent to email"
}
```

---

## 💳 Transactions Routes (`/api/transactions`)

### GET `/transactions`
Get all transactions for authenticated user.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| type | string | Filter: 'income' or 'expense' |
| category | string | Filter by category ID |
| startDate | date | Start date (YYYY-MM-DD) |
| endDate | date | End date (YYYY-MM-DD) |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "txn-001",
      "type": "expense",
      "amount": 1500.00,
      "category": "Food & Dining",
      "subcategory": "Restaurants",
      "description": "Lunch at cafe",
      "date": "2026-01-31",
      "created_at": "2026-01-31T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### POST `/transactions`
Create a new transaction.

**Request:**
```json
{
  "type": "expense",
  "amount": 1500.00,
  "category_id": "cat-001",
  "subcategory": "Restaurants",
  "description": "Lunch at cafe",
  "date": "2026-01-31",
  "note": "Optional note",
  "payment_method": "UPI"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "txn-new-uuid",
    "type": "expense",
    "amount": 1500.00
  }
}
```

---

### PUT `/transactions/:id`
Update a transaction.

**Request:**
```json
{
  "amount": 1800.00,
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### DELETE `/transactions/:id`
Delete a transaction.

**Response (200):**
```json
{
  "success": true,
  "message": "Transaction deleted"
}
```

---

## 📁 Categories Routes (`/api/categories`)

### GET `/categories`
Get all categories.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| type | string | Filter: 'income' or 'expense' |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-001",
      "name": "Food & Dining",
      "type": "expense",
      "icon": "🍽️",
      "color": "#FF6B6B",
      "subcategories": [
        { "id": "sub-001", "name": "Groceries" },
        { "id": "sub-002", "name": "Restaurants" }
      ]
    }
  ]
}
```

---

### POST `/categories`
Create custom category.

**Request:**
```json
{
  "name": "My Category",
  "type": "expense",
  "icon": "🎯",
  "color": "#FF5733"
}
```

---

## 💰 Budgets Routes (`/api/budgets`)

### GET `/budgets`
Get budgets for current month.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| month | number | Month (1-12) |
| year | number | Year (e.g., 2026) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "budget-001",
      "category": "Food & Dining",
      "budget_amount": 10000.00,
      "spent_amount": 7500.00,
      "remaining": 2500.00,
      "percentage": 75
    }
  ]
}
```

---

### POST `/budgets`
Create or update budget.

**Request:**
```json
{
  "category_id": "cat-001",
  "amount": 10000.00,
  "month": 1,
  "year": 2026,
  "alert_threshold": 80
}
```

---

## 📊 Analytics Routes (`/api/analytics`)

### GET `/analytics/summary`
Get monthly summary.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| month | number | Month (1-12) |
| year | number | Year |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_income": 80000.00,
    "total_expense": 55000.00,
    "total_investment": 15000.00,
    "balance": 10000.00,
    "savings_rate": 12.5
  }
}
```

---

### GET `/analytics/category-wise`
Get category-wise breakdown.

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "category": "Food & Dining", "amount": 8000, "percentage": 14.5 },
    { "category": "Transport", "amount": 5000, "percentage": 9.1 }
  ]
}
```

---

### GET `/analytics/trends`
Get spending trends over time.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| period | string | 'weekly', 'monthly', 'yearly' |
| months | number | Number of months (default: 6) |

---

## 💎 Net Worth Routes (`/api/networth`)

### GET `/networth`
Get current net worth.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_assets": 500000.00,
    "total_liabilities": 150000.00,
    "net_worth": 350000.00,
    "assets": [
      { "name": "Savings Account", "value": 200000 },
      { "name": "Investments", "value": 300000 }
    ],
    "liabilities": [
      { "name": "Education Loan", "value": 150000 }
    ]
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input |
| UNAUTHORIZED | 401 | Missing/invalid token |
| FORBIDDEN | 403 | Access denied |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Duplicate resource |
| SERVER_ERROR | 500 | Internal error |
