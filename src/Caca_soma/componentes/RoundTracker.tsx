import React from 'react';

interface RoundTrackerProps {
  currentRound: number;    // 1-10
  totalRounds: number;     // Always 10
}

function RoundTracker({ currentRound, totalRounds }: RoundTrackerProps) {
  const progressPercent = (currentRound / totalRounds) * 100;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '1rem',
      width: '100%',
      maxWidth: '400px'
    }}>
      {/* Round text */}
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        fontFamily: '"Cherry Bomb One", cursive'
      }}>
        Rodada {currentRound}/{totalRounds}
      </div>

      {/* Progress bar container */}
      <div style={{
        width: '100%',
        height: '1.5rem',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '2px solid #b71c1c',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        {/* Progress bar fill */}
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #b71c1c 0%, #f44336 100%)',
          transition: 'width 0.5s ease',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
        }} />
      </div>

      {/* Round indicators */}
      <div style={{
        display: 'flex',
        gap: '0.3rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        width: '100%'
      }}>
        {Array.from({ length: totalRounds }).map((_, index) => (
          <div
            key={index}
            style={{
              width: '1.5rem',
              height: '1.5rem',
              borderRadius: '50%',
              backgroundColor: index < currentRound ? '#4caf50' : 'rgba(255,255,255,0.3)',
              border: index === currentRound - 1 ? '2px solid #fff' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              color: index < currentRound ? '#fff' : '#888',
              transition: 'all 0.3s ease',
              boxShadow: index < currentRound ? '0 2px 4px rgba(76,175,80,0.5)' : 'none'
            }}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoundTracker;
