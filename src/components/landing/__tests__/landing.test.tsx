import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import HomePage from '@/app/page';
import { Logo } from '@/components/landing/logo';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { ThemePreview } from '@/components/landing/theme-preview';
import { Comparison } from '@/components/landing/comparison';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Faq } from '@/components/landing/faq';
import { CtaBanner } from '@/components/landing/cta-banner';
import { Footer } from '@/components/landing/footer';
import {
  BRAND_TAGLINE,
  BRAND_STACKING_TAGLINE,
  BRAND_MAIN_HEADLINE,
  WEDDING_THEMES,
  CORE_FEATURES,
  HOW_IT_WORKS_STEPS,
  FAQS,
  COMPARISON_POINTS,
} from '@/components/landing/landing-data';

function normalizeHtml(html: string): string {
  return html.replace(/<!-- -->/g, ' ').replace(/&amp;/g, '&');
}

describe('Streamlined Visual Homepage Components', () => {
  it('renders bespoke Logo component with sacred knot and gold gradient attributes', () => {
    const html = normalizeHtml(renderToString(<Logo size="md" />));
    expect(html).toContain('Make My Marriage Emblem');
    expect(html).toContain('mmmCrimson');
    expect(html).toContain('mmmGold');
  });

  it('renders Navbar with brand logo, signature stacking tagline, navigation links, and auth CTAs', () => {
    const html = normalizeHtml(renderToString(<Navbar />));
    expect(html).toContain('Make My Marriage');
    expect(html).toContain(BRAND_STACKING_TAGLINE);
    expect(html).toContain('The Contrast');
    expect(html).toContain('Features');
    expect(html).toContain('How It Works');
    expect(html).toContain('FAQ');
    expect(html).toContain('Sign In');
    expect(html).toContain('Start Planning');
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/signup"');
  });

  it('renders Hero section with main headline, signature tagline, and CTAs', () => {
    const html = normalizeHtml(renderToString(<Hero />));
    expect(html).toContain(BRAND_TAGLINE);
    expect(html).toContain('Your Wedding. Your People. Your Plan.');
    expect(html).toContain('All in One Place.');
    expect(html).toContain('One shared workspace');
    expect(html).toContain('Create Your Wedding Workspace');
    expect(html).toContain('href="/signup"');
  });

  it('renders ThemePreview component with 4 interactive themes, couple photo, and ceremony photos', () => {
    const html = normalizeHtml(renderToString(<ThemePreview />));
    expect(html).toContain('Choose Your Wedding Theme');
    for (const theme of WEDDING_THEMES) {
      expect(html).toContain(theme.name.split(' ')[0]);
    }
    expect(html).toContain('Divya & Rahul');
    expect(html).toContain('42');
    expect(html).toContain('Days to Go');
    expect(html).toContain('Haldi Ceremony');
    expect(html).toContain('Mehendi & Dholki');
    expect(html).toContain('Sangeet Night');
    expect(html).toContain('Caterer Plate Counts');
    expect(html).toContain('186');
    expect(html).toContain('₹12,45,000');
  });

  it('renders Comparison section with side-by-side visual status rows', () => {
    const html = normalizeHtml(renderToString(<Comparison />));
    expect(html).toContain('WhatsApp Chaos vs. Make My Marriage');
    for (const point of COMPARISON_POINTS) {
      expect(html).toContain(point.topic);
      expect(html).toContain(point.chaotic);
      expect(html).toContain(point.organized);
    }
  });

  it('renders all 6 core features with visual tags and checkmarks', () => {
    const html = normalizeHtml(renderToString(<Features />));
    expect(html).toContain('Built for Real Indian Weddings');
    for (const feature of CORE_FEATURES) {
      expect(html).toContain(feature.title);
      expect(html).toContain(feature.shortSnippet);
      expect(html).toContain(feature.visualTag);
    }
  });

  it('renders 3-step structured lifecycle workflow with action badges', () => {
    const html = normalizeHtml(renderToString(<HowItWorks />));
    expect(html).toContain('3 Simple Steps to Wedding Calm');
    for (const step of HOW_IT_WORKS_STEPS) {
      expect(html).toContain(step.number);
      expect(html).toContain(step.action);
      expect(html).toContain(step.title);
    }
  });

  it('renders FAQ section with category tags and concise answers', () => {
    const html = normalizeHtml(renderToString(<Faq />));
    expect(html).toContain('Common Questions');
    for (const faq of FAQS) {
      expect(html).toContain(faq.category);
      expect(html).toContain(faq.question);
    }
  });

  it('renders CtaBanner with signature tagline and primary conversion links', () => {
    const html = normalizeHtml(renderToString(<CtaBanner />));
    expect(html).toContain(BRAND_TAGLINE);
    expect(html).toContain('Bring Calm & Joy Back to Your Wedding Celebration');
    expect(html).toContain('Create Your Wedding Workspace');
    expect(html).toContain('Sign In to Existing Wedding');
    expect(html).toContain('href="/signup"');
    expect(html).toContain('href="/login"');
  });

  it('renders Footer with bespoke Logo, signature tagline, stacking tagline, and health endpoint link', () => {
    const html = normalizeHtml(renderToString(<Footer />));
    expect(html).toContain('Make My Marriage');
    expect(html).toContain(BRAND_STACKING_TAGLINE);
    expect(html).toContain(BRAND_TAGLINE);
    expect(html).toContain('System Status Online');
    expect(html).toContain('href="/api/health"');
    expect(html).toContain('All rights reserved.');
  });

  it('renders full HomePage composite page cleanly without errors', () => {
    const html = normalizeHtml(renderToString(<HomePage />));
    expect(html).toContain('Make My Marriage');
    expect(html).toContain(BRAND_TAGLINE);
    expect(html).toContain('Your Wedding. Your People. Your Plan.');
    expect(html).toContain('Multi-Ceremony Timeline');
    expect(html).toContain('System Status Online');
  });
});
