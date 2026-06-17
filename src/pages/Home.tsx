import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { Hero } from '../components/sections/Hero';
import { Countdown } from '../components/sections/Countdown';
import { Story } from '../components/sections/Story';
import { Schedule } from '../components/sections/Schedule';
import { Location } from '../components/sections/Location';
import { Gift } from '../components/sections/Gift';
import { RsvpCta } from '../components/sections/RsvpCta';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Countdown />
        <Story />
        <Schedule />
        <Location />
        <Gift />
        <RsvpCta />
      </main>
      <SiteFooter />
    </>
  );
}
