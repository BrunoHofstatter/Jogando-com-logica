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
                backgroundColor: '#059669', /* Distinct darker green than the board */
                padding: '3vw',
                borderRadius: '4vw',
                boxShadow: '0 1.5vw 0 #064e3b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '0.4vw solid #064e3b',
                transform: isFinal ? 'scale(1.05) translateY(-1vw)' : 'scale(1) translateY(0)',
                transition: 'all 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <h2 style={{
                    color: '#f3f4f6',
                    fontSize: '4vw',
                    marginBottom: '1.5vw',
                    marginTop: 0,
                    textShadow: '0 0.3vw 0 #064e3b',
                    fontWeight: 'normal',
                    letterSpacing: '0.08vw',
                    WebkitTextStroke: '0.15vw #064e3b',
                }}>
                    {isFinal ? 'Resultado:' : 'Rolando Dado...'}
                </h2>

                <div style={{
                    fontSize: '11vw',
                    fontWeight: 'normal',
                    lineHeight: 1,
                    color: '#e3fff6', /* Extremely light mint to pop */
                    textShadow: isFinal
                        ? '0 0.6vw 0 #064e3b'
                        : '0 0.3vw 0 #064e3b',
                    WebkitTextStroke: '0.25vw #064e3b',
                    transition: 'all 0.1s ease',
                    transform: isFinal ? 'translateY(-0.3vw)' : 'translateY(0)'
                }}>
                    {displayValue}
                </div>
            </div>
        </div>
    );
};
