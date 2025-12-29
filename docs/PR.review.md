# Section 1: Code Review

## Summary

The current implementation of the authentication endpoints (“/login” and “/invite”) contains several critical security vulnerabilities and architectural limitations that must be addressed before merging or deploying to production. The primary concerns are SQL injection risks, insecure password storage and hashing, and non-scalable session management.

### 1. Critical Security Issues

##### SQL Injection Vulnerability (Lines 16-17 and 31-32)

The code uses JavaScript template literals to insert user input (${email}, (${hash}) directly into the SQL query string and this allows attackers to manipulate queries ( for example bypassing login checks).

##### Fix:

Use parameterized queries provided by the “pg” library ($1, $2) to separate data (user input )from the query structure.

##### Weak Password Hashing (MD5) Lines 16 and 30

MD5 is cryptographically broken and prone to collision attacks. It is also too fast, allowing for efficient brute-force attacks.

##### Fix:

Use a secure, slow hashing algorithm like bcrypt.

##### Insecure Randomness Line 28

Math.random() is not cryptographically secure due to predictable values. Using it for password generation is a security risk

##### Fix:

using libraries like uuid or nanoid for generating secure secrets.

##### Sensitive Data Exposure Line33

he password is returned in the API response body. This increases the risk of credential leakage via logs or network interception

##### Fix:

Do not return passwords. Send them via a side channel (email/SMS) and return a success status only.

## 2. Architecture & Scalability Concerns

##### Stateful Sessions in Global Scope Line 20-21

Storing sessions in (global as any) can cause a memory leak (sessions are never cleared) and prevents horizontal scaling.

##### Fix:

Use a stateless authentication mechanism like (JWT) JSON Web Tokens or an external session store like Redis.

##### Hardcoded Privileges

The /invite endpoint hardcodes the role to “admin”. all invited users are hardcoded as admin

#### Fix:

The role should be passed in the request body (and validated) or defaulted to a safer role like “user”.

## 3.TypeScript & Code Quality

##### Lack of Input Validation

is accessed directly without validation and this can lead to runtime errors or invalid data entering the database.

##### Fix:

Use a schema validation library (Zod) to validate email formats and request bodies.

##### Type Safety Bypass

Using “global as any” disables type checking and is considered a bad practice and defeats the purpose of using TypeScript.

## 4. Suggested Diffs

### Architecture Changes

The old code had everything in one file. The new implementation separates code into layers:

- Routes: defines API endpoints
- Controllers: handles HTTP requests and responses
- Services: contains business logic like authentication and password hashing
- Repositories: handles database queries
- Schemas: validates incoming data
- Middlewares: handles JWT authentication

### SQL Injection Fix

Old code used string templates to build queries:

```typescript
const sql = `SELECT * FROM users WHERE email='${email}' AND password='${hash}'`;
```

New code uses parameterized queries:

```typescript
const result = await pool.query('SELECT id, email, password, role FROM users WHERE email = $1', [
  email,
]);
```

The $1 placeholder prevents SQL injection by separating data from query structure.

### Password Hashing Fix

Old code used MD5:

```typescript
const hash = crypto.createHash('md5').update(password).digest('hex');
```

New code uses bcrypt with salt:

```typescript
const hashedPassword = await bcrypt.hash(tempPassword, 10);
// Verification
const isValid = await bcrypt.compare(password, user.password);
```

Bcrypt is slower and uses salts which makes brute-force attacks much harder.

### Session Management Fix

Old code stored sessions in global memory:

```typescript
const token = Buffer.from(email + ':' + Date.now()).toString('base64');
(global as any).SESSIONS = (global as any).SESSIONS || {};
(global as any).SESSIONS[token] = { email };
```

New code uses JWT tokens:

```typescript
const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
  expiresIn: '8h',
});
```

JWT tokens are stateless, signed, and include expiration. This prevents memory leaks and allows horizontal scaling.

### Random Password Generation Fix

Old code used Math.random():

```typescript
const pw = Math.random().toString(36).slice(2);
```

New code uses crypto.randomBytes():

```typescript
const tempPassword = crypto.randomBytes(10).toString('hex');
```

Math.random() is predictable. crypto.randomBytes() is cryptographically secure.

### Input Validation Fix

Old code had no validation:

```typescript
const { email, password } = req.body;
```

New code uses Zod schemas:

```typescript
export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const { email, password } = LoginSchema.parse(req).body;
```

This validates email format and required fields before processing.

### Role Assignment Fix

Old code hardcoded all users as admin:

```typescript
VALUES('${req.body.email}', '${hash}', 'admin');
```

New code validates role and defaults to user:

```typescript
export const InviteSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    role: z.enum(['admin', 'doctor', 'user']).default('user'),
  }),
});
```

This follows principle of least privilege.

### Authentication Middleware

New implementation includes JWT verification middleware:

```typescript
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};
```

This protects routes by verifying JWT signatures and checking expiration.

### Error Handling

Old code had no error handling. New code uses try-catch blocks:

```typescript
try {
  const { email, password } = LoginSchema.parse(req).body;
  const result = await UserService.authenticateUser(email, password);
  // ...
} catch (err) {
  res.status(400).json({ error: 'Invalid request data' });
}
```

This prevents crashes from unexpected errors.

### TypeScript Improvements

Old code used type bypasses:

```typescript
(global as any).SESSIONS;
```

New code uses proper interfaces:

```typescript
interface User {
  id: number;
  email: string;
  password: string;
  role: string;
}

interface AuthResult {
  token: string;
}
```

This enables compile-time type checking.

## 5. Additional Configuration

Added tsconfig.json for TypeScript compilation settings.

Added .env.example for environment configuration:

```
PORT=3000
JWT_SECRET=your_secure_jwt_secret_key_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=your_database_password
```

Added database.sql with table schema:

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Added npm scripts to package.json:

- npm run build: compiles TypeScript
- npm run dev: builds and runs the application
- npm start: runs compiled code

## 6. Summary

All security vulnerabilities have been fixed:

- SQL injection prevented with parameterized queries
- Weak MD5 replaced with bcrypt
- Insecure Math.random() replaced with crypto.randomBytes()
- Global sessions replaced with JWT tokens
- Added input validation with Zod
- Fixed hardcoded admin role
- Added proper error handling
- Removed type safety bypasses
- Separated code into proper layers
