# Multi-Tenant SaaS Architecture (Like HubSpot)

This is a **complete multi-tenant** SaaS system where each company has:
- ✅ Isolated data (separate database records)
- ✅ Own Super Admin
- ✅ Own company branding ("Ishita's CRM")
- ✅ Email verification (OTP)
- ✅ Invitation-based team expansion

---

## 🏢 Architecture Overview

```
System
├── Company A (Ishita's CRM)
│   ├── Super Admin: Ishita
│   ├── Admin: Rahul
│   ├── Sales: John, Jane
│   └── Employees: ...
│
├── Company B (Acme Corp CRM)
│   ├── Super Admin: Vikram
│   ├── Admin: Priya
│   ├── HR: Anjali
│   └── Employees: ...
│
└── Company C ...
```

**Key Points:**
- Same user email can exist in different companies
- Roles are per-company (Ishita = Super Admin in Company A, but could be Employee in Company B)
- Data is completely isolated (Ishita's contacts are NOT visible to Vikram)

---

## 📋 User Journey (Step-by-Step)

### **STEP 1: Ishita Starts Signup**

```
User clicks "Sign Up"
Ishita enters: ishita@gmail.com
```

**Request:**
```bash
POST /api/auth/send-otp
{
  "email": "ishita@gmail.com"
}
```

**Backend:**
- Checks if email already registered globally ❌
- Generates 6-digit OTP
- Stores OTP (valid for 10 minutes)
- Sends OTP to email

**Response:**
```json
{
  "message": "OTP sent to your email",
  "verificationToken": "abc123xyz...",
  "expiresIn": "10 minutes"
}
```

**Frontend:**
- Shows "Enter OTP" screen
- Stores verificationToken

---

### **STEP 2: Ishita Enters OTP**

```
Ishita gets email with OTP: 123456
```

**Request:**
```bash
POST /api/auth/verify-otp
{
  "email": "ishita@gmail.com",
  "otp": "123456"
}
```

**Backend:**
- Finds OTP record for ishita@gmail.com
- Checks: OTP matches? ✓
- Checks: Not expired? ✓
- Checks: Not blocked (< 5 attempts)? ✓
- Marks email as verified in database

**Response:**
```json
{
  "message": "Email verified successfully",
  "verified": true,
  "verificationToken": "abc123xyz..."
}
```

---

### **STEP 3: Ishita Creates Company & Account**

```
Ishita fills:
- Name: Ishita Jain
- Company Name: ishita-crm (slug)
- Display Name: Ishita's CRM
- Password: MyPassword123
```

**Request:**
```bash
POST /api/auth/register-company
{
  "email": "ishita@gmail.com",
  "password": "MyPassword123",
  "name": "Ishita Jain",
  "companyName": "ishita-crm",
  "displayName": "Ishita's CRM",
  "verificationToken": "abc123xyz..."
}
```

**Backend Process:**

1. **Verify email was verified via OTP**
   ```javascript
   const verification = await EmailVerification.findOne({
     email: "ishita@gmail.com",
     verificationToken: "abc123xyz...",
     verified: true
   });
   // ✓ Found!
   ```

2. **Create Company**
   ```javascript
   const company = new Company({
     name: "ishita-crm",
     displayName: "Ishita's CRM"
   });
   ```

3. **Create Super Admin User for this company**
   ```javascript
   const user = new User({
     name: "Ishita Jain",
     email: "ishita@gmail.com",
     password: hashed,
     company: company._id,
     role: "superadmin",  // 🔑 Automatically assigned!
     emailVerified: true
   });
   ```

4. **Link company to super admin**
   ```javascript
   company.superAdmin = user._id;
   company.members = [user._id];
   ```

5. **Generate JWT Token** (includes company)
   ```javascript
   {
     id: "user_ishita_123",
     email: "ishita@gmail.com",
     role: "superadmin",
     company: "company_ishita_456"
   }
   ```

**Response:**
```json
{
  "message": "Welcome! You are now Super Admin of Ishita's CRM",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_ishita_123",
    "name": "Ishita Jain",
    "email": "ishita@gmail.com",
    "role": "superadmin"
  },
  "company": {
    "id": "company_ishita_456",
    "name": "ishita-crm",
    "displayName": "Ishita's CRM"
  }
}
```

**Frontend:**
- Stores token in localStorage
- Redirects to dashboard
- Shows "Ishita's CRM" in navbar

---

### **STEP 4: Ishita Invites Team Members**

```
Ishita opens: Settings → Team → Invite Members
Enters: rahul@gmail.com, Role: "sales"
```

**Request:**
```bash
POST /api/invitations
Authorization: Bearer {token}
{
  "email": "rahul@gmail.com",
  "role": "sales",
  "message": "Join our CRM team!"
}
```

**Backend:**
1. **authMiddleware**: Verify token, get Ishita's company_id
2. **requireRole('superadmin')**: Is Ishita super admin? ✓
3. **Create Invitation**
   ```javascript
   const invitation = new Invitation({
     email: "rahul@gmail.com",
     company: "company_ishita_456",
     role: "sales",
     invitedBy: "user_ishita_123",
     invitationToken: "xyz789abc...",
     invitationLink: "http://localhost:3000/join?token=xyz789abc...",
     expiresAt: "7 days from now"
   });
   ```

4. **Send Invitation Email to Rahul**
   ```
   Subject: You've been invited to join Ishita's CRM
   
   Hi Rahul,
   Ishita Jain has invited you to join: Ishita's CRM
   
   Click here to accept: http://localhost:3000/join?token=xyz789abc...
   
   This invitation expires in 7 days.
   ```

**Response:**
```json
{
  "message": "Invitation sent to rahul@gmail.com",
  "invitation": {
    "id": "inv_123",
    "email": "rahul@gmail.com",
    "role": "sales",
    "status": "pending",
    "expiresAt": "2025-03-07T10:30:00Z"
  }
}
```

---

### **STEP 5: Rahul Receives & Accepts Invitation**

```
Rahul gets email with link:
http://localhost:3000/join?token=xyz789abc...

Clicks the link
```

**Frontend:**
- Extracts token from URL
- Makes request to get invitation details

**Request:**
```bash
GET /api/invitations/token/xyz789abc...
```

**Response:**
```json
{
  "email": "rahul@gmail.com",
  "role": "sales",
  "company": {
    "id": "company_ishita_456",
    "name": "ishita-crm",
    "displayName": "Ishita's CRM"
  },
  "expiresAt": "2025-03-07T10:30:00Z"
}
```

**Frontend:**
- Shows: "You're invited to join Ishita's CRM as Sales!"
- Shows signup form (Name, Password, etc.)

---

### **STEP 6: Rahul Creates Account via Invitation**

```
Rahul fills:
- Name: Rahul Singh
- Password: RahulPass123
```

**Request:**
```bash
POST /api/auth/accept-invitation/xyz789abc...
{
  "email": "rahul@gmail.com",
  "password": "RahulPass123",
  "name": "Rahul Singh",
  "invitationToken": "xyz789abc..."
}
```

**Backend:**

1. **Find invitation**
   ```javascript
   const invitation = await Invitation.findOne({
     invitationToken: "xyz789abc...",
     email: "rahul@gmail.com",
     status: "pending"
   });
   // ✓ Found!
   ```

2. **Check not expired**
   ```javascript
   if (invitation.expiresAt < new Date()) {
     return "Invitation expired";
   }
   // ✓ Still valid!
   ```

3. **Create user in same company**
   ```javascript
   const user = new User({
     name: "Rahul Singh",
     email: "rahul@gmail.com",
     password: hashed,
     company: "company_ishita_456",
     role: "sales",  // 🔑 From invitation!
     emailVerified: true
   });
   ```

4. **Add to company members**
   ```javascript
   company.members.push(rahul._id);
   ```

5. **Mark invitation as accepted**
   ```javascript
   invitation.status = "accepted";
   invitation.acceptedBy = rahul._id;
   invitation.acceptedAt = new Date();
   ```

6. **Generate login token**
   ```javascript
   {
     id: "user_rahul_789",
     email: "rahul@gmail.com",
     role: "sales",
     company: "company_ishita_456"  // 🔑 Same company!
   }
   ```

**Response:**
```json
{
  "message": "Welcome to Ishita's CRM!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_rahul_789",
    "name": "Rahul Singh",
    "email": "rahul@gmail.com",
    "role": "sales"
  },
  "company": {
    "id": "company_ishita_456",
    "name": "ishita-crm",
    "displayName": "Ishita's CRM"
  }
}
```

---

## 🔐 Data Isolation Example

### **Ishita's Data:**
```javascript
// Ishita's contacts
Contact {
  _id: "contact_ishita_1",
  name: "John",
  owner: "user_ishita_123",
  company: "company_ishita_456"  // 🔑 Company field
}

// Rahul's contacts
Contact {
  _id: "contact_ishita_2",
  name: "Jane",
  owner: "user_rahul_789",
  company: "company_ishita_456"  // 🔑 Same company
}
```

### **Query in Ishita's CRM:**
```javascript
// Show only Ishita's company contacts
const contacts = await Contact.find({
  company: req.user.company  // From JWT token
});
// Returns: contact_ishita_1, contact_ishita_2
```

### **Vikram's Data (Different Company):**
```javascript
Contact {
  _id: "contact_vikram_1",
  name: "Priya",
  company: "company_vikram_789"  // 🔑 Different company
}

Contact {
  _id: "contact_vikram_2",
  name: "Anjali",
  company: "company_vikram_789"
}
```

**If Rahul tries to access Vikram's contacts:**
```javascript
const contacts = await Contact.find({
  company: req.user.company  // "company_ishita_456"
});
// Returns: contact_ishita_1, contact_ishita_2
// NOT vikram's contacts ✓ Data isolation works!
```

---

## 🚀 Key Endpoints

### Authentication

**1. Send OTP**
```
POST /api/auth/send-otp
{ "email": "user@example.com" }
```

**2. Verify OTP**
```
POST /api/auth/verify-otp
{ "email": "user@example.com", "otp": "123456" }
```

**3. Register Company & Super Admin**
```
POST /api/auth/register-company
{
  "email": "user@example.com",
  "password": "...",
  "name": "User Name",
  "companyName": "company-slug",
  "displayName": "Company Display Name",
  "verificationToken": "..."
}
```

**4. Login**
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "..."
}
```

**5. Accept Invitation**
```
POST /api/auth/accept-invitation/:token
{
  "email": "...",
  "password": "...",
  "name": "...",
  "invitationToken": "..."
}
```

### Invitations (Super Admin Only)

**1. Send Invitation**
```
POST /api/invitations
Authorization: Bearer {token}
{
  "email": "newmember@example.com",
  "role": "sales"
}
```

**2. List Invitations**
```
GET /api/invitations?status=pending
Authorization: Bearer {token}
```

**3. Get Invitation Details** (Public)
```
GET /api/invitations/token/:token
```

**4. Resend Invitation**
```
POST /api/invitations/:id/resend
Authorization: Bearer {token}
```

**5. Revoke Invitation**
```
DELETE /api/invitations/:id
Authorization: Bearer {token}
```

---

## 📊 Database Schema

### Company
```javascript
{
  _id: ObjectId,
  name: String (unique),        // "ishita-crm"
  displayName: String,          // "Ishita's CRM"
  superAdmin: ObjectId (ref: User),
  members: [ObjectId] (ref: User),
  plan: String,                 // "free", "starter", etc.
  maxUsers: Number,
  status: String,               // "active", "suspended"
  createdAt: Date
}
```

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  company: ObjectId (ref: Company),  // 🔑 Which company
  role: String,  // "superadmin", "admin", "hr", "sales", "employee"
  emailVerified: Boolean,
  emailVerifiedAt: Date,
  lastLogin: Date,
  createdAt: Date
}

// Unique constraint: { email, company }
// Same email can exist in multiple companies!
```

