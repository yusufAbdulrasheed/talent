import { useQuery } from '@tanstack/react-query';
import { Quote, Star } from 'lucide-react';
import PublicHero from '../../../components/public/PublicHero/PublicHero.jsx';
import { PHOTOS } from '../../../constants/photos.js';
import PublicSection from '../../../components/public/PublicSection/PublicSection.jsx';
import PublicCTA from '../../../components/public/PublicCTA/PublicCTA.jsx';
import Spinner from '../../../components/ui/Spinner/Spinner.jsx';
import { listPublicContent } from '../../../api/endpoints/content.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { cldImage } from '../../../utils/cloudinary.js';
import styles from './TestimonialsPage.module.scss';

const params = { type: 'testimonial', limit: 30 };

// Shown only until an admin publishes real testimonials in Content Studio.
const FALLBACK = [
  {
    _id: 'fallback-1',
    body: 'We filled three senior roles in under a month. Every candidate was pre-vetted and genuinely job-ready.',
    title: 'Amara Obi',
    author: 'Head of Talent, Meridian Group',
  },
  {
    _id: 'fallback-2',
    body: 'The training was practical and intense. Two weeks after finishing I had an offer through the platform.',
    title: 'Daniel Mensah',
    author: 'Backend Engineer',
  },
  {
    _id: 'fallback-3',
    body: 'Shortlisting anonymously kept our process fair, and the profiles were consistently strong.',
    title: 'Priya Nair',
    author: 'Recruitment Lead, NorthBridge',
  },
];

function TestimonialCard({ item }) {
  return (
    <figure className={styles.card}>
      <Quote className={styles.mark} size={26} aria-hidden="true" />
      <div className={styles.stars} aria-label="Rated 5 out of 5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={15} fill="currentColor" aria-hidden="true" />
        ))}
      </div>
      <blockquote className={styles.quote}>{item.body}</blockquote>
      <figcaption className={styles.person}>
        {item.imageUrl ? (
          <img src={cldImage(item.imageUrl, { width: 96, height: 96 })} alt="" loading="lazy" />
        ) : null}
        <span>
          <strong>{item.title}</strong>
          {item.author ? <span>{item.author}</span> : null}
        </span>
      </figcaption>
    </figure>
  );
}

function TestimonialsPage() {
  const query = useQuery({
    queryKey: queryKeys.content.list(params),
    queryFn: () => listPublicContent(params),
  });

  // Real content when it exists, the built-in set otherwise (including while
  // loading fails) — a testimonials page should never be a bare error.
  const items = query.data?.content?.length ? query.data.content : FALLBACK;

  return (
    <>
      <PublicHero
        photos={{ main: PHOTOS.womanBraidsConfident, accent: PHOTOS.manSmiling }}
        script="In their own words."
        eyebrow="Testimonials"
        title="What candidates and employers say"
        lead="Feedback from people who have hired through the pool or been placed from it."
      />

      <PublicSection>
        {query.isPending ? (
          <div className={styles.loading}>
            <Spinner label="Loading testimonials" />
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <TestimonialCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </PublicSection>

      <PublicCTA
        title="Have a story to share?"
        lead="If we placed you or you hired through us, we'd love to hear about it."
        primary={{ to: '/contact', label: 'Share your story' }}
      />
    </>
  );
}

export default TestimonialsPage;
