import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthProvider from './AuthProvider.jsx';
import GuestRoute from '../routes/GuestRoute.jsx';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';
import { USER_ROLES } from './roles.js';

// The bootstrap path talks to axios directly, so the HTTP layer is the seam.
vi.mock('../api/http.js', async () => {
  const actual = await vi.importActual('../api/http.js');

  return {
    ...actual,
    refreshSession: vi.fn(),
    setAccessToken: vi.fn(),
    setSessionExpiredHandler: vi.fn(),
  };
});

const { refreshSession } = await import('../api/http.js');

function renderApp({ strict = true } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const tree = (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<p>Sign in form</p>} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.TALENT]} />}>
              <Route path="/talent" element={<p>Talent portal</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

describe('AuthProvider session bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login page for an anonymous visitor under StrictMode', async () => {
    // No refresh cookie: the API answers 401 and the promise rejects.
    refreshSession.mockRejectedValue(new Error('401'));

    renderApp();

    // Regression: a StrictMode double mount used to leave status stuck on
    // `loading`, so guarded routes span forever and login never rendered.
    await waitFor(() => {
      expect(screen.getByText('Sign in form')).toBeInTheDocument();
    });

    expect(screen.queryByText('Checking your session')).not.toBeInTheDocument();
  });

  it('renders the login page outside StrictMode too', async () => {
    refreshSession.mockRejectedValue(new Error('401'));

    renderApp({ strict: false });

    await waitFor(() => {
      expect(screen.getByText('Sign in form')).toBeInTheDocument();
    });
  });

  it('only calls the refresh endpoint once despite the double mount', async () => {
    refreshSession.mockRejectedValue(new Error('401'));

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Sign in form')).toBeInTheDocument();
    });

    // Rotating the refresh token twice would invalidate the session it just
    // restored, so exactly one call is the contract.
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it('redirects a restored session away from the login page', async () => {
    refreshSession.mockResolvedValue({
      id: '1',
      firstName: 'Ada',
      lastName: 'Obi',
      fullName: 'Ada Obi',
      email: 'ada@example.com',
      role: USER_ROLES.TALENT,
      isEmailVerified: true,
      isActive: true,
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Talent portal')).toBeInTheDocument();
    });

    expect(screen.queryByText('Sign in form')).not.toBeInTheDocument();
  });
});
