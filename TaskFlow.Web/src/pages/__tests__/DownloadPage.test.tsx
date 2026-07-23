import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DownloadPage from '../DownloadPage';

describe('DownloadPage', () => {
  it('renders the page heading', () => {
    render(<DownloadPage />);
    expect(screen.getByRole('heading', { name: /desktop app/i })).toBeInTheDocument();
  });

  it('renders a Windows download link', () => {
    render(<DownloadPage />);
    const link = screen.getByRole('link', { name: /download for windows/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('TaskFlow-Setup.exe'));
  });

  it('renders Mac button as disabled', () => {
    render(<DownloadPage />);
    const macButton = screen.getByRole('button', { name: /coming soon/i });
    expect(macButton).toBeDisabled();
  });

  it('renders installation instructions', () => {
    render(<DownloadPage />);
    expect(screen.getByText(/smartscreen/i)).toBeInTheDocument();
  });

  it('renders the auto-update info banner', () => {
    render(<DownloadPage />);
    expect(screen.getByText(/already using the desktop app/i)).toBeInTheDocument();
  });
});
