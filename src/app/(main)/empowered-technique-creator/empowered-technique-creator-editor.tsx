/**
 * Empowered Technique Creator — editor facade (TASK-381 Phase 4, TASK-610)
 * =========================================================================
 * Composes co-located section islands. State, cost math, save/load, and
 * CreatorPageShell stay in page.tsx / workspace hook.
 */

'use client';

import { EmpoweredTechniqueEditorActionProfile } from './empowered-technique-editor-action-profile';
import { type EmpoweredTechniqueCreatorEditorProps } from './empowered-technique-editor-config';
import { EmpoweredTechniqueEditorMeta } from './empowered-technique-editor-meta';
import { EmpoweredTechniqueEditorPowerConfig } from './empowered-technique-editor-power-config';
import { EmpoweredTechniqueEditorPowerDamage } from './empowered-technique-editor-power-damage';
import { EmpoweredTechniqueEditorPowerParts } from './empowered-technique-editor-power-parts';
import { EmpoweredTechniqueEditorTechniqueParts } from './empowered-technique-editor-technique-parts';
import { TargetedDefensesSection } from '@/components/creator';

export type { EmpoweredTechniqueCreatorEditorProps };

export function EmpoweredTechniqueCreatorEditor(props: EmpoweredTechniqueCreatorEditorProps) {
  return (
    <>
      <EmpoweredTechniqueEditorMeta
        isAdmin={props.isAdmin}
        name={props.name}
        onNameChange={props.onNameChange}
        description={props.description}
        onDescriptionChange={props.onDescriptionChange}
        imageId={props.imageId}
        imageUrl={props.imageUrl}
        onImageChange={props.onImageChange}
      >
        <TargetedDefensesSection
          selected={props.targetedDefenses}
          onChange={props.onTargetedDefensesChange}
          parts={props.suggestionSelectedParts}
          partsDb={props.suggestionPartsDb}
          damageTypes={props.powerDamages.map((d) => d.type).filter((t) => t && t !== 'none')}
          attackMode={props.attackMode}
        />
      </EmpoweredTechniqueEditorMeta>

      <EmpoweredTechniqueEditorActionProfile
        actionDisplay={props.actionDisplay}
        actionType={props.actionType}
        onActionTypeChange={props.onActionTypeChange}
        isReaction={props.isReaction}
        onIsReactionChange={props.onIsReactionChange}
        attackMode={props.attackMode}
        onAttackModeChange={props.onAttackModeChange}
        sectionCosts={props.sectionCosts}
      />

      <EmpoweredTechniqueEditorPowerConfig
        rangeDisplay={props.rangeDisplay}
        range={props.range}
        onRangeStepsChange={props.onRangeStepsChange}
        area={props.area}
        onAreaChange={props.onAreaChange}
        duration={props.duration}
        onDurationChange={props.onDurationChange}
        onDurationTypeChange={props.onDurationTypeChange}
        sectionCosts={props.sectionCosts}
      />

      <EmpoweredTechniqueEditorPowerDamage
        powerDamages={props.powerDamages}
        onPowerDamagesChange={props.onPowerDamagesChange}
        powerDamageSummary={props.powerDamageSummary}
        sectionCosts={props.sectionCosts}
        partsDb={props.suggestionPartsDb}
      />

      <EmpoweredTechniqueEditorPowerParts
        selectedPowerParts={props.selectedPowerParts}
        nonMechanicPowerParts={props.nonMechanicPowerParts}
        onAddPowerPart={props.onAddPowerPart}
        onRemovePowerPart={props.onRemovePowerPart}
        onUpdatePowerPart={props.onUpdatePowerPart}
        selectedPowerAdvancedParts={props.selectedPowerAdvancedParts}
        powerMechanicsForList={props.powerMechanicsForList}
        onAddPowerMechanicPart={props.onAddPowerMechanicPart}
        onRemovePowerAdvancedPart={props.onRemovePowerAdvancedPart}
        onUpdatePowerAdvancedPart={props.onUpdatePowerAdvancedPart}
        sectionCosts={props.sectionCosts}
      />

      <EmpoweredTechniqueEditorTechniqueParts
        selectedTechniqueParts={props.selectedTechniqueParts}
        nonMechanicTechniqueParts={props.nonMechanicTechniqueParts}
        onAddTechniquePart={props.onAddTechniquePart}
        onRemoveTechniquePart={props.onRemoveTechniquePart}
        onUpdateTechniquePart={props.onUpdateTechniquePart}
        techniqueDamage={props.techniqueDamage}
        onTechniqueDamageChange={props.onTechniqueDamageChange}
        techniqueDamageSummary={props.techniqueDamageSummary}
        sectionCosts={props.sectionCosts}
        attackMode={props.attackMode}
      />
    </>
  );
}
