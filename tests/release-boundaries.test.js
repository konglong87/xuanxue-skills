'use strict';
const fs=require('fs');
const os=require('os');
const path=require('path');
const {createHash}=require('crypto');
const {buildPublicTree,isPublicPath}=require('../scripts/build-public-tree');

test.each([
  '.research-sample/SKILL.md', 'skills/.research-sample/course.md', 'docs/.audit-local/raw.txt',
  'core/node_modules/foreign/index.js', 'vendor/example/.git/config', 'coverage/lcov.info',
  'unreviewed-course/lesson.md', 'public-release/copy.md', 'public-release-manifest.json',
])('公开树拒绝临时/嵌套元数据/未经批准根目录 %s',file=>{
  expect(isPublicPath(file)).toBe(false);
});

test('默认构建不把旧manifest作为新manifest的文件项',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'release-boundary-'));
  try {
    const source={'VERSION':Buffer.from('0.3.1\n'),'LICENSE':Buffer.from('fixture license'),
      'public-release-manifest.json':Buffer.from('{"old":true}')};
    const result=buildPublicTree(dir,{files:Object.keys(source),readFile:p=>source[p],modeOf:()=> '100644'});
    expect(result.manifest.files.map(f=>f.path)).not.toContain('public-release-manifest.json');
    for(const f of result.manifest.files) {
      const bytes=fs.readFileSync(path.join(dir,f.path));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(f.sha256);
    }
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('公开Git跟踪集本身也不能携带被排除材料，不能只过滤导出副本',()=>{
  const root=path.resolve(__dirname,'..');
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'public-release-manifest.json'),'utf8'));
  let files;
  if(fs.existsSync(path.join(root,'.git'))) {
    files=require('child_process').execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
  } else {
    files=manifest.files.map(file=>file.path);
  }
  expect(files.filter(file=>file!=='public-release-manifest.json'&&!isPublicPath(file))).toEqual([]);
});
