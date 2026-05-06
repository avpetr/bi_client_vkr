import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import InteractiveDashboard from './pages/InteractiveDashboard';

function App() {
  return (
    <ThemeProvider>
      <InteractiveDashboard />
    </ThemeProvider>
  );
}

export default App;