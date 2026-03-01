# Google OAuth Setup for Employee Invitations

## Overview

Employees invited by Super Admin will **only sign in via Google OAuth**. No password required.

The flow:
1. Super Admin invites employee → Email sent with link
2. Employee clicks link → `/join?token=xyz`
3. Employee sees invitation details
4. Employee clicks "Sign in with Google"
5. Auto-created account ← Profile already set by Super Admin
6. Access CRM immediately

---

## Setup Steps

### Step 1: Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "CRM App"
3. Enable OAuth 2.0:
   - APIs & Services → OAuth consent screen
   - Create consent screen (External)
   - Fill in app info

4. Create OAuth credentials:
   - APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/auth/google/callback
     https://yourdomain.com/auth/google/callback
     ```
   - Copy Client ID and Secret

---

### Step 2: Install Google OAuth Library

```bash
cd frontend
npm install @react-oauth/google
```

---

### Step 3: Frontend Setup

Wrap your App with GoogleOAuthProvider:

**frontend/src/index.js:**
```javascript
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
    <Provider store={store}>
      <App />
    </Provider>
  </GoogleOAuthProvider>
);
```

---

### Step 4: Update JoinViaInvitation Component

Replace the Google sign-in handler in `frontend/src/pages/JoinViaInvitation.js`:

```javascript
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const JoinViaInvitation = () => {
  // ... existing code ...

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setSigningIn(true);

        // Get user info from Google
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v1/userinfo',
          {
            headers: { Authorization: `Bearer ${codeResponse.access_token}` }
          }
        );

        // Accept invitation with Google credentials
        const response = await axios.post(`${API_URL}/api/oauth/accept-invitation`, {
          invitationToken: token,
          googleEmail: userInfo.data.email,
          googleName: userInfo.data.name,
          googleId: userInfo.data.id
        });

        // Save token to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('company', JSON.stringify(response.data.company));

        toast.success(response.data.message);
        navigate('/');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to join workspace');
      } finally {
        setSigningIn(false);
      }
    },
    onError: () => {
      toast.error('Google sign-in failed');
    }
  });

  // ... rest of component ...
  return (
    // ... existing UI ...
    <button onClick={() => handleGoogleSignIn()} disabled={signingIn}>
      Sign in with Google
    </button>
  );
};
```

---

## How It Works

### Super Admin Flow:
```
Super Admin:
├── Go to "My Employees"
├── Click "Invite Employee"
├── Fill: Name, Email, Role, Department
├── Click "Send Invitation"
└── Email sent to employee with link
```

### Employee Flow:
```
Employee:
├── Receives email with link: /join?token=xyz
├── Clicks link
├── Sees invitation details (role, company)
├── Clicks "Sign in with Google"
├── Google login popup opens
├── Selects their Google account
└── Auto-created account + Auto login
    └── Access CRM dashboard
```

---

## Security Features

✅ **Email Verification**: Employee must use email from invitation
✅ **No Password**: OAuth only (more secure)
✅ **Data Control**: Super Admin sets role + department
✅ **Expiring Links**: Invitations expire in 7 days
✅ **One-Click Join**: No data entry from employee

---

## Environment Variables

Add to `frontend/.env`:
```
REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
```

---

## API Endpoints

### Get Invitation Details
```bash
GET /api/oauth/invitation/:token
```

Response:
```json
{
  "email": "john@example.com",
  "role": "sales",
  "company": {
    "id": "...",
    "name": "company-slug",
    "displayName": "Company Name"
  },
  "expiresAt": "2025-03-15T..."
}
```

### Accept Invitation (Google OAuth)
```bash
POST /api/oauth/accept-invitation
{
  "invitationToken": "xyz...",
  "googleEmail": "john@gmail.com",
  "googleName": "John Doe",
  "googleId": "123456"
}
```

Response:
```json
{
  "token": "jwt_token",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "sales"
  },
  "company": {
    "id": "...",
    "displayName": "Company Name"
  }
}
```

---

## Testing Locally

1. Start backend: `npm run dev` (port 5000)
2. Start frontend: `npm start` (port 3000)
3. Super Admin registers
4. Super Admin invites employee
5. Employee clicks link → `/join?token=xyz`
6. Employee signs in with Google
7. Auto-join workspace

---

## Troubleshooting

**Error: Invalid email match**
- Ensure employee signs in with the same Google account email as invitation

**Error: Invitation expired**
- Super Admin must resend invitation

**Error: Already member**
- Employee is already in workspace

---

## Production Checklist

- [ ] Create Google Cloud project
- [ ] Get Client ID and Secret
- [ ] Add production domain to OAuth consent
- [ ] Configure redirect URIs
- [ ] Add GOOGLE_CLIENT_ID to frontend
- [ ] Test with real Google account
- [ ] Monitor OAuth logs

---

This implementation is **secure, scalable, and user-friendly**! 🔒
