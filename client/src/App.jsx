import React from 'react'
import Navbar from "./Components/Navbar/Navbar.jsx"
import './App.css'
import Slideshow from './Components/Slideshow/Slideshow.jsx';
import BodyContent from './Components/BodyContent/BodyContent.jsx';


function App() {
  
  return (    
      <div>
        <div>
        <Navbar />
        </div>
        <Slideshow />
        
      </div>
  );
}

export default App
