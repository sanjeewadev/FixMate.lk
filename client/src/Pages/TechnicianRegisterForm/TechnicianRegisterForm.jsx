import React from 'react'
import './TechnicianRegisterForm.css';
import Navbar from '../../Components/nav/PublicNavBar';
import TechnicianRegister from '../../Components/TechnicianRegister/TechnicianRegister';

export default function TechnicianRegisterForm() {
  return (
    <div className='bt-body'>
      <nav>
        <Navbar />
      </nav>
      <TechnicianRegister />
    </div>
  )
}