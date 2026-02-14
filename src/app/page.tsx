/**
 * Root route "/" — wraps home content with (main) layout so Header/Footer apply.
 * Next.js expects a page at app/page for the root URL; content lives in (main)/page.tsx.
 */

import MainLayout from './(main)/layout';
import HomePage from './(main)/page';

export default function RootPage() {
  return (
    <MainLayout>
      <HomePage />
    </MainLayout>
  );
}
