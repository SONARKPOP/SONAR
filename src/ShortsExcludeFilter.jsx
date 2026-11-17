
import React from 'react';
import {useLanguage,translate} from './i18n';
import {durationSeconds} from './content-sections.js';

export default function ShortsExcludeFilter({enabled,onChange}) {
  const language=useLanguage();
  const label=translate('쇼츠 제외',language);

  return (
    <button
      type="button"
      className="shorts-exclude-filter"
      aria-pressed={enabled}
      onClick={()=>onChange(!enabled)}
    >
      {enabled?'✓ ':''}{label}
    </button>
  );
}

export function filterShortVideos(videos,enabled) {
  if(!enabled)return videos;
  return videos.filter(video=>{
    const seconds=durationSeconds(video);
    return video.format!=='short' && video.category!=='shorts' && (seconds===null||seconds>=60);
  });
}
