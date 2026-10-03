import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PortalLayout from './PortalLayout.jsx';

vi.mock('../../auth/useAuth.js', () => ({
  useAuth: () => ({
    user: { role: 'recruiter', firstName: 'Dana', fullName: 'Dana Okoro', isEmailVerified: true },
    signOut: vi.fn(),
  }),
}));

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/recruiter']}>
      <Routes>
        <Route element={<PortalLayout />}>
          <Route path="/recruiter" element={<p>Recruiter overview</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

const toggleButton = () => screen.getByRole('button', { name: /(Collapse|Expand) sidebar/ });

describe('PortalLayout — collapsible sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts expanded, with the toggle and every nav label visible', () => {
    renderLayout();

    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /Find talent/ })).toBeInTheDocument();
  });

  it('collapses on click — the one control works the same regardless of screen size', () => {
    renderLayout();

    fireEvent.click(toggleButton());

    const expanded = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(expanded).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('link', { name: /Find talent/ })).toBeInTheDocument();
  });

  it('expands again on a second click', () => {
    renderLayout();

    fireEvent.click(toggleButton());
    fireEvent.click(toggleButton());

    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
  });

  it('remembers the collapsed state across remounts', () => {
    const { unmount } = renderLayout();
    fireEvent.click(toggleButton());
    unmount();

    renderLayout();

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
  });

  it('does not throw when localStorage is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(() => renderLayout()).not.toThrow();
    expect(() => fireEvent.click(toggleButton())).not.toThrow();
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();

    getItem.mockRestore();
    setItem.mockRestore();
  });
});
