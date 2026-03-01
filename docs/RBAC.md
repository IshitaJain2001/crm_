# Role-Based Access Control (RBAC) Implementation

Complete RBAC system for CRM with 5 roles and permission-based access.

## 🎯 Role Hierarchy

```
Super Admin (5)
    ↓
Admin (4)
    ↓
HR (3)
    ↓
Sales (2)
    ↓
Employee (1)
```

Higher role can manage lower roles.

## 🔐 Roles & Permissions

### Super Admin
**Most Powerful Role**

Permissions:
- ✅ View all data
- ✅ Manage users (create, delete, update)
- ✅ Manage roles (assign/change)
- ✅ Manage system settings
- ✅ View reports
- ✅ Delete any data
- ✅ Export data

**Who**: System owner / Account creator (first registered user)

---

### Admin
**Management Level**

Permissions:
- ✅ View all data
- ✅ Manage team users (create, update)
- ✅ View reports
- ✅ Delete team data
- ✅ Export data
- ❌ Cannot delete super admin
- ❌ Cannot change own role

**Who**: Manager, Team Lead

---

### HR
**Human Resources**

Permissions:
- ✅ View employees
- ✅ Manage employees (update, deactivate)
- ✅ View contacts
- ✅ Manage contacts
- ❌ Cannot access financial data
- ❌ Cannot manage other roles

**Who**: HR Manager, Recruiter

---

### Sales
**Sales Team**

Permissions:
- ✅ View contacts
- ✅ Manage own contacts
- ✅ View deals
- ✅ Manage own deals
- ✅ View activities
- ✅ Manage own activities
- ❌ Cannot view other's contacts
- ❌ Cannot access admin panel

**Who**: Sales Executive, Sales Rep

---

### Employee
**Regular User**

Permissions:
- ✅ View own data
- ✅ Manage own tasks
- ✅ View assigned contacts
- ❌ Cannot manage other users
- ❌ Cannot access admin panel
- ❌ Cannot view reports

**Who**: Basic User, Customer Support

---

## 📝 First User Rule

When **first user registers**:

```javascript
// Automatically becomes Super Admin
{
  role: "superadmin",
  isFirstUser: true
}
```

All subsequent registrations:
```javascript
{
  role: "employee",  // Default
  isFirstUser: false
}
```

**Nobody can register as Admin/Super Admin.**

---

## 🔑 How It Works

### 1. Authentication

User logs in → Server creates JWT token with role

```javascript
{
  "user_id": "123",
  "role": "admin",
  "email": "admin@example.com"
}
```

Token is signed by server (cannot be forged).

### 2. Authorization

Every protected endpoint checks role:

```javascript
// Admin endpoints
router.post('/admin/users', 
  authMiddleware,      // Verify token
  adminOnly,           // Check role
  createUserHandler
);
```

### 3. Permission Check

Middleware verifies user has required permission:

```javascript
router.delete('/contacts/:id',
  authMiddleware,
  requirePermission('delete_any_data'),
  deleteContactHandler
);
```

---

## 🚀 API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`
Create new account.

**Response (First User):**
```json
{
  "message": "User registered successfully as Super Admin!",
  "token": "eyJhbGc...",
  "user": {
    "id": "123",
    "name": "Ishita",
    "email": "ishita@example.com",
    "role": "superadmin",
    "isFirstUser": true
  }
}
```

**Response (Subsequent Users):**
```json
{
  "message": "User registered successfully!",
  "user": {
    "role": "employee"
  }
}
```

#### POST `/api/auth/login`
Authenticate user. Returns token with role.

---

### Admin Endpoints

All require `Admin` role or higher.

#### GET `/api/admin/users`
**Permissions**: Admin+

List all users (paginated).

```bash
GET /api/admin/users?role=sales&active=true
Authorization: Bearer {token}
```

Response:
```json
{
  "users": [
    {
      "id": "123",
      "name": "Rahul",
      "email": "rahul@example.com",
      "role": "sales",
      "department": "sales",
      "active": true,
      "createdBy": "admin_id",
      "createdAt": "2025-02-28T..."
    }
  ],
  "total": 50,
  "totalPages": 3,
  "currentPage": 1
}
```

---

#### POST `/api/admin/users`
**Permissions**: Admin+

Create new user.

**Request:**
```json
{
  "name": "Rahul Singh",
  "email": "rahul@example.com",
  "password": "SecurePassword123",
  "role": "sales",
  "department": "sales"
}
```

**Super Admin can create any role:**
```
superadmin → admin, hr, sales, employee
```

**Admin can only create lower roles:**
```
admin → hr, sales, employee (NOT admin)
```

**Response:**
```json
{
  "message": "User created successfully with role: sales",
  "user": {
    "id": "456",
    "name": "Rahul Singh",
    "email": "rahul@example.com",
    "role": "sales",
    "createdBy": "123"
  }
}
```

---

#### PATCH `/api/admin/users/:id/role`
**Permissions**: Super Admin only

Change user's role.

**Request:**
```json
{
  "role": "admin"
}
```

---

#### PUT `/api/admin/users/:id`
**Permissions**: Admin+

Update user details (not role).

**Request:**
```json
{
  "name": "New Name",
  "department": "marketing",
  "active": true
}
```

