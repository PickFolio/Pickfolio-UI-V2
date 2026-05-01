import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion as Motion } from 'framer-motion';
import HomePage from './pages/HomePage';
import ContestPage from './pages/ContestPage';
import AuthPage from './pages/AuthPage';
import LeaderboardPage from './pages/LeaderboardPage';
import Layout from './components/Layout';

function PageTransition({ children }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </Motion.div>
  );
}

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <PageTransition><AuthPage /></PageTransition>,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <PageTransition><HomePage /></PageTransition>,
      },
      {
        path: '/contest/:contestId',
        element: <PageTransition><ContestPage /></PageTransition>,
      },
      {
        path: '/contest/:contestId/leaderboard',
        element: <PageTransition><LeaderboardPage /></PageTransition>,
      },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-lg)',
          },
          success: {
            iconTheme: {
              primary: '#10b981', // emerald-500
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: 'white',
            },
          },
        }}
      />
    </>
  );
}

export default App;
