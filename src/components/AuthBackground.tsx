import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function AuthBackground() {
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const orbs = [orb1Ref.current, orb2Ref.current, orb3Ref.current];

    const ctx = gsap.context(() => {
      orbs.forEach((orb, i) => {
        if (!orb) return;

        // Random drift path per orb
        const xRange = 60 + i * 20;
        const yRange = 40 + i * 15;
        const dur = 9 + i * 2.5;
        const delay = i * -3;

        const tl = gsap.timeline({
          defaults: { ease: 'sine.inOut' },
          repeat: -1,
          yoyo: true,
          delay,
        });

        tl.to(orb, {
          x: (i % 2 === 0 ? 1 : -1) * xRange,
          y: yRange,
          scale: 1 + i * 0.08,
          rotation: 15 * (i % 2 === 0 ? 1 : -1),
          duration: dur,
        })
          .to(orb, {
            x: (i % 2 === 0 ? -1 : 1) * (xRange * 0.6),
            y: -yRange * 0.7,
            scale: 1 - i * 0.05,
            rotation: -10 * (i % 2 === 0 ? 1 : -1),
            duration: dur * 0.8,
          })
          .to(orb, {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            duration: dur * 0.7,
          });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="auth-bg" aria-hidden="true">
      <div ref={orb1Ref} className="auth-orb auth-orb--1" />
      <div ref={orb2Ref} className="auth-orb auth-orb--2" />
      <div ref={orb3Ref} className="auth-orb auth-orb--3" />
    </div>
  );
}