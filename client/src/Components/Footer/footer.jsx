import React from 'react'
import './footer.css'
import footerfb from '../assets/footer-facebook.svg'
import footerinsta from '../assets/footer-instagram.svg'
import footerx from '../assets/footer-twitter.svg'
import footeryt from '../assets/footer-youtube.svg'

export default function footer() {

  return (
    <div>
      <div className="footer-section">
        <div className="nav-bar-footer-section">
          <a href=''><p>Home</p></a>
          <a href=''><p>About</p></a>
          <a href=''><p>Service</p></a>
          <a href=''><p>Contact Us</p></a>
        </div>
        <div className="footer-icon-container">
          <img className="footer-icons" src={footerfb} ></img>
          <img className="footer-icons" src={footerinsta}></img>
          <img className="footer-icons" src={footerx}></img>
          <img className="footer-icons" src={footeryt}></img>
        </div>
        <div className="footer-copywrite">
          <p>&copy; 2025 FixMate.lk. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
