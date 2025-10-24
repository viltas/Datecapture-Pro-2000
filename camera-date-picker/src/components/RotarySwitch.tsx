// src/components/RotarySwitch.tsx
import { useState } from 'react';

type SwitchMode = 'month' | 'day' | 'year';

interface RotarySwitchProps {
    currentMode: SwitchMode;
    onModeChange: (mode: SwitchMode) => void;
    isDateComplete?: boolean;
    isDateValid?: boolean | null;
}

export function RotarySwitch({
    currentMode,
    onModeChange,
    isDateComplete,
    isDateValid,
}: RotarySwitchProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    const modes: SwitchMode[] = ['month', 'day', 'year'];

    const cycleMode = () => {
        const currentIndex = modes.indexOf(currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        onModeChange(modes[nextIndex]);

        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
    };

    const getYearLabel = () => {
        if (isDateComplete && isDateValid === false) return 'INVALID DATE - REWIND';
        if (isDateComplete && isDateValid === true) return 'DATE CAPTURED';
        return 'YR';
    };

    const getRotation = () => {
        switch (currentMode) {
            case 'month':
                return -45;
            case 'day':
                return 0;
            case 'year':
                return 45;
        }
    };

    const yearLabel = getYearLabel();
    const isSpecialMode = yearLabel !== 'YR';

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Mode labels */}
            <div className="mb-1 flex min-h-[20px] items-center gap-4">
                <span
                    className={`font-mono transition-all ${isSpecialMode ? 'text-[10px]' : 'text-xs'
                        } ${currentMode === 'month' ? 'text-green-400' : 'text-neutral-600'}`}
                >
                    MO
                </span>
                <span
                    className={`font-mono transition-all ${isSpecialMode ? 'text-[10px]' : 'text-xs'
                        } ${currentMode === 'day' ? 'text-green-400' : 'text-neutral-600'}`}
                >
                    DY
                </span>
                <span
                    className={`whitespace-nowrap font-mono transition-all ${isSpecialMode ? 'text-[10px]' : 'text-xs'
                        } ${currentMode === 'year'
                            ?
                            'text-green-400'
                            : 'text-neutral-600'
                        }`}
                >
                    {yearLabel}
                </span>
            </div>

            <button
                onClick={cycleMode}
                className="group relative focus:outline-none"
                type="button"
            >
                {/* Dial body */}
                <div className="relative h-24 w-24 rounded-full border-4 border-neutral-700 bg-gradient-to-br from-neutral-800 to-neutral-950 shadow-2xl transition-all hover:border-neutral-600">
                    {/* Inner circle */}
                    <div className="absolute inset-3 rounded-full border-2 border-neutral-600 bg-gradient-to-br from-neutral-900 to-black" />

                    {/* Center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full border-2 border-neutral-500 bg-neutral-800 shadow-inner" />
                    </div>

                    {/* Position markers */}
                    <div className="absolute inset-0">
                        {/* Month (top-left) */}
                        <div
                            className="absolute h-1.5 w-1.5 rounded-full bg-neutral-500"
                            style={{
                                top: '18%',
                                left: '18%',
                                boxShadow: currentMode === 'month' ? '0 0 8px #22c55e' : 'none',
                                backgroundColor: currentMode === 'month' ? '#22c55e' : undefined,
                            }}
                        />
                        {/* Day (top center) */}
                        <div
                            className="absolute h-1.5 w-1.5 -translate-x-1/2 transform rounded-full bg-neutral-500"
                            style={{
                                top: '10%',
                                left: '50%',
                                boxShadow: currentMode === 'day' ? '0 0 8px #22c55e' : 'none',
                                backgroundColor: currentMode === 'day' ? '#22c55e' : undefined,
                            }}
                        />
                        {/* Year (top-right) */}
                        <div
                            className="absolute h-1.5 w-1.5 rounded-full bg-neutral-500"
                            style={{
                                top: '18%',
                                right: '18%',
                                boxShadow: currentMode === 'year' ? '0 0 8px #22c55e' : 'none',
                                backgroundColor: currentMode === 'year' ? '#22c55e' : undefined,
                            }}
                        />
                    </div>

                    {/* Pointer */}
                    <div
                        className={`absolute inset-0 origin-center transform transition-transform ease-out ${isAnimating ? 'duration-150' : 'duration-300'
                            }`}
                        style={{
                            transform: `rotate(${getRotation()}deg)`,
                            willChange: 'transform',
                        }}
                    >
                        <div className="absolute left-1/2 top-2 h-6 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-red-600 to-red-800 shadow-lg" />
                    </div>

                    {/* Grip texture */}
                    <div className="absolute inset-0 overflow-hidden rounded-full">
                        {[...Array(24)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute h-2 w-0.5 bg-neutral-600"
                                style={{
                                    top: '0%',
                                    left: '50%',
                                    transform: `rotate(${i * 15}deg) translateX(-50%)`,
                                    transformOrigin: `center 48px`,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Click */}
                {isAnimating && <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />}
            </button>

            <div className="mt-2 text-xs font-mono tracking-wider text-neutral-400">MODE</div>
        </div>
    );
}
