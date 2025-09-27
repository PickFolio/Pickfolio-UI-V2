import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import ContestPage from './pages/ContestPage';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/contest/:contestId',
        element: <ContestPage />,
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
            background: '#334155', // Slate-700
            color: '#e2e8f0', // Slate-200
          },
        }}
      />
    </>
  );
}

export default App;