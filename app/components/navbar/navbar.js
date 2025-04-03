"use client"; // Mark this component as a Client Component

import { usePathname } from 'next/navigation'; // Use next/navigation's usePathname hook
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // Import useSession to get user info
import { useCart } from '../../context/CartContext'; // Ensure this path is correct
import { useState } from 'react';
import './navbar.css';

const Navbar = () => {
  const pathname = usePathname(); // Get the current pathname
  const { data: session } = useSession(); // Get session data
  const { cartItems } = useCart(); // Only import cartItems, not setCartItems
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for menu visibility

  const isActive = (path) => pathname === path ? 'active' : '';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <Link href="/" className={isActive('/')}>HomePlates</Link> {/* Apply active class here */}
      </div>
      <button className="hamburger" onClick={toggleMenu}>
        {/* Hamburger Icon */}
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
      <ul className={`navbar__links ${isMenuOpen ? 'open' : ''}`}>
        <li>
          <Link href="/homecook" className={isActive('/homecook')}>BecomeHomeCook</Link>
        </li>
        <li>
          {session ? (
            <Link href="/dashboard" className={isActive('/dashboard')}>{session.user.name}</Link> // Display username
          ) : (
            <Link href="/login" className={isActive('/login')}>Login</Link>
          )}
        </li>
        <li>
          <Link href="/cart" className={`cart-link ${isActive('/cart')}`}>
            <svg className="cart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
