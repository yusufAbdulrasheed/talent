import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import SelectField from '../../../components/ui/SelectField/SelectField.jsx';
import TagList from '../../../components/ui/TagList/TagList.jsx';
import Pagination from '../../../components/ui/Pagination/Pagination.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { searchTalentPool } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import {
  AVAILABILITY_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
} from '../../../constants/candidateStatus.js';
import styles from './TalentPoolPage.module.scss';

const EMPTY_FILTERS = {
  keyword: '',
  location: '',
  skills: '',
  certification: '',
  availability: '',
  experienceLevel: '',
};

/** Drops blank fields so they never reach the API, which rejects empty values. */
function toQueryParams(filters, page) {
  const params = { page };

  for (const [key, value] of Object.entries(filters)) {
    const trimmed = value.trim();

    if (trimmed) {
      params[key] = trimmed;
    }
  }

  return params;
}

function TalentPoolPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // The URL is the source of truth for the applied search, so results can be
  // linked to and survive a refresh. The form holds the in-progress edits.
  const applied = {
    ...EMPTY_FILTERS,
    ...Object.fromEntries(
      Object.keys(EMPTY_FILTERS)
        .map((key) => [key, searchParams.get(key) ?? ''])
        .filter(([, value]) => value !== ''),
    ),
  };
  const page = Number(searchParams.get('page') ?? 1);

  const [form, setForm] = useState(applied);

  const params = toQueryParams(applied, page);
  const poolQuery = useQuery({
    queryKey: queryKeys.recruiter.talentPool(params),
    queryFn: () => searchTalentPool(params),
    placeholderData: keepPreviousData,
  });

  const updateSearch = (nextFilters, nextPage = 1) => {
    const next = toQueryParams(nextFilters, nextPage);
    setSearchParams(Object.fromEntries(Object.entries(next).map(([k, v]) => [k, String(v)])));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleReset = () => {
    setForm(EMPTY_FILTERS);
    setSearchParams({});
  };

  return (
    <>
      <PageHeader
        title="Find talent"
        description="Every profile here is an approved candidate. Identities stay private until a placement is arranged."
      />

      <Card title="Search filters">
        <form
          className={styles.filters}
          onSubmit={(event) => {
            event.preventDefault();
            updateSearch(form);
          }}
        >
          <TextField
            label="Keyword"
            name="keyword"
            hint="Matches skills, certifications, education, and location."
            value={form.keyword}
            onChange={handleChange}
          />
          <TextField label="Location" name="location" value={form.location} onChange={handleChange} />
          <TextField
            label="Skills"
            name="skills"
            hint="Comma separated. Candidates must have all of them."
            value={form.skills}
            onChange={handleChange}
          />
          <TextField
            label="Certification"
            name="certification"
            value={form.certification}
            onChange={handleChange}
          />
          <SelectField
            label="Availability"
            name="availability"
            placeholder="Any"
            options={AVAILABILITY_OPTIONS}
            value={form.availability}
            onChange={handleChange}
          />
          <SelectField
            label="Experience level"
            name="experienceLevel"
            placeholder="Any"
            options={EXPERIENCE_LEVEL_OPTIONS}
            value={form.experienceLevel}
            onChange={handleChange}
          />

          <div className={styles.filterActions}>
            <Button type="submit" isLoading={poolQuery.isFetching}>
              Search
            </Button>
            <Button type="button" variant="secondary" onClick={handleReset}>
              Clear filters
            </Button>
          </div>
        </form>
      </Card>

      <QueryBoundary query={poolQuery} loadingLabel="Searching the talent pool">
        {({ candidates, pagination }) =>
          candidates.length === 0 ? (
            <EmptyState
              title="No candidates match your filters"
              description="Try removing a filter or broadening your keyword."
              action={
                <Button variant="secondary" size="sm" onClick={handleReset}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <ul className={styles.results}>
                {candidates.map((candidate) => (
                  <li key={candidate.referenceNumber}>
                    <CandidateCard candidate={candidate} />
                  </li>
                ))}
              </ul>

              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={(nextPage) => updateSearch(applied, nextPage)}
              />
            </>
          )
        }
      </QueryBoundary>
    </>
  );
}

function CandidateCard({ candidate }) {
  const availability = AVAILABILITY_OPTIONS.find((o) => o.value === candidate.availability)?.label;
  const experience = EXPERIENCE_LEVEL_OPTIONS.find(
    (o) => o.value === candidate.experienceLevel,
  )?.label;

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <h3 className={styles.reference}>{candidate.referenceNumber}</h3>
        <p className={styles.location}>{candidate.location ?? 'Location not provided'}</p>
      </header>

      <TagList items={candidate.skills} label="Skills" emptyLabel="No skills listed" />

      <dl className={styles.meta}>
        <div>
          <dt>Experience</dt>
          <dd>{experience ?? '—'}</dd>
        </div>
        <div>
          <dt>Availability</dt>
          <dd>{availability ?? '—'}</dd>
        </div>
      </dl>

      <Link className={styles.cardLink} to={`/recruiter/talent-pool/${candidate.referenceNumber}`}>
        View profile
        <span className={styles.linkContext}> for {candidate.referenceNumber}</span>
      </Link>
    </article>
  );
}

export default TalentPoolPage;
