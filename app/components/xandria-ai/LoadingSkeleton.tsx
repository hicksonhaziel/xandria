interface LoadingSkeletonProps {
  darkMode: boolean;
}

const LoadingSkeleton = ({ darkMode }: LoadingSkeletonProps) => {
  const skeletonClass = darkMode 
    ? 'skeleton-dark' 
    : 'skeleton-light';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          {/* AI Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${skeletonClass}`}></div>
          
          {/* Message Content */}
          <div className="flex-1 space-y-2">
            <div className={`h-3 w-24 ${skeletonClass}`}></div>
            <div className={`h-4 w-full ${skeletonClass}`}></div>
            <div className={`h-4 w-5/6 ${skeletonClass}`}></div>
            <div className={`h-4 w-4/6 ${skeletonClass}`}></div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .skeleton-dark {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.06) 25%,
            rgba(255,255,255,0.12) 37%,
            rgba(255,255,255,0.06) 63%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 0.5rem;
        }

        .skeleton-light {
          background: linear-gradient(
            90deg,
            rgba(0,0,0,0.06) 25%,
            rgba(0,0,0,0.12) 37%,
            rgba(0,0,0,0.06) 63%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 0.5rem;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSkeleton;