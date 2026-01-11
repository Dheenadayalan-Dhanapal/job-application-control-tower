// Firebase Configuration and Initialization
// Replace these with your actual Firebase project credentials

const firebaseConfig = {
    apiKey: "AIzaSyAghXg8weADnAGrOVuRZBsDqCU-UHAl1T8",
    authDomain: "job-application-tracker-831c2.firebaseapp.com",
    projectId: "job-application-tracker-831c2",
    storageBucket: "job-application-tracker-831c2.firebasestorage.app",
    messagingSenderId: "775540415620",
    appId: "1:775540415620:web:85848962ef0ad10692f6d1",
    measurementId: "G-1PRS2NVYNT"
};

// Initialize Firebase
let firebaseApp = null;
let auth = null;
let db = null;
let currentUser = null;

function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.log('Firebase SDK not loaded yet');
            return false;
        }

        if (!firebaseApp) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();

            // Set up auth state listener
            auth.onAuthStateChanged(handleAuthStateChanged);

            console.log('Firebase initialized successfully');
        }
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
}

// View Management
function showView(viewId) {
    const views = ['landingView', 'authView', 'dashboardView'];
    views.forEach(id => {
        const view = document.getElementById(id);
        if (view) {
            if (id === viewId) {
                view.classList.remove('hidden');
                view.classList.add('fade-in');
            } else {
                view.classList.add('hidden');
                view.classList.remove('fade-in');
            }
        }
    });
}

// Authentication Functions
function handleAuthStateChanged(user) {
    currentUser = user;
    updateAuthUI(user);

    if (user) {
        console.log('User signed in:', user.email);
        showView('dashboardView');
        // Sync data from cloud when user signs in
        syncFromCloud();
    } else {
        console.log('User signed out');
        showView('landingView');

        // Clear local data on sign-out for privacy in multi-user environments
        if (window.jobTracker) {
            window.jobTracker.applications = [];
            localStorage.removeItem('jobApplications');

            // Re-render UI to empty state
            window.jobTracker.updateStats();
            window.jobTracker.renderApplications();

            // Explicitly update all dependent views
            if (window.remindersManager) window.remindersManager.checkReminders();
            if (window.analyticsManager) window.analyticsManager.updateInsights();
            if (window.heatmapManager) window.heatmapManager.updateHeatmap();

            // Clear any lingering notification badges
            const badge = document.querySelector('.notification-badge');
            if (badge) badge.remove();
        }
    }
}

function signInWithGoogle() {
    if (!auth) {
        console.error('Firebase not initialized');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Sign-in successful:', result.user.email);
            showNotification('Signed in successfully! Syncing your data...', 'success');
        })
        .catch((error) => {
            console.error('Sign-in error:', error);
            showNotification('Sign-in failed: ' + error.message, 'error');
        });
}

function signOut() {
    if (!auth) return;

    auth.signOut()
        .then(() => {
            console.log('User signed out');
            showNotification('Signed out successfully', 'success');
        })
        .catch((error) => {
            console.error('Sign-out error:', error);
        });
}

function updateAuthUI(user) {
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userEmail = document.getElementById('userEmail');

    if (user) {
        // User is signed in
        if (signInBtn) signInBtn.classList.add('hidden');
        if (signOutBtn) signOutBtn.classList.remove('hidden');
        if (userInfo) userInfo.classList.remove('hidden');

        if (userAvatar && user.photoURL) {
            userAvatar.src = user.photoURL;
        }
        if (userEmail) {
            userEmail.textContent = user.email;
        }
    } else {
        // User is signed out
        if (signInBtn) signInBtn.classList.remove('hidden');
        if (signOutBtn) signOutBtn.classList.add('hidden');
        if (userInfo) userInfo.classList.add('hidden');
    }
}

