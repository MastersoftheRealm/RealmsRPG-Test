import { ImageResponse } from 'next/og';
import { REALMS_MOTTO } from '@/lib/constants/copy/shared-copy';

export const alt = 'RealmsRPG';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // DESIGN_INTENT: ImageResponse/Satori cannot use Tailwind tokens.
        // Hexes match DESIGN_SYSTEM primary-700, light on-dark, and accent-gold.
        background: '#053357',
        color: '#f9f9f9',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 88,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
        }}
      >
        RealmsRPG
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 24,
          fontSize: 32,
          color: '#c79956',
          textAlign: 'center',
          maxWidth: 900,
        }}
      >
        {REALMS_MOTTO}
      </div>
    </div>,
    { ...size },
  );
}
