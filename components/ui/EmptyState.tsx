/**
 * EmptyState Component - Enterprise Design System
 * Professional empty states for various scenarios
 */

import { HTMLAttributes } from 'react';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  } & Partial<ButtonProps>;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        text-center py-12 px-4
        ${className}
      `.trim()}
      {...props}
    >
      {icon && (
        <div className="mb-6 text-gray-300">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-base text-gray-600 mb-8 max-w-md">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'primary'}
              size={action.size || 'md'}
              {...(action as any)}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Predefined empty states for common scenarios
export function NoResultsState({
  onClearFilters,
}: {
  onClearFilters?: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="No results found"
      description="We couldn't find any matches for your search. Try adjusting your filters or search terms."
      action={
        onClearFilters
          ? {
              label: 'Clear all filters',
              onClick: onClearFilters,
              variant: 'outline',
            }
          : undefined
      }
    />
  );
}

export function NoCVsState({
  onUpload,
}: {
  onUpload: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      }
      title="No CVs uploaded yet"
      description="Get started by uploading your first CV. Our AI will automatically extract key information and make it searchable."
      action={{
        label: 'Upload CVs',
        onClick: onUpload,
      }}
    />
  );
}

export function NoShortlistState() {
  return (
    <EmptyState
      icon={
        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      }
      title="No candidates shortlisted"
      description="Start searching for candidates and add your top picks to your shortlist."
    />
  );
}

export function ErrorState({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      }
      title="Something went wrong"
      description="We encountered an error while loading this content. Please try again."
      action={
        onRetry
          ? {
              label: 'Try again',
              onClick: onRetry,
              variant: 'primary',
            }
          : undefined
      }
    />
  );
}
