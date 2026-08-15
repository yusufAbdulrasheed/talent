import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import DataTable from '../../../components/ui/DataTable/DataTable.jsx';
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
import styles from './AdminContentPage.module.scss';

const CONTENT_TYPES = [
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'gallery_item', label: 'Gallery item' },
  { value: 'event', label: 'Event' },
  { value: 'faq', label: 'FAQ' },
];

const EMPTY_FORM = { type: 'faq', title: '', body: '', imageUrl: '', eventDate: '' };

function typeLabel(value) {
  return CONTENT_TYPES.find((type) => type.value === value)?.label ?? value;
}

function AdminContentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const type = searchParams.get('type') ?? '';
  const page = Number(searchParams.get('page') ?? 1);
  const [form, setForm] = useState(EMPTY_FORM);

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

  const columns = [
    { key: 'type', header: 'Type', render: (row) => typeLabel(row.type) },
    { key: 'title', header: 'Title' },
    {
      key: 'isPublished',
      header: 'Visibility',
      render: (row) => (
        <StatusBadge tone={row.isPublished ? 'success' : 'neutral'}>
          {row.isPublished ? 'Published' : 'Draft'}
        </StatusBadge>
      ),
    },
    {
      key: 'eventDate',
      header: 'Event date',
      render: (row) => (row.eventDate ? formatDate(row.eventDate) : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className={styles.rowActions}>
          <Button
            size="sm"
            variant="secondary"
            disabled={updateMutation.isPending}
            onClick={() =>
              updateMutation.mutate({ id: row._id ?? row.id, isPublished: !row.isPublished })
            }
          >
            {row.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(row._id ?? row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Website content"
        description="Testimonials, gallery items, events, and FAQs for the public marketing site."
      />

      <Card title="Add content">
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
              label="Image URL"
              name="imageUrl"
              type="url"
              hint="Optional. Include https://"
              value={form.imageUrl}
              onChange={handleChange}
              error={fieldError('imageUrl')}
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

          <TextareaField
            label="Body"
            name="body"
            rows={3}
            value={form.body}
            onChange={handleChange}
            error={fieldError('body')}
          />

          <div className={styles.action}>
            <Button type="submit" isLoading={createMutation.isPending}>
              Add content
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Filter">
        <SelectField
          label="Type"
          name="typeFilter"
          placeholder="All types"
          options={CONTENT_TYPES}
          value={type}
          onChange={(event) => updateSearch({ type: event.target.value })}
        />
      </Card>

      <QueryBoundary query={contentQuery} loadingLabel="Loading content">
        {({ content, pagination }) =>
          content.length === 0 ? (
            <EmptyState title="No content yet" description="Add your first item using the form above." />
          ) : (
            <Card>
              <DataTable
                caption="Public website content"
                columns={columns}
                rows={content}
                getRowKey={(row) => row._id ?? row.id}
              />
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={(nextPage) => updateSearch({ page: nextPage })}
              />
            </Card>
          )
        }
      </QueryBoundary>
    </>
  );
}

export default AdminContentPage;
