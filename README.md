# Job Application Control Tower 🎯

A premium, feature-rich dashboard for tracking job applications, managing follow-ups, and analyzing rejection patterns.

## Features

- 📊 **Application Tracking** - Full CRUD operations with filtering and sorting
- ⏰ **Follow-up Reminders** - Automated reminder system with visual indicators
- 💬 **HR Replies Storage** - Categorized responses with sentiment analysis
- 🔥 **Rejection Heatmap** - Interactive visualization of application patterns
- ☁️ **Cloud Sync** - Real-time synchronization powered by Firebase
- 🔐 **Secure Auth** - Google Sign-In with multi-user data isolation
- 📥 **Import/Export** - JSON-based data portability

## Tech Stack

- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **Backend & Auth**: Firebase (Authentication & Firestore)
- **Deployment**: Vercel

## Getting Started

Simply open `index.html` in your browser or visit the live deployment.

## Usage

1. **Add Applications** - Click "Add Application" to track new job submissions
2. **Set Reminders** - Automatic follow-up date calculation
3. **Track Responses** - Add HR replies with sentiment categorization
4. **Analyze Patterns** - View rejection heatmaps and insights

## Local Development

No build process required! Just open the files in your browser:

```bash
# Navigate to the project directory
cd job-tracker

# Open index.html in your browser
start index.html  # Windows
open index.html   # macOS
```

## Project Structure

```
job-tracker/
├── index.html      # Main HTML structure
├── styles.css      # Custom styles and animations
├── app.js          # Core application logic
├── reminders.js    # Reminder management
├── analytics.js    # Insights generation
└── heatmap.js      # Heatmap visualization
```

## Features Breakdown

### Application Tracking
- Add, edit, delete applications
- Filter by status, search by company/role
- Sort by date, company, or status
- Color-coded status badges

### Follow-up Reminders
- Automatic calculation based on application date
- Visual indicators (overdue, upcoming, ok)
- Notification badges on Reminders tab

### HR Replies
- Positive/Neutral/Negative sentiment categorization
- Stage tracking (screening, interview, offer, rejection)
- Full reply history per application

### Analytics & Heatmap
- Time-based rejection analysis
- Company-based success rates
- Role-based performance metrics
- Smart insights and recommendations

## Data Privacy

Your data is stored securely in **Google Firebase (Cloud Firestore)** when signed in, ensuring cross-device synchronization. For guest users, data remains in your browser's `LocalStorage`.

- **Multi-user Isolation**: Each user can only access their own data.
- **Secure Authentication**: Powerded by Google Firebase Auth.
- **Local Fallback**: Works offline using local storage.
- **Data Clearing**: User data is automatically cleared from the browser upon sign-out for enhanced privacy in shared environments.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

---

Built with ❤️ for job seekers everywhere
