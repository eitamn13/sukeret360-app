import { useState, useEffect } from 'react';

export function useCurrentTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;

  const greeting =
    hours >= 5 && hours < 12
      ? 'בוקר טוב'
      : hours >= 12 && hours < 17
      ? 'צהריים טובים'
      : hours >= 17 && hours < 21
      ? 'ערב טוב'
      : 'לילה טוב';

  const dateString = now.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return { timeString, greeting, dateString, now };
}
