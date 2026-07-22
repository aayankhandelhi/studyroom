import { ImageResponse } from 'next/og';

// Route segment config
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Favicon: brand-green rounded tile with an 'S' monogram. Generated at build time. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2D6A4F',
          color: '#F7F5F0',
          fontSize: 22,
          fontWeight: 700,
          borderRadius: 7,
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
