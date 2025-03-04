# 📅 [2025-03-02] Sprint #001

**Commit:** [`sprint001`](https://github.com/Vikkkkk/hospitalERP-backend/commit/sprint001)
**Changes:**

- Updated `models/user.js`:
  - Renamed `password` field to `password_hash`.
  - Added `deletedAt` field to support soft deletion.
  - Implemented password hashing using Sequelize hooks.
- Updated `AuthService.ts`:
  - Changed `user.password` to `user.password_hash` for database consistency.
  - Improved error logging to include `error.message` for better debugging.
- Updated `AuthController.ts`:
  - Changed `user.password` to `user.password_hash`.
  - Integrated `AuthService.login()` for consistent authentication handling.
  - Improved error handling with proper TypeScript typecasting.
- Updated `AuthMiddleware.ts`:
  - Improved JWT error handling (expired & invalid token detection).
  - Ensured `JWT_SECRET` is set, with a warning if missing.
  - Improved logging for authentication failures.

-Fixes:
- Removed unused `BeforeCreate` and `BeforeUpdate` imports in `User.ts`.
- Fixed incorrect references to `password`, replaced with `password_hash`.
- Improved error handling in `AuthMiddleware.ts` by properly typecasting `error`.
- Fixed authentication issues and database inconsistencies.
- Manually added `deletedAt` column in the `Users` table to support `paranoid: true` soft deletes.
- Updated `AuthMiddleware.ts` to improve JWT handling and error logging.
- Successfully tested and verified user login and token generation.
- Tested protected routes to ensure JWT-based authentication is working correctly.


**Affected Files:**

- `src/models/User.ts`
- `src/services/AuthService.ts`
- `src/controllers/AuthController.ts`
- `src/middlewares/AuthMiddleware.ts`
- `src/controllers/UserController.ts`
- `src/routes/AuthRoutes.ts`
- `src/routes/UserRoutes.ts`
- `src/routes/WeComAuthRoutes.ts`
- `src/services/UserService.ts`

**Related Issues:**
- Aligning authentication with database schema changes.
- Ensuring authentication controller is correctly using updated service logic.
- Aligning model with database schema changes.
- Strengthening authentication middleware to improve security & debugging.
- Fixing TypeScript errors from `password` → `password_hash` migration.
- Cleaning up unused imports in `User.ts`.
- Improving error handling in middleware.

---------------------------------------------------------------------------------------------------------------------------------

## 📅 [2025-03-02] (sprint #002)
**Commit:** [`sprint002-wecom`](https://github.com/Vikkkkk/hospitalERP-backend/commit/sprint002-wecom)

**Changes:**
- **Authentication Updates:**
  - Fixed authentication issues and database inconsistencies.
  - Manually added `deletedAt` column in the `Users` table to support `paranoid: true` soft deletes.
  - Updated `AuthMiddleware.ts` to improve JWT handling and error logging.
  - Successfully tested and verified user login and token generation.
  - Tested protected routes to ensure JWT-based authentication is working correctly.

- **WeCom Integration Updates:**
  - Updated `WeComAuthRoutes.ts`:
    - **Added `/wecom-callback` route** to support login via QR code.
    - **Ensured correct JWT authentication flow** after QR login.
    - **Enhanced error logging** for easier debugging.
    - **Fixed import paths and improved security.**
  - Updated `WeComService.ts`:
    - Improved access token management with automatic expiry handling.
    - Ensured approval requests pull real approvers dynamically.
    - Cleaned up status mapping for WeCom approval callbacks.
    - Enhanced error logging for better debugging.
  - Updated `wecom-integration/callbacks.ts`:
    - Fixed incorrect import path for `ProcurementRequest`.
    - Improved status handling with flexible mapping.
    - Enhanced error logging for better debugging.

**Affected Files:**
- `src/models/User.ts`
- `src/middlewares/AuthMiddleware.ts`
- `src/controllers/AuthController.ts`
- `src/services/AuthService.ts`
- `src/routes/WeComAuthRoutes.ts`
- `src/services/WeComService.ts`
- `wecom-integration/callbacks.ts`

**Related Issues:**
- Ensuring consistency between Sequelize ORM and PostgreSQL schema.
- Verified and tested authentication endpoints.
- Confirmed that protected routes enforce authentication.
- Ensuring secure WeCom authentication and account linking.
- Improving WeCom login flow with better validations.
- Ensuring WeCom approval callbacks correctly update the procurement system.
- Preventing errors from unrecognized approval status formats.
- Ensuring WeCom QR code login works correctly.
- Preventing login failures due to missing callback handling.