### Invitation
```javascript
{
  _id: ObjectId,
  email: String,
  company: ObjectId (ref: Company),
  role: String,
  invitedBy: ObjectId (ref: User),
  invitationToken: String (unique),
  invitationLink: String,
  status: String,  // "pending", "accepted", "rejected", "expired"
  acceptedBy: ObjectId (ref: User),
  acceptedAt: Date,
  expiresAt: Date,
  createdAt: Date
}
```

### EmailVerification
```javascript
{
  email: String,
  otp: String,
  otpExpiry: Date,        // 10 minutes
  verified: Boolean,
  verificationToken: String,
  attemptCount: Number,
  blocked: Boolean,
  blockedUntil: Date,
  createdAt: Date        // Auto-delete after 1 hour
}
```

---

## 🛡️ Security Features

✅ **Email Verification (OTP)**
- 6-digit OTP sent to email
- Valid for 10 minutes
- Max 5 attempts, then 30-min block

✅ **Invitation Tokens**
- Unique, random tokens
- Expire after 7 days
- Can be revoked by Super Admin

✅ **Role-Based Access**
- Only Super Admin can invite
- Users cannot change own role
- Data isolated per company

✅ **No Open Registration**
- Users must have invitation link
- OR create their own company
- No free-for-all signup

---

