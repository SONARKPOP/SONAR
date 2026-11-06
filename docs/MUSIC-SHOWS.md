# Music-show stages and continuous-live exclusions

The MUSIC-adjacent 음악방송 tab exclusively shows reviewed broadcaster stages and official fancams. These are excluded from Home, MUSIC, Own, External, Shorts and live-archive tabs; upload-calendar entries remain available by publication date. Music-show short fancams follow this newer exclusive-tab rule.

`config/broadcast.json` is shared by the Python publisher and browser. A registered broadcaster channel ID plus a recognizable music-show/fancam title is required. Pink Cabinet, interviews, backstage, reaction, games, talking, relay dance and Lee Mujin Service remain external. “예능연구소” is not treated as a variety exclusion: MBC official FullCam uploads remain stages. Existing canonical archives are tagged again on publication, and the browser also applies the current rules to old indexes. No duplicate records are created.

Reviewed original broadcast sources added: MBCkpop (`@MBCkpop`), SBSKPOP X INKIGAYO (`@SBSKPOP`), Mnet K-POP (`@Mnet`). Fan cams from fan/reupload channels remain excluded from collection.

`config/live-policy.json` identifies explicitly labelled continuous streams such as BIBI STATION, 24/7 and continuous music playback. These stay in the retained canonical archive but are omitted from LIVE NOW, LIVE ON counts and content browsing. Ordinary fan-chat, birthday, radio-style artist chat and concert livestreams remain eligible. A generic “radio” title alone is not grounds for exclusion.
