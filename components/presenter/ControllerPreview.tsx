import React from 'react'
import SlideStage from './SlideStage'
import type { ThemeSettings } from '../../lib/supabase/types'

type PreviewProps = {
  text?: string
  reference?: string
  theme: ThemeSettings
  fontSize: number
  label: string
  large?: boolean
}

export function ControllerPreview({ text = '', reference, theme, fontSize, label, large = false }: PreviewProps) {
  const scale = 0.33 // Match scale with display for consistent rendering
  
  return (
    <div style={{ 
      background: '#000', 
      borderRadius: 12, 
      padding: 12,
      boxShadow: large ? '0 6px 20px rgba(0,0,0,0.4)' : undefined,
      flex: large ? 2 : 1
    }}>
      <div style={{ 
        width: '100%', 
        aspectRatio: '16/9', 
        overflow: 'hidden', 
        position: 'relative' 
      }}>
        <div style={{ 
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '100%',
            height: '100%',
            position: 'relative' 
          }}>
            <SlideStage 
              text={text}
              reference={reference}
              theme={theme}
              fontSize={fontSize}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
              }}
            />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 14, opacity: 0.7 }}>
        {label}
      </div>
    </div>
  )
}

export function ControllerPlaylist({ 
  playlist = [], 
  selectedId,
  onSelect 
}: { 
  playlist: Array<{ id: string; reference: string }>,
  selectedId?: string | null,
  onSelect?: (id: string) => void
}) {
  if (playlist.length === 0) return null

  return (
    <div>
      <h3 style={{ 
        fontSize: 18, 
        fontWeight: 600, 
        marginBottom: 12, 
        color: '#e5e7eb' 
      }}>
        Playlist
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {playlist.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            style={{
              padding: '12px 16px',
              background: item.id === selectedId 
                ? 'rgba(59, 130, 246, 0.5)' 
                : 'rgba(24, 24, 27, 0.8)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 16,
              width: '100%',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              boxShadow: item.id === selectedId 
                ? '0 0 0 2px rgba(59, 130, 246, 0.5)' 
                : undefined
            }}>
            <span style={{ opacity: 0.7, minWidth: 24 }}>{index + 1}.</span>
            <span style={{ flex: 1 }}>{item.reference}</span>
          </button>
        ))}
      </div>
    </div>
  )
}