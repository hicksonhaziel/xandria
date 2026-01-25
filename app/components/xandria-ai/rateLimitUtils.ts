interface RateLimitData {
  count: number;
  resetTime: number;
}

const STORAGE_KEY = 'xandria_rate_limit';
const MAX_MESSAGES = 3;
const TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const checkRateLimit = (): { allowed: boolean; remaining: number; resetTime: number } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (!stored) {
      // First time user
      return { allowed: true, remaining: MAX_MESSAGES - 1, resetTime: now + TIME_WINDOW };
    }

    const data: RateLimitData = JSON.parse(stored);

    // Check if time window has passed
    if (now >= data.resetTime) {
      // Reset the counter
      return { allowed: true, remaining: MAX_MESSAGES - 1, resetTime: now + TIME_WINDOW };
    }

    // Check if user has remaining messages
    if (data.count >= MAX_MESSAGES) {
      return { allowed: false, remaining: 0, resetTime: data.resetTime };
    }

    return { allowed: true, remaining: MAX_MESSAGES - data.count - 1, resetTime: data.resetTime };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the message but log it
    return { allowed: true, remaining: MAX_MESSAGES - 1, resetTime: Date.now() + TIME_WINDOW };
  }
};

export const incrementRateLimit = (): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (!stored) {
      const data: RateLimitData = {
        count: 1,
        resetTime: now + TIME_WINDOW
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return;
    }

    const data: RateLimitData = JSON.parse(stored);

    // If time window passed, reset
    if (now >= data.resetTime) {
      const newData: RateLimitData = {
        count: 1,
        resetTime: now + TIME_WINDOW
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return;
    }

    // Increment count
    data.count += 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Rate limit increment error:', error);
  }
};

export const getRemainingTime = (resetTime: number): string => {
  const now = Date.now();
  const diff = resetTime - now;

  if (diff <= 0) return 'now';

  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

export const resetRateLimit = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Rate limit reset error:', error);
  }
};