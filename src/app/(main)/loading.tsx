/**
 * Main Route Group Loading
 * =========================
 * Shows a centered spinner while route transitions happen.
 */

import { LoadingState } from '@/components/ui/spinner';

export default function MainLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingState message="Loading..." size="lg" padding="lg" />
    </div>
  );
}
