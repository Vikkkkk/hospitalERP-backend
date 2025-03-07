## Notes
- # User.ts
File Path: backend-api/src/models/User.ts
Filename: User.ts
Key Features & Functions:
    User Model Definition:
    Defines the User model using Sequelize.
    Stores key user attributes, including:
    id, username, role, departmentid, password_hash, isglobalrole, wecom_userid, createdAt, updatedAt, deletedAt.

    Role Management:
    Uses an ENUM to ensure valid roles (Admin, DepartmentHead, Staff).
    Default role is "Staff" if not provided.
   
    Password Handling:
    password_hash field is used for secure password storage.
    Includes a method validPassword() for password validation using bcrypt.
    Pre-save & update hooks ensure passwords are hashed before saving.
    Prevents double hashing by checking if the password field was modified before re-hashing.
   
    Soft Deletion:
    Supports paranoid mode (soft delete) with a deletedAt field.
   
    WeCom Integration:
    Includes a wecom_userid field for binding WeCom accounts.
    Ensures wecom_userid is unique, preventing duplicate bindings.
    Unique Username Constraint:
    Enforces unique usernames to prevent duplicate users.

--------------------------------------------------------------------------------------------------------------------------------

Notes for Department.ts
File Path: backend-api/src/models/Department.ts
Filename: Department.ts
Key Features & Functions:
    Department Model Definition:
    Defines the Department model using Sequelize.

    Stores essential attributes:
    id - Unique identifier, auto-incremented.
    name - Name of the department (e.g., "HR", "Finance").
    createdAt & updatedAt - Automatically managed timestamps.

    Department Management:
    Auto-generates timestamps (createdAt & updatedAt).
    Uses timestamps: true to enable automatic updates in Sequelize.

    Constraints & Validations:
    name field is required (allowNull: false).
    Ensures unique department names (💡 We should enforce unique: true at the DB level if not done elsewhere).
    Relationships (Expected):
    Expected one-to-many relationship with User.ts (users belong to departments).

    Foreign Key: User.departmentid → Department.id.

    -----------------------------------------------------------------------------------------------------------------------------
📌 Notes for UserController.ts 
1️⃣ File Path:
📍 backend-api/src/controllers/UserController.ts

2️⃣ File Name:
📝 UserController.ts

3️⃣ Key Features & Functions:
Function Name	Description	Key Improvements
createUser	✅ Creates a new user (only Admins/Dept Heads)	🔹 Prevents duplicate usernames, hashes passwords securely
getAllUsers	📋 Retrieves all users (Admin only)	🔹 Hides password_hash in responses
updateUserRole	🔄 Updates a user's role (Admin only)	🔹 Ensures user exists before updating
resetUserPassword	🔑 Resets a user's password (Admin only)	🔹 Adds password length validation, prevents double hashing
deleteUser	❌ Soft deletes a user (RootAdmin only)	🔹 Uses deletedAt instead of permanent deletion

🔍 Detailed Notes
Role-Based Access Control (RBAC)

Previously, any authenticated user could modify user data.
Now, it requires Admin or Department Head permissions.
Future work: Implement checkRole() middleware.
Preventing Duplicate Usernames

Before creating a user, we check if the username already exists.
Returns 409 Conflict error if the username is taken.
Secure Password Handling

Before: Passwords were not validated for length.
Now: Passwords must be at least 6 characters.
Fix: Ensured passwords are hashed properly and not re-hashed during updates.
Soft Deletion Instead of Permanent Deletion

Before: deleteUser permanently removed users from the database.
Now: It soft deletes users by setting deletedAt instead of deleting.

---------------------------------------------------------------------------------------------------------------------------------


