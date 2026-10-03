import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Filter,
  MessageSquare,
  Image as ImageIcon,
  Calendar,
  HelpCircle,
  FileText,
  Newspaper,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import FileUploadField from '../../../components/ui/FileUploadField/FileUploadField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Pagination from '../../../components/ui/Pagination/Pagination.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import {
  createContent,
  deleteContent,
  listContent,
  updateContent,
} from '../../../api/endpoints/admin.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import { formatDate } from '../../../utils/format.js';
import { cldImage } from '../../../utils/cloudinary.js';
import styles from './AdminContentPage.module.scss';

const CONTENT_TYPES = [
  { value: 'post', label: 'Blog post' },
  { value: 'event', label: 'Event' },
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'gallery_item', label: 'Gallery item' },
  { value: 'faq', label: 'FAQ' },
];

const CONTENT_TYPE_ICONS = {
  post: Newspaper,
  testimonial: MessageSquare,
  gallery_item: ImageIcon,
  event: Calendar,
  faq: HelpCircle,
};

const TYPE_TABS = [
  { value: '', label: 'All content', icon: Filter },
  ...CONTENT_TYPES.map((item) => ({ ...item, icon: CONTENT_TYPE_ICONS[item.value] })),
];

const EMPTY_FORM = {
  type: 'post',
  title: '',
  body: '',
  excerpt: '',
  author: '',
  imageUrl: '',
  eventDate: '',
};

function typeLabel(value) {
  return CONTENT_TYPES.find((type) => type.value === value)?.label ?? value;
}

function ContentItem({ item, onTogglePublish, isToggling, onDelete, isDeleting }) {
  const icon = CONTENT_TYPE_ICONS[item.type] ?? FileText;
  const Icon = icon;

  return (
    <article className={styles.contentItem}>
      {item.imageUrl ? (
        <img
          className={styles.contentThumb}
          src={cldImage(item.imageUrl, { width: 120, height: 120 })}
          alt=""
          loading="lazy"
        />
      ) : (
        <span className={styles.contentIcon} aria-hidden="true">
          <Icon size={18} strokeWidth={2} />
        </span>
      )}

      <div className={styles.contentBody}>
        <div className={styles.contentHeadRow}>
          <h3 className={styles.contentTitle}>{item.title}</h3>
          <StatusBadge tone={item.isPublished ? 'success' : 'neutral'}>
            {item.isPublished ? 'Published' : 'Draft'}
          </StatusBadge>
        </div>

        {item.body ? <p className={styles.contentExcerpt}>{item.body}</p> : null}

        <p className={styles.contentMeta}>
          <span>{typeLabel(item.type)}</span>
          {item.eventDate ? <span>Event on {formatDate(item.eventDate)}</span> : null}
          {item.updatedAt ? <span>Updated {formatDate(item.updatedAt)}</span> : null}
        </p>
      </div>

      <div className={styles.contentActions}>
        <Button size="sm" variant="secondary" disabled={isToggling} onClick={onTogglePublish}>
          {item.isPublished ? 'Unpublish' : 'Publish'}
        </Button>
        <Button size="sm" variant="danger" disabled={isDeleting} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </article>
  );
}

function AdminContentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const type = searchParams.get('type') ?? '';
  const page = Number(searchParams.get('page') ?? 1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const params = { page, ...(type ? { type } : {}) };
  const contentQuery = useQuery({
    queryKey: queryKeys.admin.content(params),
    queryFn: () => listContent(params),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });

  const createMutation = useMutation({
    mutationFn: createContent,
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setShowForm(false);
      invalidate();
    },
  });
  const updateMutation = useMutation({ mutationFn: updateContent, onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: deleteContent, onSuccess: invalidate });

  const updateSearch = (next) => {
    const merged = { type, page: 1, ...next };
    const clean = {};

    if (merged.type) clean.type = merged.type;
    if (merged.page > 1) clean.page = String(merged.page);

    setSearchParams(clean);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const fieldError = (field) =>
    createMutation.error?.response?.data?.details?.find((detail) => detail.field === field)?.message;

  return (
    <>
      <PageHeader
        title="Content Studio"
        description="Blog posts, events, testimonials, gallery items, and FAQs for the public marketing site."
        actions={
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            onClick={() => setShowForm((value) => !value)}
          >
            <Plus size={16} aria-hidden="true" />
            New content
          </Button>
        }
      />

      {showForm ? (
        <Card>
          {createMutation.isError ? (
            <Alert variant="error">{getErrorMessage(createMutation.error)}</Alert>
          ) : null}
          {deleteMutation.isError ? (
            <Alert variant="error">{getErrorMessage(deleteMutation.error)}</Alert>
          ) : null}

          <form
            className={styles.form}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const payload = { type: form.type, title: form.title.trim() };

              if (form.body.trim()) payload.body = form.body.trim();
              if (form.excerpt.trim()) payload.excerpt = form.excerpt.trim();
              if (form.author.trim()) payload.author = form.author.trim();
              if (form.imageUrl.trim()) payload.imageUrl = form.imageUrl.trim();
              if (form.eventDate) payload.eventDate = form.eventDate;

              createMutation.mutate(payload);
            }}
          >
            <div className={styles.grid}>
              <SelectField
                label="Type"
                name="type"
                options={CONTENT_TYPES}
                value={form.type}
                onChange={handleChange}
                error={fieldError('type')}
              />
              <TextField
                label="Title"
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                error={fieldError('title')}
              />
              <TextField
                label="Author"
                name="author"
                hint="Blog posts — shown as the byline."
                value={form.author}
                onChange={handleChange}
                error={fieldError('author')}
              />
              <TextField
                label="Event date"
                name="eventDate"
                type="date"
                hint="Events only."
                value={form.eventDate}
                onChange={handleChange}
                error={fieldError('eventDate')}
              />
            </div>

            <FileUploadField
              label="Image"
              folder="content"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              value={form.imageUrl}
              onChange={(url) => setForm((previous) => ({ ...previous, imageUrl: url }))}
              hint="Optional cover / gallery image — stored on Cloudinary and served from there."
              error={fieldError('imageUrl')}
            />

            <TextField
              label="Excerpt"
              name="excerpt"
              hint="Optional. Short summary shown on blog cards; falls back to the start of the body."
              value={form.excerpt}
              onChange={handleChange}
              error={fieldError('excerpt')}
            />

            <TextareaField
              label="Body"
              name="body"
              rows={form.type === 'post' ? 8 : 3}
              value={form.body}
              onChange={handleChange}
              error={fieldError('body')}
              hint={form.type === 'post' ? 'Separate paragraphs with a blank line.' : undefined}
            />

            <div className={styles.action}>
              <Button type="submit" isLoading={createMutation.isPending}>
                Add content
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className={styles.tabBar} role="tablist" aria-label="Content type">
        {TYPE_TABS.map((tab) => {
          const icon = tab.icon;
          const TabIcon = icon;
          const isActive = type === tab.value;

          return (
            <button
              key={tab.value || 'all'}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => updateSearch({ type: tab.value })}
            >
              <TabIcon size={15} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <QueryBoundary query={contentQuery} loadingLabel="Loading content">
        {({ content, pagination }) =>
          content.length === 0 ? (
            <EmptyState title="No content yet" description="Add your first item using the form above." />
          ) : (
            <div className={styles.contentColumn}>
              <div className={styles.contentList}>
                {content.map((item) => (
                  <ContentItem
                    key={item._id ?? item.id}
                    item={item}
                    isToggling={updateMutation.isPending}
                    onTogglePublish={() =>
                      updateMutation.mutate({ id: item._id ?? item.id, isPublished: !item.isPublished })
                    }
                    isDeleting={deleteMutation.isPending}
                    onDelete={() => deleteMutation.mutate(item._id ?? item.id)}
                  />
                ))}
              </div>
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={(nextPage) => updateSearch({ page: nextPage })}
              />
            </div>
          )
        }
      </QueryBoundary>
    </>
  );
}

export default AdminContentPage;
