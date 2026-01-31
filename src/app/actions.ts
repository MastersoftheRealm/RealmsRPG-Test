/**
 * Server Actions Index
 * =====================
 * Centralized export of all server actions.
 * 
 * Server Actions provide:
 * - Type-safe, server-side mutations
 * - Automatic cache revalidation
 * - Reduced client bundle size
 * - Better security (server-side validation)
 * 
 * Usage:
 * ```tsx
 * import { createCharacterAction } from '@/app/actions';
 * 
 * const handleCreate = async (data) => {
 *   const result = await createCharacterAction(data);
 *   if (result.error) {
 *     // handle error
 *   }
 * };
 * ```
 */

// Auth actions
export {
  signOutAction,
  createUserProfileAction,
  updateUserProfileAction,
  getUserProfileAction,
  checkUsernameAvailableAction,
  deleteAccountAction,
} from './(auth)/actions';

// Character actions
export {
  getCharactersAction,
  getCharacterAction,
  createCharacterAction,
  updateCharacterAction,
  deleteCharacterAction,
  duplicateCharacterAction,
} from './(main)/characters/actions';

// Library actions
export {
  // Powers
  getUserPowersAction,
  savePowerAction,
  deletePowerAction,
  // Techniques
  getUserTechniquesAction,
  saveTechniqueAction,
  deleteTechniqueAction,
  // Items
  getUserItemsAction,
  saveItemAction,
  deleteItemAction,
  // Creatures
  getUserCreaturesAction,
  saveCreatureAction,
  deleteCreatureAction,
} from './(main)/library/actions';
