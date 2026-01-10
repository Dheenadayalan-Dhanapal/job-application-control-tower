// Heatmap Visualization Module

class HeatmapManager {
    constructor(jobTracker) {
        this.jobTracker = jobTracker;
        this.currentView = 'time';
        this.dateFrom = null;
        this.dateTo = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('heatmapView')?.addEventListener('change', (e) => {
            this.currentView = e.target.value;
            this.updateHeatmap();
        });

        document.getElementById('dateFrom')?.addEventListener('change', (e) => {
            this.dateFrom = e.target.value;
            this.updateHeatmap();
        });

        document.getElementById('dateTo')?.addEventListener('change', (e) => {
            this.dateTo = e.target.value;
            this.updateHeatmap();
        });
    }

    updateHeatmap() {
        const container = document.getElementById('heatmapContainer');

        if (!container) return;

        const filteredApps = this.filterByDateRange();

        if (filteredApps.length === 0) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                        <svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-2">No Data Available</h3>
                    <p class="text-gray-400">Add more applications to see the rejection heatmap</p>
                </div>
            `;
            return;
        }

        switch (this.currentView) {
            case 'time':
                this.renderTimeBasedHeatmap(container, filteredApps);
                break;
            case 'company':
                this.renderCompanyBasedHeatmap(container, filteredApps);
                break;
            case 'role':
                this.renderRoleBasedHeatmap(container, filteredApps);
                break;
        }
    }

    filterByDateRange() {
        let apps = [...this.jobTracker.applications];

        if (this.dateFrom) {
            apps = apps.filter(app => app.dateApplied >= this.dateFrom);
        }

        if (this.dateTo) {
            apps = apps.filter(app => app.dateApplied <= this.dateTo);
        }

        return apps;
    }

    renderTimeBasedHeatmap(container, apps) {
        const monthlyData = this.aggregateByMonth(apps);
        const maxRejections = Math.max(...Object.values(monthlyData).map(d => d.rejected), 1);

        container.innerHTML = `
            <h3 class="text-lg font-semibold mb-4">Rejection Rate by Month</h3>
            <div class="space-y-3">
                ${Object.entries(monthlyData)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([month, data]) => {
                    const rejectionRate = data.total > 0 ? (data.rejected / data.total * 100).toFixed(1) : 0;
                    const intensity = data.rejected / maxRejections;
                    const bgColor = this.getHeatmapColor(intensity);

                    return `
                            <div class="heatmap-row" style="background: ${bgColor}; padding: 16px; rounded: 12px; border-radius: 12px;">
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <div class="font-semibold text-lg">${this.formatMonth(month)}</div>
                                        <div class="text-sm text-gray-300 mt-1">
                                            ${data.total} applications • ${data.rejected} rejected • ${data.interview} interviews • ${data.offer} offers
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-2xl font-bold ${rejectionRate > 50 ? 'text-red-400' : rejectionRate > 30 ? 'text-yellow-400' : 'text-green-400'}">
                                            ${rejectionRate}%
                                        </div>
                                        <div class="text-xs text-gray-400">rejection rate</div>
                                    </div>
                                </div>
                                <div class="mt-3 h-2 bg-gray-900/50 rounded-full overflow-hidden">
                                    <div class="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all" style="width: ${rejectionRate}%"></div>
                                </div>
                            </div>
                        `;
                }).join('')}
            </div>
        `;
    }

    renderCompanyBasedHeatmap(container, apps) {
        const companyData = this.aggregateByCompany(apps);
        const sortedCompanies = Object.entries(companyData)
            .sort((a, b) => b[1].rejected - a[1].rejected)
            .slice(0, 15); // Show top 15 companies

        if (sortedCompanies.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-400">
                    <p>No company data available for the selected date range</p>
                </div>
            `;
            return;
        }

        const maxRejections = Math.max(...sortedCompanies.map(([, data]) => data.rejected), 1);

        container.innerHTML = `
            <h3 class="text-lg font-semibold mb-4">Rejection Rate by Company (Top 15)</h3>
            <div class="space-y-2">
                ${sortedCompanies.map(([company, data]) => {
            const rejectionRate = data.total > 0 ? (data.rejected / data.total * 100).toFixed(1) : 0;
            const intensity = data.rejected / maxRejections;
            const bgColor = this.getHeatmapColor(intensity * 0.5);

            return `
                        <div class="heatmap-row" style="background: ${bgColor}; padding: 12px; border-radius: 10px;">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="font-semibold">${this.escapeHtml(company)}</div>
                                    <div class="text-xs text-gray-400 mt-1">
                                        ${data.total} applications • ${data.rejected} rejected
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <div class="text-right min-w-[80px]">
                                        <div class="text-lg font-bold ${rejectionRate > 66 ? 'text-red-400' : rejectionRate > 33 ? 'text-yellow-400' : 'text-green-400'}">
                                            ${rejectionRate}%
                                        </div>
                                    </div>
                                    <div class="w-32 h-1.5 bg-gray-900/50 rounded-full overflow-hidden">
                                        <div class="h-full bg-gradient-to-r from-red-500 to-red-600" style="width: ${rejectionRate}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    renderRoleBasedHeatmap(container, apps) {
        const roleData = this.aggregateByRole(apps);
        const sortedRoles = Object.entries(roleData)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 15); // Show top 15 roles

        if (sortedRoles.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-400">
                    <p>No role data available for the selected date range</p>
                </div>
            `;
            return;
        }

        const maxApplications = Math.max(...sortedRoles.map(([, data]) => data.total), 1);

        container.innerHTML = `
            <h3 class="text-lg font-semibold mb-4">Success Rate by Job Role (Top 15)</h3>
            <div class="space-y-2">
                ${sortedRoles.map(([role, data]) => {
            const successRate = data.total > 0 ? ((data.interview + data.offer) / data.total * 100).toFixed(1) : 0;
            const rejectionRate = data.total > 0 ? (data.rejected / data.total * 100).toFixed(1) : 0;
            const barWidth = (data.total / maxApplications * 100);

            return `
                        <div class="heatmap-row" style="background: rgba(31, 41, 55, 0.4); padding: 12px; border-radius: 10px;">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex-1">
                                    <div class="font-semibold">${this.escapeHtml(role)}</div>
                                    <div class="text-xs text-gray-400 mt-1">
                                        ${data.total} applications
                                    </div>
                                </div>
                                <div class="flex gap-4 text-xs">
                                    <div class="text-center">
                                        <div class="font-bold text-green-400">${successRate}%</div>
                                        <div class="text-gray-500">success</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="font-bold text-red-400">${rejectionRate}%</div>
                                        <div class="text-gray-500">rejected</div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex gap-1 h-2 rounded-full overflow-hidden" style="width: ${barWidth}%">
                                ${data.offer > 0 ? `<div class="bg-green-500" style="flex: ${data.offer}"></div>` : ''}
                                ${data.interview > 0 ? `<div class="bg-blue-500" style="flex: ${data.interview}"></div>` : ''}
                                ${data.applied > 0 ? `<div class="bg-gray-500" style="flex: ${data.applied}"></div>` : ''}
                                ${data.rejected > 0 ? `<div class="bg-red-500" style="flex: ${data.rejected}"></div>` : ''}
                            </div>
                            <div class="flex gap-3 mt-2 text-xs">
                                <span class="flex items-center gap-1">
                                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                                    ${data.offer} offers
                                </span>
                                <span class="flex items-center gap-1">
                                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                                    ${data.interview} interviews
                                </span>
                                <span class="flex items-center gap-1">
                                    <span class="w-2 h-2 rounded-full bg-gray-500"></span>
                                    ${data.applied} pending
                                </span>
                                <span class="flex items-center gap-1">
                                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                                    ${data.rejected} rejected
                                </span>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    aggregateByMonth(apps) {
        const monthlyData = {};

        apps.forEach(app => {
            const date = new Date(app.dateApplied);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    total: 0,
                    applied: 0,
                    interview: 0,
                    offer: 0,
                    rejected: 0,
                    withdrawn: 0
                };
            }

            monthlyData[monthKey].total++;
            monthlyData[monthKey][app.status]++;
        });

        return monthlyData;
    }

    aggregateByCompany(apps) {
        const companyData = {};

        apps.forEach(app => {
            if (!companyData[app.companyName]) {
                companyData[app.companyName] = {
                    total: 0,
                    applied: 0,
                    interview: 0,
                    offer: 0,
                    rejected: 0,
                    withdrawn: 0
                };
            }

            companyData[app.companyName].total++;
            companyData[app.companyName][app.status]++;
        });

        return companyData;
    }

    aggregateByRole(apps) {
        const roleData = {};

        apps.forEach(app => {
            if (!roleData[app.jobTitle]) {
                roleData[app.jobTitle] = {
                    total: 0,
                    applied: 0,
                    interview: 0,
                    offer: 0,
                    rejected: 0,
                    withdrawn: 0
                };
            }

            roleData[app.jobTitle].total++;
            roleData[app.jobTitle][app.status]++;
        });

        return roleData;
    }

    getHeatmapColor(intensity) {
        // intensity from 0 to 1
        const colors = [
            'rgba(31, 41, 55, 0.3)',    // Very low
            'rgba(59, 130, 246, 0.2)',  // Low
            'rgba(251, 191, 36, 0.2)',  // Medium
            'rgba(239, 68, 68, 0.2)',   // High
            'rgba(220, 38, 38, 0.3)'    // Very high
        ];

        const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
        return colors[index];
    }

    formatMonth(monthKey) {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

// Initialize heatmap after jobTracker is ready
if (typeof jobTracker !== 'undefined') {
    window.heatmapManager = new HeatmapManager(jobTracker);
}
