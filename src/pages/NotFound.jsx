import { eventPath, navigate } from '../lib/routes'
import PageHeader from '../components/PageHeader'

export default function NotFound({ eventSlug }) {
  return (
    <section className="route-state" aria-labelledby="route-state-title">
      <PageHeader
        eyebrow="Open Mic Queue"
        title="This page is not part of the event."
        description="The link may be incomplete or may point to an event page that has moved."
        actions={(
          <button className="btn btn-primary" type="button" onClick={() => navigate(eventPath(eventSlug))}>
            Return to Event Home
          </button>
        )}
      />
    </section>
  )
}
