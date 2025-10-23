"use client"

import Image from 'next/image'
import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'


const HeroSection = () => {

  const imageRef = useRef(null); 

  useEffect(() => {
    

    const handleScroll = () => {
        const imageElement = imageRef.current;

        const scrolPosition = window.scrollY;
        const scrolThreshold = 100; 

        if (scrolPosition > scrolThreshold) {
            imageElement.classList.add('scrolled')
        } else{
            imageElement.classList.remove('scrolled')
        }

    };

    window.addEventListener('scroll', handleScroll);
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };


  }, [])

  return (
    <section className='w-full pt-36 md:pt-48 pb-10'>
        <div className='space-y-6 text-center'>
            <div className='space-y-6 mx-auto'>
                <h1 className='text-5xl md:text-6xl font-bold lg:text-7xl xl:text-8xl gradient-title'>
                    Your AI Career Coach for
                     <br />   
                    Professional Success
                </h1>
                <p className='mx-auto max-w-[600px] text-muted-foreground md:text-xl'>
                    Advance your career with personalized guidance, interview prep, and
                    AI-powered tools for job success.
                </p>
            </div>

            <div className='flex justify-center space-x-4'> 
                <Link href="/onboarding">
                    <button size='lg' className='px-6 py-2 border rounded bg-primary text-primary-foreground hover:bg-primary/90'>
                        Get Started
                    </button>
                </Link>
                {/* <Link href="/dashboard">
                    <button variant='outline' size='lg' className='px-8'>
                        Get Started
                    </button>
                </Link>     */}
            </div>

            <div className='hero-image-wrapper mt-5 md:mt-0'>
                <div ref={imageRef} className='hero-image'>
                    <Image 
                      src={"/banner.jpeg"}
                      width={1280}
                      height={720}
                      alt='Banner SensEra'
                      className='rounded-lg shadow-2xl border mx-auto'
                      priority
                    />
                    
                </div>
            </div>
        </div>
    </section>
  )
}

export default HeroSection