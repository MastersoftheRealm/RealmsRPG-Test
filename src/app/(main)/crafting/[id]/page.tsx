/**
 * Crafting Tool Page (Single-Page)
 * =================================
 * All-in-one crafting tool: select item, set options, configure optional rules,
 * enter rolls, see live results and outcome. Autosaves progress.
 * Facade (TASK-607): state/derived in `use-crafting-tool-page`; panels under `_components/`.
 */

'use client';

import Link from 'next/link';
import { ChevronLeft, Hammer } from 'lucide-react';
import { Button, LoadingState, Alert } from '@/components/ui';
import { CreatorLayout } from '@/components/creator';
import { CraftingItemSelectModal } from '@/components/crafting/CraftingItemSelectModal';
import { useCraftingToolPage } from './_components/use-crafting-tool-page';
import { CraftingSummarySidebar } from './_components/crafting-summary-sidebar';
import { CraftingItemOptionsSection } from './_components/crafting-item-options-section';
import { CraftingAdjustmentsSection } from './_components/crafting-adjustments-section';
import { CraftingRollsSection } from './_components/crafting-rolls-section';
import { CraftingOptionalRulesSection } from './_components/crafting-optional-rules-section';
import { CraftingOutcomeCard } from './_components/crafting-outcome-card';

export default function CraftingToolPage() {
  const model = useCraftingToolPage();

  if (model.isLoading || !model.initialized) {
    return <LoadingState message="Loading crafting session..." size="lg" />;
  }

  if (model.error || !model.session) {
    return (
      <Alert variant="danger" title="Session not found">
        {model.error?.message ?? 'This crafting session could not be loaded.'}
      </Alert>
    );
  }

  const {
    session,
    item,
    customBaseItem,
    displayName,
    requirements,
    effectiveDS,
    required,
  } = model;

  return (
    <CreatorLayout
      icon={<Hammer className="w-6 h-6" />}
      title={displayName}
      description={
        item || customBaseItem
          ? `${requirements?.rarity ?? ''} · DS ${effectiveDS} · ${required} success${required !== 1 ? 'es' : ''} required`
          : 'Select an item to begin crafting.'
      }
      actions={
        <Link href="/crafting">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Crafting
          </Button>
        </Link>
      }
      sidebar={
        <CraftingSummarySidebar
          requirements={requirements}
          requirementsBreakdown={model.requirementsBreakdown}
          effectiveDS={effectiveDS}
          quantity={model.quantity}
          isEnhanced={model.isEnhanced}
          isCompleted={model.isCompleted}
          resolvedPowerRef={model.resolvedPowerRef}
          rulesData={model.rulesData}
          usesType={model.usesType}
          usesCount={model.usesCount}
          session={session}
          item={item}
          customBaseItem={customBaseItem}
          liveOutcome={model.liveOutcome}
          netDelta={model.netDelta}
          sessionsLength={model.sessions.length}
          totalEnhSuccesses={model.totalEnhSuccesses}
          totalEnhFailures={model.totalEnhFailures}
          baseSessionSuccesses={model.baseSessionSuccesses}
          baseSessionFailures={model.baseSessionFailures}
          enhSessionSuccesses={model.enhSessionSuccesses}
          enhSessionFailures={model.enhSessionFailures}
          required={required}
          outcome={model.outcome}
          baseOutcomeForDisplay={model.baseOutcomeForDisplay}
          onComplete={model.handleComplete}
          isSaving={model.saveMutation.isPending}
        />
      }
      modals={
        <>
          <CraftingItemSelectModal
            isOpen={model.itemSelectOpen}
            onClose={() => model.setItemSelectOpen(false)}
            onSelect={model.handleItemSelect}
          />
          <CraftingItemSelectModal
            isOpen={model.upgradeItemSelectOpen}
            onClose={() => model.setUpgradeItemSelectOpen(false)}
            onSelect={model.handleUpgradeItemSelect}
          />
        </>
      }
    >
      <CraftingItemOptionsSection
        session={session}
        item={item}
        customBaseItem={customBaseItem}
        upgradeOriginalItem={model.upgradeOriginalItem}
        isCompleted={model.isCompleted}
        isConsumable={model.isConsumable}
        quantity={model.quantity}
        isEnhanced={model.isEnhanced}
        usesType={model.usesType}
        usesCount={model.usesCount}
        rulesData={model.rulesData}
        powerOptions={model.powerOptions}
        resolvedPowerRef={model.resolvedPowerRef}
        updateData={model.updateData}
        onOpenItemSelect={() => model.setItemSelectOpen(true)}
        onOpenUpgradeItemSelect={() => model.setUpgradeItemSelectOpen(true)}
      />

      <CraftingAdjustmentsSection
        isCompleted={model.isCompleted}
        item={item}
        customBaseItem={customBaseItem}
        session={session}
        effectiveDS={effectiveDS}
        updateData={model.updateData}
      />

      <CraftingRollsSection
        id={model.id}
        isCompleted={model.isCompleted}
        sessions={model.sessions}
        session={session}
        effectiveDS={effectiveDS}
        netDelta={model.netDelta}
        totalEnhSuccesses={model.totalEnhSuccesses}
        totalEnhFailures={model.totalEnhFailures}
        isEnhanced={model.isEnhanced}
        requirementsBreakdown={model.requirementsBreakdown}
        craftSubSkills={model.craftSubSkills}
        updateData={model.updateData}
        updateSessionRoll={model.updateSessionRoll}
      />

      <CraftingOptionalRulesSection
        isCompleted={model.isCompleted}
        item={item}
        customBaseItem={customBaseItem}
        requirements={requirements}
        rulesData={model.rulesData}
        isConsumable={model.isConsumable}
        mods={model.mods}
        maxReduceTimeByDifficultySteps={model.maxReduceTimeByDifficultySteps}
        maxReduceTimeByCostSteps={model.maxReduceTimeByCostSteps}
        maxReduceDifficultyByTimeSteps={model.maxReduceDifficultyByTimeSteps}
        maxReduceDifficultyByCostSteps={model.maxReduceDifficultyByCostSteps}
        setOptionModifier={model.setOptionModifier}
      />

      <CraftingOutcomeCard
        isCompleted={model.isCompleted}
        outcome={model.outcome}
        session={session}
        craftSubSkill={model.craftSubSkill}
        netDelta={model.netDelta}
        resolvedPowerRef={model.resolvedPowerRef}
        rulesData={model.rulesData}
        isEnhanced={model.isEnhanced}
        requirements={requirements}
        requirementsBreakdown={model.requirementsBreakdown}
        upgradePotencyValue={model.upgradePotencyValue}
        setUpgradePotencyValue={model.setUpgradePotencyValue}
        createEnhanced={model.createEnhanced}
        updateEnhanced={model.updateEnhanced}
        showToast={model.showToast}
      />
    </CreatorLayout>
  );
}
