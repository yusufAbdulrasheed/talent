import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import PublicHero from '../../../components/public/PublicHero/PublicHero.jsx';
import { PHOTOS, fallbackScene, photoUrl } from '../../../constants/photos.js';
import PublicSection from '../../../components/public/PublicSection/PublicSection.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import Pagination from '../../../components/ui/Pagination/Pagination.jsx';
import { listPublicContent } from '../../../api/endpoints/content.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { formatDate } from '../../../utils/format.js';
import { cldImage } from '../../../utils/cloudinary.js';
import styles from './BlogPage.module.scss';

function excerptFor(post) {
  if (post.excerpt) {
    return post.excerpt;
  }

  const text = (post.body ?? '').replace(/\s+/g, ' ').trim();
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const params = { type: 'post', page, limit: 9 };

  const query = useQuery({
    queryKey: queryKeys.content.list(params),
    queryFn: () => listPublicContent(params),
  });

  const goToPage = (next) => {
    setSearchParams(next > 1 ? { page: String(next) } : {});
  };

  return (
    <>
      <PublicHero
        photos={{ main: PHOTOS.womanLaptopSofa, accent: PHOTOS.manGlasses }}
        script="Stories worth sharing."
        eyebrow="Blog"
        title="Notes on hiring, training, and getting job-ready"
        lead="Guides and updates from the team. New posts are published straight from Content Studio."
      />

      <PublicSection>
        <QueryBoundary query={query} loadingLabel="Loading posts">
          {({ content, pagination }) =>
            content.length === 0 ? (
              <EmptyState
                title="No posts yet"
                description="Once an administrator publishes a blog post, it will appear here."
              />
            ) : (
              <div className={styles.column}>
                <ul className={styles.grid}>
                  {content.map((post) => (
                    <li key={post._id}>
                      <Link to={`/blog/${post._id}`} className={styles.card}>
                        {post.imageUrl ? (
                          <img
                            className={styles.cover}
                            src={cldImage(post.imageUrl, { width: 800, height: 450 })}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <img
                            className={styles.cover}
                            src={photoUrl(fallbackScene(post._id), 800, 450)}
                            alt=""
                            loading="lazy"
                          />
                        )}
                        <div className={styles.cardBody}>
                          <p className={styles.meta}>
                            {post.author ? <span>{post.author}</span> : null}
                            <span>{formatDate(post.createdAt)}</span>
                          </p>
                          <h3 className={styles.cardTitle}>{post.title}</h3>
                          <p className={styles.excerpt}>{excerptFor(post)}</p>
                          <span className={styles.readMore}>
                            Read post
                            <ArrowRight size={15} aria-hidden="true" />
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                {pagination.totalPages > 1 ? (
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    onPageChange={goToPage}
                  />
                ) : null}
              </div>
            )
          }
        </QueryBoundary>
      </PublicSection>
    </>
  );
}

export default BlogPage;
