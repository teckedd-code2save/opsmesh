'use client';

import { useEffect, useState } from 'react';
import type { RadarPreferenceRecord } from '@opsmesh/radar-core';
import { PageShell } from '@/components/page-shell';

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<RadarPreferenceRecord | null>(null);

  useEffect(() => {
    fetch('/api/radar/preferences')
      .then((res) => res.json())
      .then((payload: RadarPreferenceRecord) => setPreferences(payload))
      .catch(() => setPreferences(null));
  }, []);

  return (
    <PageShell eyebrow="Preferences" title="Targeting rules" description="Personalization lives here. Gig Radar should feel tuned to one operator, not like a generic job board browser.">
      {preferences ? (
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, background: 'rgba(15,23,42,0.65)' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><strong>Display name:</strong> {preferences.displayName}</div>
            <div><strong>Min hourly:</strong> {preferences.minHourlyRate ?? '—'}</div>
            <div><strong>Min fixed:</strong> {preferences.minFixedBudget ?? '—'}</div>
            <div><strong>Remote only:</strong> {preferences.remoteOnly ? 'yes' : 'no'}</div>
            <div><strong>Preferred keywords:</strong> {preferences.preferredKeywords.join(', ')}</div>
            <div><strong>Excluded keywords:</strong> {preferences.excludedKeywords.join(', ')}</div>
            <div><strong>Notes:</strong> {preferences.notes}</div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
