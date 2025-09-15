'use client';

interface ReadingProgressProps {
  progress: number;
  className?: string;
}

export function ReadingProgress({ progress, className = '' }: ReadingProgressProps) {
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 h-1 ${className}`}>
      <div
        className="h-full bg-primary-600 transition-all duration-300 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress: ${progress}%`}
      />
    </div>
  );
}