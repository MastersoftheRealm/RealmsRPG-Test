/**
 * Power Creator — editor facade (TASK-381 Phase 1, TASK-616)
 * =========================================================
 * Composes co-located section islands. State, cost math, save/load, and
 * CreatorPageShell stay in page.tsx / workspace hook.
 */

'use client';

import { PowerCreatorEditorActionProfile } from './power-creator-editor-action-profile';
import { type PowerCreatorEditorProps } from './power-creator-editor-config';
import { PowerCreatorEditorMeta } from './power-creator-editor-meta';
import { PowerCreatorEditorPowerConfig } from './power-creator-editor-power-config';
import { PowerCreatorEditorPowerDamage } from './power-creator-editor-power-damage';
import { PowerCreatorEditorPowerParts } from './power-creator-editor-power-parts';

export type { PowerCreatorEditorProps };

export function PowerCreatorEditor(props: PowerCreatorEditorProps) {
  return (
    <>
      <PowerCreatorEditorMeta
        isAdmin={props.isAdmin}
        name={props.name}
        onNameChange={props.onNameChange}
        description={props.description}
        onDescriptionChange={props.onDescriptionChange}
        imageId={props.imageId}
        imageUrl={props.imageUrl}
        onImageChange={props.onImageChange}
      />

      <PowerCreatorEditorActionProfile
        actionType={props.actionType}
        onActionTypeChange={props.onActionTypeChange}
        isReaction={props.isReaction}
        onIsReactionChange={props.onIsReactionChange}
        actionTypeDisplay={props.actionTypeDisplay}
        attackMode={props.attackMode}
        onAttackModeChange={props.onAttackModeChange}
        sectionCosts={props.sectionCosts}
      />

      <PowerCreatorEditorPowerConfig
        range={props.range}
        onRangeChange={props.onRangeChange}
        rangeSummary={props.rangeSummary}
        area={props.area}
        onAreaChange={props.onAreaChange}
        areaPartInfo={props.areaPartInfo}
        duration={props.duration}
        onDurationChange={props.onDurationChange}
        durationSummary={props.durationSummary}
        sectionCosts={props.sectionCosts}
      />

      <PowerCreatorEditorPowerParts
        selectedParts={props.selectedParts}
        nonMechanicParts={props.nonMechanicParts}
        powerPartsSummary={props.powerPartsSummary}
        onAddPart={props.onAddPart}
        onRemovePart={props.onRemovePart}
        onUpdatePart={props.onUpdatePart}
        selectedAdvancedParts={props.selectedAdvancedParts}
        mechanicPartsForList={props.mechanicPartsForList}
        powerMechanicsSummary={props.powerMechanicsSummary}
        onAddMechanicPart={props.onAddMechanicPart}
        onRemoveAdvancedPart={props.onRemoveAdvancedPart}
        onUpdateAdvancedPart={props.onUpdateAdvancedPart}
        sectionCosts={props.sectionCosts}
      />

      <PowerCreatorEditorPowerDamage
        damages={props.damages}
        onDamagesChange={props.onDamagesChange}
        damageSummary={props.damageSummary}
        sectionCosts={props.sectionCosts}
      />
    </>
  );
}
