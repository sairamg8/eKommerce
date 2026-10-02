# Refresh Token Rotation Guide & Architecture — eKommerce

A step-by-step architectural and implementation guide for the refresh token rotation system in `ek-backend`.

---

## 1. Overview & Threat Model

### Why Refresh Tokens?
* **Access Tokens:** Short-lived (15 minutes), stateless JWTs sent with every API request. If intercepted, the exposure window is narrow.
* **Refresh Tokens:** Long-lived (24 hours to 7 days), stateful credentials used exclusively to request a new access token when the current one expires.

### Why Token Rotation?
Without rotation, a compromised refresh token remains valid until expiration. With **Refresh Token Rotation (RTR)**:
1. Every time a refresh token is used, it is **immediately invalidated (revoked)**.
2. A **brand-new refresh token** is issued alongside the new access token.
3. If an attacker steals a token and uses it, or if the legitimate client tries to use an already-rotated token, **Token Reuse Detection** triggers an automatic security lockdown that invalidates all active sessions for that user.

---

## 2. Architecture & Data Flow

```
Client                             Server (`ek-backend`)                    PostgreSQL (`app.refresh_tokens`)
  |                                        |                                               |
  |--- 1. POST /user/refresh ------------->|                                               |
  |    { refresh_token: "..." }            |--- 2. verify_token(token, 'refresh') -------->|
  |                                        |                                               |
  |                                        |--- 3. Lookup token by payload.id ------------>|
  |                                        |<-- Return record (or null) -------------------|
  |                                        |                                               |
  |                                        |--- [Check 1]: Record exists?                  |
  |                                        |    No -> 401 Unauthorized                     |
  |                                        |                                               |
  |                                        |--- [Check 2]: Is revoked_at != null?          |
  |                                        |    Yes -> ALARM: TOKEN REUSE DETECTED!        |
  |                                        |           Revoke ALL active user tokens ----->|
  |                                        |           Return 403 Forbidden                |
  |                                        |                                               |
  |                                        |--- [Check 3]: Is expires_at < now()?          |
  |                                        |    Yes -> 401 Expired                         |
  |                                        |                                               |
  |                                        |--- [Check 4]: decrypt_hash matches?           |
  |                                        |    No -> 401 Invalid Token                    |
  |                                        |                                               |
  |                                        |--- 4. Issue new Access + Refresh Token pair   |
  |                                        |--- 5. Hash new refresh token                  |
  |                                        |                                               |
  |                                        |--- 6. Invalidate old token (set revoked_at) ->|
  |                                        |--- 7. Insert new token record --------------->|
  |                                        |                                               |
  |<-- 8. Return { access_token, ----------|                                               |
  |               refresh_token }          |                                               |
```

---

## 3. Database Schema (`app.refresh_tokens`)

The existing migration (`002_refresh_tokens.sql`) already defines:

| Column | Type | Purpose |
|:---|:---|:---|
| `id` | `uuid` | Primary Key. Corresponds to `payload.id` inside the JWT. |
| `user_id` | `uuid` | FK to `app.users(id)`. |
| `token_hash` | `text` | Bcrypt hash of the refresh token string. |
| `expires_at` | `timestamptz` | Hard expiration boundary (24 hours). |
| `revoked_at` | `timestamptz` | Timestamp when replaced or manually logged out. |
| `replaced_by_id`| `uuid` | FK to the new `app.refresh_tokens(id)` issued during rotation. |
| `ip` | `inet` | Request IP address for auditing. |
| `created_at` | `timestamptz` | Record creation time. |

---

## 4. Step-by-Step Implementation Blueprint

### Step 1: JWT Verification Helper (`src/utils/index.ts`)
Add a helper to verify JWT tokens and catch expiration/tampering errors cleanly:

```typescript
export const verify_token = <T = jwt.JwtPayload>(
  token: string,
  secret_type: SecretType
): { valid: true; payload: T } | { valid: false; error: string; expired: boolean } => {
  try {
    const secret = secret_type === "access" ? env.access_secret : env.refresh_secret;
    const decoded = jwt.verify(token, secret) as T;
    return { valid: true, payload: decoded };
  } catch (err: any) {
    return {
      valid: false,
      error: err.message,
      expired: err.name === "TokenExpiredError",
    };
  }
};
```

---

### Step 2: Repository Operations (`src/repositories/refresh_token/index.ts`)
Need 4 repository queries:

1. **`get_refresh_token_by_id(id: string)`**
   * Do **NOT** filter `where revoked_at is null` in this query.
   * We need to know if the record exists and whether `revoked_at` is set to detect token reuse!
   ```sql
   SELECT * FROM app.refresh_tokens WHERE id = $1
   ```

2. **`rotate_refresh_token(...)`**
   * Atomically revoke the old token and insert the new one.
   * Set `revoked_at = NOW()` and `replaced_by_id = $new_token_id` on the old row.
   * Insert new row into `app.refresh_tokens`.

3. **`revoke_all_user_tokens(user_id: string)`**
   * Emergency revocation triggered when token reuse is detected:
   ```sql
   UPDATE app.refresh_tokens 
   SET revoked_at = NOW() 
   WHERE user_id = $1 AND revoked_at IS NULL
   ```

4. **`revoke_token(id: string)`**
   * For user logout (`POST /user/logout`):
   ```sql
   UPDATE app.refresh_tokens 
   SET revoked_at = NOW() 
   WHERE id = $1 AND revoked_at IS NULL
   ```

