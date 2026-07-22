import { ImageResponse } from 'next/og';

export const alt = 'StudyNook — find & book study spaces near you';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Default social-share (Open Graph / Twitter) image. Generated at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
          color: '#F7F5F0',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F7F5F0',
              color: '#2D6A4F',
              fontSize: 46,
              fontWeight: 800,
              borderRadius: 16,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>StudyNook</div>
        </div>
        <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
          Find &amp; book study spaces near you
        </div>
        <div style={{ fontSize: 30, marginTop: 24, opacity: 0.85 }}>
          Study halls, reading rooms &amp; coworking — discover, compare, reserve.
        </div>
      </div>
    ),
    { ...size },
  );
}
