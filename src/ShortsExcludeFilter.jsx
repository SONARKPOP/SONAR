
import React from 'react';
import {Check} from 'lucide-react';

export default function ShortsExcludeFilter({
  enabled = false,
  onChange
}) {
  return (
    <button
      type="button"
      className="shorts-exclude-filter"
      aria-pressed={enabled}
      onClick={() => onChange(!enabled)}
    >
      {enabled && <Check size={14}/>}
      <span>쇼츠 제외</span>
    </button>
  );
}
