import { analytics, type Analytics } from './tracker';

export interface DashboardCard {
  title: string;
  value: number | string;
  change?: number;
  icon: string;
}

export class AnalyticsDashboard {
  generateCards(data: Analytics): DashboardCard[] {
    return [
      {
        title: 'Total Comments',
        value: data.totalComments,
        icon: '💬'
      },
      {
        title: 'Total Views',
        value: data.totalViews,
        icon: '👁️'
      },
      {
        title: 'Total Reactions',
        value: data.totalReactions,
        icon: '❤️'
      },
      {
        title: 'Avg Response Time',
        value: `${data.avgResponseTime}m`,
        icon: '⏱️'
      }
    ];
  }

  generateChartData(data: Analytics) {
    return {
      labels: data.dailyStats.map(s => s.date),
      datasets: [{
        label: 'Activity',
        data: data.dailyStats.map(s => s.count)
      }]
    };
  }

  exportReport(projectId?: string): string {
    const data = analytics.getAnalytics(projectId);
    const cards = this.generateCards(data);
    
    let report = '# Analytics Report\n\n';
    cards.forEach(card => {
      report += `## ${card.icon} ${card.title}\n`;
      report += `**${card.value}**\n\n`;
    });

    report += '## Top Projects\n\n';
    data.topProjects.forEach((p, i) => {
      report += `${i + 1}. Project ${p.id}: ${p.count} events\n`;
    });

    return report;
  }
}
