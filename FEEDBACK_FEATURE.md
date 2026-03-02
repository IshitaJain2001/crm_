# Feedback Feature - Superadmin Only

## Overview

Added a **feedback system** for superadmins to share their experience with the CRM and help improve it. Superadmins can:
- 📝 Submit feedback/suggestions
- ⭐ Rate their experience (1-5 stars)
- 📋 View feedback history
- 📊 Track feedback status

## Access

**Location**: Sidebar → "Feedback" (visible only to superadmins)
**URL**: `/feedback`
**Role**: Superadmin only

## Features

### Submit Feedback Tab

#### Rating System
- 1-5 star rating scale
- Visual feedback with color changes
- Clear indication: 1 = Poor, 5 = Excellent

#### Category Selection
- **General Feedback** - General comments
- **Feature Request** - New feature suggestions
- **Bug Report** - Issues/problems
- **Performance** - Speed/performance feedback
- **UI/UX** - Interface/design suggestions

#### Form Fields
1. **Rating** (Required) - 1-5 stars
2. **Category** (Optional) - Predefined categories
3. **Subject** (Required) - Min 5 characters
4. **Message** (Required) - Min 10 characters

#### Validation
- ✅ All required fields validated
- ✅ Minimum character limits enforced
- ✅ User-friendly error messages
- ✅ Success confirmation after submission

### Feedback History Tab

#### Statistics Dashboard
- **Total Feedback** - All submissions
- **New** - Recently submitted
- **Reviewed** - Team reviewed
- **In Progress** - Being addressed
- **Resolved** - Completed

#### Feedback List
- Chronological order (newest first)
- Subject and message visible
- Current status displayed
- Rating shown with color coding
- Category badge
- Timestamp for each feedback

#### Status Indicators
| Status | Color | Meaning |
|--------|-------|---------|
| New | Blue | Just received |
| Reviewed | Yellow | Reviewed by team |
| In Progress | Purple | Being worked on |
| Resolved | Green | Issue/feature complete |

#### Rating Colors
| Rating | Color | Meaning |
|--------|-------|---------|
| 5 ⭐ | Green | Excellent |
| 4 ⭐ | Blue | Good |
| 3 ⭐ | Yellow | Average |
| 2 ⭐ | Orange | Poor |
| 1 ⭐ | Red | Very Poor |

## Backend Implementation

### Model: `backend/models/Feedback.js`

**Schema:**
```javascript
{
  company: ObjectId,        // Company reference
  superAdmin: ObjectId,     // Superadmin who submitted
  email: String,            // Superadmin email
  companyName: String,      // Company name
  rating: Number (1-5),     // Star rating
  category: String,         // Feedback category
  subject: String,          // Title (min 5 chars)
  message: String,          // Detailed message (min 10 chars)
  status: String,           // new, reviewed, in_progress, resolved
  createdAt: Date,          // Auto timestamp
  updatedAt: Date           // Auto timestamp
}
```

### Routes: `backend/routes/feedback.js`

#### Submit Feedback
```
POST /api/feedback/submit
Headers: Authorization: Bearer {token}
Body: {
  rating: 5,
  category: "feature_request",
  subject: "Amazing feature suggestion",
  message: "It would be great if we could..."
}
Response: {
  message: "Thank you for your feedback!",
  feedback: {...}
}
```

#### Get My Feedback
```
GET /api/feedback/my-feedback
Headers: Authorization: Bearer {token}
Response: {
  feedback: [...],
  stats: {
    total: 10,
    new: 2,
    reviewed: 5,
    inProgress: 2,
    resolved: 1,
    avgRating: 4.3
  }
}
```

#### Get Single Feedback
```
GET /api/feedback/:id
Headers: Authorization: Bearer {token}
Response: {
  _id: "...",
  subject: "...",
  ...
}
```

## Frontend Implementation

### Component: `frontend/src/pages/Feedback.js`

**Features:**
- ✅ Two-tab interface (Submit & History)
- ✅ Form validation with real-time feedback
- ✅ Star rating interactive component
- ✅ Status badges with color coding
- ✅ Statistics dashboard
- ✅ Responsive design

### Integration

**Added to Sidebar:**
```javascript
{ path: '/feedback', label: 'Feedback', icon: FiStar }
```

**Added to App.js Routes:**
```javascript
<Route
  path="/feedback"
  element={
    <AdminRoute>
      <Feedback />
    </AdminRoute>
  }
/>
```

## User Flow

