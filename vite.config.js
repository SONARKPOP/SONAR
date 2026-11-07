import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readdir, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';

function pagesArchiveFiles(){
 let contentDir;
 return {
  name:'sonar-pages-archive-files',
  apply:'build',
  configResolved(config){contentDir=resolve(config.root,config.build.outDir,'data','content');},
  async closeBundle(){
   const files=await readdir(contentDir,{withFileTypes:true}).catch(error=>{
    if(error.code!=='ENOENT')throw error;
    return [];
   });
   // The collector keeps these canonical records in Git. The browser reads the indexes.
   const records=files.filter(file=>file.isFile()&&file.name.endsWith('.json'));
   for(let offset=0;offset<records.length;offset+=100){
    await Promise.all(records.slice(offset,offset+100).map(file=>unlink(join(contentDir,file.name))));
   }
  },
 };
}

export default defineConfig({
 plugins:[react(),tailwindcss(),process.env.GITHUB_ACTIONS==='true'&&pagesArchiveFiles()],
 base:process.env.BASE_PATH || './',
});
