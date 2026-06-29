/**
 * Community / closing band
 * ========================
 * Tertiary CTA (REALMS_PRODUCT_OVERVIEW Section 4) for visitors not ready to
 * create yet: Join Discord. Closing section of the landing scroll story.
 */

import { DiscordIcon } from '@/components/shared/discord-icon';
import { LANDING_COPY, DISCORD_URL } from '@/lib/constants/site-copy';
import { MarketingExternalButton } from './marketing-button';

export function CommunitySection() {
  const copy = LANDING_COPY.community;

  return (
    <section className="bg-surface-secondary py-14 sm:py-20">
      <div className="layout-shell-wide px-4">
        <div className="max-w-[52ch] mx-auto text-center flex flex-col items-center gap-4">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
            {copy.heading}
          </h2>
          <p className="font-nunito text-base sm:text-lg text-text-secondary">
            {copy.body}
          </p>
          <MarketingExternalButton href={DISCORD_URL} variant="outline" size="lg">
            <DiscordIcon className="w-5 h-5" />
            {copy.cta}
          </MarketingExternalButton>
        </div>
      </div>
    </section>
  );
}