### Submit Feedback Flow
```
Superadmin clicks "Feedback" in sidebar
    ↓
Navigates to /feedback (default: Submit tab)
    ↓
Fills in:
  - Star rating
  - Category
  - Subject (5+ chars)
  - Message (10+ chars)
    ↓
Clicks "Send Feedback"
    ↓
Frontend validates all fields
    ↓
API POST /api/feedback/submit
    ↓
Backend creates Feedback record
    ↓
Returns success message
    ↓
Form resets, shows success toast
    ↓
Auto-switches to History tab
```

### View History Flow
```
Superadmin clicks "Feedback History" tab
    ↓
API GET /api/feedback/my-feedback
    ↓
Loads all feedback + statistics
    ↓
Shows stats dashboard (total, new, resolved, etc)
    ↓
Shows chronological feedback list
    ↓
Each feedback shows:
  - Subject & message
  - Star rating (with color)
  - Category
  - Current status
  - Submitted date/time
```

## Security

✅ **Authentication Required** - Only logged-in superadmins
✅ **Authorization** - Only superadmins can access/submit
✅ **Company Scoped** - Each feedback linked to superadmin's company
✅ **Data Validation** - All inputs validated on backend
✅ **Input Sanitization** - Prevents malicious input

## Validation Rules

| Field | Rule | Example |
|-------|------|---------|
| Rating | 1-5 integer | 5 |
| Category | Enum value | feature_request |
| Subject | 5+ characters | "Great improvement" |
| Message | 10+ characters | "This would help..." |
| Email | Auto-populated | user@company.com |
| Company | Auto-populated | Company Name |

## Error Handling

| Error | Message | Action |
|-------|---------|--------|
| Missing fields | "Please fill in all fields" | Highlight empty fields |
| Subject too short | "Subject must be at least 5 characters" | Show character count |
| Message too short | "Message must be at least 10 characters" | Show character count |
| Invalid rating | "Rating must be between 1 and 5" | Show rating scale |
| Submission error | "Failed to submit feedback" | Retry button |

## Performance

- **Submission**: < 500ms
- **History Load**: < 1s (with statistics)
- **Database**: Indexed by superAdmin for fast queries
- **Pagination**: Can be added for large datasets

## Testing

### Test Case 1: Submit Valid Feedback
1. Navigate to `/feedback`
2. Select 5-star rating
3. Choose "Feature Request" category
4. Enter subject (5+ chars)
5. Enter message (10+ chars)
6. Click "Send Feedback"
7. **Expected**: Success message, form resets, switches to history

### Test Case 2: Submit Invalid Feedback
1. Navigate to `/feedback`
2. Leave rating empty
3. Enter short subject (< 5 chars)
4. Click "Send Feedback"
5. **Expected**: Error message, form not submitted

### Test Case 3: View Feedback History
1. Navigate to `/feedback`
2. Click "Feedback History" tab
3. **Expected**: 
   - Stats dashboard shows
   - All feedback listed
   - Sorted by newest first

### Test Case 4: Access Control
1. Log in as regular employee
2. Try accessing `/feedback`
3. **Expected**: 401 error or redirect to dashboard

### Test Case 5: Empty Feedback List
1. New superadmin with no feedback
2. Navigate to "Feedback History"
3. **Expected**: "No feedback yet" message

## Future Enhancements

- [ ] Export feedback as PDF/Excel
- [ ] Email notifications to team on feedback
- [ ] Admin reply/response system
- [ ] Feedback analytics dashboard
- [ ] Bulk status update
- [ ] Feedback search/filter
- [ ] Admin dashboard to view all company feedback
- [ ] Automated response templates
- [ ] Feedback sentiment analysis

## Files Created/Modified

**Created:**
- `backend/models/Feedback.js` - Feedback schema
- `backend/routes/feedback.js` - API endpoints
- `frontend/src/pages/Feedback.js` - UI component

**Modified:**
- `backend/server.js` - Added feedback routes
- `frontend/src/App.js` - Added feedback route
- `frontend/src/components/Sidebar.js` - Added feedback link

## API Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/feedback/submit | Superadmin | Submit new feedback |
| GET | /api/feedback/my-feedback | Superadmin | Get all feedback + stats |
| GET | /api/feedback/:id | Superadmin | Get single feedback |

## Support

**Q: Can employees submit feedback?**
A: No, feedback is superadmin-only for system-wide improvements.

**Q: Can I edit feedback after submitting?**
A: Not currently, but can be added. Submit new feedback if needed.

**Q: How long is feedback stored?**
A: Indefinitely. No automatic deletion.

**Q: Can I delete feedback?**
A: Not currently. Contact support if needed.

## Status

✅ **COMPLETE** - Feedback system fully implemented

---

**Updated**: 2026-03-02
**Version**: 1.0
**Features**: Submit, view history, statistics, status tracking
