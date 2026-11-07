import {activityView} from './youtube-activity.js';
import {artistCategories} from './lib.js';

const INITIALS=[...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
export const INITIAL_KEYS=['0–9','기호',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ'];
const DOUBLE_INITIAL={'ㄲ':'ㄱ','ㄸ':'ㄷ','ㅃ':'ㅂ','ㅆ':'ㅅ','ㅉ':'ㅈ'};

function initial(name){
 const char=name?.trim().normalize('NFC')[0];
 if(!char)return '';
 if(/[0-9]/.test(char))return '0–9';
 if(/[a-z]/i.test(char))return char.toUpperCase();
 const n=char.charCodeAt(0)-0xAC00;
 if(n>=0&&n<=11171){
  const letter=INITIALS[Math.floor(n/588)];
  return DOUBLE_INITIAL[letter]||letter;
 }
 return '기호';
}

export function artistInitials(artist){
 return [...new Set([artist.name,artist.nameKo,artist.nameEn,...(artist.aliases||[])].map(initial).filter(Boolean))];
}

export function activityRecommendations(groups,{clock,type,mode,favorites,excluded}){
 const states=mode==='hot'?['SURGE']:mode==='steady'?['SAILING']:['SURGE','SAILING','COASTING'];
 const hidden=new Set(excluded);
 return groups.flatMap(artist=>{
  if(favorites.has(artist.id)||hidden.has(artist.id)||(type!=='all'&&!artistCategories(artist).includes(type)))return [];
  const view=activityView(artist,clock);
  return view&&states.includes(view.state)?[{artist,view}]:[];
 }).sort((a,b)=>Date.parse(b.view.lastUpload)-Date.parse(a.view.lastUpload)||b.view.uploads7d-a.view.uploads7d).slice(0,6);
}
