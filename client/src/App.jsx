import React from 'react';
import './App.css'
import Home from './Pages/Home/Home.jsx';
import AIChatWidget from "./Components/AIChat/AIChatWidget";


function App() {
  
  return (    
      <div>
        <Home />
        <AIChatWidget />
      </div>
  );
}

export default App