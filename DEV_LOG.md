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

---------------------------------------------------------------------------------------------------------------------------------

📅 [2025-03-03] Sprint #002 - Backend Updates
Commit: sprint002

🔄 Changes:
Implemented WeCom Login via QR Code

Added WeCom authentication using /wecom-callback.
Verified code against WeCom API.
If the user exists, JWT is generated for login.
If the user is not linked, redirects with an error message.
Updated WeCom Authentication Handling

Improved error handling for invalid OAuth codes.
Added logging for WeCom API responses.
Ensured access tokens are correctly retrieved and cached.
Implemented Frontend Redirection for WeCom Login

Redirects to /login?error=wecom_auth_failed on failure.
Redirects to /login?error=unlinked_account if no associated user.
Updated WeCom API Service

Improved error handling for expired OAuth codes.
Fixed token expiration handling.
Improved logging for debugging.
Implemented .env Variable Support

WeCom API credentials are now securely loaded from .env.
CORS & Security Updates

Allowed https://readily-hip-leech.ngrok-free.app as an origin for API access.
Fixed Access-Control-Allow-Credentials issues.
🐛 Fixes:
Fixed "OAuth Code Already Used" issue by ensuring WeCom API calls are made correctly.
Resolved JWT_SECRET missing environment variable issue.
Fixed missing wecom_userid in JWT payload.
Ensured proper redirects for failed WeCom logins.
📂 Affected Files:
src/routes/WeComAuthRoutes.ts
src/routes/WeComCallbackRoutes.ts
src/services/WeComService.ts
src/middlewares/AuthMiddleware.ts
src/server.ts
.env (Updated with WeCom API credentials)
✅ Testing:
Successfully logged in via WeCom QR code.
Verified JWT contains correct user attributes.
Tested failed logins (unlinked account, expired code, invalid token).
Verified redirections to /login with appropriate error messages.

--------------------------------------------------------------------------------------------------------------------
📜 Development Log: WeCom Authentication Integration (Frontend & Backend)
📅 Date: March 6, 2025
👨‍💻 Feature: WeCom Authentication, Account Binding, and Unbinding
🔄 Status: ✅ Fully Integrated & Tested
🛠 Summary of Work Done
We have fully implemented and tested WeCom authentication, including:

WeCom QR Code Login
WeCom Account Binding to Existing User
WeCom Unbinding
Ensuring Secure Authentication & Session Persistence
Preventing Unintended Overwrites (e.g., password_hash corruption bug)
This allows users to log in either via username/password or WeCom scan while ensuring proper linkage between accounts.

🚀 Backend Implementation
📌 Updated Routes (wecomAuthRoutes.ts)
1️⃣ WeCom OAuth Callback (/wecom-callback)
Receives the authorization code from WeCom.
Fetches WeCom User ID via API.
Login Mode:
If WeCom account is linked, user logs in via WeCom.
If WeCom account is NOT linked, user is redirected with an error.
Binding Mode (mode=link)
Redirects user to confirm binding after successful WeCom authentication.
ts
Copy
Edit
router.get('/wecom-callback', async (req: Request, res: Response) => {
  try {
    const { code, mode } = req.query;
    if (!code) return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);

    const wecomUser = await getWeComUser(code as string);
    if (!wecomUser || !wecomUser.UserId) {
      return res.redirect(`${FRONTEND_URL}/login?error=wecom_auth_failed`);
    }

    if (mode === 'link') {
      return res.redirect(`${FRONTEND_URL}/profile?mode=confirm&wecom_userid=${wecomUser.UserId}`);
    }

    const user = await User.findOne({ where: { wecom_userid: wecomUser.UserId } });
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=unlinked_account`);
    }

    const token = jwt.sign({ ...user.toJSON() }, JWT_SECRET as string, { expiresIn: '8h' });
    return res.redirect(`${FRONTEND_URL}/login?token=${token}`);
  } catch (error) {
    console.error('❌ WeCom 登录失败:', error);
    return res.redirect(`${FRONTEND_URL}/login?error=internal_error`);
  }
});
2️⃣ Link WeCom Account (/link-wecom)
Authenticated users can link their WeCom account.
Securely updates only wecom_userid to prevent accidental overwrites.
ts
Copy
Edit
router.post('/link-wecom', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { password, wecom_userid } = req.body;
    const user = await User.findByPk(req.user!.id);

    if (!user) return res.status(404).json({ message: '用户未找到' });
    if (user.wecom_userid) return res.status(409).json({ message: '账户已绑定 WeCom' });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ message: '密码错误' });

    await User.update({ wecom_userid }, { where: { id: user.id } }); // ✅ Prevent accidental overwrites

    return res.status(200).json({ message: 'WeCom 账号绑定成功' });
  } catch (error) {
    return res.status(500).json({ message: '绑定失败' });
  }
});
3️⃣ Unlink WeCom Account (/unlink-wecom)
Securely removes the WeCom link without affecting any other user data.
ts
Copy
Edit
router.post('/unlink-wecom', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user!.id);
    if (!user || !user.wecom_userid) return res.status(400).json({ message: '未绑定 WeCom 账号' });

    await User.update({ wecom_userid: null }, { where: { id: user.id } });

    return res.status(200).json({ message: 'WeCom 账号解绑成功' });
  } catch (error) {
    return res.status(500).json({ message: '解绑失败' });
  }
});

