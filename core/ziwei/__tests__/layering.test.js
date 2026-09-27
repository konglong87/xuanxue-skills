'use strict';
const fs=require('fs');const os=require('os');const path=require('path');const {spawnSync}=require('child_process');
const ROOT=path.resolve(__dirname,'../../..');
test('core与vendor单独复制可排盘，不反向依赖skills',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ziwei-core-only-'));
  try {
    for(const name of ['core','vendor'])fs.cpSync(path.join(ROOT,name),path.join(dir,name),{recursive:true});
    const code="const z=require('./core/ziwei'); const c=z.ziweiChart({lunarMonth:1,lunarDay:1,timeBranch:'子',yearStem:'甲',yearBranch:'辰',gender:'male'}); if(c.命身.命宫!=='寅')process.exit(2);";
    const result=spawnSync(process.execPath,['-e',code],{cwd:dir,encoding:'utf8'});
    expect(result.stderr).toBe('');expect(result.status).toBe(0);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
