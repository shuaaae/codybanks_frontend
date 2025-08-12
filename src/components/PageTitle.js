import { useEffect } from 'react';

const PageTitle = ({ title }) => {
  useEffect(() => {
    const baseTitle = 'Draft and Statistics System';
    const fullTitle = title ? `${title} - ${baseTitle}` : baseTitle;
    document.title = fullTitle;
  }, [title]);

  return null; // This component doesn't render anything
};

export default PageTitle; 