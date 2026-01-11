# Firebase Setup Guide

## Quick Setup (5 minutes)

Follow these steps to enable cloud sync for your Job Application Control Tower.

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name your project: **job-application-tracker** (or any name you prefer)
4. Disable Google Analytics (not needed for this app)
5. Click "Create Project"

### Step 2: Set Up Web App

1. In your Firebase project, click the **Web icon** (</>) to add a web app
2. Register app with nickname: **Job Tracker**
3. Don't enable Firebase Hosting (we're using Vercel)
4. Click "Register App"
5. Copy the **firebaseConfig** object shown (you'll need this in Step 4)

### Step 3: Enable Authentication

1. In Firebase Console sidebar, click **Authentication**
2. Click "Get Started"
3. Click **Sign-in method** tab
4. Enable **Google** provider:
   - Click on "Google"
   - Toggle "Enable"
   - Select support email (your email)
   - Click "Save"

### Step 4: Enable Firestore Database

1. In Firebase Console sidebar, click **Firestore Database**
2. Click "Create database"
3. Start in **Production mode**
4. Choose your location (select closest to you)
5. Click "Enable"
6. Go to **Rules** tab
7. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

8. Click "Publish"

### Step 5: Configure Your App

1. Open `firebase-auth.js` in your code editor
2. Find the `firebaseConfig` object at the top (lines 4-10)
3. Replace `YOUR_API_KEY`, `YOUR_PROJECT_ID`, etc. with values from Step 2
4. Save the file

Your config should look like this (with your actual values):

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "job-application-tracker.firebaseapp.com",
    projectId: "job-application-tracker",
    storageBucket: "job-application-tracker.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
```

### Step 6: Add Authorized Domain (for Vercel deployment)

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Click "Add domain"
3. Add: `job-application-control-tower.vercel.app`
4. Click "Add"

### Step 7: Test Locally

1. Open `index.html` in your browser
2. Click "Sign In" button
3. Choose your Google account
4. Grant permissions
5. You should see your email and avatar in the header!
6. Add a test application
7. Check Firebase Console → Firestore Database → you should see your data!

### Step 8: Deploy to Vercel

Once everything works locally:

```bash
git add .
git commit -m "Add Firebase cloud sync with Google authentication"
git push origin main
```

Vercel will auto-deploy. Wait 30 seconds, then visit your live site!

---

## Verification Checklist

- [ ] Firebase project created
- [ ] Web app registered in Firebase
- [ ] Google authentication enabled
- [ ] Firestore database created with correct rules
- [ ] `firebase-auth.js` updated with your config
- [ ] Authorized domain added for Vercel
- [ ] Tested sign-in locally
- [ ] Data appears in Firestore console
- [ ] Deployed to Vercel
- [ ] Tested on live site

---

## Troubleshooting

### "Sign-in failed: auth/unauthorized-domain"
**Solution:** Add your domain to Firebase Console → Authentication → Settings → Authorized domains

### "Firebase not initialized"
**Solution:** Check that `firebaseConfig` in `firebase-auth.js` has your actual values (not placeholders)

### "Permission denied" when saving data
**Solution:** Verify Firestore security rules are correctly set (Step 4, item 7)

### Sign-in popup blocked
**Solution:** Allow popups for your site in browser settings

### Data not syncing
**Solution:** 
1. Check browser console for errors (F12)
2. Verify you're signed in (avatar should appear in header)
3. Check Firestore rules allow write access

---

## How It Works

### Data Flow

1. **User signs in** → Firebase Authentication
2. **User adds/edits application** → Saves to LocalStorage + Firestore simultaneously
3. **User clears cache** → LocalStorage deleted
4. **User signs in again** → Data downloaded from Firestore to LocalStorage
5. **Result:** All data restored!

### Multi-Device Sync

- Same Google account on different devices/browsers
- Data syncs automatically
- Most recent change wins

### Offline Support

- Works offline (LocalStorage)
- Syncs to cloud when back online
- No data loss!

---

## Security

- Each user can only access their own data
- Firebase handles authentication securely
- Data encrypted in transit (HTTPS)
- Firestore rules prevent unauthorized access

---

## Free Tier Limits

Firebase Free tier is very generous:
- **Authentication:** Unlimited users
- **Firestore:** 
  - 1 GB storage
  - 50,000 reads per day
  - 20,000 writes per day

For personal use tracking job applications, you'll never hit these limits!

---

## Next Steps

After cloud sync is working:
1. Add multiple applications
2. Test clearing browser cache
3. Sign in and verify data restored
4. Try on different device/browser
5. Enjoy never losing your data again! 🎉
