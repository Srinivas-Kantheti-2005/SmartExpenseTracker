# Database Schema - Smart Expense Tracker

This document defines the database schema for the Smart Expense Tracker application.

## Tables

### 1. Users

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email (login) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `name` | VARCHAR(100) | NOT NULL | Full name |
| `phone` | VARCHAR(15) | NULL | Phone number |
| `avatar_url` | VARCHAR(500) | NULL | Profile picture URL |
| `is_active` | BOOLEAN | DEFAULT true | Account status |
| `is_verified` | BOOLEAN | DEFAULT false | Email verified |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Registration date |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |
| `last_login` | TIMESTAMP | NULL | Last login time |

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
```

---

### 2. User Settings

Stores user preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Setting ID |
| `user_id` | UUID | FOREIGN KEY | Reference to user |
| `currency` | VARCHAR(3) | DEFAULT 'INR' | Preferred currency |
| `theme` | VARCHAR(10) | DEFAULT 'light' | UI theme |
| `date_format` | VARCHAR(20) | DEFAULT 'DD/MM/YYYY' | Date display format |
| `notifications_email` | BOOLEAN | DEFAULT true | Email notifications |
| `notifications_budget` | BOOLEAN | DEFAULT true | Budget alerts |
| `notifications_bills` | BOOLEAN | DEFAULT true | Bill reminders |

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(3) DEFAULT 'INR',
    theme VARCHAR(10) DEFAULT 'light',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    notifications_email BOOLEAN DEFAULT true,
    notifications_budget BOOLEAN DEFAULT true,
    notifications_bills BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. Sessions

Stores active user sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Session ID |
| `user_id` | UUID | FOREIGN KEY | Reference to user |
| `token` | VARCHAR(255) | UNIQUE, NOT NULL | Session token |
| `ip_address` | INET | NULL | Client IP |
| `user_agent` | TEXT | NULL | Browser info |
| `expires_at` | TIMESTAMP | NOT NULL | Expiration time |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Session start |

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

---

### 4. Password Reset Tokens

Stores password reset requests.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Token ID |
| `user_id` | UUID | FOREIGN KEY | Reference to user |
| `token` | VARCHAR(255) | UNIQUE, NOT NULL | Reset token |
| `expires_at` | TIMESTAMP | NOT NULL | Token expiration |
| `used_at` | TIMESTAMP | NULL | When token was used |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Request time |

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
```

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐
│     users       │       │  user_settings   │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │───┐   │ id (PK)          │
│ email           │   │   │ user_id (FK)     │──┐
│ password_hash   │   │   │ currency         │  │
│ name            │   │   │ theme            │  │
│ phone           │   │   │ date_format      │  │
│ avatar_url      │   │   │ notifications_*  │  │
│ is_active       │   │   └──────────────────┘  │
│ is_verified     │   │                         │
│ created_at      │   │   ┌──────────────────┐  │
│ updated_at      │   └───│ sessions         │  │
│ last_login      │       ├──────────────────┤  │
└─────────────────┘       │ id (PK)          │  │
         │                │ user_id (FK)     │──┘
         │                │ token            │
         │                │ ip_address       │
         │                │ expires_at       │
         │                └──────────────────┘
         │
         │                ┌──────────────────────┐
         └────────────────│ password_reset_tokens│
                          ├──────────────────────┤
                          │ id (PK)              │
                          │ user_id (FK)         │
                          │ token                │
                          │ expires_at           │
                          │ used_at              │
                          └──────────────────────┘
```

---

## Indexes

| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| users | email | UNIQUE | Fast login lookup |
| sessions | token | INDEX | Session validation |
| sessions | user_id | INDEX | User session lookup |
| password_reset_tokens | token | INDEX | Reset validation |

---

## Security Notes

1. **Password Hashing**: Use bcrypt with cost factor 12+
2. **Session Tokens**: Generate using crypto-secure random
3. **Reset Tokens**: 64-character hex, expire in 1 hour
4. **SQL Injection**: Use parameterized queries
5. **Rate Limiting**: Implement on login/register endpoints
