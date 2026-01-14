import React, { useState, useEffect } from 'react';

interface DiceAnimationProps {
    targetValue: number[];
    onComplete: () => void;
}

export const DiceAnimation: React.FC<DiceAnimationProps> = ({ targetValue, onComplete }) => {
    const [displayValue, setDisplayValue] = useState<number>(0);
    const [isFinal, setIsFinal] = useState(false);

    useEffect(() => {
        // Phase 1: Rapid flickering (Rolando...)
        const flickerInterval = setInterval(() => {
            // Generate random number between 2 and 10 (2d5 range)
            const randomVal = Math.floor(Math.random() * 9) + 2;
            setDisplayValue(randomVal);
        }, 80);

        // Phase 2: Land on target value after 2 seconds
        const settleTimeout = setTimeout(() => {
            clearInterval(flickerInterval);
            const total = targetValue.reduce((sum, val) => sum + val, 0);
            setDisplayValue(total);
            setIsFinal(true);
        }, 800);

        // Phase 3: Complete after showing result for 1.5 seconds
        const completeTimeout = setTimeout(() => {
            onComplete();
        }, 1800);

        return () => {
            clearInterval(flickerInterval);
            clearTimeout(settleTimeout);
            clearTimeout(completeTimeout);
        };
    }, [targetValue, onComplete]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                backgroundColor: '#2d3748',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 0 50px rgba(66, 153, 225, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '2px solid #4a5568',
                transform: isFinal ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s ease-out'
            }}>
                <h2 style={{
                    color: '#a0aec0',
                    fontSize: '2rem',
                    marginBottom: '20px',
                    fontFamily: 'system-ui'
                }}>
                    {isFinal ? 'Resultado:' : 'Rolando Dado...'}
                </h2>

                <div style={{
                    fontSize: '6rem',
                    fontWeight: 'bold',
                    color: isFinal ? '#48bb78' : '#63b3ed',
                    textShadow: isFinal ? '0 0 20px rgba(72, 187, 120, 0.6)' : 'none'
                }}>
                    {displayValue}
                </div>
            </div>
        </div>
    );
};
