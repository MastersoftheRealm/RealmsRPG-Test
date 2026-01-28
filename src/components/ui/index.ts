/**
 * UI Components Index
 * ====================
 * Central export point for all UI components
 */

// Core input components
export { Button, buttonVariants, type ButtonProps } from './button';
export { Input, type InputProps } from './input';
export { SearchInput } from './search-input';

// Layout components
export { PageContainer, type ContainerSize } from './page-container';
export { PageHeader } from './page-header';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

// Chip/Badge components
export { Chip, chipVariants, type ChipProps } from './chip';
export { ExpandableChip, ChipGroup, type ExpandableChipProps, type ChipGroupProps } from './expandable-chip';

// Navigation components
export { TabNavigation, type Tab } from './tab-navigation';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

// Feedback components
export { Modal } from './modal';
export { ToastProvider, useToast } from './toast';
export { Alert, type AlertProps } from './alert';
export { Alert as AlertEnhanced } from './alert-enhanced';

// Collapsible components
export { Collapsible, CollapsibleGroup, type CollapsibleProps, type CollapsibleGroupProps } from './collapsible';

// Loading states
export { Spinner, LoadingOverlay, LoadingState } from './spinner';

// Empty states
export { EmptyState } from './empty-state';