---

#### PATCH `/api/admin/users/:id/deactivate`
**Permissions**: Admin+

Deactivate (soft delete) user.

Cannot deactivate yourself.

---

#### DELETE `/api/admin/users/:id`
**Permissions**: Super Admin only

Permanently delete user.

Cannot delete yourself.

---

#### GET `/api/admin/roles`
**Permissions**: Any authenticated user

Get all roles and permissions.

**Response:**
```json
{
  "roles": ["superadmin", "admin", "hr", "sales", "employee"],
  "permissions": {
    "superadmin": ["view_all_data", "manage_users", ...],
    "admin": ["view_all_data", "manage_team_users", ...],
    ...
  },
  "currentUserRole": "admin",
  "currentUserPermissions": [...]
}
```

---

## 🔒 Security Rules

### Rule 1: User Cannot Set Own Role

When registering → Backend assigns role automatically.

### Rule 2: User Cannot Change Own Role

Endpoint rejects:
```javascript
if (userId === req.user.id && req.body.role) {
  return "Cannot change your own role"
}
```

### Rule 3: User Cannot Deactivate Themselves

```javascript
if (userId === req.user.id) {
  return "Cannot deactivate yourself"
}
```

### Rule 4: Lower Role Cannot Manage Higher Role

```javascript
canManageUser('sales', 'admin') // false
canManageUser('admin', 'sales') // true
```

### Rule 5: Permissions Verified On Every Request

Even if token says "admin", backend re-checks database role.

---

## 📊 Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "superadmin" | "admin" | "hr" | "sales" | "employee",
  permissions: [String],
  department: String,
  phone: String,
  active: Boolean,
  isFirstUser: Boolean,
  createdBy: ObjectId (ref: User),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing RBAC

### Test 1: First User Registration

```bash
POST /api/auth/register
{
  "name": "Ishita",
  "email": "ishita@gmail.com",
  "password": "Test123"
}

# Response: role = "superadmin"
```

### Test 2: Create Second User As Employee

```bash
POST /api/auth/register
{
  "name": "Rahul",
  "email": "rahul@gmail.com",
  "password": "Test123"
}

# Response: role = "employee"
```

### Test 3: Admin Creates User

```bash
POST /api/admin/users
Authorization: Bearer {admin_token}
{
  "name": "Sales Person",
  "email": "sales@gmail.com",
  "password": "Test123",
  "role": "sales"
}

# Success: User created with sales role
```

### Test 4: Sales User Cannot Create Users

```bash
POST /api/admin/users
Authorization: Bearer {sales_token}
{
  "name": "...",
  ...
}

# Error: Admin access required
```

### Test 5: Cannot Demote Yourself

```bash
PATCH /api/admin/users/{your_id}/role
{
  "role": "employee"
}

# Error: Cannot change your own role
```

---

## 🚨 Common Mistakes To Avoid

❌ **Mistake 1**: Allowing user to register with role

```javascript
// WRONG
{
  "role": "admin"  // User chooses role
}
```

✅ **Correct**:
```javascript
// Backend decides
role = isFirstUser ? 'superadmin' : 'employee'
```

---

❌ **Mistake 2**: Trusting frontend for permissions

```javascript
// WRONG
if (frontendUser.role === 'admin') {
  // Let them proceed
}
```

✅ **Correct**:
```javascript
// Always check backend/database
const dbUser = await User.findById(userId)
if (dbUser.role !== 'admin') {
  return "Access Denied"
}
```

---

❌ **Mistake 3**: Storing sensitive data in JWT

```javascript
// WRONG
{
  "permissions": ["delete_all", ...],  // In token
  "password": "..."
}
```

✅ **Correct**:
```javascript
{
  "user_id": "123",
  "role": "admin"  // Only role
}
// Fetch permissions from DB if needed
```

---

## 🔄 Typical User Journey

1. **First Person Registers**
   - Role: Super Admin
   - Can access everything

2. **Super Admin Creates Admin**
   - POST /api/admin/users
   - role: "admin"

3. **Admin Creates Sales Users**
   - POST /api/admin/users
   - role: "sales"

4. **Sales User Login & Access**
   - Can only view own contacts
   - Can only manage own deals

5. **Super Admin Changes Sales to HR**
   - PATCH /api/admin/users/{id}/role
   - role: "hr"

---

## 📈 Extending RBAC

To add new role:

1. Update User schema enum:
```javascript
role: {
  enum: ['superadmin', 'admin', 'hr', 'sales', 'employee', 'manager']
}
```

2. Add to ROLE_HIERARCHY:
```javascript
ROLE_HIERARCHY = {
  manager: 4.5  // Between admin and hr
}
```

3. Define permissions:
```javascript
PERMISSIONS = {
  manager: ['view_all_data', 'manage_team_users', ...]
}
```

4. Update routes to support new role.

---

## 🎓 Summary

✅ **First user = Auto Super Admin**
✅ **Subsequent users = Default Employee**
✅ **Only backend assigns roles**
✅ **Higher roles manage lower roles**
✅ **Permissions checked on every request**
✅ **Users cannot change own role**
✅ **Production-ready security**

This is enterprise-level RBAC implementation.
