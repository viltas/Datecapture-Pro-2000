import { useState } from 'react';
import { CameraViewfinder } from './components/CameraViewfinder';
import { RotarySwitch } from './components/RotarySwitch';
import { Aperture } from 'lucide-react';

type InputMode = 'month' | 'day' | 'year';

export default function App() {
  const [inputMode, setInputMode] = useState<InputMode>('month');
  const [monthInput, setMonthInput] = useState('');
  const [dayInput, setDayInput] = useState('');
  const [yearInput, setYearInput] = useState('');
  const [isRewinding, setIsRewinding] = useState(false);
  const [focusedDigit, setFocusedDigit] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  // Debug logging
  console.log('Current state:', { inputMode, monthInput, dayInput, yearInput });

  const handleCapture = (digit: number) => {
    const digitStr = digit.toString();

    switch (inputMode) {
      case 'month':
        if (monthInput.length < 2) {
          const newMonth = monthInput + digitStr;
          setMonthInput(newMonth);
          console.log('Captured month digit:', digitStr, 'New month:', newMonth);
        }
        break;
      case 'day':
        if (dayInput.length < 2) {
          const newDay = dayInput + digitStr;
          setDayInput(newDay);
          console.log('Captured day digit:', digitStr, 'New day:', newDay);
        }
        break;
      case 'year':
        if (yearInput.length < 4) {
          const newYear = yearInput + digitStr;
          setYearInput(newYear);
          console.log('Captured year digit:', digitStr, 'New year:', newYear);
        }
        break;
    }
  };

  const clearCurrentInput = () => {
    switch (inputMode) {
      case 'month':
        setMonthInput('');
        break;
      case 'day':
        setDayInput('');
        break;
      case 'year':
        setYearInput('');
        break;
    }
  };

  const clearAll = () => {
    setIsRewinding(true);
    setTimeout(() => {
      setMonthInput('');
      setDayInput('');
      setYearInput('');
      setInputMode('month');
      setIsRewinding(false);
    }, 1000);
  };

  // Validation functions
  const isMonthValid = (month: string): boolean => {
    if (month.length !== 2) return true; // Not complete yet
    const monthNum = parseInt(month, 10);
    return monthNum >= 1 && monthNum <= 12;
  };

  const isDayValid = (day: string): boolean => {
    if (day.length !== 2) return true; // Not complete yet
    const dayNum = parseInt(day, 10);
    return dayNum >= 1 && dayNum <= 31;
  };

  // Check if current mode is complete
  const isModeComplete = () => {
    switch (inputMode) {
      case 'month':
        return monthInput.length === 2;
      case 'day':
        return dayInput.length === 2;
      case 'year':
        return yearInput.length === 4;
      default:
        return false;
    }
  };

  // Check if current input is invalid
  const isCurrentInputInvalid = () => {
    switch (inputMode) {
      case 'month':
        return monthInput.length === 2 && !isMonthValid(monthInput);
      case 'day':
        return dayInput.length === 2 && !isDayValid(dayInput);
      default:
        return false;
    }
  };

  const handleShutter = () => {
    if (focusedDigit === null || isCapturing || isModeComplete()) return;

    setIsCapturing(true);
    setFlash(true);

    // Flash effect
    setTimeout(() => setFlash(false), 100);

    // Capture after brief delay
    setTimeout(() => {
      handleCapture(focusedDigit);
      setIsCapturing(false);
    }, 200);
  };

  const getMonthName = (monthNum: string) => {
    const months = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const num = parseInt(monthNum);
    // If invalid month, show the digits padded instead of '---'
    return num >= 1 && num <= 12 ? months[num] : monthNum.padStart(2, '0');
  };

  const formatDate = () => {
    // Format month based on current mode
    let month: string;
    if (inputMode === 'month') {
      // Show as numbers when in month mode
      month = monthInput ? monthInput.padStart(2, '0') : '--';
    } else {
      // Show as three-letter text when not in month mode
      month = monthInput ? getMonthName(monthInput) : '---';
    }

    const day = dayInput ? dayInput.padStart(2, '0') : '--';
    const year = yearInput || '----';

    return `${month} ${day} ${year}`;
  };

  const isDateValid = () => {
    // Need all fields filled
    if (!monthInput || !dayInput || !yearInput || yearInput.length < 4) {
      return null; // Not complete
    }

    const month = parseInt(monthInput);
    const day = parseInt(dayInput);
    const year = parseInt(yearInput);

    // Basic validation
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1000 || year > 9999) return false;

    // Month-specific day validation
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Leap year check
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (isLeapYear && month === 2) {
      daysInMonth[1] = 29;
    }

    if (day > daysInMonth[month - 1]) return false;

    return true;
  };

  const dateStatus = isDateValid();

  // Check if any individual field is invalid
  const hasInvalidField = () => {
    // Check month
    if (monthInput.length === 2 && !isMonthValid(monthInput)) {
      return true;
    }
    // Check day
    if (dayInput.length === 2 && !isDayValid(dayInput)) {
      return true;
    }
    // Check complete date
    if (dateStatus === false) {
      return true;
    }
    return false;
  };

  // Check if all fields are captured (complete date)
  const isDateComplete = () => {
    return monthInput.length === 2 && dayInput.length === 2 && yearInput.length === 4;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-neutral-50 to-white flex items-center justify-center p-8 pb-12">
      {/* Camera body wrapper */}
      <div className="relative bg-gradient-to-br from-neutral-800 via-neutral-900 to-black rounded-3xl shadow-2xl border-8 border-neutral-700 pt-14 px-12 pb-12" style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.1)'
      }}>
        {/* Embedded camera brand text */}
        <div className="absolute top-6 left-12">
          <h1 className="text-xl tracking-[0.2em] text-white whitespace-nowrap" style={{
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: '900',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5), -1px -1px 1px rgba(255, 255, 255, 0.15), inset 0 1px 1px rgba(0, 0, 0, 0.5)'
          }}>
            DATECAPTURE PRO 2000
          </h1>
        </div>

        {/* Decorative camera screws */}
        <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-neutral-600 shadow-inner border border-neutral-500" />
        <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-neutral-600 shadow-inner border border-neutral-500" />
        <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-neutral-600 shadow-inner border border-neutral-500" />
        <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-neutral-600 shadow-inner border border-neutral-500" />

        <div className="max-w-6xl w-full">
          <div className="mb-8 mt-12">

            {/* Current date display */}
            <div className="flex items-center gap-8">
              {/* Analog mechanical date display */}
              <div className={`relative px-8 py-6 bg-gradient-to-br from-neutral-900 to-black shadow-2xl border-4 transition-all ${dateStatus === false ? 'border-red-800' : 'border-neutral-700'
                }`}
                style={{
                  width: '360px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.6)'
                }}>
                {/* Top label plate */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-b from-neutral-700 to-neutral-800 border-2 border-neutral-600 shadow-lg">
                  <div className={`text-xs tracking-widest font-mono transition-colors ${dateStatus === false ? 'text-red-400' : 'text-green-400'
                    }`}>
                    CAPTURED DATE
                  </div>
                </div>

                {/* Mechanical counter display */}
                <div className="mt-4 bg-black p-4 border-2 border-neutral-800 shadow-inner">
                  <div className={`text-3xl tabular-nums font-mono tracking-wider transition-colors text-center ${dateStatus === false ? 'text-red-500' : dateStatus === true ? 'text-green-400' : 'text-amber-600'
                    }`}
                    style={{
                      textShadow: dateStatus === null ? '0 0 8px rgba(251, 191, 36, 0.5)' :
                        dateStatus ? '0 0 8px rgba(74, 222, 128, 0.5)' :
                          '0 0 8px rgba(239, 68, 68, 0.5)',
                      fontFamily: 'monospace',
                      letterSpacing: '0.15em'
                    }}>
                    {!monthInput && !dayInput && !yearInput ? '-- -- ----' : formatDate()}
                  </div>
                </div>

                {/* Bottom screws */}
                <div className="absolute bottom-2 left-4 w-2 h-2 rounded-full bg-neutral-600 shadow-inner border border-neutral-700" />
                <div className="absolute bottom-2 right-4 w-2 h-2 rounded-full bg-neutral-600 shadow-inner border border-neutral-700" />
              </div>

              {/* LED Indicators */}
              <div className="flex flex-col gap-4">
                {/* Red LED - Invalid */}
                <div className="flex items-center gap-3">
                  <div className="relative w-4 h-4">
                    <div className={`w-4 h-4 rounded-full transition-all ${hasInvalidField()
                        ? 'bg-red-600 shadow-lg shadow-red-500/50 animate-pulse'
                        : 'bg-red-900/30'
                      }`} />
                    {hasInvalidField() && (
                      <div className="absolute inset-0 w-4 h-4 rounded-full bg-red-500 blur-sm animate-pulse" />
                    )}
                  </div>
                  <span className="text-sm text-green-400 font-mono">INVALID</span>
                </div>

                {/* Green LED - Valid */}
                <div className="flex items-center gap-3">
                  <div className="relative w-4 h-4">
                    <div className={`w-4 h-4 rounded-full transition-all ${dateStatus === true
                        ? 'bg-green-500 shadow-lg shadow-green-500/50'
                        : 'bg-green-900/30'
                      }`} />
                    {dateStatus === true && (
                      <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-400 blur-sm" />
                    )}
                  </div>
                  <span className="text-sm text-green-400 font-mono">VALID</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 lg:gap-16">
            {/* Camera viewfinder */}
            <div className="flex-shrink-0">
              <CameraViewfinder
                mode={inputMode}
                onCapture={handleCapture}
                onFocusChange={setFocusedDigit}
                flash={flash}
                isModeComplete={isModeComplete()}
                isInvalid={isCurrentInputInvalid()}
                isDateComplete={isDateComplete()}
              />
            </div>

            {/* Right side panel: Rewind + Rotary Switch + Shutter */}
            <div className="flex flex-col items-center gap-12">
              {/* Rewind knob */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={clearAll}
                  disabled={isRewinding}
                  className="relative group focus:outline-none"
                >
                  {/* Knob base */}
                  <div
                    className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 shadow-2xl border-4 border-neutral-600 hover:border-red-600 transition-all group-active:scale-95 ${isRewinding ? 'border-red-600' : ''
                      }`}
                    style={{
                      animation: isRewinding ? 'spin 1s linear' : 'none'
                    }}
                  >
                    {/* Inner mechanism */}
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-neutral-800 to-black border-2 border-neutral-500" />

                    {/* Center dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-neutral-600 shadow-inner" />
                    </div>

                    {/* Rewind symbol */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-colors ${isRewinding ? 'text-red-400' : 'text-neutral-400 group-hover:text-red-400'
                          }`}
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </div>

                    {/* Grip notches */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-0.5 h-2 bg-neutral-500"
                          style={{
                            top: '2px',
                            left: '50%',
                            transform: `rotate(${i * 22.5}deg) translateX(-50%)`,
                            transformOrigin: `center ${40}px`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              </div>

              {/* Rotary mode switch */}
              <RotarySwitch
                currentMode={inputMode}
                onModeChange={setInputMode}
                isDateValid={dateStatus}
              />

              {/* Shutter button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleShutter}
                  disabled={isCapturing}
                  className="group disabled:opacity-50 focus:outline-none"
                >
                  <div className="relative">
                    {/* Outer metallic ring */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-b from-neutral-600 via-neutral-700 to-neutral-800 shadow-2xl flex items-center justify-center">
                      {/* Middle ring with grooves */}
                      <div className="w-20 h-20 rounded-full bg-gradient-to-b from-neutral-700 to-neutral-800 shadow-inner flex items-center justify-center border border-neutral-600 relative overflow-hidden">
                        {/* Grip texture */}
                        {[...Array(32)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-0.5 h-1.5 bg-neutral-600/50"
                            style={{
                              top: '4px',
                              left: '50%',
                              transform: `rotate(${i * 11.25}deg) translateX(-50%)`,
                              transformOrigin: `center ${40}px`
                            }}
                          />
                        ))}

                        {/* Inner shutter button */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-red-500 to-red-700 shadow-lg flex items-center justify-center transition-all group-hover:from-red-400 group-hover:to-red-600 group-active:scale-95 group-disabled:from-red-900 group-disabled:to-red-950 border-2 border-red-800 group-hover:border-red-700 group-disabled:border-red-950">
                          <Aperture className="w-7 h-7 text-white/90 group-disabled:text-white/30" strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
