'use client';

import type { CSSProperties } from 'react';
import { Navigation, Heart, Plane, Users, Headphones } from 'lucide-react';
import styles from './dome-gallery.module.css';

const GALLERY_ITEMS = [
  {
    title: 'Real-time guidance',
    body: 'Live prompts keep travelers confident at every checkpoint.',
    icon: Navigation,
    gradient: 'from-blue-500 to-cyan-400',
    iconBg: 'bg-blue-600/20',
  },
  {
    title: 'Compassionate AI',
    body: 'Natural voice assistance tailored to seniors and families.',
    icon: Heart,
    gradient: 'from-rose-500 to-pink-400',
    iconBg: 'bg-rose-600/20',
  },
  {
    title: 'Flight awareness',
    body: 'Up-to-the-minute gate, delay, and rebook alerts.',
    icon: Plane,
    gradient: 'from-indigo-500 to-purple-400',
    iconBg: 'bg-indigo-600/20',
  },
  {
    title: 'Helper sharing',
    body: 'Give loved ones a private link to monitor progress.',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-400',
    iconBg: 'bg-emerald-600/20',
  },
  {
    title: 'Agent handoff',
    body: 'Escalate to a live rep with context already captured.',
    icon: Headphones,
    gradient: 'from-amber-500 to-orange-400',
    iconBg: 'bg-amber-600/20',
  },
];

export function DomeGallery() {
  return (
    <section className={styles.gallery}>
      <div className={styles.halo} aria-hidden="true" />
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Every step, beautifully supported</h2>
        <p className={styles.headerSubtitle}>
          A dome of moments that show how MeeMaw keeps families connected from curb to gate.
        </p>
      </div>
      <div className={styles.arc}>
        {GALLERY_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className={styles.item} style={{ '--i': index } as CSSProperties}>
              <div className={styles.card}>
                <div className={`${styles.cardVisual} bg-gradient-to-br ${item.gradient}`}>
                  <div className={`${styles.iconWrapper} ${item.iconBg}`}>
                    <Icon className={styles.icon} strokeWidth={1.5} />
                  </div>
                </div>
                <div className={styles.cardTitle}>{item.title}</div>
                <div className={styles.cardBody}>{item.body}</div>
              </div>
            </div>
          );
        })}
        <div className={styles.base} aria-hidden="true" />
      </div>
    </section>
  );
}
