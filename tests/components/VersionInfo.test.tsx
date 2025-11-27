/**
 * VersionInfo Component Tests
 * 
 * Example component test demonstrating React Testing Library patterns.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VersionInfo } from '../../src/components/VersionInfo';

describe('VersionInfo', () => {
  it('renders version information', () => {
    render(<VersionInfo />);
    
    // Check that version text is displayed
    const versionText = screen.getByText(/v\d+\.\d+/);
    expect(versionText).toBeInTheDocument();
  });

  it('displays the correct version format', () => {
    render(<VersionInfo />);
    
    // Version should match semantic versioning pattern
    const versionText = screen.getByText(/v\d+\.\d+/);
    expect(versionText.textContent).toMatch(/v\d+\.\d+/);
  });
});

