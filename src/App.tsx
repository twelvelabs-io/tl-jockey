import React from 'react';
import VideoAssistant from './widgets/VideoAssistant/VideoAssistant';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { CommonProvider } from './widgets/IndexVideo/WrapperPage';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CommonProvider>
        <Router>
          <Routes>
            <Route path="/" element={<VideoAssistant />} />
            <Route path="/Chat" element={<VideoAssistant />} />
          </Routes>
        </Router>
      </CommonProvider>
    </QueryClientProvider>
  );
};

export default App;
