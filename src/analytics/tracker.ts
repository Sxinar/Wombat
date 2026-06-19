export interface AnalyticsEvent {
  type: 'comment' | 'reply' | 'reaction' | 'view';
  projectId: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface Analytics {
  totalComments: number;
  totalViews: number;
  totalReactions: number;
  avgResponseTime: number;
  topProjects: Array<{ id: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
}

export class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];

  trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    this.events.push({
      ...event,
      timestamp: new Date()
    });
  }

  getAnalytics(projectId?: string): Analytics {
    const filtered = projectId 
      ? this.events.filter(e => e.projectId === projectId)
      : this.events;

    const comments = filtered.filter(e => e.type === 'comment');
    const views = filtered.filter(e => e.type === 'view');
    const reactions = filtered.filter(e => e.type === 'reaction');

    // Calculate daily stats
    const dailyMap = new Map<string, number>();
    filtered.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top projects
    const projectMap = new Map<string, number>();
    filtered.forEach(event => {
      projectMap.set(event.projectId, (projectMap.get(event.projectId) || 0) + 1);
    });

    const topProjects = Array.from(projectMap.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalComments: comments.length,
      totalViews: views.length,
      totalReactions: reactions.length,
      avgResponseTime: 0, // TODO: Calculate from comment chains
      topProjects,
      dailyStats
    };
  }

  exportData(): string {
    return JSON.stringify(this.events, null, 2);
  }

  importData(json: string): void {
    this.events = JSON.parse(json);
  }
}

export const analytics = new AnalyticsTracker();
