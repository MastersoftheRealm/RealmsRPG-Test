/**
 * Root route "/" — wraps home content with (main) layout so Header/Footer apply.
 * Content lives in (main)/home-page.tsx (non-route) to avoid duplicate route / Vercel manifest issues.
 */

import MainLayout from './(main)/layout';
import HomePage from './(main)/home-page';

export default function RootPage() {
  return (
    <MainLayout>
      <HomePage />
    </MainLayout>
  );
}
