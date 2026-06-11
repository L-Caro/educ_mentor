import { Outlet } from 'react-router-dom';
import Header from 'src/components/layout/Header/Header.tsx';
import { SessionTimerProvider } from 'src/context/SessionTimerContext.tsx';
import TimerOverlay from 'src/components/common/TimerOverlay.tsx';

export default function HomePage() {
  return (
    <SessionTimerProvider>
      <div className="HomePage">
        <Header />
        <main className="HomePage__main">
          <Outlet />
        </main>
        <TimerOverlay />
      </div>
    </SessionTimerProvider>
  );
}
