import React, { useEffect, useRef, useState } from 'react';

interface SpriteAnimationProps {
    src: string;
    rows: number;
    cols: number;
    fps?: number;
    className?: string;
    loop?: boolean;
    totalFrames?: number;
}

const SpriteAnimation: React.FC<SpriteAnimationProps> = ({
    src,
    rows = 6,
    cols = 6,
    fps = 12,
    className = "",
    loop = true,
    totalFrames: propTotalFrames
}) => {
    const [frame, setFrame] = useState(0);
    const totalFrames = propTotalFrames || (rows * cols);
    const lastTimeRef = useRef<number>(0);
    const frameRef = useRef<number>(0);
    const requestRef = useRef<number | undefined>(undefined);

    const animate = (time: number) => {
        if (lastTimeRef.current !== undefined) {
            const deltaTime = time - lastTimeRef.current;
            const frameDuration = 1000 / fps;

            if (deltaTime >= frameDuration) {
                lastTimeRef.current = time;
                frameRef.current = (frameRef.current + 1) % totalFrames;

                if (!loop && frameRef.current === 0) {
                    // Stop at last frame if loop is false
                    frameRef.current = totalFrames - 1;
                } else {
                    setFrame(frameRef.current);
                }
            }
        } else {
            lastTimeRef.current = time;
        }
        requestRef.current = requestAnimationFrame((t) => animate(t));
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame((t) => animate(t));
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [fps, totalFrames, loop]);

    // Calculate background position percentages
    // For a 6x6 grid, frame 0 is (0%, 0%), frame 1 is (20%, 0%), ..., frame 5 is (100%, 0%)
    // frame 6 is (0%, 20%), etc.
    // Formula: (colIndex * (100 / (cols - 1)))% (rowIndex * (100 / (rows - 1)))%
    const colIndex = frame % cols;
    const rowIndex = Math.floor(frame / cols);

    const posX = (colIndex * (100 / (cols - 1))).toFixed(2);
    const posY = (rowIndex * (100 / (rows - 1))).toFixed(2);

    return (
        <div
            className={`relative w-full h-full overflow-hidden ${className}`}
            style={{
                backgroundImage: `url("${src}")`,
                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                backgroundPosition: `${posX}% ${posY}%`,
                backgroundRepeat: 'no-repeat',
                imageRendering: 'auto',
            }}
        />
    );
};

export default SpriteAnimation;
