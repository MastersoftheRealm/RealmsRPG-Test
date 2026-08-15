/**
 * UI Components Index
 * ====================
 * Central export point for all UI components
 */

// Core input components
export { Button, type ButtonProps } from './button';
export { IconButton } from './icon-button';
export { Input } from './input';
export { Select, type SelectOption } from './select';
export { Checkbox } from './checkbox';
export { Textarea } from './textarea';
export { SearchInput } from './search-input';

// Layout components
export { PageContainer, type ContainerSize } from './page-container';
export { PageHeader } from './page-header';
export { TableScroll } from './table-scroll';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
} from './card';
export { SelectionCard, SelectionCardSurface } from './selection-card';

// Chip/Badge components
export {
  Chip,
  DescriptorChip,
  chipVariants,
  type ChipProps,
  type DescriptorChipSize,
} from './chip';
export {
  ExpandableChip,
  ChipGroup,
  type ExpandableChipProps,
  type ExpandableChipOption,
} from './expandable-chip';

// Navigation components
export { TabNavigation, TabContentPanel, useTabGroup, type Tab } from './tab-navigation';
// Note: tabs.tsx (Tabs, TabsList, TabsTrigger, TabsContent) was removed - use TabNavigation instead

// Feedback components
export { Modal } from './modal';
export { ToastProvider, useToast } from './toast';
export { Alert } from './alert';
export { Tooltip } from './tooltip';
// Note: alert-enhanced.tsx was removed - use Alert instead

// Loading states
export { Spinner, LoadingState } from './spinner';

// Empty states
export { EmptyState } from './empty-state';
