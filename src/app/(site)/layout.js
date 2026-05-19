import '@/app/globals.css';
import BottomBar from '@/components/site/BottomBar';

export default function SiteLayout({ children }) {
  return (
    <>
      {children}
      <BottomBar />
    </>
  );
}
