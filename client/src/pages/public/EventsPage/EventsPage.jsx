import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import PublicHero from '../../../components/public/PublicHero/PublicHero.jsx';
import { PHOTOS, fallbackScene, photoUrl } from '../../../constants/photos.js';
import PublicSection from '../../../components/public/PublicSection/PublicSection.jsx';
import PublicCTA from '../../../components/public/PublicCTA/PublicCTA.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import { listPublicContent } from '../../../api/endpoints/content.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { formatDate } from '../../../utils/format.js';
import { cldImage } from '../../../utils/cloudinary.js';
import styles from './EventsPage.module.scss';

const params = { type: 'event', limit: 50 };

function EventCard({ event, past }) {
  return (
    <article className={`${styles.card} ${past ? styles.cardPast : ''}`}>
      {event.imageUrl ? (
        <img
          className={styles.thumb}
          src={cldImage(event.imageUrl, { width: 640, height: 360 })}
          alt=""
          loading="lazy"
        />
      ) : (
        <img
          className={styles.thumb}
          src={photoUrl(fallbackScene(event._id), 640, 360)}
          alt=""
          loading="lazy"
        />
      )}
      <div className={styles.cardBody}>
        <p className={styles.date}>
          <CalendarDays size={14} aria-hidden="true" />
          {event.eventDate ? formatDate(event.eventDate) : 'Date to be announced'}
        </p>
        <h3 className={styles.cardTitle}>{event.title}</h3>
        {event.body ? <p className={styles.cardText}>{event.body}</p> : null}
      </div>
    </article>
  );
}

function EventsPage() {
  const query = useQuery({
    queryKey: queryKeys.content.list(params),
    queryFn: () => listPublicContent(params),
  });

  return (
    <>
      <PublicHero
        photos={{ main: PHOTOS.laptopMeeting, accent: PHOTOS.womanLaughing }}
        script="See you there!"
        eyebrow="Events"
        title="Cohort demos, hiring meetups, and workshops"
        lead="What's coming up and what we've run recently. Events are published from Content Studio."
      />

      <PublicSection>
        <QueryBoundary query={query} loadingLabel="Loading events">
          {({ content }) => {
            const now = Date.now();
            const upcoming = content
              .filter((event) => event.eventDate && new Date(event.eventDate).getTime() >= now)
              .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
            const past = content
              .filter((event) => !event.eventDate || new Date(event.eventDate).getTime() < now)
              .sort((a, b) => new Date(b.eventDate ?? 0) - new Date(a.eventDate ?? 0));

            if (content.length === 0) {
              return (
                <EmptyState
                  title="No events yet"
                  description="Once an administrator publishes an event, it will show up here."
                />
              );
            }

            return (
              <div className={styles.groups}>
                <section className={styles.group}>
                  <h2 className={styles.groupTitle}>Upcoming</h2>
                  {upcoming.length === 0 ? (
                    <p className={styles.groupEmpty}>Nothing on the calendar right now — check back soon.</p>
                  ) : (
                    <div className={styles.grid}>
                      {upcoming.map((event) => (
                        <EventCard key={event._id} event={event} />
                      ))}
                    </div>
                  )}
                </section>

                {past.length > 0 ? (
                  <section className={styles.group}>
                    <h2 className={styles.groupTitle}>Past events</h2>
                    <div className={styles.grid}>
                      {past.map((event) => (
                        <EventCard key={event._id} event={event} past />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            );
          }}
        </QueryBoundary>
      </PublicSection>

      <PublicCTA
        title="Want us at your campus or office?"
        lead="We run hiring meetups and cohort demos with partners."
        primary={{ to: '/contact', label: 'Get in touch' }}
      />
    </>
  );
}

export default EventsPage;