---

### Step 3: Controller Logic (`src/controller/auth/index.ts`)
Implement the `RefreshToken` controller with the following sequence:

1. **Input Check:** `req.body.refresh_token` (guaranteed by `req_validate(refresh_token_schema)`).
2. **Verify JWT:**
   * Call `verify_token(refresh_token, "refresh")`.
   * If invalid: Return `401 Unauthorized` with specific error message (e.g. `"Token expired"` or `"Invalid token"`).
   * Ensure `payload.type === "refresh"`.
3. **Database Lookup:**
   * Fetch token row by `payload.id`.
   * If not found: Return `401 Unauthorized` (`"Session not found"`).
4. **Token Reuse Detection:**
   * If `db_token.revoked_at !== null`:
     * Log security alert: `Token reuse detected for user ${db_token.user_id}`.
     * Call `revoke_all_user_tokens(db_token.user_id)`.
     * Return `403 Forbidden` (`"Compromised session detected. Please log in again."`).
5. **Expiration Check:**
   * If `new Date(db_token.expires_at) <= new Date()`:
     * Return `401 Unauthorized` (`"Refresh token has expired"`).
6. **Bcrypt Hash Verification:**
   * `const matches = await decrypt_hash(db_token.token_hash, refresh_token)`
   * If `!matches`: Return `401 Unauthorized`.
7. **Active User Check:**
   * Query `get_user_by_id(db_token.user_id)` to ensure user exists and is not soft-deleted.
8. **Generate New Pair & Rotate:**
   * Generate `new_refresh_id = randomUUID()`.
   * Generate new access token and new refresh token.
   * Hash new refresh token.
   * Update old token (`revoked_at = now()`, `replaced_by_id = new_refresh_id`).
   * Insert new refresh token record.
   * Send response:
     ```json
     {
       "access_token": "...",
       "refresh_token": "..."
     }
     ```

---

### Step 4: Router Registration (`src/routes/user.router.ts`)
```typescript
user_router.post(
  "/refresh", 
  req_validate(refresh_token_schema), 
  RefreshToken
);
```

---

## 5. Comprehensive Edge Cases & Solutions

### Edge Case 1: Token Reuse Attack (Replay)
* **Scenario:** Attacker steals a refresh token. The legitimate user refreshes first. Later, the attacker presents the stolen token.
* **Problem:** If we only look for active tokens, the stolen token is simply "not found", which masks an attack as an expired session.
* **Defense:** Look up the token without filtering `revoked_at`. If `revoked_at` is set, identify the event as token reuse and invalidate **all active sessions** for that `user_id`.

---

### Edge Case 2: Multi-Tab Race Condition (Concurrent Refresh Requests)
* **Scenario:** A user opens 3 tabs at once. All 3 tabs send simultaneous requests with the same refresh token.
* **Problem:** Tab 1 succeeds and rotates the token. Tabs 2 and 3 arrive 50ms later with the old token, mistakenly triggering the Token Reuse panic and logging the user out.
* **Solutions:**
  1. **Short Grace Period (Recommended for Backend):**
     If a token has `revoked_at` within the last 15-30 seconds AND has a `replaced_by_id`, allow returning the *existing* active token rather than triggering a security panic.
  2. **Client-Side Refresh Mutex (Recommended for Frontend):**
     Use an Axios/Fetch interceptor with a mutex/promise lock so only one refresh call is made while other requests wait.

---

### Edge Case 3: Token Type Confusion
* **Scenario:** A malicious user sends an access token to `/user/refresh` or a refresh token to a protected API endpoint.
* **Defense:** 
  * Encode `type: "access"` and `type: "refresh"` in the respective payloads.
  * Use separate JWT signing secrets (`env.access_secret` vs `env.refresh_secret`).

---

### Edge Case 4: Stale Database Bloat (Cleanup)
* **Scenario:** Over months, millions of expired and revoked rows pile up in `app.refresh_tokens`.
* **Defense:**
  * Existing index: `create index if not exists idx_refresh_expires on app.refresh_tokens(expires_at)`.
  * Add a periodic cleanup cron or scheduled task:
    ```sql
    DELETE FROM app.refresh_tokens WHERE expires_at < NOW() - INTERVAL '7 days';
    ```

---

### Edge Case 5: User Deleted or Suspended
* **Scenario:** An admin deletes or disables a user, but their refresh token is valid for 24 hours.
* **Defense:** Always verify that `app.users` still has an active record for `user_id` before issuing new tokens.

---

## 6. Verification & Test Checklist

When testing with Postman or Curl:

1. **Happy Path:**
   * Login -> receive `access_token` and `refresh_token`.
   * Call `POST /user/refresh` with `refresh_token`.
   * Receive new pair.
   * Verify that DB shows old row with `revoked_at` populated and `replaced_by_id` pointing to new row.
2. **Rotation Verification:**
   * Call `POST /user/refresh` with the NEW `refresh_token` -> should succeed.
3. **Replay Detection:**
   * Call `POST /user/refresh` with the OLD (already rotated) `refresh_token`.
   * Verify: Response is `403`, and all other active tokens for that user are now revoked in the DB.
4. **Invalid Input:**
   * Empty body -> `400 Bad Request` from Zod.
   * Random string -> `401 Unauthorized` (JWT verification failure).
   * Access token sent to refresh -> `401 Unauthorized` (Type mismatch).
