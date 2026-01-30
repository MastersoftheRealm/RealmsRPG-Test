/**
 * UI Components Index
 * ====================
 * Central export point for all UI components
 */

// Core input components
export { Button, buttonVariants, type ButtonProps } from './button';
export { IconButton, iconButtonVariants, type IconButtonProps } from './icon-button';
export { Input, type InputProps } from './input';
export { Select, type SelectProps, type SelectOption } from './select';
export { Checkbox, type CheckboxProps } from './checkbox';
export { Textarea, type TextareaProps } from './textarea';
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
// Note: tabs.tsx (Tabs, TabsList, TabsTrigger, TabsContent) was removed - use TabNavigation instead

// Feedback components
export { Modal } from './modal';
export { ToastProvider, useToast } from './toast';
export { Alert, type AlertProps } from './alert';
// Note: alert-enhanced.tsx was removed - use Alert instead

// Collapsible components
export { Collapsible, CollapsibleGroup, type CollapsibleProps, type CollapsibleGroupProps } from './collapsible';

// Loading states
export { Spinner, LoadingOverlay, LoadingState } from './spinner';

// Empty states
export { EmptyState } from './empty-state';

