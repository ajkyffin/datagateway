import React from 'react';

export function useSticky(): {
  isSticky: boolean;
  element: React.RefObject<HTMLDivElement>;
} {
  const [isSticky, setIsSticky] = React.useState(false);
  const element = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback((): void => {
    console.log('Got scroll');
    if (element.current && element.current.getBoundingClientRect().bottom) {
      console.log(
        'Got bottom: ',
        element.current.getBoundingClientRect().bottom
      );

      if (window.scrollY > element.current.getBoundingClientRect().bottom) {
        console.log('Scroll greater than navbar');
        setIsSticky(true);
      } else {
        console.log('Scroll less than navbar');

        setIsSticky(false);
      }
    }
  }, [element]);

  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', () => handleScroll);
    };
  }, [handleScroll]);

  return { isSticky, element };
}
