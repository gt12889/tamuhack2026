'use client';

import type { CSSProperties } from 'react';
import styles from './dome-gallery.module.css';

const GALLERY_ITEMS = [
  {
    title: 'Real-time guidance',
    body: 'Live prompts keep travelers confident at every checkpoint.',
    label: 'Guided',
  },
  {
    title: 'Compassionate AI',
    body: 'Natural voice assistance tailored to seniors and families.',
    label: 'Caring',
  },
  {
    title: 'Flight awareness',
    body: 'Up-to-the-minute gate, delay, and rebook alerts.',
    label: 'Aware',
  },
  {
    title: 'Helper sharing',
    body: 'Give loved ones a private link to monitor progress.',
    label: 'Linked',
  },
  {
    title: 'Agent handoff',
    body: 'Escalate to a live rep with context already captured.',
    label: 'Seamless',
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
        {GALLERY_ITEMS.map((item, index) => (
          <div key={item.title} className={styles.item} style={{ '--i': index } as CSSProperties}>
            <div className={styles.card}>
              <div className={styles.cardVisual}>{item.label}</div>
              <div className={styles.cardTitle}>{item.title}</div>
              <div className={styles.cardBody}>{item.body}</div>
            </div>
          </div>
        ))}
        <div className={styles.base} aria-hidden="true" />
      </div>
    </section>
  );
}
