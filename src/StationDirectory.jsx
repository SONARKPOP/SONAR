import React from 'react';
import {Youtube,ExternalLink} from 'lucide-react';
import {useLanguage} from './i18n';
import {stationChannels} from './station-directory';
import './station-directory.css';

const copy={ko:['라이브스테이션','상시방송 채널 모음입니다. 방송 상태는 확인하지 않습니다.','YouTube 라이브 목록 열기'],ja:['ライブステーション','常設配信チャンネルの一覧です。配信状況は確認していません。','YouTube のライブ一覧を開く'],en:['Live stations','Continuous-stream channels. Broadcast availability is not monitored.','Open YouTube live streams'],es:['Estaciones en directo','Canales de emisión continua. No se comprueba si están emitiendo.','Abrir directos de YouTube']};
export default function StationDirectory({channels,excluded=[]}){
 const language=useLanguage(),text=copy[language]||copy.ko;
 const rows=stationChannels(channels,{excluded});
 return <section className="station-directory"><h2>{text[0]} <small>{rows.length}</small></h2><p>{text[1]}</p><div className="station-channel-grid">{rows.map(row=><a key={row.channelId} href={row.url} target="_blank" rel="noopener noreferrer" aria-label={`${row.name} · ${text[2]}`}><Youtube size={24}/><span data-no-translate>{row.name}</span><ExternalLink size={16}/></a>)}</div></section>;
}
