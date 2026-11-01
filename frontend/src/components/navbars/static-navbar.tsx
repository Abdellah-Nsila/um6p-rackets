import Link from 'next/link';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import Logo from '../logo';

export function StaticNavbar() {
  return (
    <NavigationMenu className="min-w-full p-4 bg-background ">
      <NavigationMenuList className="flex justify-between items-center gap-4">
        <NavigationMenuItem>
          <Logo />
        </NavigationMenuItem>
        <NavigationMenuItem className="flex items-center gap-4">
          {/*Home */}
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            render={<Link href="/">Home</Link>}
          />
          {/*clubs */}
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            render={<Link href="/#clubs">Clubs</Link>}
          />
          {/* About */}
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            render={<Link href="/about">About</Link>}
          />
          {/* Contact */}
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            render={<Link href="/contact">Contact</Link>}
          />
          {/* privacy policy */}
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            render={<Link href="/privacy">Privacy Policy</Link>}
          />
          {/* Terms of Service */}
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            render={<Link href="/terms">Terms of Service</Link>}
          />
          {/* <ThemeToggle /> dark mode not supported on this platform */}
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
