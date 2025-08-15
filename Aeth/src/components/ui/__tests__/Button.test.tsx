import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../ui/Button';
import { describe, it, expect, vi } from 'vitest';

describe('Button', () => {
  it('renderiza el contenido', () => {
    render(<Button>Hola</Button>);
    expect(screen.getByRole('button', { name: /hola/i })).toBeInTheDocument();
  });

  it('deshabilita y muestra spinner cuando isLoading=true', async () => {
    render(<Button isLoading aria-label="Cargando">Enviar</Button>);
    const btn = screen.getByRole('button', { name: /cargando/i });
    expect(btn).toBeDisabled();
    // spinner tiene clase animate-spin
    const spinner = btn.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('dispara click cuando no está deshabilitado', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button', { name: /click/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});


