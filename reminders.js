// Reminders Management Module

class RemindersManager {
    constructor(jobTracker) {
        this.jobTracker = jobTracker;
        this.init();
    }

    init() {
        // Check reminders on page load
        this.checkReminders();

        // Check reminders periodically (every hour)
        setInterval(() => this.checkReminders(), 3600000);
    }

    checkReminders() {
        const pending = this.jobTracker.getPendingFollowups();

        if (pending.length > 0) {
            this.showNotificationBadge(pending.length);
        }
    }

    showNotificationBadge(count) {
        const remindersTab = document.querySelector('[data-tab="reminders"]');
        if (!remindersTab) return;

        // Remove existing badge
        const existingBadge = remindersTab.querySelector('.notification-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Add new badge
        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.textContent = count;
            remindersTab.style.position = 'relative';
            remindersTab.appendChild(badge);
        }
    }

    getReminderPriority(app) {
        const reminderStatus = this.jobTracker.getReminderStatus(app);

        if (!reminderStatus) return 0;

        if (reminderStatus.type === 'overdue') return 3;
        if (reminderStatus.type === 'upcoming') return 2;
        return 1;
    }

    getUpcomingReminders(days = 7) {
        const today = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);

        return this.jobTracker.applications.filter(app => {
            if (!app.followUpDate || app.status === 'rejected' || app.status === 'withdrawn' || app.status === 'offer') {
                return false;
            }

            const followUpDate = new Date(app.followUpDate);
            return followUpDate >= today && followUpDate <= future;
        });
    }

    getOverdueReminders() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.jobTracker.applications.filter(app => {
            if (!app.followUpDate || app.status === 'rejected' || app.status === 'withdrawn' || app.status === 'offer') {
                return false;
            }

            const followUpDate = new Date(app.followUpDate);
            followUpDate.setHours(0, 0, 0, 0);
            return followUpDate < today;
        });
    }

    snoozeReminder(applicationId, days) {
        const app = this.jobTracker.applications.find(a => a.id === applicationId);
        if (app && app.followUpDate) {
            const currentDate = new Date(app.followUpDate);
            currentDate.setDate(currentDate.getDate() + days);
            app.followUpDate = currentDate.toISOString().split('T')[0];
            app.updatedAt = new Date().toISOString();
            this.jobTracker.saveData();
        }
    }

    dismissReminder(applicationId) {
        const app = this.jobTracker.applications.find(a => a.id === applicationId);
        if (app) {
            delete app.followUpDate;
            app.updatedAt = new Date().toISOString();
            this.jobTracker.saveData();
        }
    }

    getReminderStats() {
        const overdue = this.getOverdueReminders().length;
        const upcoming = this.getUpcomingReminders(3).length;
        const thisWeek = this.getUpcomingReminders(7).length;

        return {
            overdue,
            upcoming,
            thisWeek,
            total: overdue + thisWeek
        };
    }
}

// Initialize reminders after jobTracker is ready
if (window.jobTracker) {
    window.remindersManager = new RemindersManager(window.jobTracker);
} else {
    // Fallback in case of race condition
    document.addEventListener('DOMContentLoaded', () => {
        if (window.jobTracker) {
            window.remindersManager = new RemindersManager(window.jobTracker);
        }
    });
}
