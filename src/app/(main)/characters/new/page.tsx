/**
 * Character Creator Page
 * ======================
 * Multi-step character creation wizard
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import {
  CreatorTabBar,
  ArchetypeStep,
  SpeciesStep,
  AncestryStep,
  AbilitiesStep,
  SkillsStep,
  FeatsStep,
  EquipmentStep,
  PowersStep,
  FinalizeStep,
} from '@/components/character-creator';

const STEP_COMPONENTS = {
  archetype: ArchetypeStep,
  species: SpeciesStep,
  ancestry: AncestryStep,
  abilities: AbilitiesStep,
  skills: SkillsStep,
  feats: FeatsStep,
  equipment: EquipmentStep,
  powers: PowersStep,
  finalize: FinalizeStep,
};

export default function CharacterCreatorPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { currentStep } = useCharacterCreatorStore();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/characters/new');
    }
  }, [loading, user, router]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect
  }
  
  const StepComponent = STEP_COMPONENTS[currentStep];
  
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Character</h1>
          <p className="text-gray-600 mt-1">
            Follow the steps below to build your character
          </p>
        </div>
        
        <CreatorTabBar />
        
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
          <StepComponent />
        </div>
      </div>
    </div>
  );
}
