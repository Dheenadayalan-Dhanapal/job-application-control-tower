// Analytics and Insights Module

class AnalyticsManager {
    constructor(jobTracker) {
        this.jobTracker = jobTracker;
    }

    updateInsights() {
        const container = document.getElementById('insightsList');
        const insights = this.generateInsights();

        if (insights.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <p>Not enough data to generate insights yet.</p>
                    <p class="text-sm mt-2">Add more applications to see patterns and recommendations.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = insights.map(insight => `
            <div class="insight-card insight-${insight.type}">
                <div class="flex items-start gap-3">
                    <div class="mt-1">
                        ${this.getInsightIcon(insight.type)}
                    </div>
                    <div>
                        <h4 class="font-semibold mb-1">${insight.title}</h4>
                        <p class="text-sm text-gray-300">${insight.description}</p>
                        ${insight.recommendation ? `
                            <p class="text-xs text-gray-400 mt-2">💡 ${insight.recommendation}</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    generateInsights() {
        const insights = [];
        const apps = this.jobTracker.applications;

        if (apps.length === 0) return insights;

        // Application volume insight
        const recentApps = apps.filter(app => {
            const appDate = new Date(app.dateApplied);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return appDate >= thirtyDaysAgo;
        });

        if (recentApps.length > 0) {
            const avgPerWeek = (recentApps.length / 4).toFixed(1);
            insights.push({
                type: 'info',
                title: 'Application Activity',
                description: `You've submitted ${recentApps.length} applications in the last 30 days (avg ${avgPerWeek} per week).`,
                recommendation: avgPerWeek < 5 ? 'Consider increasing your application volume for better chances.' : 'Great job maintaining consistent application volume!'
            });
        }

        // Response rate insight
        const appsWithReplies = apps.filter(app => app.hrReplies && app.hrReplies.length > 0);
        const responseRate = apps.length > 0 ? (appsWithReplies.length / apps.length * 100).toFixed(1) : 0;

        if (apps.length >= 5) {
            insights.push({
                type: responseRate > 30 ? 'positive' : responseRate > 15 ? 'warning' : 'negative',
                title: 'Response Rate',
                description: `${responseRate}% of your applications received responses from HR.`,
                recommendation: responseRate < 30 ? 'Try tailoring your resume and cover letter more specifically to each position.' : 'Your application materials are getting noticed!'
            });
        }

        // Success rate insight
        const offers = apps.filter(app => app.status === 'offer').length;
        const interviews = apps.filter(app => app.status === 'interview').length;
        const successRate = apps.length > 0 ? (offers / apps.length * 100).toFixed(1) : 0;

        if (apps.length >= 10) {
            insights.push({
                type: successRate > 5 ? 'positive' : successRate > 2 ? 'warning' : 'info',
                title: 'Offer Rate',
                description: `${successRate}% of your applications resulted in offers (${offers} offers from ${apps.length} applications).`,
                recommendation: offers > 0 ? 'Excellent! Keep doing what you\'re doing.' : interviews > 0 ? 'You\'re getting interviews - focus on interview preparation.' : 'Consider revisiting your application strategy.'
            });
        }

        // Rejection pattern by company
        const rejections = apps.filter(app => app.status === 'rejected');
        if (rejections.length >= 5) {
            const rejectionsByCompany = this.groupBy(rejections, 'companyName');
            const topRejector = Object.entries(rejectionsByCompany)
                .sort((a, b) => b[1].length - a[1].length)[0];

            if (topRejector && topRejector[1].length > 1) {
                insights.push({
                    type: 'warning',
                    title: 'Repeated Rejections',
                    description: `${topRejector[0]} has rejected ${topRejector[1].length} of your applications.`,
                    recommendation: 'Consider researching what this company looks for in candidates before applying again.'
                });
            }
        }

        // Time-based pattern
        const avgResponseTime = this.calculateAverageResponseTime();
        if (avgResponseTime > 0) {
            insights.push({
                type: 'info',
                title: 'Average Response Time',
                description: `Companies typically respond within ${Math.round(avgResponseTime)} days.`,
                recommendation: 'Use this timeframe to plan your follow-ups effectively.'
            });
        }

        // Interview conversion rate
        if (interviews > 0) {
            const interviewToOfferRate = offers > 0 ? (offers / interviews * 100).toFixed(1) : 0;
            insights.push({
                type: interviewToOfferRate > 30 ? 'positive' : 'warning',
                title: 'Interview Success',
                description: `${interviewToOfferRate}% of your interviews led to offers (${offers} offers from ${interviews} interviews).`,
                recommendation: interviewToOfferRate < 30 ? 'Consider practicing your interview skills or seeking feedback from interviewers.' : 'Your interview performance is strong!'
            });
        }

        // Sentiment analysis from HR replies
        const allReplies = apps.flatMap(app => app.hrReplies || []);
        if (allReplies.length >= 5) {
            const positive = allReplies.filter(r => r.sentiment === 'positive').length;
            const negative = allReplies.filter(r => r.sentiment === 'negative').length;
            const neutral = allReplies.filter(r => r.sentiment === 'neutral').length;

            const positiveRate = (positive / allReplies.length * 100).toFixed(1);

            insights.push({
                type: positiveRate > 50 ? 'positive' : positiveRate > 25 ? 'warning' : 'negative',
                title: 'HR Response Sentiment',
                description: `${positiveRate}% of HR responses were positive (${positive} positive, ${neutral} neutral, ${negative} negative).`,
                recommendation: positiveRate < 50 ? 'Focus on applications where you meet more of the requirements.' : 'Companies are responding positively to your profile!'
            });
        }

        // Most successful job role
        const offerApps = apps.filter(app => app.status === 'offer' || app.status === 'interview');
        if (offerApps.length >= 3) {
            const roleGroups = this.groupBy(offerApps, 'jobTitle');
            const topRole = Object.entries(roleGroups)
                .sort((a, b) => b[1].length - a[1].length)[0];

            if (topRole) {
                insights.push({
                    type: 'positive',
                    title: 'Best Performing Role',
                    description: `"${topRole[0]}" positions have the highest success rate with ${topRole[1].length} positive responses.`,
                    recommendation: 'Consider focusing more on similar roles to maximize your chances.'
                });
            }
        }

        return insights;
    }

    calculateAverageResponseTime() {
        const appsWithReplies = this.jobTracker.applications.filter(app =>
            app.hrReplies && app.hrReplies.length > 0
        );

        if (appsWithReplies.length === 0) return 0;

        const responseTimes = appsWithReplies.map(app => {
            const appliedDate = new Date(app.dateApplied);
            const firstReply = app.hrReplies[0];
            const replyDate = new Date(firstReply.date);
            const diffTime = Math.abs(replyDate - appliedDate);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        });

        return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    }

    getInsightIcon(type) {
        const icons = {
            positive: `
                <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `,
            warning: `
                <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
            `,
            negative: `
                <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `,
            info: `
                <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            `
        };
        return icons[type] || icons.info;
    }

    // Get rejection data for heatmap
    getRejectionData() {
        const rejections = this.jobTracker.applications.filter(app => app.status === 'rejected');
        return rejections;
    }

    // Get time-based rejection data
    getTimeBasedRejections() {
        const rejections = this.getRejectionData();
        const byMonth = {};

        rejections.forEach(app => {
            const date = new Date(app.dateApplied);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!byMonth[monthKey]) {
                byMonth[monthKey] = 0;
            }
            byMonth[monthKey]++;
        });

        return byMonth;
    }

    // Get company-based rejection data
    getCompanyBasedRejections() {
        const rejections = this.getRejectionData();
        return this.groupBy(rejections, 'companyName');
    }

    // Get role-based rejection data
    getRoleBasedRejections() {
        const rejections = this.getRejectionData();
        return this.groupBy(rejections, 'jobTitle');
    }
}

// Initialize analytics after jobTracker is ready
if (typeof jobTracker !== 'undefined') {
    window.analyticsManager = new AnalyticsManager(jobTracker);
}
