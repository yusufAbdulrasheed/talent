import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import PublicSection from '../../../components/public/PublicSection/PublicSection.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getPublicContentItem } from '../../../api/endpoints/content.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { formatDate } from '../../../utils/format.js';
import { cldImage } from '../../../utils/cloudinary.js';
import styles from './BlogPostPage.module.scss';

function paragraphs(body) {
  return (body ?? '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function BlogPostPage() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: queryKeys.content.item(id),
    queryFn: () => getPublicContentItem(id),
    retry: false,
  });

  return (
    <PublicSection>
      <Link to="/blog" className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" />
        All posts
      </Link>

      <QueryBoundary query={query} loadingLabel="Loading post">
        {(post) => (
          <article className={styles.article}>
            <header className={styles.header}>
              <p className={styles.meta}>
                {post.author ? <span>{post.author}</span> : null}
                <span>{formatDate(post.createdAt)}</span>
              </p>
              <h1 className={styles.title}>{post.title}</h1>
              {post.excerpt ? <p className={styles.lead}>{post.excerpt}</p> : null}
            </header>

            {post.imageUrl ? (
              <img className={styles.cover} src={cldImage(post.imageUrl, { width: 1200 })} alt="" />
            ) : null}

            <div className={styles.body}>
              {paragraphs(post.body).map((block, index) => (
                <p key={index}>{block}</p>
              ))}
            </div>
          </article>
        )}
      </QueryBoundary>
    </PublicSection>
  );
}

export default BlogPostPage;
