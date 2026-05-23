/**
 * Loading Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading, Skeleton, CardSkeleton, TableSkeleton } from '@/components/ui/loading';

describe('Loading Components', () => {
  describe('Loading', () => {
    it('should render with default props', () => {
      render(<Loading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render with custom text', () => {
      render(<Loading text="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should render in fullscreen mode', () => {
      const { container } = render(<Loading fullScreen />);
      const loadingDiv = container.firstChild;
      expect(loadingDiv).toHaveClass('fixed', 'inset-0');
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<Loading size="sm" />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<Loading size="lg" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Skeleton', () => {
    it('should render single skeleton', () => {
      const { container } = render(<Skeleton />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(1);
    });

    it('should render multiple skeletons', () => {
      const { container } = render(<Skeleton count={3} />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(3);
    });

    it('should apply custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />);
      const skeleton = container.querySelector('.custom-class');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('CardSkeleton', () => {
    it('should render card skeleton structure', () => {
      const { container } = render(<CardSkeleton />);
      const card = container.querySelector('.rounded-lg.border');
      expect(card).toBeInTheDocument();

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('TableSkeleton', () => {
    it('should render table skeleton with default rows', () => {
      const { container } = render(<TableSkeleton />);
      const rows = container.querySelectorAll('tr');
      // 1 header + 5 default rows
      expect(rows).toHaveLength(6);
    });

    it('should render table skeleton with custom rows', () => {
      const { container } = render(<TableSkeleton rows={3} />);
      const rows = container.querySelectorAll('tr');
      // 1 header + 3 custom rows
      expect(rows).toHaveLength(4);
    });

    it('should have table structure', () => {
      const { container } = render(<TableSkeleton />);
      expect(container.querySelector('table')).toBeInTheDocument();
      expect(container.querySelector('thead')).toBeInTheDocument();
      expect(container.querySelector('tbody')).toBeInTheDocument();
    });
  });
});
