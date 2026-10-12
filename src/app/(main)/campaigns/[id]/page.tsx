import { assertCampaignDetailHttpAccess } from '@/lib/server/assert-resource-http-access';
import CampaignDetailRoute from './campaign-detail-route';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageParams) {
  const { id } = await params;
  await assertCampaignDetailHttpAccess(id);
  return <CampaignDetailRoute />;
}
