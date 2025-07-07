import { createFileRoute } from '@tanstack/react-router'
import fetchHeartbeat from '@/frontend/lib/loaders/heartbeat'
import HeartbeatPage from '@/frontend/components/pages/heartbeat-page'

export const Route = createFileRoute('/dashboard/$workspaceName/heartbeats/$id/')({
  loader: ({ params, abortController }) =>
    fetchHeartbeat({ params, abortController }),
  staleTime: 30_000,
  component: HeartbeatPage,
})
