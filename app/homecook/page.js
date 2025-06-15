'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './page.css';

export default function HomecookPage() {
  return (
    <div className="container">
      <br />
      <h1 className="heading">
        Enjoy Cooking? Paid Handsomely&apos;?
      </h1>
      <p className="menuDescription">
        Join our community of home cooks and earn extra income by cooking for others.
      </p>

      <div className="max-w-3xl mx-auto space-y-12 mt-12">
        {/* Step 1 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">1. Sign in with Google</h2>
          <p className="mb-4">On the top right of the page, click login. Then sign in with Google.</p>
          <div className="relative w-full h-[400px] mb-4">
            <Image
              src="/images/screenshot1.png"
              alt="Login with Google"
              fill
              style={{ objectFit: 'contain' }}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">2. Fill in Personal Information</h2>
          <p className="mb-4">Add your profile pic, and don't forget to click save!</p>
          <div className="relative w-full h-[400px] mb-4">
            <Image
              src="/images/screenshot4.png"
              alt="Address Information Form"
              fill
              style={{ objectFit: 'contain' }}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">3. Add a New Meal</h2>
          <p className="mb-4">Scroll down to add a new meal to your menu.</p>
          <div className="relative w-full h-[400px] mb-4">
            <Image
              src="/images/screenshot3.png"
              alt="Add New Meal Form"
              fill
              style={{ objectFit: 'contain' }}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <Link 
            href="/dashboard" 
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
