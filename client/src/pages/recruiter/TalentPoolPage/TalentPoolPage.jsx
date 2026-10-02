import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Check,
  Crown,
  ListChecks,
  Lock,
  MapPin,
  Search,
  SearchX,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import TagList from '../../../components/ui/TagList/TagList.jsx';
import Pagination from '../../../components/ui/Pagination/Pagination.jsx';
import EmptyState from '../../../components/feedback/EmptyState/EmptyState.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { searchTalentPool } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import GroupRequestModal from './GroupRequestModal.jsx';
import styles from './TalentPoolPage.module.scss';

const EMPTY_FILTERS = {
  keyword: '',
  jobTitle: '',
  location: '',
  skills: '',
  certification: '',
};

// Talent is browsed by the same three tiers a recruiter subscribes to.
const TIER_LABELS = {
  junior: 'Junior',
  intermediate: 'Intermediate',
  senior: 'Senior',
};

/** Drops blank fields so they never reach the API, which rejects empty values. */
function toQueryParams(filters, page, tier) {
  const params = { page };

  for (const [key, value] of Object.entries(filters)) {
    const trimmed = value.trim();

    if (trimmed) {
      params[key] = trimmed;
    }
  }

  if (tier) {
    params.tier = tier;
  }

  return params;
}

function pluralise(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
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
  // A bookmarked or hand-edited unknown tier falls back to "All" rather than erroring.
  const requestedTier = searchParams.get('tier') ?? '';
  const tier = Object.hasOwn(TIER_LABELS, requestedTier) ? requestedTier : '';

  const [form, setForm] = useState(applied);
  // Talents picked for a multi-talent request, keyed by reference. Kept across
  // result pages and filter changes until the request is sent or cleared.
  const [selected, setSelected] = useState(() => new Map());
  const [isGroupRequestOpen, setGroupRequestOpen] = useState(false);

  const toggleSelected = (candidate) =>
    setSelected((previous) => {
      const next = new Map(previous);
      if (next.has(candidate.referenceNumber)) {
        next.delete(candidate.referenceNumber);
      } else {
        next.set(candidate.referenceNumber, candidate);
      }
      return next;
    });

  const selectAll = (candidates) =>
    setSelected((previous) => {
      const next = new Map(previous);
      candidates.forEach((candidate) => next.set(candidate.referenceNumber, candidate));
      return next;
    });

  const params = toQueryParams(applied, page, tier);
  const poolQuery = useQuery({
    queryKey: queryKeys.recruiter.talentPool(params),
    queryFn: () => searchTalentPool(params),
    placeholderData: keepPreviousData,
  });

  const updateSearch = (nextFilters, { page: nextPage = 1, tier: nextTier = tier } = {}) => {
    const next = toQueryParams(nextFilters, nextPage, nextTier);
    setSearchParams(Object.fromEntries(Object.entries(next).map(([k, v]) => [k, String(v)])));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  // Clearing the filters keeps the level tab: the tab is where you are looking,
  // not a filter you typed.
  const handleReset = () => {
    setForm(EMPTY_FILTERS);
    setSearchParams(tier ? { tier } : {});
  };

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <PageHeader
            title="Discover talent"
            description="Find the right professionals for your team, faster. Identities stay private until a placement is arranged."
          />

          <form
            className={styles.searchForm}
            onSubmit={(event) => {
              event.preventDefault();
              updateSearch(form);
            }}
          >
            <div className={styles.searchBar}>
              <Search size={20} className={styles.searchIcon} aria-hidden="true" />
              <label htmlFor="talent-keyword" className={styles.srOnly}>
                Keyword
              </label>
              <input
                id="talent-keyword"
                type="text"
                name="keyword"
                className={styles.searchInput}
                placeholder="Search by job title, skill, certification, education or location…"
                value={form.keyword}
                onChange={handleChange}
              />
              <Button type="submit" isLoading={poolQuery.isFetching} className={styles.searchButton}>
                Search
              </Button>
            </div>

            <div className={styles.filters}>
              <p className={styles.filtersLabel}>
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filters
              </p>
              <TextField
                label="Job title"
                name="jobTitle"
                placeholder="e.g. Frontend Developer"
                value={form.jobTitle}
                onChange={handleChange}
              />
              <TextField
                label="Location"
                name="location"
                placeholder="All locations"
                value={form.location}
                onChange={handleChange}
              />
              <TextField
                label="Skills"
                name="skills"
                placeholder="e.g. Excel, Sales"
                value={form.skills}
                onChange={handleChange}
              />
              <TextField
                label="Certification"
                name="certification"
                placeholder="Any certification"
                value={form.certification}
                onChange={handleChange}
              />
              <div className={styles.filterActions}>
                <Button type="button" variant="secondary" onClick={handleReset}>
                  Clear filters
                </Button>
                <Button type="submit" isLoading={poolQuery.isFetching}>
                  Apply filters
                </Button>
              </div>
            </div>
          </form>
        </div>

        <aside className={styles.promo}>
          <span className={styles.promoIcon} aria-hidden="true">
            <Users size={22} />
          </span>
          <p className={styles.promoTitle}>
            Hiring more than one?
            <br />
            Request them together.
          </p>
          <p className={styles.promoBody}>Pick several verified talents and send one request to our team.</p>
          <Button onClick={() => setGroupRequestOpen(true)} fullWidth>
            <ListChecks size={16} aria-hidden="true" />
            Request multiple talents
          </Button>
        </aside>
      </section>

      <QueryBoundary query={poolQuery} loadingLabel="Searching the talent pool">
        {({ candidates, pagination, tiers }) => {
          const selectedTier = tiers.find((entry) => entry.tier === tier);
          const isTierLocked = selectedTier ? !selectedTier.unlocked : false;

          return (
            <>
              <LevelTabs
                tiers={tiers}
                selected={tier}
                onSelect={(nextTier) => updateSearch(applied, { tier: nextTier })}
              />

              {tier === '' ? <LockedTiersNotice tiers={tiers} /> : null}

              {isTierLocked ? (
                <LockedTierPanel tier={selectedTier} />
              ) : candidates.length === 0 ? (
                <EmptyState
                  icon={SearchX}
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
                  <div className={styles.resultsBar}>
                    <p className={styles.resultCount}>
                      <strong>{pagination.total}</strong> verified{' '}
                      {pluralise(pagination.total, 'professional')} found
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => setGroupRequestOpen(true)}>
                      <ListChecks size={16} aria-hidden="true" />
                      Request multiple talents
                    </Button>
                  </div>
                  <ul className={styles.results}>
                    {candidates.map((candidate) => (
                      <li key={candidate.referenceNumber}>
                        <CandidateCard
                          candidate={candidate}
                          isSelected={selected.has(candidate.referenceNumber)}
                          onToggleSelected={() => toggleSelected(candidate)}
                        />
                      </li>
                    ))}
                  </ul>

                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    onPageChange={(nextPage) => updateSearch(applied, { page: nextPage })}
                  />
                </>
              )}
            </>
          );
        }}
      </QueryBoundary>

      {selected.size > 0 && !isGroupRequestOpen ? (
        <div className={styles.selectionBar} role="region" aria-label="Selected talents">
          <span className={styles.selectionCount}>
            <strong>{selected.size}</strong> {pluralise(selected.size, 'talent')} selected
          </span>
          <Button size="sm" onClick={() => setGroupRequestOpen(true)}>
            Request selected
          </Button>
          <button
            type="button"
            className={styles.selectionClear}
            onClick={() => setSelected(new Map())}
            aria-label="Clear selection"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <GroupRequestModal
        isOpen={isGroupRequestOpen}
        onClose={() => setGroupRequestOpen(false)}
        candidates={poolQuery.data?.candidates ?? []}
        selected={selected}
        onToggle={toggleSelected}
        onSelectAll={selectAll}
        onClearSelection={() => setSelected(new Map())}
      />
    </>
  );
}

/**
 * "All" plus one tab per tier. Counts are head-counts of approved talent and
 * ignore the search filters on purpose (the server does the same), so a tab
 * above the recruiter's plan discloses how many people it holds and nothing else.
 */
function LevelTabs({ tiers, selected, onSelect }) {
  const browsableTotal = tiers.filter((entry) => entry.unlocked).reduce((sum, entry) => sum + entry.total, 0);
  const options = [
    { value: '', label: 'All', total: browsableTotal, isLocked: false },
    ...tiers.map((entry) => ({
      value: entry.tier,
      label: TIER_LABELS[entry.tier] ?? entry.tier,
      total: entry.total,
      isLocked: !entry.unlocked,
    })),
  ];

  return (
    <div className={styles.levelTabs} role="group" aria-label="Browse talent by level">
      {options.map((option) => {
        const isActive = selected === option.value;

        return (
          <button
            key={option.value || 'all'}
            type="button"
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            aria-pressed={isActive}
            onClick={() => onSelect(option.value)}
          >
            {option.isLocked ? <Lock size={14} aria-hidden="true" /> : null}
            {option.label}
            <span className={styles.tabCount}>{option.total}</span>
            {option.isLocked ? <span className={styles.srOnly}>(locked on your plan)</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** On the "All" tab: a single line saying what the current plan is not showing. */
function LockedTiersNotice({ tiers }) {
  const lockedTiers = tiers.filter((entry) => !entry.unlocked && entry.total > 0);

  if (lockedTiers.length === 0) {
    return null;
  }

  const lockedTotal = lockedTiers.reduce((sum, entry) => sum + entry.total, 0);
  const breakdown = lockedTiers.map((entry) => `${entry.total} ${TIER_LABELS[entry.tier] ?? entry.tier}`).join(', ');

  return (
    <aside className={styles.lockedNotice}>
      <Lock size={16} aria-hidden="true" />
      <p className={styles.lockedNoticeText}>
        {lockedTotal} more {pluralise(lockedTotal, 'talent is', 'talents are')} locked on your plan: {breakdown}.
      </p>
      <Link className={styles.lockedNoticeLink} to="/recruiter/subscription">
        Subscribe to unlock
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </aside>
  );
}

/** Shown instead of a list when the selected tab is above the plan. Head-count only. */
function LockedTierPanel({ tier }) {
  const label = TIER_LABELS[tier.tier] ?? tier.tier;

  return (
    <section className={styles.lockedPanel} aria-labelledby="locked-tier-title">
      <span className={styles.lockedPanelIcon} aria-hidden="true">
        <Crown size={22} strokeWidth={2} />
      </span>
      <h2 id="locked-tier-title" className={styles.lockedPanelTitle}>
        {label} talent is locked on your plan
      </h2>
      <p className={styles.lockedPanelText}>
        {tier.total > 0
          ? `${tier.total} approved ${label} ${pluralise(tier.total, 'candidate is', 'candidates are')} available. Subscribe to a higher plan to browse their profiles and request a placement.`
          : `There are no approved ${label} candidates yet. Subscribe to a higher plan to be first in line when they arrive.`}
      </p>
      <Button to="/recruiter/subscription">Subscribe to unlock</Button>
    </section>
  );
}

// Recruiters only ever see an anonymous profile, so the card leads with the
// reference number and a neutral avatar — never a name or photo.
const MAX_CARD_SKILLS = 3;

function CandidateCard({ candidate, isSelected, onToggleSelected }) {
  const skills = candidate.skills ?? [];
  const extraSkills = skills.length - MAX_CARD_SKILLS;
  const certificationCount = candidate.certifications?.length ?? 0;

  return (
    <article className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}>
      <header className={styles.cardHeader}>
        <span className={styles.avatar} aria-hidden="true">
          <UserRound size={36} strokeWidth={1.6} />
        </span>
        <span className={styles.badges}>
          {certificationCount > 0 ? (
            <span className={styles.certPill}>
              <strong>{certificationCount}</strong>
              <span>{pluralise(certificationCount, 'certificate')}</span>
            </span>
          ) : null}
          <span className={styles.verified}>
            <BadgeCheck size={14} aria-hidden="true" />
            Verified
          </span>
        </span>
      </header>

      <div className={styles.identity}>
        <h3 className={styles.reference}>{candidate.referenceNumber}</h3>
        <p className={styles.jobTitle}>{candidate.jobTitle || 'Verified professional'}</p>
        {candidate.education ? <p className={styles.education}>{candidate.education}</p> : null}
      </div>

      <ul className={styles.metaRow}>
        <li>
          <MapPin size={14} aria-hidden="true" />
          {candidate.location ?? 'Location not provided'}
        </li>
        {certificationCount > 0 ? (
          <li>
            <Award size={14} aria-hidden="true" />
            <span className={styles.metaText}>{candidate.certifications[0]}</span>
          </li>
        ) : null}
      </ul>

      {candidate.bio ? <p className={styles.bio}>{candidate.bio}</p> : null}

      <div className={styles.skills}>
        <p className={styles.skillsLabel}>Top skills</p>
        <TagList items={skills.slice(0, MAX_CARD_SKILLS)} label="Skills" emptyLabel="No skills listed" />
        {extraSkills > 0 ? <p className={styles.moreSkills}>+{extraSkills} more</p> : null}
      </div>

      <div className={styles.cardActions}>
        <Button
          to={`/recruiter/talent-pool/${candidate.referenceNumber}`}
          size="sm"
          aria-label={`View full profile for ${candidate.referenceNumber}`}
        >
          View profile
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className={isSelected ? styles.selectActive : ''}
          aria-pressed={isSelected}
          aria-label={`Select ${candidate.referenceNumber} for a multi-talent request`}
          onClick={onToggleSelected}
        >
          {isSelected ? <Check size={15} aria-hidden="true" /> : <ListChecks size={15} aria-hidden="true" />}
          {isSelected ? 'Selected' : 'Select'}
        </Button>
      </div>
    </article>
  );
}

export default TalentPoolPage;
