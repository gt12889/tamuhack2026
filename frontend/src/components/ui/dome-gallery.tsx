'use client';

import type { CSSProperties } from 'react';
import { Navigation, Heart, Plane, Users, Headphones } from 'lucide-react';
import styles from './dome-gallery.module.css';

const GALLERY_ITEMS = [
  {
    title: 'Real-time guidance',
    body: 'Live prompts keep travelers confident at every checkpoint.',
    icon: Navigation,
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    iconBg: 'rgba(99, 102, 241, 0.25)',
  },
  {
    title: 'Compassionate AI',
    body: 'Natural voice assistance tailored to seniors and families.',
    icon: Heart,
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    iconBg: 'rgba(236, 72, 153, 0.25)',
  },
  {
    title: 'Flight awareness',
    body: 'Up-to-the-minute gate, delay, and rebook alerts.',
    icon: Plane,
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    iconBg: 'rgba(124, 58, 237, 0.25)',
  },
  {
    title: 'Helper sharing',
    body: 'Give loved ones a private link to monitor progress.',
    icon: Users,
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    iconBg: 'rgba(16, 185, 129, 0.25)',
  },
  {
    title: 'Agent handoff',
    body: 'Escalate to a live rep with context already captured.',
    icon: Headphones,
    gradient: 'linear-gradient(135deg, #6C63FF 0%, #818cf8 100%)',
    iconBg: 'rgba(108, 99, 255, 0.25)',
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
                <div
                  className={styles.cardVisual}
                  style={{ background: item.gradient }}
                >
                  <div
                    className={styles.iconWrapper}
                    style={{ backgroundColor: item.iconBg }}
                  >
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
