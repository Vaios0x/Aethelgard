import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import RequireAuth from '../../auth/RequireAuth';

describe('RequireAuth', () => {
  beforeEach(() => {
    try { window.localStorage.removeItem('AETH_JWT'); } catch {}
  });

  it('redirige a "/" cuando no hay token', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<div>Landing</div>} />
          <Route path="/dashboard" element={<RequireAuth><div>Dashboard</div></RequireAuth>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  it('renderiza hijos cuando hay token', () => {
    try { window.localStorage.setItem('AETH_JWT', 'token'); } catch {}
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<div>Landing</div>} />
          <Route path="/dashboard" element={<RequireAuth><div>Dashboard</div></RequireAuth>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});


