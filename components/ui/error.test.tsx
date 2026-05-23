/**
 * Error Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ErrorMessage,
  ErrorPage,
  InlineError,
  EmptyState,
} from '@/components/ui/error';

describe('Error Components', () => {
  describe('ErrorMessage', () => {
    it('should render error message', () => {
      render(<ErrorMessage message="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<ErrorMessage title="Custom Error" message="Error details" />);
      expect(screen.getByText('Custom Error')).toBeInTheDocument();
      expect(screen.getByText('Error details')).toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', async () => {
      const onRetry = vi.fn();
      const user = userEvent.setup();

      render(<ErrorMessage message="Error" onRetry={onRetry} />);

      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onGoHome when home button clicked', async () => {
      const onGoHome = vi.fn();
      const user = userEvent.setup();

      render(<ErrorMessage message="Error" onGoHome={onGoHome} />);

      const homeButton = screen.getByText('Go Home');
      await user.click(homeButton);

      expect(onGoHome).toHaveBeenCalledTimes(1);
    });

    it('should not render buttons when callbacks not provided', () => {
      render(<ErrorMessage message="Error" />);
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
      expect(screen.queryByText('Go Home')).not.toBeInTheDocument();
    });
  });

  describe('ErrorPage', () => {
    it('should render full page error', () => {
      const { container } = render(<ErrorPage message="Page error" />);
      const errorPage = container.querySelector('.min-h-screen');
      expect(errorPage).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<ErrorPage title="404" message="Page not found" />);
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page not found')).toBeInTheDocument();
    });
  });

  describe('InlineError', () => {
    it('should render inline error', () => {
      render(<InlineError message="Inline error message" />);
      expect(screen.getByText('Inline error message')).toBeInTheDocument();
    });

    it('should have error styling', () => {
      const { container } = render(<InlineError message="Error" />);
      const errorDiv = container.firstChild;
      expect(errorDiv).toHaveClass('text-red-600');
    });
  });

  describe('EmptyState', () => {
    it('should render empty state', () => {
      render(
        <EmptyState
          title="No Data"
          description="There is no data to display"
        />
      );
      expect(screen.getByText('No Data')).toBeInTheDocument();
      expect(screen.getByText('There is no data to display')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      const Icon = () => <svg data-testid="custom-icon" />;
      render(
        <EmptyState
          icon={Icon}
          title="Empty"
          description="No items"
        />
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should render action button', async () => {
      const onAction = vi.fn();
      const user = userEvent.setup();

      render(
        <EmptyState
          title="Empty"
          description="No items"
          action={{
            label: 'Add Item',
            onClick: onAction,
          }}
        />
      );

      const actionButton = screen.getByText('Add Item');
      await user.click(actionButton);

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('should not render action when not provided', () => {
      render(
        <EmptyState
          title="Empty"
          description="No items"
        />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
