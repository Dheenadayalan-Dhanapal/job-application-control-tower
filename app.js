// Job Application Control Tower - Main Application Logic

class JobTracker {
    constructor() {
        this.applications = [];
        this.currentFilter = { search: '', status: '', sort: 'dateDesc' };
        this.editingId = null;
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateStats();
        this.renderApplications();
        this.updateReminders();
        this.updateReplies();
        this.updateAnalytics();
    }

    // Data Management
    loadData() {
        const stored = localStorage.getItem('jobApplications');
        if (stored) {
            this.applications = JSON.parse(stored);
        }
    }

    saveData() {
        localStorage.setItem('jobApplications', JSON.stringify(this.applications));
        this.updateStats();
        this.renderApplications();
        this.updateReminders();
        this.updateReplies();
        this.updateAnalytics();

        // Sync to cloud if user is signed in
        if (window.firebaseAuth && window.firebaseAuth.getCurrentUser()) {
            window.firebaseAuth.syncToCloud(this.applications);
        }
    }

    generateId() {
        return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Event Listeners
    setupEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.closest('.nav-tab').dataset.tab));
        });

        // Application Modal
        document.getElementById('addApplicationBtn').addEventListener('click', () => this.openApplicationModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeApplicationModal());
        document.getElementById('cancelModal').addEventListener('click', () => this.closeApplicationModal());
        document.getElementById('applicationForm').addEventListener('submit', (e) => this.saveApplication(e));

        // Reply Modal
        document.getElementById('closeReplyModal').addEventListener('click', () => this.closeReplyModal());
        document.getElementById('cancelReplyModal').addEventListener('click', () => this.closeReplyModal());
        document.getElementById('replyForm').addEventListener('submit', (e) => this.saveReply(e));

        // Filters
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilter.search = e.target.value;
            this.renderApplications();
        });
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentFilter.status = e.target.value;
            this.renderApplications();
        });
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.currentFilter.sort = e.target.value;
            this.renderApplications();
        });
        document.getElementById('clearFilters').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            document.getElementById('statusFilter').value = '';
            document.getElementById('sortBy').value = 'dateDesc';
            this.currentFilter = { search: '', status: '', sort: 'dateDesc' };
            this.renderApplications();
        });

        // Data Import/Export
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importDataBtn').addEventListener('click', () => this.importData());

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.closest('.modal').classList.add('hidden');
                }
            });
        });

        // Set today's date as default for date fields
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateApplied').value = today;
        document.getElementById('replyDate').value = today;

        // Firebase Auth Buttons
        document.getElementById('signInBtn')?.addEventListener('click', () => {
            if (window.firebaseAuth) {
                window.firebaseAuth.signIn();
            } else {
                alert('Firebase authentication is not yet configured. Please contact support.');
            }
        });

        document.getElementById('signOutBtn')?.addEventListener('click', () => {
            if (window.firebaseAuth) {
                window.firebaseAuth.signOut();
            }
        });
    }

    // Tab Switching
    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
            content.classList.remove('active');
        });
        const targetTab = document.getElementById(`${tabName}Tab`);
        targetTab.classList.remove('hidden');
        targetTab.classList.add('active');

        // Update data for specific tabs
        if (tabName === 'reminders') this.updateReminders();
        if (tabName === 'replies') this.updateReplies();
        if (tabName === 'analytics') this.updateAnalytics();
    }

    // Statistics
    updateStats() {
        const total = this.applications.length;
        const withReplies = this.applications.filter(app => app.hrReplies && app.hrReplies.length > 0).length;
        const offers = this.applications.filter(app => app.status === 'offer').length;

        document.getElementById('totalApplications').textContent = total;
        document.getElementById('pendingFollowups').textContent = this.getPendingFollowups().length;
        document.getElementById('responseRate').textContent = total > 0 ? Math.round((withReplies / total) * 100) + '%' : '0%';
        document.getElementById('successRate').textContent = total > 0 ? Math.round((offers / total) * 100) + '%' : '0%';
    }

    getPendingFollowups() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.applications.filter(app => {
            if (!app.followUpDate || app.status === 'rejected' || app.status === 'withdrawn' || app.status === 'offer') {
                return false;
            }
            const followUpDate = new Date(app.followUpDate);
            followUpDate.setHours(0, 0, 0, 0);
            return followUpDate <= today;
        });
    }

    // Application Modal
    openApplicationModal(applicationId = null) {
        this.editingId = applicationId;
        const modal = document.getElementById('applicationModal');
        const form = document.getElementById('applicationForm');

        if (applicationId) {
            const app = this.applications.find(a => a.id === applicationId);
            if (app) {
                document.getElementById('modalTitle').textContent = 'Edit Application';
                document.getElementById('applicationId').value = app.id;
                document.getElementById('companyName').value = app.companyName;
                document.getElementById('jobTitle').value = app.jobTitle;
                document.getElementById('dateApplied').value = app.dateApplied;
                document.getElementById('status').value = app.status;
                document.getElementById('location').value = app.location || '';
                document.getElementById('salary').value = app.salary || '';
                document.getElementById('jobLink').value = app.jobLink || '';
                document.getElementById('reminderDays').value = app.reminderDays || 7;
                document.getElementById('notes').value = app.notes || '';
            }
        } else {
            document.getElementById('modalTitle').textContent = 'Add Application';
            form.reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('dateApplied').value = today;
        }

        modal.classList.remove('hidden');
    }

    closeApplicationModal() {
        document.getElementById('applicationModal').classList.add('hidden');
        document.getElementById('applicationForm').reset();
        this.editingId = null;
    }

    saveApplication(e) {
        e.preventDefault();

        const formData = {
            companyName: document.getElementById('companyName').value.trim(),
            jobTitle: document.getElementById('jobTitle').value.trim(),
            dateApplied: document.getElementById('dateApplied').value,
            status: document.getElementById('status').value,
            location: document.getElementById('location').value.trim(),
            salary: document.getElementById('salary').value.trim(),
            jobLink: document.getElementById('jobLink').value.trim(),
            reminderDays: parseInt(document.getElementById('reminderDays').value) || 7,
            notes: document.getElementById('notes').value.trim(),
        };

        // Calculate follow-up date
        const appliedDate = new Date(formData.dateApplied);
        const followUpDate = new Date(appliedDate);
        followUpDate.setDate(followUpDate.getDate() + formData.reminderDays);
        formData.followUpDate = followUpDate.toISOString().split('T')[0];

        if (this.editingId) {
            // Update existing
            const index = this.applications.findIndex(a => a.id === this.editingId);
            if (index !== -1) {
                this.applications[index] = {
                    ...this.applications[index],
                    ...formData,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Create new
            const newApplication = {
                id: this.generateId(),
                ...formData,
                hrReplies: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.applications.push(newApplication);
        }

        this.saveData();
        this.closeApplicationModal();
    }

    deleteApplication(id) {
        if (confirm('Are you sure you want to delete this application?')) {
            this.applications = this.applications.filter(a => a.id !== id);
            this.saveData();
        }
    }

    // Render Applications
    renderApplications() {
        const container = document.getElementById('applicationsList');
        const emptyState = document.getElementById('emptyState');

        let filtered = this.filterApplications();
        filtered = this.sortApplications(filtered);

        if (filtered.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        container.innerHTML = filtered.map(app => this.createApplicationCard(app)).join('');

        // Add event listeners to action buttons
        filtered.forEach(app => {
            document.querySelector(`[data-edit-id="${app.id}"]`)?.addEventListener('click', () => this.openApplicationModal(app.id));
            document.querySelector(`[data-delete-id="${app.id}"]`)?.addEventListener('click', () => this.deleteApplication(app.id));
            document.querySelector(`[data-reply-id="${app.id}"]`)?.addEventListener('click', () => this.openReplyModal(app.id));
        });
    }

    filterApplications() {
        return this.applications.filter(app => {
            const matchesSearch = !this.currentFilter.search ||
                app.companyName.toLowerCase().includes(this.currentFilter.search.toLowerCase()) ||
                app.jobTitle.toLowerCase().includes(this.currentFilter.search.toLowerCase());

            const matchesStatus = !this.currentFilter.status || app.status === this.currentFilter.status;

            return matchesSearch && matchesStatus;
        });
    }

    sortApplications(apps) {
        const sorted = [...apps];

        switch (this.currentFilter.sort) {
            case 'dateDesc':
                sorted.sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));
                break;
            case 'dateAsc':
                sorted.sort((a, b) => new Date(a.dateApplied) - new Date(b.dateApplied));
                break;
            case 'company':
                sorted.sort((a, b) => a.companyName.localeCompare(b.companyName));
                break;
            case 'status':
                sorted.sort((a, b) => a.status.localeCompare(b.status));
                break;
        }

        return sorted;
    }

    createApplicationCard(app) {
        const reminderStatus = this.getReminderStatus(app);
        const hasReplies = app.hrReplies && app.hrReplies.length > 0;

        return `
            <div class="application-card fade-in">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <h3 class="text-lg font-bold text-white mb-1">${this.escapeHtml(app.companyName)}</h3>
                                <p class="text-gray-300 font-medium">${this.escapeHtml(app.jobTitle)}</p>
                            </div>
                        </div>
                        
                        <div class="flex flex-wrap gap-2 mt-3">
                            <span class="status-badge status-${app.status}">${this.formatStatus(app.status)}</span>
                            ${reminderStatus ? `<span class="reminder-${reminderStatus.type}">${reminderStatus.text}</span>` : ''}
                            ${hasReplies ? `<span class="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">${app.hrReplies.length} ${app.hrReplies.length === 1 ? 'Reply' : 'Replies'}</span>` : ''}
                        </div>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                            <div>
                                <span class="text-gray-400 block">Applied</span>
                                <span class="text-white font-medium">${this.formatDate(app.dateApplied)}</span>
                            </div>
                            ${app.location ? `
                            <div>
                                <span class="text-gray-400 block">Location</span>
                                <span class="text-white font-medium">${this.escapeHtml(app.location)}</span>
                            </div>
                            ` : ''}
                            ${app.salary ? `
                            <div>
                                <span class="text-gray-400 block">Salary</span>
                                <span class="text-white font-medium">${this.escapeHtml(app.salary)}</span>
                            </div>
                            ` : ''}
                            ${app.followUpDate ? `
                            <div>
                                <span class="text-gray-400 block">Follow-up</span>
                                <span class="text-white font-medium">${this.formatDate(app.followUpDate)}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        ${app.notes ? `
                        <div class="mt-3 p-3 bg-gray-800/40 rounded-lg">
                            <p class="text-sm text-gray-300">${this.escapeHtml(app.notes)}</p>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex md:flex-col gap-2">
                        <button class="action-btn" data-edit-id="${app.id}" title="Edit">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button class="action-btn" data-reply-id="${app.id}" title="Add HR Reply">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                            </svg>
                        </button>
                        ${app.jobLink ? `
                        <a href="${this.escapeHtml(app.jobLink)}" target="_blank" class="action-btn" title="View Job">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                        </a>
                        ` : ''}
                        <button class="action-btn hover:!bg-red-500/20 hover:!border-red-500/50 hover:!text-red-500" data-delete-id="${app.id}" title="Delete">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getReminderStatus(app) {
        if (!app.followUpDate || app.status === 'rejected' || app.status === 'withdrawn' || app.status === 'offer') {
            return null;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const followUpDate = new Date(app.followUpDate);
        followUpDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((followUpDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { type: 'overdue', text: `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}` };
        } else if (diffDays <= 3) {
            return { type: 'upcoming', text: `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}` };
        } else {
            return { type: 'ok', text: `Due in ${diffDays} days` };
        }
    }

    // Reply Modal
    openReplyModal(applicationId) {
        document.getElementById('replyApplicationId').value = applicationId;
        const app = this.applications.find(a => a.id === applicationId);
        if (app) {
            document.querySelector('#replyModal h3').textContent = `Add HR Reply - ${app.companyName}`;
        }
        document.getElementById('replyModal').classList.remove('hidden');
    }

    closeReplyModal() {
        document.getElementById('replyModal').classList.add('hidden');
        document.getElementById('replyForm').reset();
    }

    saveReply(e) {
        e.preventDefault();

        const applicationId = document.getElementById('replyApplicationId').value;
        const replyData = {
            id: 'reply_' + Date.now(),
            date: document.getElementById('replyDate').value,
            sentiment: document.querySelector('input[name="sentiment"]:checked').value,
            stage: document.getElementById('replyStage').value,
            content: document.getElementById('replyContent').value.trim(),
        };

        const appIndex = this.applications.findIndex(a => a.id === applicationId);
        if (appIndex !== -1) {
            if (!this.applications[appIndex].hrReplies) {
                this.applications[appIndex].hrReplies = [];
            }
            this.applications[appIndex].hrReplies.push(replyData);
            this.applications[appIndex].updatedAt = new Date().toISOString();
        }

        this.saveData();
        this.closeReplyModal();
    }

    // Update Reminders Tab
    updateReminders() {
        const container = document.getElementById('remindersList');
        const emptyState = document.getElementById('remindersEmptyState');

        const reminders = this.getPendingFollowups();

        if (reminders.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        // Sort by follow-up date
        reminders.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

        container.innerHTML = reminders.map(app => {
            const reminderStatus = this.getReminderStatus(app);
            return `
                <div class="application-card">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-bold">${this.escapeHtml(app.companyName)}</h3>
                                ${reminderStatus ? `<span class="reminder-${reminderStatus.type}">${reminderStatus.text}</span>` : ''}
                            </div>
                            <p class="text-gray-300 mb-2">${this.escapeHtml(app.jobTitle)}</p>
                            <div class="flex gap-4 text-sm">
                                <div>
                                    <span class="text-gray-400">Applied:</span>
                                    <span class="text-white font-medium ml-1">${this.formatDate(app.dateApplied)}</span>
                                </div>
                                <div>
                                    <span class="text-gray-400">Follow-up:</span>
                                    <span class="text-white font-medium ml-1">${this.formatDate(app.followUpDate)}</span>
                                </div>
                            </div>
                        </div>
                        <button onclick="jobTracker.openApplicationModal('${app.id}')" class="px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-blue rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update Replies Tab
    updateReplies() {
        const container = document.getElementById('repliesList');
        const emptyState = document.getElementById('repliesEmptyState');

        const appsWithReplies = this.applications.filter(app => app.hrReplies && app.hrReplies.length > 0);

        if (appsWithReplies.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        container.innerHTML = appsWithReplies.map(app => {
            return `
                <div class="glass-card p-5 rounded-xl">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-bold">${this.escapeHtml(app.companyName)}</h3>
                            <p class="text-gray-400 text-sm">${this.escapeHtml(app.jobTitle)}</p>
                        </div>
                        <span class="status-badge status-${app.status}">${this.formatStatus(app.status)}</span>
                    </div>
                    
                    <div class="space-y-3">
                        ${app.hrReplies.map(reply => `
                            <div class="reply-card reply-${reply.sentiment}">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-semibold uppercase px-2 py-1 rounded ${reply.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                    reply.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                }">
                                            ${reply.sentiment}
                                        </span>
                                        <span class="text-xs text-gray-400">${this.formatStage(reply.stage)}</span>
                                    </div>
                                    <span class="text-xs text-gray-400">${this.formatDate(reply.date)}</span>
                                </div>
                                <p class="text-sm text-gray-300">${this.escapeHtml(reply.content)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update Analytics
    updateAnalytics() {
        if (window.heatmapManager) {
            window.heatmapManager.updateHeatmap();
        }
        if (window.analyticsManager) {
            window.analyticsManager.updateInsights();
        }
    }

    // Data Export/Import
    exportData() {
        const dataStr = JSON.stringify(this.applications, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `job-applications-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const imported = JSON.parse(event.target.result);
                        if (Array.isArray(imported)) {
                            if (confirm(`This will import ${imported.length} applications. Current data will be merged. Continue?`)) {
                                this.applications = [...this.applications, ...imported];
                                this.saveData();
                                alert('Data imported successfully!');
                            }
                        } else {
                            alert('Invalid file format');
                        }
                    } catch (err) {
                        alert('Error parsing file: ' + err.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // Utility Functions
    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    formatStatus(status) {
        const statusMap = {
            'applied': 'Applied',
            'interview': 'Interview',
            'offer': 'Offer',
            'rejected': 'Rejected',
            'withdrawn': 'Withdrawn'
        };
        return statusMap[status] || status;
    }

    formatStage(stage) {
        const stageMap = {
            'initial_screening': 'Initial Screening',
            'interview': 'Interview',
            'offer': 'Offer',
            'rejection': 'Rejection'
        };
        return stageMap[stage] || stage;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize the application
const jobTracker = new JobTracker();
