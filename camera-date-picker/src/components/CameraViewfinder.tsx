import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraViewfinderProps {
    mode: 'month' | 'day' | 'year';
    onFocusChange: (digit: number | null) => void;
    flash: boolean;
    isModeComplete: boolean;
    isInvalid: boolean;
    isDateComplete: boolean;
}

interface FloatingDigit {
    digit: number;
    id: string;
    path: { x: number; y: number }[];
    duration: number;
    currentX?: number;
    currentY?: number;
}

export function CameraViewfinder({
    mode,
    onFocusChange,
    flash,
    isModeComplete,
    isInvalid,
    isDateComplete,
}: CameraViewfinderProps) {
    const [floatingDigits, setFloatingDigits] = useState<FloatingDigit[]>([]);
    const [focusedDigit, setFocusedDigit] = useState<number | null>(null);

    const digitQueueRef = useRef<number[]>([]);
    const digitPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const floatingCountRef = useRef<number>(0);

    // Keep ref in sync with state length
    useEffect(() => {
        floatingCountRef.current = floatingDigits.length;
    }, [floatingDigits.length]);

    // Initialize digits in shuffled order
    useEffect(() => {
        const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        digitQueueRef.current = digits.sort(() => Math.random() - 0.5);
    }, []);

    // Generate random position outside the viewfinder
    const getEdgePosition = () => {
        const side = Math.floor(Math.random() * 4);
        const offset = (Math.random() - 0.5) * 400;

        switch (side) {
            case 0:
                return { x: offset, y: -280 };
            case 1:
                return { x: 280, y: offset };
            case 2:
                return { x: offset, y: 280 };
            case 3:
                return { x: -280, y: offset };
            default:
                return { x: 0, y: -280 };
        }
    };

    // Generate a path that goes through the center
    const generatePathThroughCenter = () => {
        const start = getEdgePosition();
        const end = getEdgePosition();

        const path = [
            start,
            { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }, // near center
            { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 }, // very close to center
            { x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 }, // near center again
            end,
        ];

        return path;
    };

    // Generate a random curved path through viewfinder
    const generateRandomPath = () => {
        const start = getEdgePosition();
        const end = getEdgePosition();

        const numWaypoints = 3 + Math.floor(Math.random() * 2);
        const path = [start];

        for (let i = 0; i < numWaypoints; i++) {
            path.push({ x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 300 });
        }

        path.push(end);
        return path;
    };

    // Add a new digit to float through the viewfinder — with concurrency cap & cleanup
    useEffect(() => {
        let digitIndex = 0;
        let centerPassCounter = 0;

        const timeouts = new Set<ReturnType<typeof setTimeout>>();
        const addTimeout = (id: ReturnType<typeof setTimeout>) => timeouts.add(id);
        const clearAllTimeouts = () => {
            timeouts.forEach((t) => clearTimeout(t));
            timeouts.clear();
        };

        const addDigit = () => {
            // cap on-screen digits to 6 using ref to avoid stale closures
            if (floatingCountRef.current >= 6) return;
            if (digitQueueRef.current.length === 0) return;

            const digit = digitQueueRef.current[digitIndex % digitQueueRef.current.length];

            const shouldPassThroughCenter = centerPassCounter % 2 === 0;
            const path = shouldPassThroughCenter ? generatePathThroughCenter() : generateRandomPath();
            const duration = 5 + Math.random() * 3;

            const newDigit: FloatingDigit = {
                digit,
                id: `${digit}-${Date.now()}-${Math.random()}`,
                path,
                duration,
            };

            setFloatingDigits((prev) => [...prev, newDigit]);

            // Remove digit after it completes its journey
            const removal = setTimeout(() => {
                setFloatingDigits((prev) => prev.filter((d) => d.id !== newDigit.id));
                digitPositionsRef.current.delete(newDigit.id);
            }, duration * 1000 + 500);
            addTimeout(removal);

            digitIndex++;
            centerPassCounter++;
        };

        // Seed a few digits quickly
        addDigit();
        addTimeout(setTimeout(addDigit, 1000));
        addTimeout(setTimeout(addDigit, 2000));

        // Add digits at intervals, respecting cap
        const interval = setInterval(() => {
            addDigit();
        }, 2000);

        return () => {
            clearInterval(interval);
            clearAllTimeouts();
        };
    }, []);

    // Track which digit is currently in focus with debouncing to prevent blinking
    useEffect(() => {
        const checkInterval = setInterval(() => {
            let closestDigit: number | null = null;
            let minDistance = 70; // Must be within 70px of center to be "focused"

            digitPositionsRef.current.forEach((pos, id) => {
                const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);

                if (distance < minDistance) {
                    minDistance = distance;
                    const digit = floatingDigits.find((d) => d.id === id)?.digit;
                    if (digit !== undefined) {
                        closestDigit = digit;
                    }
                }
            });

            // If we found a focused digit, update immediately
            if (closestDigit !== null) {
                if (focusTimeoutRef.current) {
                    clearTimeout(focusTimeoutRef.current);
                    focusTimeoutRef.current = null;
                }
                if (focusedDigit !== closestDigit) {
                    setFocusedDigit(closestDigit);
                    onFocusChange(closestDigit);
                }
            } else {
                // If no digit is in focus, wait a bit before clearing (debounce)
                if (focusedDigit !== null && !focusTimeoutRef.current) {
                    focusTimeoutRef.current = setTimeout(() => {
                        setFocusedDigit(null);
                        onFocusChange(null);
                        focusTimeoutRef.current = null;
                    }, 150);
                }
            }
        }, 50);

        return () => {
            clearInterval(checkInterval);
            if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current);
            }
        };
    }, [floatingDigits, onFocusChange, focusedDigit]);

    const maxDigits = mode === 'year' ? 4 : 2;

    // ---- Single-source-of-truth UI status (mutually exclusive)
    type Status = 'invalid' | 'date' | 'mode' | 'focus';
    const status: Status = useMemo(() => {
        if (isInvalid) return 'invalid';
        if (isDateComplete) return 'date';
        if (isModeComplete) return 'mode';
        return 'focus';
    }, [isInvalid, isDateComplete, isModeComplete]);

    const renderStatus = () => {
        switch (status) {
            case 'invalid':
                return (
                    <div className="text-red-500 animate-pulse uppercase tracking-wider">
                        {mode} INVALID - REWIND
                    </div>
                );
            case 'date':
                return (
                    <div className="text-green-400 animate-pulse uppercase tracking-wider">DATE CAPTURED</div>
                );
            case 'mode':
                return (
                    <div className="text-amber-400 animate-pulse uppercase tracking-wider">
                        {mode} CAPTURED - SWITCH MODE
                    </div>
                );
            default:
                return (
                    <div
                        className={`transition-colors ${focusedDigit !== null ? 'text-green-300' : 'text-green-400/50'
                            }`}
                    >
                        FOCUS: {focusedDigit !== null ? focusedDigit : 'SEARCHING...'}
                    </div>
                );
        }
    };

    return (
        <div className="relative">
            {/* Camera body/viewfinder frame */}
            <div className="w-[500px] h-[500px] bg-black rounded-lg shadow-2xl relative overflow-hidden border-8 border-neutral-800">
                {/* Viewfinder content */}
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 to-black">
                    {/* Floating digits */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        <AnimatePresence>
                            {floatingDigits.map((fd) => {
                                const xPath = fd.path.map((p) => p.x);
                                const yPath = fd.path.map((p) => p.y);

                                return (
                                    <motion.div
                                        key={fd.id}
                                        initial={{
                                            x: xPath[0],
                                            y: yPath[0],
                                            opacity: 0,
                                            scale: 0.6,
                                            rotate: (Math.random() - 0.5) * 30,
                                        }}
                                        animate={{
                                            x: xPath,
                                            y: yPath,
                                            opacity: [0, 0.8, 1, 0.8, 0],
                                            scale: [0.6, 0.9, 1, 0.9, 0.6],
                                            rotate: fd.path.map(() => (Math.random() - 0.5) * 20),
                                        }}
                                        exit={{ opacity: 0, scale: 0.3 }}
                                        transition={{ duration: fd.duration, ease: 'easeInOut' }}
                                        onUpdate={(latest: { x: any; y: any }) => {
                                            if (typeof latest.x === 'number' && typeof latest.y === 'number') {
                                                digitPositionsRef.current.set(fd.id, { x: latest.x, y: latest.y });
                                            }
                                        }}
                                        className="absolute pointer-events-none"
                                    >
                                        <div
                                            className={`text-7xl tabular-nums transition-colors duration-300 ${fd.digit === focusedDigit
                                                    ? 'text-green-300 drop-shadow-[0_0_15px_rgba(134,239,172,0.8)]'
                                                    : 'text-green-400/60'
                                                }`}
                                        >
                                            {fd.digit}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Focus frame */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        {/* Main focus rectangle */}
                        <div
                            className={`w-40 h-40 border-2 transition-all duration-300 relative ${focusedDigit !== null ? 'border-green-400 scale-100' : 'border-green-400/40 scale-95'
                                }`}
                        >
                            {/* Corner brackets */}
                            <div
                                className={`absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 transition-colors ${focusedDigit !== null ? 'border-green-400' : 'border-green-400/40'
                                    }`}
                            />
                            <div
                                className={`absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 transition-colors ${focusedDigit !== null ? 'border-green-400' : 'border-green-400/40'
                                    }`}
                            />
                            <div
                                className={`absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 transition-colors ${focusedDigit !== null ? 'border-green-400' : 'border-green-400/40'
                                    }`}
                            />
                            <div
                                className={`absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 transition-colors ${focusedDigit !== null ? 'border-green-400' : 'border-green-400/40'
                                    }`}
                            />

                            {/* Center crosshair */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className={`w-1 h-10 transition-colors ${focusedDigit !== null ? 'bg-green-400/60' : 'bg-green-400/20'}`} />
                                <div
                                    className={`w-10 h-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors ${focusedDigit !== null ? 'bg-green-400/60' : 'bg-green-400/20'
                                        }`}
                                />
                            </div>

                            {/* Pulsing focus indicator when digit is centered */}
                            {focusedDigit !== null && (
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute inset-0 border-2 border-green-400 rounded-sm"
                                />
                            )}
                        </div>
                    </div>

                    {/* Viewfinder info overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Top info bar */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start text-green-400 text-xs font-mono">
                            <div className="space-y-1">
                                <div>MODE: {mode.toUpperCase()}</div>
                                <div>{mode === 'year' ? 'LENGTH' : 'MAX'}: {maxDigits} DIGITS</div>
                            </div>
                            <div className="space-y-1 text-right">
                                {/* Battery indicator */}
                                <div className="flex items-center gap-2 justify-end">
                                    <div className="relative flex items-center">
                                        {/* Battery body */}
                                        <div className={`w-8 h-4 border rounded-sm flex items-center p-0.5 gap-0.5 ${'border-green-400'}`}>
                                            {/* Battery bars */}
                                            {[...Array(4)].map((_, i) => (
                                                <div key={i} className={`flex-1 h-full rounded-[1px] transition-colors ${'bg-green-400'}`} />
                                            ))}
                                        </div>
                                        {/* Battery tip */}
                                        <div className={`w-0.5 h-2 rounded-r-sm ${'bg-green-400'}`} />
                                    </div>
                                </div>
                                <div>F/2.8</div>
                                <div className="text-green-400/70">SHUTTER: 1/125</div>
                            </div>
                        </div>

                        {/* Bottom info bar */}
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-green-400 text-xs font-mono">
                            <div className="space-y-1">
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={status}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                    >
                                        {renderStatus()}
                                    </motion.div>
                                </AnimatePresence>
                                <div className="text-green-400/70">AUTO-FOCUS ENABLED</div>
                            </div>
                            <div className="space-y-1 text-right">
                                <div>ISO 400</div>
                                <div className="text-green-400/70">WB: AUTO</div>
                            </div>
                        </div>
                    </div>

                    {/* Flash effect */}
                    <AnimatePresence>
                        {flash && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.1 }}
                                className="absolute inset-0 bg-white pointer-events-none z-50"
                            />)
                        }
                    </AnimatePresence>

                    {/* Vignette effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_40%,black_100%)] pointer-events-none opacity-60" />
                </div>
            </div>
        </div>
    );
}
