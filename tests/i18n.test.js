import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {LANGUAGES,translate,localize} from '../src/i18n.js';
test('language controls use ES and key interface strings translate',()=>{
 assert.deepEqual(LANGUAGES.map(row=>row[1]),['KR','JP','EN','ES']);
 assert.equal(translate('그룹 추가하기','en'),'Add groups');
 assert.equal(translate('스케줄','es'),'Agenda');
 assert.equal(translate('홈','ja'),'ホーム');
 assert.equal(translate('RESCENE title','es'),'RESCENE title');
});
test('localization preserves keys, interaction, values and explicitly original content',()=>{
 const click=()=>{};
 const button=React.createElement('button',{key:'test',onClick:click,'aria-label':'닫기'},'홈');
 const localized=localize(button,'en');
 assert.equal(localized.props.children,'Home');
 assert.equal(localized.props.onClick,click);
 assert.equal(localized.key,'test');
 assert.equal(localized.props['aria-label'],'Close');
 const original=React.createElement('h3',{'data-no-translate':true},'홈');
 assert.equal(localize(original,'es'),original);
});
