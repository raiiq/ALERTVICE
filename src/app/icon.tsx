import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '34%', background: '#CE1126' }}></div>
        <div style={{ width: '100%', height: '32%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '12px', height: '4px', background: '#007A3D', borderRadius: '1px' }}></div>
        </div>
        <div style={{ width: '100%', height: '34%', background: 'black' }}></div>
      </div>
    ),
    { ...size }
  )
}
