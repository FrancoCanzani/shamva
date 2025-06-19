import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'Docs',
  sidebar: [
    {
      text: 'Getting Started',
      link: '/getting-started',
    },
    {
      text: 'User Guide',
      link: '/user-guide',
      items: [
        { text: 'What is a Monitor?', link: '/user-guide/what-is-a-monitor' },
        { text: 'Creating Your First Monitor', link: '/user-guide/creating-your-first-monitor' },
        { text: 'How Monitoring Works', link: '/user-guide/how-monitoring-works' },
        { text: 'Incidents and Downtime', link: '/user-guide/incidents-and-downtime' },
        { text: 'Notifications and Alerts', link: '/user-guide/notifications-and-alerts' },
        { text: 'Data and Logs', link: '/user-guide/data-and-logs' },
      ],
    },
    {
      text: 'Developer Guide',
      link: '/developer-guide',
      items: [
        { text: 'API Overview', link: '/developer-guide/api-overview' },
        { text: 'Adding a Feature', link: '/developer-guide/adding-a-feature' },
        { text: 'Monorepo Structure', link: '/monorepo-structure' },
      ],
    },
    {
      text: 'Example',
      link: '/example',
    },
  ],
})
