export const OFFICIAL_PLATFORMS={youtube:'YouTube',weverse:'Weverse',berriz:'Berriz',x:'X (Twitter)',instagram:'Instagram',tiktok:'TikTok',website:'공식 사이트'};
const hosts={youtube:['youtube.com','www.youtube.com'],weverse:['weverse.io'],berriz:['berriz.in','link.berriz.in'],x:['x.com','www.x.com','twitter.com','www.twitter.com'],instagram:['instagram.com','www.instagram.com'],tiktok:['tiktok.com','www.tiktok.com']};
export function validOfficialLink(link){
 try{const u=new URL(link.url);return Boolean(OFFICIAL_PLATFORMS[link.platform]&&u.protocol==='https:'&&!u.username&&!u.password&&(link.platform==='website'||(hosts[link.platform]?.includes(u.hostname)&&u.pathname!=='/')));}catch{return false;}
}
export function officialLinksFor(artist,channels=[]){
 const youtube=channels.filter(c=>c.official&&c.groupIds?.includes(artist.id)&&c.platformId&&!c.unavailableReason).map(c=>({platform:'youtube',url:`https://www.youtube.com/channel/${c.platformId}`,label:c.name}));
 const seen=new Set();return [...youtube,...(artist.officialLinks||[])].filter(l=>{const key=l.platform+':'+l.url.replace(/\/$/,'');if(!validOfficialLink(l)||seen.has(key))return false;seen.add(key);return true;});
}

