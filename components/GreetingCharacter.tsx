import React from 'react';

/**
 * GreetingCharacter Component
 * 
 * Simplified component using a WEBP animation instead of a sprite sheet.
 * This approach reduces CPU overhead and simplifies the codebase.
 */

interface GreetingCharacterProps {
    /** Width of the character container (default: 300px) */
    width?: string;
    /** Additional CSS classes for styling */
    className?: string;
}

const WEBP_IMAGE_PATH = '/webp/greeting2.webp';

const GreetingCharacter: React.FC<GreetingCharacterProps> = ({
    width = '300px',
    className = ''
}) => {
    return (
        <div
            className={`relative overflow-hidden flex justify-center items-center ${className}`}
            style={{
                width: width,
                aspectRatio: '1 / 1', // Maintain square container
            }}
        >
            <img
                src={WEBP_IMAGE_PATH}
                alt="Greeting Character"
                className="w-full h-full object-contain"
                style={{ imageRendering: 'auto' }}
            />
        </div>
    );
};

export default GreetingCharacter;
