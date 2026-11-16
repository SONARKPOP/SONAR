import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
test('feedback only links Google Forms response pages and stays disabled without a destination',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null}});
 try{
  const {feedbackUrl,default:Feedback}=await server.ssrLoadModule('/src/FeedbackLink.jsx');
  assert.equal(feedbackUrl('https://docs.google.com/forms/d/e/abc/viewform'),'https://docs.google.com/forms/d/e/abc/viewform');
  assert.equal(feedbackUrl('https://forms.gle/example'),'https://forms.gle/example');
  for(const value of [null,'javascript:alert(1)','https://docs.google.com/forms/d/abc/edit','https://docs.google.com.evil.test/forms/x/viewform'])assert.equal(feedbackUrl(value),null);
  const html=renderToStaticMarkup(React.createElement(Feedback,{responseUrl:null}));
  assert.match(html,/disabled/);assert.doesNotMatch(html,/<form|<iframe|href=/);
  const linked=renderToStaticMarkup(React.createElement(Feedback));
  assert.match(linked,/개선 의견 보내기/);assert.match(linked,/\/viewform/);assert.doesNotMatch(linked,/\/edit/);
 }finally{await server.close();}
});
