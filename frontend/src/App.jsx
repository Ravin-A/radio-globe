import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import React from "react";
import GlobeView from "./components/GlobeView";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <GlobeView />
    </div>
  );
}

export default App;
