import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, ZapOff } from 'lucide-react';
import { Button } from '../components';
import { AppLanguage } from '../context';

const ERROR_COPY: Record<AppLanguage, {
  titlePrefix: string;
  titleHighlight: string;
  body1: string;
  body2: string;
  reload: string;
}> = {
  en: {
    titlePrefix: 'Temporary',
    titleHighlight: 'cosmic glitch',
    body1: 'The signal is unstable for a moment.',
    body2: 'Please reload to realign your destiny flow.',
    reload: 'Reload',
  },
  ko: {
    titlePrefix: '일시적인',
    titleHighlight: '영적 혼란',
    body1: '우주의 기운이 잠시 꼬였습니다.',
    body2: '운명을 다시 정렬하기 위해 새로고침 해주세요.',
    reload: '운명 재접속',
  },
  ja: {
    titlePrefix: '一時的な',
    titleHighlight: '霊的ノイズ',
    body1: '宇宙の波動が一時的に乱れています。',
    body2: '再読み込みして運命の流れを整えてください。',
    reload: '再読み込み',
  },
};

const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  let language: AppLanguage = 'ko';
  try {
    const saved = localStorage.getItem('appLanguage');
    if (saved === 'en' || saved === 'ko' || saved === 'ja') {
      language = saved;
    }
  } catch {
    language = 'ko';
  }

  const copy = ERROR_COPY[language] ?? ERROR_COPY.ko;

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-[#f0f2f5]">
      <div className="w-full max-w-[480px] h-full relative overflow-hidden shadow-2xl flex flex-col items-center justify-center p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#2d2b55] z-0" />
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-red-400/20 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-500/20 blur-[80px] rounded-full" />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] z-0" />

        <div className="relative z-10 w-full flex flex-col items-center text-center space-y-8">
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, -5, 5, -2, 2, 0], scale: [1, 1.05, 0.95, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="w-32 h-32 rounded-[32px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            >
              <ZapOff size={48} className="text-red-300 drop-shadow-[0_0_15px_rgba(252,165,165,0.6)]" />
            </motion.div>
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles size={24} className="text-[#98FF98]" />
            </motion.div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {copy.titlePrefix} <span className="text-red-300">{copy.titleHighlight}</span>
            </h1>
            <p className="text-slate-300 font-medium text-sm leading-relaxed px-4">
              {copy.body1}<br />
              {copy.body2}
            </p>
            {error && (
              <div className="mt-4 p-3 bg-black/20 rounded-xl border border-white/10 max-w-full overflow-hidden">
                <p className="text-[10px] text-slate-400 font-mono break-all line-clamp-2">{error.message}</p>
              </div>
            )}
          </div>

          <div className="w-full pt-4">
            <Button
              fullWidth
              variant="glass"
              onClick={resetErrorBoundary}
              className="!bg-white/20 hover:!bg-white/30 !border-white/40 !text-white"
            >
              <RefreshCw size={18} className="mr-2" />
              {copy.reload}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
