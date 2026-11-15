import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const project=createRequire(resolve('package.json'));
const babel=createRequire(project.resolve('@vitejs/plugin-react'))('@babel/core');
const files=process.argv.slice(2);
if(!files.length)throw new Error('Usage: node audit-unused.mjs src/file.jsx ...');
for(const file of files){
 const ast=babel.parseSync(readFileSync(file,'utf8'),{filename:file,configFile:false,babelrc:false,parserOpts:{sourceType:'module',plugins:['jsx']}});
 const reported=new Set();
 babel.traverse(ast,{Scope(path){for(const [name,binding] of Object.entries(path.scope.bindings)){
  if(name==='React'||name.startsWith('_')||binding.kind==='param'||binding.referenced||reported.has(binding)||binding.path.parentPath?.isExportNamedDeclaration())continue;
  reported.add(binding);
  console.log(`${file}:${binding.identifier.loc.start.line} ${name} (${binding.kind})`);
 }}});
}
