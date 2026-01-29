import React from 'react';

interface RoundTrackerProps {
  currentRound: number;    // 1-10
  totalRounds: number;     // Always 10
  levelId: number;
}

function RoundTracker({ currentRound, totalRounds, levelId }: RoundTrackerProps) {
  const progressPercent = (currentRound / totalRounds) * 100;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5vw',
      padding: '1vw',
      width: '100%',
    }}>
      {/* Round text */}
      <div style={{
        fontSize: '2.5vw',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        fontFamily: '"Cherry Bomb One", cursive',
        WebkitTextStroke: '0.1vw #b71c1c',

      }}>
        Nível {levelId} - Rodada {currentRound}/{totalRounds}
      </div>

      {/* Progress bar container */}
      <div style={{
        width: '100%',
        height: '2vw',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: '1vw',
        overflow: 'hidden',
        border: '0.2vw solid #b71c1c',
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
              width: '2.5vw',
              height: '2.5vw',
              borderRadius: '50%',
              backgroundColor: index < currentRound ? '#4caf50' : 'rgba(255,255,255,0.3)',
              WebkitTextStroke: index < currentRound ? '0.1vw #af2f2fff' : '0.0vw #4caf50',
              border: index < currentRound ? '0.15vw solid #af2f2fff' : '0.15vw solid transparent',
              scale: index === currentRound - 1 ? '1.2' : '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5vw',
              fontWeight: 'bold',
              color: index < currentRound ? '#fff' : '#888',
              transition: 'all 0.3s ease',
              boxShadow: index < currentRound ? '0 2px 4px rgba(76,175,80,0.5)' : 'none',

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
