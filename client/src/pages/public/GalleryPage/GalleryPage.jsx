import { useQuery } from '@tanstack/react-query';
import PublicHero from '../../../components/public/PublicHero/PublicHero.jsx';
import { PHOTOS, fallbackScene, photoUrl } from '../../../constants/photos.js';
import PublicSection from '../../../components/public/PublicSection/PublicSection.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import { listPublicContent } from '../../../api/endpoints/content.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { cldImage } from '../../../utils/cloudinary.js';
import styles from './GalleryPage.module.scss';

const params = { type: 'gallery_item', limit: 48 };

function GalleryPage() {
  const query = useQuery({
    queryKey: queryKeys.content.list(params),
    queryFn: () => listPublicContent(params),
  });

  return (
    <>
      <PublicHero
        photos={{ main: PHOTOS.studyGroupLaptops, accent: PHOTOS.manTraditionalCap }}
        script="Moments that matter."
        eyebrow="Gallery"
        title="Inside our training sessions and events"
        lead="Moments from cohorts, demo days, and hiring meetups."
      />

      <PublicSection>
        <QueryBoundary query={query} loadingLabel="Loading gallery">
          {({ content }) =>
            content.length === 0 ? (
              <EmptyState
                title="No photos yet"
                description="Once an administrator adds gallery items, they will appear here."
              />
            ) : (
              <ul className={styles.grid}>
                {content.map((item) => (
                  <li key={item._id} className={styles.tile}>
                    {item.imageUrl ? (
                      <img
                        src={cldImage(item.imageUrl, { width: 600, height: 600 })}
                        alt={item.title}
                        loading="lazy"
                      />
                    ) : (
                      <img src={photoUrl(fallbackScene(item._id), 600, 600)} alt={item.title} loading="lazy" />
                    )}
                    {item.title ? <figcaption>{item.title}</figcaption> : null}
                  </li>
                ))}
              </ul>
            )
          }
        </QueryBoundary>
      </PublicSection>
    </>
  );
}

export default GalleryPage;
