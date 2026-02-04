/**
 * Codex Filter Components
 * ========================
 * Re-export filter components from shared/filters for backward compatibility.
 * New code should import directly from '@/components/shared/filters'.
 * 
 * @deprecated Import from '@/components/shared/filters' instead
 */

export {
  ChipSelect,
  AbilityRequirementFilter,
  type AbilityRequirement,
  TagFilter,
  CheckboxFilter,
  SelectFilter,
  FilterSection,
} from '@/components/shared/filters';
