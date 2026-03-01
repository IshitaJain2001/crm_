# CRM API Documentation

Base URL: `http://localhost:5000/api`

All endpoints require `Authorization: Bearer {token}` header except Auth endpoints.

## Authentication

### POST /auth/register
Create new user account.

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "department": "sales"
}
```

**Response** (201):
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### POST /auth/login
Authenticate user.

**Request**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response** (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": { ... }
}
```

### GET /auth/me
Get current user profile.

**Response** (200): User object

---

## Contacts

### GET /contacts
List all contacts (paginated).

**Query Params**:
- `page` (default: 1)
- `limit` (default: 20)
- `search` - Search by name or email
- `company` - Filter by company ID

**Response**:
```json
{
  "contacts": [...],
  "totalPages": 5,
  "currentPage": 1,
  "total": 100
}
```

### GET /contacts/:id
Get single contact.

### POST /contacts
Create contact.

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "companyId",
  "jobTitle": "Sales Manager",
  "lifecycle": "lead"
}
```

### PUT /contacts/:id
Update contact.

### DELETE /contacts/:id
Delete contact.

---

## Companies

### GET /companies
List all companies.

**Query Params**:
- `page`, `limit`, `search`

### GET /companies/:id
Get single company.

### POST /companies
Create company.

**Request**:
```json
{
  "name": "Acme Corp",
  "website": "https://acme.com",
  "industry": "Technology",
  "phone": "+1234567890",
  "email": "info@acme.com",
  "companySize": "51-200"
}
```

### PUT /companies/:id
Update company.

### DELETE /companies/:id
Delete company.

---

## Deals

### GET /deals
List all deals.

**Query Params**:
- `page`, `limit`
- `status` - "open", "won", "lost"
- `stage` - Deal stage

### GET /deals/:id
Get single deal.

### POST /deals
Create deal.

**Request**:
```json
{
  "dealName": "Enterprise Contract",
  "company": "companyId",
  "contact": "contactId",
  "amount": 50000,
  "dealStage": "proposal_sent",
  "expectedCloseDate": "2024-06-30"
}
```

**Deal Stages**:
- initial_contact
- proposal_sent
- negotiation
- review
- decision_makers_bought_in

### PUT /deals/:id
Update deal.

### DELETE /deals/:id
Delete deal.

---

## Activities

### GET /activities
List all activities.

**Query Params**:
- `page`, `limit`
- `contact` - Filter by contact
- `type` - "email", "call", "meeting", "note", "task"
- `status` - "pending", "completed", "cancelled"

### GET /activities/:id
Get single activity.

### POST /activities
Create activity.

**Request**:
```json
{
  "type": "call",
  "subject": "Follow-up call",
  "description": "Discussed pricing",
  "contact": "contactId",
  "company": "companyId",
  "dueDate": "2024-06-20",
  "priority": "high"
}
```

### PUT /activities/:id
Update activity.

### PATCH /activities/:id/complete
Mark activity as completed.

### DELETE /activities/:id
Delete activity.

---

## Tasks

### GET /tasks
List all tasks.

**Query Params**:
- `page`, `limit`
- `status` - "pending", "completed"
- `priority` - "low", "medium", "high"

### POST /tasks
Create task.

**Request**:
```json
{
  "subject": "Call prospect",
  "description": "Follow up with John",
  "contact": "contactId",
  "dueDate": "2024-06-22",
  "priority": "high",
  "assignedTo": "userId"
}
```

---

## Users

### GET /users
List all users (admin only).

**Query Params**:
- `page`, `limit`
- `role` - "admin", "manager", "user"
- `active` - true/false (default: true)

### GET /users/:id
Get single user.

### PUT /users/:id
Update user profile.

### PATCH /users/:id/role
Change user role (admin only).

**Request**:
```json
{
  "role": "manager"
}
```

### PATCH /users/:id/deactivate
Deactivate user (admin only).

---

## Dashboard

### GET /dashboard/stats
Get dashboard statistics.

**Response**:
```json
{
  "totalContacts": 50,
  "totalCompanies": 25,
  "openDeals": 12,
  "totalDealsAmount": 500000,
  "dealsWonThisMonth": 3,
  "recentActivities": 42
}
```

### GET /dashboard/pipeline
Get sales pipeline overview.

### GET /dashboard/activity-summary
Get activity type breakdown.

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently not implemented. Add rate limiting middleware for production.

## Pagination

Default: 20 items per page.

```
GET /contacts?page=2&limit=50
```

Returns total count for frontend pagination.

---

## Authentication Token

Token stored in localStorage after login/register. Include in all requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token expires in 7 days by default.
