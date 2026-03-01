# CRM Database Schema

MongoDB collections and document structures.

## Collections

### Users
User accounts and authentication.

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "admin" | "manager" | "user",
  department: "sales" | "support" | "marketing" | "management" | "other",
  phone: String,
  avatar: String (URL),
  active: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Contacts
Customer/prospect contact information.

```javascript
{
  _id: ObjectId,
  firstName: String (required),
  lastName: String (required),
  email: String,
  phone: String,
  mobile: String,
  company: ObjectId (ref: Company),
  jobTitle: String,
  department: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  lifecycle: "subscriber" | "lead" | "customer" | "evangelist",
  leadStatus: "new" | "open" | "in_progress" | "open_deal" | "unqualified" | "attempted_contact" | "connected" | "qualified",
  leadScore: Number (0-100),
  tags: [String],
  notes: String,
  customFields: Mixed,
  owner: ObjectId (ref: User, required),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- email
- firstName + lastName
- company
- owner

### Companies
Organization/account information.

```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  website: String,
  industry: String,
  companySize: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+",
  phone: String,
  email: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  annualRevenue: Number,
  employees: Number,
  description: String,
  linkedinUrl: String,
  twitterHandle: String,
  tags: [String],
  owner: ObjectId (ref: User, required),
  contacts: [ObjectId] (ref: Contact),
  customFields: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- name
- website
- owner

### Deals
Sales pipeline deals/opportunities.

```javascript
{
  _id: ObjectId,
  dealName: String (required),
  company: ObjectId (ref: Company, required),
  contact: ObjectId (ref: Contact),
  amount: Number (required),
  currency: String (default: "USD"),
  dealStatus: "won" | "lost" | "open",
  dealStage: "initial_contact" | "proposal_sent" | "negotiation" | "review" | "decision_makers_bought_in",
  probability: Number (0-100),
  expectedCloseDate: Date,
  actualCloseDate: Date,
  description: String,
  owner: ObjectId (ref: User, required),
  lastActivity: Date,
  tags: [String],
  customFields: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- company
- contact
- owner
- dealStatus + dealStage

### Activities
Emails, calls, meetings, notes, tasks.

```javascript
{
  _id: ObjectId,
  type: "email" | "call" | "meeting" | "note" | "task" (required),
  subject: String (required),
  description: String,
  contact: ObjectId (ref: Contact, required),
  company: ObjectId (ref: Company),
  deal: ObjectId (ref: Deal),
  owner: ObjectId (ref: User, required),
  activityDate: Date,
  dueDate: Date,
  status: "pending" | "completed" | "cancelled",
  priority: "low" | "medium" | "high",
  assignedTo: ObjectId (ref: User),
  
  // Email specific
  emailDetails: {
    from: String,
    to: [String],
    cc: [String],
    subject: String,
    body: String,
    attachments: [String]
  },
  
  // Call specific
  callDetails: {
    duration: Number (seconds),
    direction: "inbound" | "outbound",
    outcome: String
  },
  
  // Meeting specific
  meetingDetails: {
    location: String,
    attendees: [String],
    duration: Number (minutes)
  },
  
  attachments: [String] (URLs),
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- contact
- company
- deal
- owner
- activityDate

## Relationships

```
User (1) ─── (Many) Contacts
User (1) ─── (Many) Companies
User (1) ─── (Many) Deals
User (1) ─── (Many) Activities

Company (1) ─── (Many) Contacts
Company (1) ─── (Many) Deals

Contact (1) ─── (Many) Activities
Contact (1) ─── (Many) Deals

Deal (1) ─── (Many) Activities
```

## Data Size Estimates

For 100 users, 10,000 contacts:
- Total size: ~500 MB
- Index size: ~100 MB
- Total disk: ~600 MB

MongoDB Atlas Free Tier includes 5 GB storage (plenty for this scale).

## Backup Strategy

### Local Development
Use `mongodump` to backup:
```bash
mongodump --uri="mongodb://localhost:27017/crm" --out=./backup
```

Restore with:
```bash
mongorestore --uri="mongodb://localhost:27017/crm" ./backup/crm
```

### MongoDB Atlas
Automatic daily backups included. Download from Atlas console.

## Scalability Considerations

### Current Limits
- Single MongoDB server handles ~10k contacts easily
- Current schema supports 1M+ documents

### Future Optimization
- Add field-level encryption for sensitive data
- Implement read replicas for scaling reads
- Archive old activities to separate collection
- Add caching layer (Redis)

## Migrations

For schema changes:

1. Create new field with default value
2. Update existing documents
3. Migrate data if needed
4. Test thoroughly
5. Remove old field (optional)

Example:
```javascript
db.contacts.updateMany({}, {
  $set: { newField: defaultValue }
})
```

## Data Validation

Mongoose provides schema validation. Additional rules:

- Emails must be unique per user
- Phone numbers should be standardized format
- Company names unique per user
- Amount > 0 for deals
- Dates must be valid

See model files for complete validation rules.
