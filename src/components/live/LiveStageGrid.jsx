import React, { useRef, useEffect } from 'react';
import SpeakingIndicator from './SpeakingIndicator';

export default function LiveStageGrid(props) {
  var participants = props.participants || [];
  var maxSeats = props.maxSeats || 20;
  var onTapSeat = props.onTapSeat;

  var emptySeats = Math.max(0, maxSeats - participants.length);
  var emptyArray = new Array(emptySeats).fill(null);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        padding: '10px',
      }}
    >
      {participants.map(function (p) {
        return (
          <SpeakingIndicator
            key={p.id}
            isSpeaking={p.audioLevel > 0.02}
            isHost={p.isHost}
          >
            <StageTile participant={p} onTap={onTapSeat} />
          </SpeakingIndicator>
        );
      })}
      {emptyArray.map(function (_, i) {
        return <EmptySeat key={'empty-' + i} />;
      })}
    </div>
  );
}

function StageTile(props) {
  var p = props.participant;
  var videoRef = useRef(null);

  useEffect(function () {
    if (videoRef.current && p.videoStream) {
      videoRef.current.srcObject = p.videoStream;
    }
  }, [p.videoStream]);

  return (
    <div
      onClick={function () { props.onTap && props.onTap(p.id); }}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#1a1410',
        border: p.isHost ? '2px solid #FFD700' : '1px solid #FFD70033',
        minHeight: '44px',
      }}
    >
      {p.videoStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={p.isLocal}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '22px',
            color: '#F5F0E6',
            background: '#20180f',
          }}
        >
          {(p.name || '?').charAt(0).toUpperCase()}
        </div>
      )}

      {p.isHost && (
        <span style={{ position: 'absolute', top: '4px', left: '4px', fontSize: '14px' }}>👑</span>
      )}
      {p.muted && (
        <span style={{ position: 'absolute', bottom: '4px', right: '4px', fontSize: '14px' }}>🔇</span>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(0deg, #000000cc, transparent)',
          color: '#F5F0E6',
          fontSize: '10px',
          fontFamily: 'Rajdhani, sans-serif',
          padding: '2px 4px',
          textAlign: 'center',
        }}
      >
        {p.name}{p.isCoHost ? ' · Co-host' : ''}
      </div>
    </div>
  );
}

function EmptySeat() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: '12px',
        border: '1px dashed #FFD70022',
        background: '#12100c',
      }}
    />
  );
}
