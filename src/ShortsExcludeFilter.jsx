import React from 'react';
import {durationSeconds} from './content-sections.js';

export default function ShortsExcludeFilter({
  enabled,
  onChange
}) {
  return (
    <button
      type="button"
      className="shorts-exclude-filter"
      aria-pressed={enabled}
      onClick={() => onChange(!enabled)}
    >
      {enabled ? '✓ 쇼츠 제외' : '쇼츠 제외'}
    </button>
  );
}

export function filterShortVideos(videos, enabled) {
  if (!enabled) return videos;
  return videos.filter(video => {
    const seconds = durationSeconds(video);
    return seconds === null || seconds >= 60;
  });
}
