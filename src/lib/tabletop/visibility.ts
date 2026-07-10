import type { VttAction, VttRole, VttTabletopState, VttToken, VttTokenMetadata } from '@/types/tabletop';

function filterTokenMetadata(token: VttToken, showEnemyResources: boolean): VttTokenMetadata {
  if (showEnemyResources || token.combatantType !== 'enemy') return token.metadata;
  const safe = { ...token.metadata };
  delete safe.currentHealth;
  delete safe.maxHealth;
  delete safe.currentEnergy;
  delete safe.maxEnergy;
  delete safe.ap;
  return safe;
}

export function filterTokensForRole(tokens: VttToken[], role: VttRole, showEnemyResources: boolean): VttToken[] {
  if (role === 'realm-master') return tokens;
  return tokens
    .filter((token) => token.visible)
    .map((token) => ({
      ...token,
      locked: true,
      metadata: filterTokenMetadata(token, showEnemyResources),
    }));
}

export function filterActionsForRole(actions: VttAction[], role: VttRole, userId: string): VttAction[] {
  if (role === 'realm-master') return actions;
  return actions.filter((action) => action.type === 'ping' || action.userId === userId);
}

export function filterTabletopStateForRole(state: VttTabletopState, userId: string): VttTabletopState {
  return {
    ...state,
    tokens: filterTokensForRole(
      state.tokens,
      state.role,
      state.scene.settings.showEnemyResources
    ),
    actions: filterActionsForRole(state.actions, state.role, userId),
  };
}
