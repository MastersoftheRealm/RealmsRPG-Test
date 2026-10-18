export const ADMIN_SOURCES_CARD_TITLE = 'Sources';
export const ADMIN_SOURCES_CARD_BODY =
  'View one source and add or remove codex items from that pack. Create a new source name when you add the first item.';
export const ADMIN_SOURCES_CARD_BUTTON = 'Open Sources';

export const ADMIN_SOURCES_PAGE_TITLE = 'Sources';
export const ADMIN_SOURCES_PAGE_DESCRIPTION =
  'Feats, skills, species, traits, parts, properties, equipment, archetypes, and creature feats in the selected source.';
export const ADMIN_SOURCES_BACK_LINK = '← Back to Admin';

export const ADMIN_SOURCES_SELECT_LABEL = 'Source';
export const ADMIN_SOURCES_SELECT_PLACEHOLDER = 'Select a source';

export const ADMIN_SOURCES_NEW_SOURCE_BUTTON = 'New source';
export const ADMIN_SOURCES_NEW_SOURCE_FIELD_LABEL = 'Name';
export const ADMIN_SOURCES_NEW_SOURCE_SUBMIT = 'Create';
export const ADMIN_SOURCES_NEW_SOURCE_DRAFT_HELPER = 'This name is kept when you add an item.';
export const ADMIN_SOURCES_NEW_SOURCE_MODAL_TITLE = 'New source';

export const ADMIN_SOURCES_SECTION_ADD_BUTTON = 'Add';
export const ADMIN_SOURCES_ADD_MODAL_SEARCH = 'Search';
export const ADMIN_SOURCES_ADD_MODAL_CONFIRM = 'Add selected';

export function adminSourcesAddModalTitle(source: string): string {
  return `Add to ${source}`;
}

export function adminSourcesRemoveButtonLabel(itemName: string, source: string): string {
  return `Remove ${itemName} from ${source}`;
}

export function adminSourcesRemoveConfirmTitle(source: string): string {
  return `Remove from ${source}`;
}

export function adminSourcesRemoveConfirmBody(itemName: string, source: string): string {
  return `${itemName} will no longer be in ${source}.`;
}

export function adminSourcesRemoveLastSourceBody(itemName: string, source: string): string {
  return `${itemName} will no longer be in ${source}. It will be Core.`;
}

export const ADMIN_SOURCES_REMOVE_CONFIRM_BUTTON = 'Remove';
export const ADMIN_SOURCES_CANCEL = 'Cancel';

export const ADMIN_SOURCES_SEARCH_PLACEHOLDER = 'Search names and sources…';
export const ADMIN_SOURCES_ADD_MODAL_TYPE_COLUMN = 'Type';

export function adminSourcesSectionSearchLabel(sectionLabel: string): string {
  return `Search ${sectionLabel}`;
}

export const ADMIN_SOURCES_EMPTY_SOURCE_TITLE = 'This source has no items.';

export const ADMIN_SOURCES_LOADING = 'Loading sources…';
export const ADMIN_SOURCES_LOAD_ERROR = 'Could not load sources.';
export const ADMIN_SOURCES_EMPTY_CATALOG_TITLE = 'No sources yet';
export const ADMIN_SOURCES_EMPTY_CATALOG_MESSAGE =
  'Create a source name, then add codex items to store it on the first row.';

export const ADMIN_SOURCES_LIST_COLUMN_NAME = 'Name';
export const ADMIN_SOURCES_LIST_COLUMN_SOURCES = 'Sources';
export const ADMIN_SOURCES_SAVED_TOAST = 'Saved';

export const ADMIN_SOURCES_NAME_REQUIRED = 'Source name is required.';
export const ADMIN_SOURCES_UNNAMED_ITEM = 'Unnamed item';
export const ADMIN_SOURCES_ADD_MODAL_ALL_TYPES = 'All types';
export const ADMIN_SOURCES_ADD_ITEMS_BUTTON = 'Add items';
export const ADMIN_SOURCES_UPDATE_FAILED = 'Update failed.';
export const ADMIN_SOURCES_ADD_FAILED = 'Failed to add item to source.';
export const ADMIN_SOURCES_REMOVE_FAILED = 'Failed to remove item from source.';
export const ADMIN_SOURCES_REMOVE_LOADING = 'Removing…';
export const ADMIN_SOURCES_UNKNOWN_COLLECTION = 'Unknown collection';
export const ADMIN_SOURCES_NOT_FOUND = 'Document not found';

export function adminSourcesSectionAddLabel(sectionLabel: string): string {
  return `Add ${sectionLabel}`;
}

export function adminSourcesAddItemsLabel(source: string): string {
  return `Add items to ${source}`;
}

export function adminSourcesBatchStoppedMessage(succeeded: number, error: string): string {
  const added = succeeded === 1 ? '1 item was added' : `${succeeded} items were added`;
  return `${error} (${added} before the error.)`;
}

export function adminSourcesRemoveWithError(body: string, error: string): string {
  return `${body} ${error}`;
}
