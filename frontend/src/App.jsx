import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './Home'
import Room from './Room'

function App() {

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/room/:id' element={<Room />} />
      </Routes>
    </Router>
  )
}

export default App
