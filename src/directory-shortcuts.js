const INITIALS=[...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
export const INITIAL_ROWS=[
 ['한글 초성',[...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ']],
 ['숫자·기호·알파벳',['0–9','기호',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']],
];
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

