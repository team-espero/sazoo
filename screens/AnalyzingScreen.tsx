import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AppLanguage, useSajuSettings } from '../context';

const ANALYZING_COPY: Record<AppLanguage, string> = {
  en: 'Reading the weave of your destiny...',
  ko: '운명의 결을 읽는 중이에요...',
  ja: '運命の糸を静かに読んでいます...',
};

const AnalyzingScreen = ({ onFinish }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { language = 'ko' } = useSajuSettings();
  const title = ANALYZING_COPY[language as AppLanguage] ?? ANALYZING_COPY.ko;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => { });
    }
    const timer = setTimeout(onFinish, 900);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      key="analyzing"
      className="h-full w-full flex flex-col items-center justify-center bg-transparent z-50 absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <video
        ref={videoRef}
        src="/checking_saju.mp4"
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
        controls={false}
        onEnded={onFinish}
      />

      <div className="relative z-10 flex flex-col items-center">
        <h2 className="text-2xl font-extrabold text-white drop-shadow-lg mb-2">{title}</h2>
      </div>
    </motion.div>
  );
};

export default AnalyzingScreen;

