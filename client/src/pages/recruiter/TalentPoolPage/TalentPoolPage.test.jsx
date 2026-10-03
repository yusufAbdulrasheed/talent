import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TalentPoolPage from './TalentPoolPage.jsx';

vi.mock('../../../api/endpoints/recruiter.js', () => ({
  searchTalentPool: vi.fn(),
  createGroupPlacementRequest: vi.fn(),
}));

const { searchTalentPool, createGroupPlacementRequest } = await import('../../../api/endpoints/recruiter.js');

const TIERS = [
  { tier: 'junior', unlocked: true, total: 8 },
  { tier: 'intermediate', unlocked: false, total: 4 },
  { tier: 'senior', unlocked: false, total: 4 },
];

const CANDIDATE = {
  locked: false,
  referenceNumber: 'TAL-2026-00001',
  location: 'Yaba, Lagos',
  skills: ['Bookkeeping', 'Microsoft Excel'],
  certifications: [],
  education: 'BSc Accounting',
};

function pageOf(candidates) {
  return {
    candidates,
    pagination: { page: 1, limit: 12, total: candidates.length, totalPages: 1 },
    tiers: TIERS,
  };
}

function renderPage(initialEntry = '/recruiter/talent-pool') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/recruiter/talent-pool" element={<TalentPoolPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const lastParams = () => searchTalentPool.mock.lastCall[0];

