import React from 'react';
import VideoAssistant from './widgets/VideoAssistant/VideoAssistant';
import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import IndexVideo from './widgets/IndexVideo/IndexVideo';
import { CommonProvider } from './widgets/IndexVideo/WrapperPage';

const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: '/',
    element: <VideoAssistant/>
  },
  {
    path: '/Chat',
    element: <VideoAssistant/>
  },
  {
    path: '/Index',
    element: <IndexVideo />
  }
]);

const App = (): JSX.Element => (
    <QueryClientProvider client={queryClient}>
      <CommonProvider>
        <RouterProvider router={router} />
      </CommonProvider>
    </QueryClientProvider>
);

export default App;
