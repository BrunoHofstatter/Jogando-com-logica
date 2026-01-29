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
        }, 2200);

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
            height: '100dvh',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            fontFamily: '"Cherry Bomb One", system-ui',
        }}>
            <div style={{
                background: 'radial-gradient(circle, rgba(32, 179, 103, 0.6), rgba(21, 152, 84, 0.73))',
                padding: '3vw',
                borderRadius: '6vw',
                boxShadow: '0 0 3.5vw rgba(16, 185, 129, 0.4), inset 0 0 1.5vw rgba(52, 211, 153, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '0.25vw solid #04573dff',
                transform: isFinal ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <h2 style={{
                    color: '#e2e8f0',
                    fontSize: '4vw',
                    marginBottom: '1.5vw',
                    marginTop: 0,
                    textShadow: '0 0.15vw 0.3vw rgba(0,0,0,0.5)',
                    fontWeight: 'normal',
                    letterSpacing: '0.08vw',
                    WebkitTextStroke: '0.27vw #064e3b',
                }}>
                    {isFinal ? 'Resultado:' : 'Rolando Dado...'}
                </h2>

                <div style={{
                    fontSize: '11vw',
                    fontWeight: 'normal',
                    lineHeight: 1,
                    color: isFinal ? '#4ade80' : '#6ee7b7',
                    textShadow: isFinal
                        ? '0 0 2vw rgba(74, 222, 128, 0.6), 0.15vw 0.15vw 0px #064e3b'
                        : '0 0 0.75vw rgba(110, 231, 183, 0.4)',
                    WebkitTextStroke: '0.3vw #064e3b',
                    transition: 'all 0.3s ease'
                }}>
                    {displayValue}
                </div>
            </div>
        </div>
    );
};
