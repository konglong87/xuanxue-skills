# 手相公开图片候选与外部验收记录

本目录只记录来源与验收口径，**不提交图片文件**。真机测试前必须重新核对来源页许可；保存本地副本时移除 EXIF 等元数据。

## 首选：Wikimedia Commons 双掌图

- 来源页：<https://commons.wikimedia.org/wiki/File:Open_Palm_of_the_Left_Hand,_Fingers.jpg>
- 文件：`Open_Palm_of_the_Left_Hand,_Fingers.jpg`
- 作者：Eyefive45
- 许可：CC BY-SA 4.0
- 页面标注原图为 4032 × 3024，画面包含双手掌心。
- 2026-08-11 通过独立联网检索核对了来源页、作者、许可、尺寸与双掌内容。
- 同日在本机分别访问 Commons 页面、MediaWiki API 与 upload 原图链接，均在 30 秒内超时；未取得图片字节，不能伪称完成了该文件的本地视觉验收。

## 特殊纹路候选

- 来源页：<https://commons.wikimedia.org/wiki/File:25.12.2018_Vierfingerfurche,_beidseitig.JPG>
- 文件：`25.12.2018_Vierfingerfurche,_beidseitig.JPG`
- 许可：CC BY-SA 4.0
- 原文件含 EXIF，已知元数据包含 GPS 风险。若后续用于测试，必须先移除全部元数据，并保留作者、许可和改动说明。

## 可下载备用：Pexels 双掌图

- 来源页：<https://www.pexels.com/photo/photo-of-person-s-open-hands-2258248/>
- 来源页提供的下载 URL：<https://images.pexels.com/photos/2258248/pexels-photo-2258248.jpeg?cs=srgb&dl=pexels-jibarofoto-2258248.jpg&fm=jpg>
- 许可页：<https://www.pexels.com/license/>
- 页面作者：Luis Quintero；Pexels 用户路径为 `@jibarofoto`。
- 许可：Pexels License。2026-08-11 重新联网核对来源页的 `Free to use` 与许可页的 `Attribution is not required`。
- 作者差异：来源页显示 `Luis Quintero`，下载文件嵌入的 EXIF/XMP artist 为 `JIBAROFOTO`、copyright 为 `ALL`。两者可能对应同一作者的展示名与账号/署名，但仓库不自行合并身份；记录差异后清除嵌入元数据。
- 2026-08-11 已真实取得 1260 × 840 文件。原临时 PNG 实测仍含 `eXIf`、Adobe XMP、artist 与 copyright，并非此前误记的“无 EXIF”；该表述已纠正。

### 临时图片清理与验证

图片只在 `/tmp` 用于外部真机测试，不提交仓库。清理时先写新文件，不直接覆盖原件：

```bash
ffmpeg -hide_banner -loglevel error \
  -i /tmp/xuanxue-palm-e2e.png -map_metadata -1 -frames:v 1 -c:v png \
  /tmp/xuanxue-palm-e2e-pixels-only.png
node -e 'const fs=require("fs");const b=fs.readFileSync("/tmp/xuanxue-palm-e2e-pixels-only.png");const keep=[b.subarray(0,8)];const blocked=new Set(["eXIf","iTXt","tEXt","zTXt"]);let p=8;while(p<b.length){const n=b.readUInt32BE(p);const end=p+12+n;if(end>b.length)throw new Error("invalid PNG chunk length");const type=b.toString("ascii",p+4,p+8);if(!blocked.has(type))keep.push(b.subarray(p,end));p=end;}if(p!==b.length)throw new Error("invalid PNG trailing bytes");fs.writeFileSync("/tmp/xuanxue-palm-e2e-clean.png",Buffer.concat(keep));'
xattr -c /tmp/xuanxue-palm-e2e-clean.png
```

实际使用 FFmpeg 8.1。`sips --deleteProperty artist --deleteProperty copyright` 和单独的 `ffmpeg -map_metadata -1` 都仍保留 `eXIf`，因此没有拿其输出覆盖目标。结构化 chunk 清理后的新文件通过以下检查后才替换 `/tmp/xuanxue-palm-e2e.png`：

```bash
ffmpeg -i /tmp/xuanxue-palm-e2e.png -map 0:v:0 -f hash -hash sha256 -
ffmpeg -i /tmp/xuanxue-palm-e2e-clean.png -map 0:v:0 -f hash -hash sha256 -
node -e '解析 PNG chunk 并拒绝 eXIf/iTXt/tEXt/zTXt'
sips -g all /tmp/xuanxue-palm-e2e-clean.png
mdls /tmp/xuanxue-palm-e2e-clean.png
xattr -l /tmp/xuanxue-palm-e2e-clean.png
```

源文件与清理文件的解码帧 SHA-256 均为 `9da9f3b134a7f536f2c5b7c13716a9aced629fa728bca1fe40db683fe4df3d74`。清理文件只含 `IHDR/pHYs/sRGB/cHRM/gAMA/IDAT/IEND`，不含 EXIF、XMP、GPS、artist、copyright 或文本 chunk；人工视觉复核确认仍为双掌完整、掌心朝上、主要掌纹可辨。

macOS 在临时文件上保留或重新附加 `com.apple.provenance` 文件系统扩展属性；它不在 PNG chunk 内，不含作者、版权或 GPS 值。该事实保留在记录中，不把 `xattr -c` 误写成“所有文件系统属性均为空”。

## 外部技能基线与真机阻塞

2026-08-11 使用 Claude CLI 2.1.227 实跑综合命理、婚恋、事业财运、事业加婚恋和本地 Pexels 双掌图 5 条 `claude -p --plugin-dir .`。每条都先显示用户级 settings 中一条与本仓无关的 permission rule warning，随后在进入模型调用前返回 `Not logged in · Please run /login` 并退出 1；因此没有生成模型结果，不能声称路由或视觉判读已经通过。登录后的同场景测试保留到最终端到端验收。

2026-08-12 最终复测再次使用同一清理后 PNG 与五场景命令。五条均返回 `Not logged in · Please run /login` 并退出 1，没有模型输出；较早一次同日运行曾返回 `401 Invalid bearer token`，鉴权状态变化已记录在 `docs/TEST-CASES.md`。图片仍只位于 `/tmp`，没有进入 Git。
