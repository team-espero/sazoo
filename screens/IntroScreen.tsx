import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppLanguage, useSajuSettings } from '../context';

const INTRO_COPY: Record<AppLanguage, { play: string; skip: string }> = {
    en: { play: 'Start', skip: 'Skip' },
    ko: { play: '인트로 재생', skip: '건너뛰기' },
    ja: { play: '再生', skip: 'スキップ' },
};

const IntroScreen = ({ onComplete }: { onComplete: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const { language = 'ko' } = useSajuSettings();
    const copy = INTRO_COPY[language as AppLanguage] ?? INTRO_COPY.ko;

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch((error) => {
                console.log('Autoplay prevented:', error);
            });
        }
    }, []);

    const handleManualPlay = () => {
        videoRef.current?.play().catch(() => {});
    };

    return (
        <motion.div
            className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[url('/destiny_check.png')] bg-cover bg-center bg-no-repeat"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
        >
            <video
                ref={videoRef}
                className={`w-full h-full object-cover transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
                src="/intro-video.mp4"
                playsInline
                muted
                autoPlay
                controls={false}
                onPlay={() => setIsPlaying(true)}
                onEnded={onComplete}
            />

            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 backdrop-blur-sm">
                    <button
                        onClick={handleManualPlay}
                        className="min-h-[48px] px-8 py-4 bg-white/10 border border-white/30 rounded-full text-white font-bold text-lg backdrop-blur-md hover:bg-white/20 transition-all animate-pulse"
                    >
                        {copy.play}
                    </button>
                </div>
            )}

            <div className={`absolute bottom-10 py-6 w-full flex justify-center z-20 transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                <button
                    onClick={onComplete}
                    className="min-h-[44px] text-white/60 text-sm font-bold uppercase tracking-widest hover:text-white transition-colors border border-white/20 px-4 py-2 rounded-full backdrop-blur-sm bg-black/20"
                >
                    {copy.skip}
                </button>
            </div>
        </motion.div>
    );
};

export default IntroScreen;
