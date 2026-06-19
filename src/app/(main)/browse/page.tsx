import { redirect } from 'next/navigation';

/** Legacy route — consolidated into /library (TASK-336). Redirect keeps Next.js route types valid. */
export default function BrowsePage() {
  redirect('/library');
}