## 🎯 Advantages

1. **Multi-Company Support** - Unlimited companies
2. **Data Isolation** - Complete separation per company
3. **Company Branding** - Custom display names
4. **Scalable** - Add companies without code changes
5. **Enterprise-Ready** - Like Salesforce, HubSpot, Slack
6. **Email Verified** - Users verify email before account creation
7. **Controlled Expansion** - Only Super Admin invites team
8. **Same Email Multiple Companies** - Person can be in multiple orgs

---

## 🚀 Usage Example

### Register as First User (Super Admin)

```bash
# Step 1
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"ishita@gmail.com"}'

# Step 2 (Ishita checks email, gets OTP: 123456)
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"ishita@gmail.com","otp":"123456"}'

# Step 3
curl -X POST http://localhost:5000/api/auth/register-company \
  -H "Content-Type: application/json" \
  -d '{
    "email":"ishita@gmail.com",
    "password":"Test123",
    "name":"Ishita Jain",
    "companyName":"ishita-crm",
    "displayName":"Ishita'\''s CRM",
    "verificationToken":"..."
  }'

# Get token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Invite Team Member

```bash
curl -X POST http://localhost:5000/api/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email":"rahul@gmail.com",
    "role":"sales"
  }'

# Rahul receives invitation email with link
# Clicks link → /join?token=xyz789abc...
# Fills form → name, password
# Accepted to company with "sales" role
```

---

This is **production-ready SaaS architecture**! 🚀
