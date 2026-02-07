# Quick Start: Testing the Fixed Backend

## Prerequisites

```bash
# Terminal 1: Start PostgreSQL + Backend
docker compose up

# Wait for services to be ready (~10 seconds)
```

## Test Endpoints

### 1. Health Check
```bash
curl http://localhost:8080/health
```

✅ Expected: `{"status":"ok"}`

---

### 2. User Registration (SignUp)

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "StrongPassword123",
    "displayName": "Alice Johnson"
  }'
```

✅ Expected: Returns JWT token and user object
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "displayName": "Alice Johnson",
    "tier": "free",
    "createdAt": "2026-02-07T...",
    "updatedAt": "2026-02-07T..."
  }
}
```

**Save the token for next tests!**

---

### 3. User Login (SignIn)

```bash
curl -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "StrongPassword123"
  }'
```

✅ Expected: Returns JWT token and user object

---

### 4. Get Current User (Protected)

Replace `YOUR_TOKEN_HERE` with the token from step 2 or 3:

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

✅ Expected: Returns user object
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@example.com",
  "displayName": "Alice Johnson",
  "tier": "free",
  "createdAt": "2026-02-07T...",
  "updatedAt": "2026-02-07T..."
}
```

---

### 5. Test Token Validation (Invalid Token)

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer invalid.token.here"
```

❌ Expected: `401 Unauthorized` with error: `invalid token`

---

### 6. Test Missing Auth Header

```bash
curl -X GET http://localhost:8080/api/auth/me
```

❌ Expected: `401 Unauthorized` with error: `missing authorization header`

---

### 7. Test Duplicate Email

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "AnotherPassword123",
    "displayName": "Another Alice"
  }'
```

❌ Expected: `409 Conflict` with error: `user already exists`

---

### 8. Test Invalid Password

```bash
curl -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "WrongPassword123"
  }'
```

❌ Expected: `401 Unauthorized` with error: `invalid credentials`

---

### 9. Test Short Password

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "password": "short",
    "displayName": "Bob"
  }'
```

❌ Expected: `400 Bad Request` - password must be min 8 chars

---

## Database Verification

Connect to PostgreSQL directly:

```bash
# From host machine
psql -h localhost -U postgres -d gas_peep

# List tables
\dt

# Check users table
SELECT id, email, display_name, tier, created_at FROM users;

# Check fuel types
SELECT name, display_name, color_code FROM fuel_types ORDER BY display_order;
```

---

## Frontend Testing

After backend is running:

```bash
# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

Navigate to `http://localhost:3000`

- ✅ Unauthenticated users redirected to `/signin`
- ✅ After login, can access `/` (map), `/submit`, `/alerts`
- ✅ Logout clears token and redirects to signin
- ✅ Refresh page maintains auth state (loads from localStorage)

---

## Troubleshooting

### Backend won't start
- Check Docker: `docker compose ps`
- Check DB connection: `docker compose logs postgres`
- Check migrations: Look for "Migration applied" in logs

### Migrations didn't run
- Check migrations directory exists: `backend/internal/migrations/`
- Check file permissions: `ls -la backend/internal/migrations/`

### Invalid token errors
- JWT_SECRET mismatch? Check `backend/.env`
- Token expired? Default is 24 hours from creation
- Bearer format? Must be: `Authorization: Bearer <token>`

### Frontend still redirects to signin
- Check token stored in localStorage: Open DevTools → Application → Storage
- Check API proxy: `http://localhost:8080/api` should be reachable
- Check Vite proxy in `frontend/vite.config.ts`

---

## Expected Server Startup Output

```
✓ Database connected
✓ Migration applied: 001_create_users_table.up.sql
✓ Migration applied: 002_create_stations_table.up.sql
✓ Migration applied: 003_create_fuel_types_table.up.sql
✓ Migration applied: 004_create_fuel_prices_table.up.sql
✓ Migration applied: 005_create_price_submissions_table.up.sql
✓ Migration applied: 006_create_alerts_table.up.sql
✓ Migration applied: 007_create_notifications_table.up.sql
✓ Migration applied: 008_create_station_owners_table.up.sql
✓ Migration applied: 009_create_broadcasts_table.up.sql
✓ Migrations completed
Starting server on port 8080
```

---

**Happy testing!** 🚀
