import { Outlet } from 'react-router-dom';
import Header from 'src/components/layout/Header/Header.tsx';
import { SessionTimerProvider } from 'src/context/SessionTimerContext';
import TimerOverlay from 'src/components/common/TimerOverlay';

export default function ChildLayout() {
  return (
    <SessionTimerProvider>
      <div className="ChildLayout">
        <Header />
        <main className="ChildLayout__main">
          <Outlet />
        </main>
        <TimerOverlay />
      </div>
    </SessionTimerProvider>
  );
}