describe('TalentPoolPage', () => {
  beforeEach(() => {
    searchTalentPool.mockReset();
    searchTalentPool.mockImplementation(async (params) =>
      pageOf(params.tier === 'senior' || params.tier === 'intermediate' ? [] : [CANDIDATE]),
    );
  });

  describe('filters', () => {
    it('applies every typed filter when "Apply filters" is clicked', async () => {
      renderPage();
      await screen.findByText('TAL-2026-00001');
      expect(lastParams()).toEqual({ page: 1 });

      fireEvent.change(screen.getByRole('textbox', { name: 'Location' }), { target: { value: 'Lagos' } });
      fireEvent.change(screen.getByRole('textbox', { name: 'Skills' }), { target: { value: 'Excel' } });
      fireEvent.change(screen.getByRole('textbox', { name: 'Certification' }), { target: { value: 'ICAN' } });
      expect(searchTalentPool).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

      await waitFor(() =>
        expect(lastParams()).toEqual({ page: 1, location: 'Lagos', skills: 'Excel', certification: 'ICAN' }),
      );
    });

    it('applies the keyword from the Search button, together with the other filters', async () => {
      renderPage();
      await screen.findByText('TAL-2026-00001');

      fireEvent.change(screen.getByRole('textbox', { name: 'Keyword' }), { target: { value: 'accounting' } });
      fireEvent.change(screen.getByRole('textbox', { name: 'Location' }), { target: { value: 'Lagos' } });
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => expect(lastParams()).toEqual({ page: 1, keyword: 'accounting', location: 'Lagos' }));
    });

    it('drops blank filters instead of sending empty values', async () => {
      renderPage();
      await screen.findByText('TAL-2026-00001');

      fireEvent.change(screen.getByRole('textbox', { name: 'Location' }), { target: { value: '   ' } });
      fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));

      await waitFor(() => expect(searchTalentPool.mock.calls.length).toBeGreaterThanOrEqual(1));
      expect(lastParams()).toEqual({ page: 1 });
    });

    it('clears the filters but stays on the selected level tab', async () => {
      renderPage('/recruiter/talent-pool?tier=junior&location=Lagos');
      await screen.findByText('TAL-2026-00001');
      expect(lastParams()).toEqual({ page: 1, location: 'Lagos', tier: 'junior' });

      fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

      await waitFor(() => expect(lastParams()).toEqual({ page: 1, tier: 'junior' }));
      expect(screen.getByRole('textbox', { name: 'Location' })).toHaveValue('');
    });
  });

  describe('level tabs', () => {
    it('shows All plus a tab per level with head-counts, and marks the locked ones', async () => {
      renderPage();
      await screen.findByText('TAL-2026-00001');

      expect(screen.getByRole('button', { name: /^All\s*8$/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Junior\s*8$/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Intermediate\s*4\s*\(locked on your plan\)/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Senior\s*4\s*\(locked on your plan\)/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true');
    });

    it('asks the API for just that level when a tab is chosen, keeping the applied filters', async () => {
      renderPage('/recruiter/talent-pool?location=Lagos');
      await screen.findByText('TAL-2026-00001');

      fireEvent.click(screen.getByRole('button', { name: /^Junior/ }));

      await waitFor(() => expect(lastParams()).toEqual({ page: 1, location: 'Lagos', tier: 'junior' }));
      expect(screen.getByRole('button', { name: /^Junior/ })).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows only a head-count panel — no talent cards — for a level above the plan', async () => {
      renderPage();
      await screen.findByText('TAL-2026-00001');

      fireEvent.click(screen.getByRole('button', { name: /Senior/ }));

      expect(await screen.findByRole('heading', { name: 'Senior talent is locked on your plan' })).toBeInTheDocument();
      expect(screen.getByText(/4 approved Senior candidates are available/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Subscribe to unlock' })).toHaveAttribute('href', '/recruiter/subscription');
      expect(screen.queryByText('TAL-2026-00001')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /View full profile/ })).not.toBeInTheDocument();
    });

    it('tells the recruiter what their plan is not showing on the All tab', async () => {
      renderPage();
      await screen.findByText('TAL-2026-00001');

      expect(
        screen.getByText('8 more talents are locked on your plan: 4 Intermediate, 4 Senior.'),
      ).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: /View full profile/ })).toHaveLength(1);
    });

    it('does not show the locked notice once a specific level is selected', async () => {
      renderPage('/recruiter/talent-pool?tier=junior');
      await screen.findByText('TAL-2026-00001');

      expect(screen.queryByText(/more talents are locked on your plan/)).not.toBeInTheDocument();
    });

    it('falls back to All for an unknown level in the address instead of erroring', async () => {
      renderPage('/recruiter/talent-pool?tier=constructor');
      await screen.findByText('TAL-2026-00001');

      expect(lastParams()).toEqual({ page: 1 });
      expect(screen.getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('multi-talent request', () => {
    const inPopup = { hidden: true };
    const popup = () => within(document.querySelector('dialog'));

    it('sends the talents selected on the cards to the admin as one request', async () => {
      createGroupPlacementRequest.mockResolvedValue({ groupId: 'g1', placementRequests: [] });
      renderPage();
      await screen.findByText('TAL-2026-00001');

      const select = screen.getByRole('button', { name: /Select TAL-2026-00001/ });
      fireEvent.click(select);
      expect(select).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/talent selected/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Request selected' }));
      fireEvent.click(popup().getByRole('button', { name: /Continue/, ...inPopup }));

      fireEvent.change(popup().getByRole('textbox', { name: 'Job title', ...inPopup }), {
        target: { value: 'Accounts Officer' },
      });
      fireEvent.change(popup().getByRole('textbox', { name: 'Location', ...inPopup }), {
        target: { value: 'Lagos' },
      });
      fireEvent.change(popup().getByRole('textbox', { name: 'Job description', ...inPopup }), {
        target: { value: 'Manage ledgers and monthly reconciliations.' },
      });
      fireEvent.click(popup().getByRole('button', { name: /Send request to admin/, ...inPopup }));

      await waitFor(() => expect(createGroupPlacementRequest).toHaveBeenCalledTimes(1));
      expect(createGroupPlacementRequest.mock.lastCall[0]).toEqual({
        candidateReferences: ['TAL-2026-00001'],
        jobTitle: 'Accounts Officer',
        location: 'Lagos',
        jobDescription: 'Manage ledgers and monthly reconciliations.',
        employmentType: 'full_time',
      });
      expect(await screen.findByText(/1 talent requested/, {}, { timeout: 2000 })).toBeInTheDocument();
    });

    it('cannot continue until at least one talent is selected', async () => {
      renderPage();
      await screen.findByText('TAL-2026-00001');

      fireEvent.click(screen.getAllByRole('button', { name: /Request multiple talents/ })[0]);

      expect(popup().getByRole('button', { name: /Continue/, ...inPopup })).toBeDisabled();
    });

    describe('job title filter inside the popup', () => {
      const CANDIDATE_B = {
        ...CANDIDATE,
        referenceNumber: 'TAL-2026-00002',
        jobTitle: 'Registered Nurse',
      };

      beforeEach(() => {
        searchTalentPool.mockImplementation(async () =>
          pageOf([{ ...CANDIDATE, jobTitle: 'Frontend Developer' }, CANDIDATE_B]),
        );
      });

      it('narrows the popup list by job title without touching the main page search', async () => {
        renderPage();
        await screen.findByText('TAL-2026-00001');

        fireEvent.click(screen.getAllByRole('button', { name: /Request multiple talents/ })[0]);
        expect(popup().getByText('TAL-2026-00001', inPopup)).toBeInTheDocument();
        expect(popup().getByText('TAL-2026-00002', inPopup)).toBeInTheDocument();

        fireEvent.change(popup().getByRole('textbox', { name: 'Filter by job title', ...inPopup }), {
          target: { value: 'nurse' },
        });

        expect(popup().queryByText('TAL-2026-00001', inPopup)).not.toBeInTheDocument();
        expect(popup().getByText('TAL-2026-00002', inPopup)).toBeInTheDocument();
        expect(searchTalentPool).toHaveBeenCalledTimes(1);
        expect(screen.getByText('TAL-2026-00001')).toBeInTheDocument();
      });

      it('"select all on this page" only selects what the filter is currently showing', async () => {
        renderPage();
        await screen.findByText('TAL-2026-00001');

        fireEvent.click(screen.getAllByRole('button', { name: /Request multiple talents/ })[0]);
        fireEvent.change(popup().getByRole('textbox', { name: 'Filter by job title', ...inPopup }), {
          target: { value: 'nurse' },
        });

        fireEvent.click(popup().getByRole('checkbox', { name: 'Select all matching on this page', ...inPopup }));

        expect(popup().getByRole('checkbox', { name: /TAL-2026-00002/, ...inPopup })).toBeChecked();

        fireEvent.change(popup().getByRole('textbox', { name: 'Filter by job title', ...inPopup }), {
          target: { value: '' },
        });
        expect(popup().getByRole('checkbox', { name: /TAL-2026-00001/, ...inPopup })).not.toBeChecked();
      });

      it('keeps a cross-page pick selected even while the filter hides it', async () => {
        renderPage();
        await screen.findByText('TAL-2026-00001');

        fireEvent.click(screen.getByRole('button', { name: /Select TAL-2026-00001/ }));

        fireEvent.click(screen.getByRole('button', { name: 'Request selected' }));
        fireEvent.change(popup().getByRole('textbox', { name: 'Filter by job title', ...inPopup }), {
          target: { value: 'nurse' },
        });

        expect(popup().queryByText('TAL-2026-00001', inPopup)).not.toBeInTheDocument();
        expect(popup().getByRole('button', { name: /Continue/, ...inPopup })).toBeEnabled();
      });

      it('shows an empty state scoped to the filter, with a way to clear just that', async () => {
        renderPage();
        await screen.findByText('TAL-2026-00001');

        fireEvent.click(screen.getAllByRole('button', { name: /Request multiple talents/ })[0]);
        fireEvent.change(popup().getByRole('textbox', { name: 'Filter by job title', ...inPopup }), {
          target: { value: 'astronaut' },
        });

        expect(popup().getByText(/No talents match/, inPopup)).toBeInTheDocument();

        fireEvent.click(popup().getByRole('button', { name: 'Clear this filter', ...inPopup }));

        expect(popup().getByText('TAL-2026-00001', inPopup)).toBeInTheDocument();
        expect(popup().getByText('TAL-2026-00002', inPopup)).toBeInTheDocument();
      });
    });
  });
});
