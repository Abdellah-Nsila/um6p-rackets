'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AuthButton } from '../auth/auth-button';
import { useMe } from '@/hooks/use-me';



export default function HeroSection() {
  const { data: user } = useMe();
  return (
    <section
      className={cn(
        'relative overflow-hidden bg-secondary/50 font-(family-name:--font-poppins) dark:bg-[#121417] pt-27'
      )}
    >
      <span
        aria-hidden
        className="absolute right-0 top-98 hidden h-2.5 w-[18%]   bg-[#2B2F33] dark:bg-white lg:block"
      />

      <div className="relative mx-auto grid max-w-360 items-start gap-10 px-5 pb-10 pt-20 sm:py-10 lg:grid-cols-[535px_1fr] lg:gap-17.5 lg:px-0 lg:py-0 lg:pl-5.5">
        {/* court + rackets image (hidden on phones) */}
        <Image
          src="/hero_decoration_1.png"
          alt="Tennis and badminton rackets on a court"
          width={596}
          height={632}
          priority
          style={{ width: '100%', height: 'auto' }}
          className="z-10 mx-auto max-w-133.75 lg:mx-0 hidden lg:block"
        />

        {/* content */}
        <div className="relative z-10 flex flex-col md:flex-row lg:flex-col pt-10 lg:pt-37.5 gap-6 lg:gap-0">
          <div className="flex flex-col w-fit">
            <h1 className="text-5xl font-bold leading-none tracking-tight text-[#2B2F33] dark:text-white  lg:text-6xl xl:text-8xl truncate">
              <span className="text-[#D94A28]">UM6P</span> Racket
            </h1>

            <p className="mt-8 text-lg text-[#2B2F33] dark:text-white sm:text-[22px] truncate">
              All Rackets Sport In One Place
            </p>
            {user === null && (
              <AuthButton
                title="Get Started"
                className="mt-8 h-14.25 w-fit rounded-md bg-primary px-10 text-xl font-normal text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-primary/80"
              />
            )}
          </div>

          <div className="w-full  flex md:items-right md:justify-end md:ml-10 lg:ml-0">
            <p className="mt-12 mr-2 max-w-100 lg:max-w-150  font-(family-name:--font-roboto-condensed) text-lg font-light leading-snug text-[#2B2F33] dark:text-gray-300 xl:ml-57.5 lg:mt-14">
              Welcome to the UM6P racket sports hub—a platform designed to make
              organizing your matches completely effortless so you can simply
              focus on enjoying your sport more.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