// Landing & Auth Page Event Listeners
function setupLandingPageListeners() {
    const getStartedBtn = document.getElementById('getStartedBtn');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const viewDemoBtn = document.getElementById('viewDemoBtn');

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => showView('authView'));
    }

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', signInWithGoogle);
    }

    if (viewDemoBtn) {
        viewDemoBtn.addEventListener('click', () => {
            showNotification('Demo video coming soon!', 'info');
        });
    }
}

// Cloud Sync Functions
async function syncToCloud(applications) {
    if (!currentUser || !db) {
        console.log('Not signed in or Firebase not ready - skipping cloud sync');
        return;
    }

    try {
        showSyncStatus('syncing');

        const userRef = db.collection('users').doc(currentUser.uid);
        const batch = db.batch();

        // Delete existing applications
        const existingApps = await userRef.collection('applications').get();
        existingApps.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Add current applications
        applications.forEach(app => {
            const appRef = userRef.collection('applications').doc(app.id);
            batch.set(appRef, {
                ...app,
                syncedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        console.log('Synced to cloud:', applications.length, 'applications');
        showSyncStatus('synced');

    } catch (error) {
        console.error('Cloud sync error:', error);
        showSyncStatus('error');
        showNotification('Failed to sync to cloud: ' + error.message, 'error');
    }
}

async function syncFromCloud() {
    if (!currentUser || !db) {
        console.log('Not signed in or Firebase not ready');
        return;
    }

    try {
        showSyncStatus('syncing');

        const userRef = db.collection('users').doc(currentUser.uid);
        const snapshot = await userRef.collection('applications').get();

        if (snapshot.empty) {
            console.log('No data in cloud, keeping local data');
            // If no cloud data, sync local data to cloud
            if (window.jobTracker && window.jobTracker.applications.length > 0) {
                await syncToCloud(window.jobTracker.applications);
            }
            showSyncStatus('synced');
            return;
        }

        const cloudApplications = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            delete data.syncedAt; // Remove sync metadata
            cloudApplications.push(data);
        });

        console.log('Loaded from cloud:', cloudApplications.length, 'applications');

        // Update jobTracker with cloud data
        if (window.jobTracker) {
            window.jobTracker.applications = cloudApplications;
            window.jobTracker.saveData();
            showNotification(`Synced ${cloudApplications.length} applications from cloud`, 'success');
        }

        showSyncStatus('synced');

    } catch (error) {
        console.error('Cloud sync error:', error);
        showSyncStatus('error');
        showNotification('Failed to load from cloud: ' + error.message, 'error');
    }
}

function showSyncStatus(status) {
    const syncIndicator = document.getElementById('syncIndicator');
    if (!syncIndicator) return;

    syncIndicator.classList.remove('syncing', 'synced', 'error', 'hidden');

    if (status === 'syncing') {
        syncIndicator.classList.add('syncing');
        syncIndicator.innerHTML = `
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span class="text-xs">Syncing...</span>
        `;
    } else if (status === 'synced') {
        syncIndicator.classList.add('synced');
        syncIndicator.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="text-xs">Synced</span>
        `;
        // Hide after 3 seconds
        setTimeout(() => {
            syncIndicator.classList.add('hidden');
        }, 3000);
    } else if (status === 'error') {
        syncIndicator.classList.add('error');
        syncIndicator.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-xs">Sync failed</span>
        `;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Initialize Firebase when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // Setup landing page buttons
    setupLandingPageListeners();

    // Wait for Firebase SDK to load
    setTimeout(() => {
        const initialized = initializeFirebase();
        if (!initialized) {
            console.log('Firebase initialization delayed - will retry');
            // Retry after 2 seconds
            setTimeout(initializeFirebase, 2000);
        }
    }, 1000);
});

// Export functions for use in other modules
window.firebaseAuth = {
    signIn: signInWithGoogle,
    signOut: signOut,
    getCurrentUser: () => currentUser,
    syncToCloud: syncToCloud,
    syncFromCloud: syncFromCloud
};
