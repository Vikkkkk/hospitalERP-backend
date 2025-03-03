# 📅 [2025-03-02] Sprint #001

**Commit:** [`backendOptimization`](https://github.com/Vikkkkk/hospitalERP-backend/commit/backendOptimization)
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
