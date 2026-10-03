import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus } from 'lucide-react';
import PublicHero from '../../../components/public/PublicHero/PublicHero.jsx';
import { PHOTOS } from '../../../constants/photos.js';
import PublicSection from '../../../components/public/PublicSection/PublicSection.jsx';
import PublicCTA from '../../../components/public/PublicCTA/PublicCTA.jsx';
import Spinner from '../../../components/ui/Spinner/Spinner.jsx';
import { listPublicContent } from '../../../api/endpoints/content.js';
import { queryKeys } from '../../../api/queryKeys.js';
import styles from './FaqPage.module.scss';

const params = { type: 'faq', limit: 50 };

const FALLBACK = [
  {
    _id: 'fallback-1',
    title: 'How are candidates verified?',
    body: 'Talents complete a structured training programme, are assessed by their trainer, and are reviewed by an administrator before being published to the pool.',
  },
  {
    _id: 'fallback-2',
    title: 'When do recruiters see a candidate’s identity?',
    body: 'Profiles are anonymous while recruiters search and shortlist. Full details are shared only after a placement request is approved.',
  },
  {
    _id: 'fallback-3',
    title: 'What does training cost?',
    body: 'Training is free once you are accepted into the programme — there is no enrolment fee.',
  },
  {
    _id: 'fallback-4',
    title: 'Who runs the training programmes?',
    body: 'Dedicated trainers are assigned to programmes and batches by the administrator and manage candidate progress throughout.',
  },
];

function FaqList({ items }) {
  const [open, setOpen] = useState(0);

  return (
    <ul className={styles.list}>
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <li key={item._id} className={styles.item}>
            <button
              type="button"
              className={styles.question}
              aria-expanded={isOpen}
              aria-controls={`faq-${index}`}
              onClick={() => setOpen(isOpen ? -1 : index)}
            >
              <span>{item.title}</span>
              {isOpen ? <Minus size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
            </button>
            <p id={`faq-${index}`} className={styles.answer} hidden={!isOpen}>
              {item.body}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function FaqPage() {
  const query = useQuery({
    queryKey: queryKeys.content.list(params),
    queryFn: () => listPublicContent(params),
  });

  const items = query.data?.content?.length ? query.data.content : FALLBACK;

  return (
    <>
      <PublicHero
        photos={{ main: PHOTOS.womanOfficeGlasses, accent: PHOTOS.manBlackSweater }}
        script="We've got answers."
        eyebrow="FAQ"
        title="Frequently asked questions"
        lead="Answers about training, verification, hiring, and how identities stay protected."
      />

      <PublicSection>
        {query.isPending ? (
          <div className={styles.loading}>
            <Spinner label="Loading questions" />
          </div>
        ) : (
          <FaqList items={items} />
        )}
      </PublicSection>

      <PublicCTA
        title="Still have a question?"
        lead="Send it over and the team will get back to you."
        primary={{ to: '/contact', label: 'Contact us' }}
      />
    </>
  );
}

export default FaqPage;
