# 🚀 Backend Codebase Notes

## 📌 Overview
This document provides an overview of key backend files, their responsibilities, and important implementation details. It is intended to help developers understand the architecture and avoid breaking existing functionality.

---

## **📂 Models**

### **1️⃣ `/models/User.ts`**
- Defines the **User** model with fields: `id, username, role, departmentid, password_hash, isglobalrole, wecom_userid, createdAt, updatedAt, deletedAt`.
- Implements **password hashing hooks** before saving (`beforeCreate` & `beforeUpdate`).
- Provides `validPassword()` method for authentication.
- **Soft delete enabled** (`paranoid: true`).

---

### **2️⃣ `/models/Department.ts`**
- Defines **Department** model with `id, name, createdAt, updatedAt`.
- Used to associate users with specific departments.

---

### **3️⃣ `/models/ProcurementRequest.ts`**
- Defines **Procurement Request** model with fields: `id, title, description, departmentid, requestedBy, priorityLevel, deadlineDate, quantity, status, approvalId`.
- Supports **status management** (`Pending, Approved, Rejected, Completed`).

---

## **📂 Controllers**

### **4️⃣ `/controllers/UserController.ts`**
- **Key Functions**:
  - `createUser()` → Creates new user (only by Admins & Dept Heads).
  - `getAllUsers()` → Lists all users (**Admin only**).
  - `updateUserRole()` → Updates a user’s role (**Admin only**).
  - `resetUserPassword()` → Resets user password (**Admin & Dept Head**).
  - `deleteUser()` → **Soft deletes** a user (**RootAdmin only**).
- Uses **`authorizeRole()` middleware** for security.

---

### **5️⃣ `/controllers/ProcurementController.ts`**
- **Key Functions**:
  - `submitRequest()` → Creates a new procurement request (validates priority level, department auto-assigned).
  - `getAllRequests()` → Lists all procurement requests (**Admin & Director only**).
  - `updateRequestStatus()` → Updates procurement request status (`Pending → Approved/Rejected`).
- Integrates with **ApprovalService** for WeCom approval handling.

---

## **📂 Routes**

### **6️⃣ `/routes/UserRoutes.ts`**
- Handles:
  - `POST /create` → Create user (Admin, Dept Head).
  - `GET /` → List all users (Admin).
  - `PATCH /:id/role` → Update user role (Admin).
  - `PATCH /:id/reset-password` → Reset user password.
  - `POST /link-wecom` → WeCom binding.
  - `POST /unlink-wecom` → WeCom unbinding.

---

### **7️⃣ `/routes/ProcurementRoutes.ts`**
- Handles:
  - `POST /` → Submit procurement request.
  - `GET /` → Get all procurement requests (**Admin, Directors**).
  - `PATCH /:id/status` → Approve/Reject requests.

---

### **8️⃣ `/routes/WeComAuthRoutes.ts`**
- Handles:
  - **WeCom OAuth callback for login & account linking**.
  - Generates JWT on successful login.
  - Implements **transaction-based** WeCom binding/unbinding.

---

## **📂 Middleware**

### **9️⃣ `/middlewares/AuthMiddleware.ts`**
- **`authenticateUser()`** → Extracts user from JWT, verifies authentication.
- Extends `AuthenticatedRequest` to store `user` object.

---

### **🔟 `/middlewares/RoleCheck.ts`**
- **`authorizeRole(allowedRoles)`**:
  - Checks if user has required role **or** inherited permissions.
  - Allows **RootAdmin & Global Roles** full access.
- **`checkRole(allowedRoles)`**:
  - Used for **fine-grained** action control.

---

## **📂 Services**

### **1️⃣1️⃣ `/services/UserService.ts`**
- **Helper functions for managing users**:
  - `hashPassword()`, `findUserById()`, `updateUserRole()`, `validateUserCredentials()`, `deleteUser()`, etc.

---

### **1️⃣2️⃣ `/services/WeComService.ts`**
- Handles:
  - **Fetching WeCom access token** (cached).
  - **Sending procurement approval requests**.
  - **Retrieving WeCom user data** (OAuth).
  - **Processing approval callback updates**.

---

### **1️⃣3️⃣ `/services/ApprovalService.ts`**
- Processes **approval responses** from WeCom.
- Updates **procurement request status** based on approval result.

---

### **1️⃣4️⃣ `/services/NotificationService.ts`**
- **Simulated notifications** (to be replaced with real messaging system).
- `notifyApprovalRequired()`, `notifyRequestStatusUpdate()`.

---

### **1️⃣5️⃣ `/services/LoggerService.ts`**
- Logs important events to `logs/application.log`.

---

## **📂 Config & Database**

### **1️⃣6️⃣ `/config/database.ts`**
- **Initializes Sequelize** with PostgreSQL.
- Uses `DATABASE_URL` from `.env`.

---

## **📂 Server & Entry Points**

### **1️⃣7️⃣ `/app.ts`**
- Main **Express app instance**.
- Sets up **CORS, middlewares, API routes**.

---

### **1️⃣8️⃣ `/server.ts`**
- **Main server entry point**.
- Loads environment variables.
- Starts the Express server (`app.listen()`).

---

### **📝 Notes & Next Steps**
✅ Backend is fully **optimized & tested**.  
🟢 Moving on to **Frontend Optimization**.

---

