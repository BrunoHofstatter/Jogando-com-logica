import React from 'react';

interface StarDisplayProps {
  stars: number;              // 0-3 stars earned
  maxStars?: number;          // Maximum stars (default 3)
  size?: 'small' | 'medium' | 'large';
  showNumbers?: boolean;      // Show "2/3" text
}

function StarDisplay({
  stars,
  maxStars = 3,
  size = 'medium',
  showNumbers = false
}: StarDisplayProps) {
  // Clamp stars to valid range
  const displayStars = Math.max(0, Math.min(stars, maxStars));

  // Size mappings
  const sizeMap = {
    small: '1.2rem',
    medium: '1.8rem',
    large: '2.5rem'
  };

  const fontSize = sizeMap[size];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
      {Array.from({ length: maxStars }).map((_, index) => (
        <span
          key={index}
          style={{
            fontSize,
            color: index < displayStars ? '#FFD700' : '#888',
            textShadow: index < displayStars ? '0 0 5px rgba(255, 215, 0, 0.8)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          ★
        </span>
      ))}
      {showNumbers && (
        <span style={{
          fontSize: `calc(${fontSize} * 0.6)`,
          marginLeft: '0.3rem',
          color: '#fff',
          fontWeight: 'bold'
        }}>
          {displayStars}/{maxStars}
        </span>
      )}
    </div>
  );
}

export default StarDisplay;
