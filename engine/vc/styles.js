// 画风外观表:组件(vc.js)只认文字角色,这里给每个角色字体 / 颜色 / 出场方式,并选承载物的造型(carriers)。
// 字体写法 '族名:字重';中文字走 zh,其余字符走 en。全部 SIL OFL(见 .claude/skills/baitu-video/design/fonts.md)。
// 新增画风:复制一套,改颜色与字体,carriers 先从已有造型里挑;要新造型就在 vc.js 对应组件里加一个 kind 分支。
// 角色值的出处:各画风卡与场景卡的书写来源表(paper-skeuo ← N8/N9;tech-ui ← A1/A2;cartoon-ui ← N1–N3)。
(function () {
  const VC = window.VC = window.VC || {};
  VC.styles = VC.styles || {};

  // ---------------- 纸面拟物:真纸、真墨、真打字机 ----------------
  {
    const c = {
      bg: '#E4D9C2', ink: '#1F1C1A', muted: '#6B6355', accent: '#C23A30', pen: '#24324C', note: '#F6EFD9', tape: '#E9DDB4',
      bezel: '#2B3236', screen: '#0F1F1B', scrTxt: '#8FB8A8', scrHi: '#6FD6A8', scrGrid: '#24443B', chatU: '#E9DFC8', chatA: '#FFFFFF',
    };
    VC.styles['paper-skeuo'] = {
      id: 'paper-skeuo', name: '纸面拟物', nameEn: 'Paper', c, vig: .3,
      roles: {
        R1: { zh: 'Noto Serif SC:900', en: 'Noto Serif SC:900', size: 84, fill: c.ink, entrance: 'type', cps: 8 },
        R2: { zh: 'Noto Serif SC:900', en: 'Noto Serif SC:900', size: 48, fill: c.ink, entrance: 'type', cps: 12 },
        R3: { zh: 'Noto Sans SC:500', en: 'Noto Sans SC:500', size: 28, fill: c.muted, entrance: 'fadeUp' },
        R4: { zh: 'Noto Sans SC:900', en: 'Space Mono:700', size: 96, fill: c.ink },
        R5: { zh: 'Noto Serif SC:500', en: 'Special Elite:400', size: 40, fill: '#1E1E1E', entrance: 'type', cps: 14, cpsEn: 30, ink: .28, jit: .07 },
        R6: { zh: 'Zhi Mang Xing:400', en: 'Caveat Brush:400', size: 44, fill: c.accent, entrance: 'hand', cps: 6, blend: 'multiply' },
        R7: { zh: 'Xiaolai:400', en: 'Kalam:400', size: 38, fill: c.pen, entrance: 'static', zhUI: 'Noto Sans SC:500', enUI: 'Noto Sans SC:500' },
        R8: { zh: 'Xiaolai:400', en: 'Kalam:400', size: 46, fill: c.pen, entrance: 'hand', cps: 8, cpsEn: 18, jit: 1 },
        R9: { zh: 'Noto Serif SC:900', en: 'Noto Serif SC:900', size: 44, fill: c.accent },
        R10: { zh: 'Noto Sans SC:500', en: 'Space Mono:400', size: 22, fill: c.muted, entrance: 'fadeUp' },
      },
      mono: { zh: 'Noto Sans SC:500', en: 'Space Mono:400' },
      carriers: { backdrop: 'paper', mark: 'pencil', stamp: 'ink', counter: 'print', bubble: 'note', window: 'bezel', panel: 'sheet' },
      bar: { font: 'Noto Sans SC:900', accent: '#F2C14E', track: '#fff', text: '#fff', ink: c.ink },
    };
  }

  // ---------------- 科技深色界面:深蓝黑底、细线面板、蓝色辉光、等宽数字 ----------------
  {
    const c = {
      bg: '#070B16', surface: '#0E1528', win: '#0B1122', line: '#1C2A47', edge: '#22325A', text: '#E8EEF9', muted: '#8C9BB8',
      accent: '#2E8BFF', glow: '#7CC2FF', warm: '#FF9E3D', dot: '#3A4766', chatU: '#13305C', chatA: '#111A31', ink: '#070B16',
    };
    VC.styles['tech-ui'] = {
      id: 'tech-ui', name: '科技深色', nameEn: 'Tech', c, vig: .45,
      roles: {
        R1: { zh: 'Noto Sans SC:900', en: 'Space Grotesk:700', size: 84, fill: c.text, entrance: 'fadeUp' },
        R2: { zh: 'Noto Sans SC:900', en: 'Space Grotesk:700', size: 48, fill: c.text, entrance: 'fadeUp' },
        R3: { zh: 'Noto Sans SC:500', en: 'Space Grotesk:500', size: 28, fill: c.muted, entrance: 'fadeUp' },
        R4: { zh: 'Noto Sans SC:900', en: 'JetBrains Mono:700', size: 96, fill: c.text },
        R5: { zh: 'Noto Sans SC:500', en: 'JetBrains Mono:400', size: 38, fill: c.text, entrance: 'type', cps: 18, cpsEn: 40, cursor: true, cursorFill: c.accent },
        R6: { zh: 'Noto Sans SC:900', en: 'Space Grotesk:700', size: 40, fill: c.glow, entrance: 'fadeUp' },
        R7: { zh: 'Noto Sans SC:500', en: 'Space Grotesk:500', size: 34, fill: c.text, entrance: 'static' },
        // 本画风没有手写层(tech-ui.md):手记改成等宽字逐字打出
        R8: { zh: 'Noto Sans SC:500', en: 'JetBrains Mono:400', size: 40, fill: c.glow, entrance: 'type', cps: 14, cpsEn: 32, cursor: true, cursorFill: c.accent },
        R9: { zh: 'Noto Sans SC:900', en: 'JetBrains Mono:700', size: 34, fill: c.accent },
        R10: { zh: 'Noto Sans SC:500', en: 'JetBrains Mono:400', size: 22, fill: c.muted, entrance: 'fadeUp' },
      },
      mono: { zh: 'Noto Sans SC:500', en: 'JetBrains Mono:400' },
      carriers: { backdrop: 'grid', mark: 'glow', stamp: 'chip', counter: 'glow', bubble: 'card', window: 'win' },
      bar: { font: 'Noto Sans SC:900', accent: c.accent, track: '#C8D6F0', text: '#fff', ink: '#05080F' },
    };
  }

  // ---------------- 卡通界面:马卡龙色、圆角粗描边 ----------------
  {
    const c = {
      bg: '#F6EFE0', ink: '#2A2420', muted: '#7A6E62', accent: '#E8627A', lw: 6, dots: '#D9CBB0',
      pink: '#F7B7C3', mint: '#A8DCC8', yolk: '#F6CB5A', sky: '#9CC9EE', lilac: '#C9B6F0', marker: '#FBE38A',
      term: '#2D2A3E', termTxt: '#FFF6E0', chatU: '#A8DCC8', chatA: '#FFFFFF',
    };
    VC.styles['cartoon-ui'] = {
      id: 'cartoon-ui', name: '卡通界面', nameEn: 'Cartoon', c, vig: .12,
      roles: {
        R1: { zh: 'ZCOOL KuaiLe:400', en: 'Quicksand:700', size: 84, fill: c.ink, entrance: 'pop', stroke: '#fff', strokeW: .14 },
        R2: { zh: 'ZCOOL KuaiLe:400', en: 'Quicksand:700', size: 48, fill: c.ink, entrance: 'pop' },
        R3: { zh: 'ZCOOL KuaiLe:400', en: 'Quicksand:700', size: 28, fill: c.muted, entrance: 'fadeUp' },
        R4: { zh: 'Noto Sans SC:900', en: 'Noto Sans SC:900', size: 96, fill: '#fff' },
        R5: { zh: 'Noto Sans SC:500', en: 'Noto Sans SC:500', size: 36, fill: c.ink, entrance: 'type', cps: 16, cpsEn: 36 },
        R6: { zh: 'ZCOOL KuaiLe:400', en: 'Quicksand:700', size: 40, fill: c.accent, entrance: 'pop' },
        R7: { zh: 'ZCOOL KuaiLe:400', en: 'Quicksand:700', size: 38, fill: c.ink, entrance: 'static', zhUI: 'ZCOOL KuaiLe:400', enUI: 'Quicksand:700' },
        R8: { zh: 'Xiaolai:400', en: 'Kalam:400', size: 44, fill: c.ink, entrance: 'hand', cps: 9, cpsEn: 20, jit: .8 },
        R9: { zh: 'ZCOOL KuaiLe:400', en: 'Quicksand:700', size: 42, fill: c.ink },
        R10: { zh: 'Noto Sans SC:500', en: 'Noto Sans SC:500', size: 22, fill: c.muted, entrance: 'fadeUp' },
      },
      mono: { zh: 'Noto Sans SC:500', en: 'JetBrains Mono:700' },
      carriers: { backdrop: 'dots', mark: 'marker', stamp: 'sticker', counter: 'outline', bubble: 'outline', window: 'outline' },
      bar: { font: 'Noto Sans SC:900', accent: c.yolk, track: '#fff', text: '#fff', ink: c.ink, shade: .3 },
    };
  }
  // ---------------- 游戏拟物:深色面板 + 金边,游戏标题字(站酷小薇),刻本宋体原文 ----------------
  {
    const c = {
      bg: '#14212B', ink: '#0B1218', line: '#3C5566', panel: '#1B2A36', term: '#101A22', text: '#F1E9D2', muted: '#A9A08A', accent: '#E0B34C',
      gold: '#D4A846', goldL: '#F6E3A1', goldD: '#8A6420', glow: '#F6E3A1', marker: '#E0B34C', chatU: '#2A3D4C', chatA: '#22323F', chatTxt: '#F1E9D2',
      termTxt: '#E6DDC2', termHi: '#E0B34C',
    };
    VC.styles['game-ui'] = {
      id: 'game-ui', name: '游戏拟物', nameEn: 'Game', c, vig: .55,
      roles: {
        R1: { zh: 'ZCOOL XiaoWei:400', en: 'Noto Serif SC:900', size: 84, fill: c.goldL, entrance: 'pop' },
        R2: { zh: 'ZCOOL XiaoWei:400', en: 'Noto Serif SC:900', size: 52, fill: c.goldL, entrance: 'fadeUp' },
        R3: { zh: 'Noto Sans SC:500', en: 'Noto Sans SC:500', size: 28, fill: c.muted, entrance: 'fadeUp' },
        R4: { zh: 'Noto Sans SC:900', en: 'Noto Sans SC:900', size: 96, fill: c.text },
        R5: { zh: 'Noto Serif SC:500', en: 'Noto Serif SC:500', size: 38, fill: c.text, entrance: 'type', cps: 14 },
        R6: { zh: 'Ma Shan Zheng:400', en: 'Noto Serif SC:900', size: 44, fill: '#E2654A', entrance: 'hand', cps: 6 },
        R7: { zh: 'Noto Sans SC:500', en: 'Noto Sans SC:500', size: 34, fill: c.text, entrance: 'static' },
        R8: { zh: 'Ma Shan Zheng:400', en: 'Noto Serif SC:500', size: 46, fill: c.text, entrance: 'hand', cps: 8, jit: .7 },
        R9: { zh: 'ZCOOL XiaoWei:400', en: 'Noto Serif SC:900', size: 36, fill: c.goldL },
        R10: { zh: 'Noto Sans SC:500', en: 'Noto Sans SC:500', size: 22, fill: c.muted, entrance: 'fadeUp' },
      },
      mono: { zh: 'Noto Sans SC:500', en: 'JetBrains Mono:400' },
      carriers: { backdrop: 'game', mark: 'glow', stamp: 'achievement', counter: 'resource', bubble: 'advisor', window: 'gold' },
      bar: { font: 'Noto Sans SC:900', accent: c.gold, track: '#F1E9D2', text: '#fff', ink: '#05080C' },
    };
  }

  // ---------------- 扁平几何:深色纯色底、无描边、双色块,只用得意黑 + 思源黑体 ----------------
  {
    const c = {
      bg: '#1D2B4F', ink: '#14203D', text: '#F4F1E8', muted: '#9FB0D3', accent: '#FFC94A', marker: '#FFC94A', card: '#2A3C68', cardD: '#22335A',
      title: '#F4F1E8', bubble: '#F4F1E8', chatU: '#FFC94A', chatA: '#F4F1E8', chatTxt: '#14203D', term: '#14203D', termTxt: '#F4F1E8', termHi: '#FFC94A',
    };
    VC.styles['flat-geometric'] = {
      id: 'flat-geometric', name: '扁平几何', nameEn: 'Flat geo', c, vig: .1,
      roles: {
        R1: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 96, fill: c.text, entrance: 'fadeUp' },
        R2: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 60, fill: c.text, entrance: 'fadeUp' },
        R3: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 32, fill: c.muted, entrance: 'fadeUp' },
        R4: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 120, fill: c.accent },
        // 本画风没有手写 / 打字 / 印刷原件层(flat-geometric.md):原文、手记都用标题字淡入
        R5: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 42, fill: c.text, entrance: 'fadeUp' },
        R6: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 40, fill: c.accent, entrance: 'fadeUp' },
        R7: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 40, fill: c.ink, entrance: 'static', zhUI: 'Smiley Sans:400', enUI: 'Smiley Sans:400' },
        R8: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 46, fill: c.text, entrance: 'fadeUp' },
        R9: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 40, fill: c.ink },
        R10: { zh: 'Noto Sans SC:500', en: 'Noto Sans SC:500', size: 22, fill: c.muted, entrance: 'fadeUp' },
      },
      mono: { zh: 'Noto Sans SC:500', en: 'JetBrains Mono:400' },
      carriers: { backdrop: 'solid', mark: 'marker', stamp: 'capsule', counter: 'flat', bubble: 'flat', window: 'flat' },
      bar: { font: 'Noto Sans SC:900', accent: c.accent, track: '#fff', text: '#fff', ink: c.ink, shade: .25 },
    };
  }

  // ---------------- 扁平插画:Kurzgesagt 一路,多层景深 + 光晕 + 颗粒,文字放在半透明深色牌上 ----------------
  {
    const c = {
      bg: '#2B2F63', sky3: ['#1E2457', '#7C5A8E', '#F0A47E'], sun: '#FFE2B0', far: '#4A4B86', mid: '#33356C', near: '#1D1F45', fog: '#F6C59A',
      ink: '#15173A', text: '#FFF6EA', muted: '#D6CBE6', accent: '#FFC56B', marker: '#FFC56B', plate: '#15173A', plateA: .62, title: '#FFF6EA',
      bubble: '#FFFFFF', chatU: '#FFC56B', chatA: '#FFFFFF', chatTxt: '#15173A', term: '#15173A', termTxt: '#FFF6EA', termHi: '#FFC56B',
    };
    VC.styles['flat-illustration'] = {
      id: 'flat-illustration', name: '扁平插画', nameEn: 'Flat illus.', c, vig: .35,
      roles: {
        R1: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 96, fill: c.text, entrance: 'fadeUp' },
        R2: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 60, fill: c.text, entrance: 'fadeUp' },
        R3: { zh: 'Noto Sans SC:500', en: 'Noto Sans SC:500', size: 28, fill: c.muted, entrance: 'fadeUp' },
        R4: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 120, fill: c.accent },
        R5: { zh: 'Noto Sans SC:500', en: 'Noto Sans SC:500', size: 36, fill: c.text, entrance: 'fadeUp' },
        R6: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 40, fill: c.accent, entrance: 'fadeUp' },
        R7: { zh: 'ZCOOL KuaiLe:400', en: 'Quicksand:700', size: 38, fill: c.ink, entrance: 'static' },
        R8: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 46, fill: c.text, entrance: 'fadeUp' },
        R9: { zh: 'Smiley Sans:400', en: 'Smiley Sans:400', size: 40, fill: c.ink },
        R10: { zh: 'Noto Sans SC:500', en: 'Noto Sans SC:500', size: 22, fill: c.muted, entrance: 'fadeUp' },
      },
      mono: { zh: 'Noto Sans SC:500', en: 'JetBrains Mono:400' },
      carriers: { backdrop: 'landscape', mark: 'marker', stamp: 'capsule', counter: 'flat', bubble: 'flat', window: 'plate' },
      bar: { font: 'Noto Sans SC:900', accent: c.accent, track: '#fff', text: '#fff', ink: c.ink, shade: .3 },
    };
  }
  // ---------------- 白板手绘:近白底、马克笔(黑 / 蓝 / 红 / 绿)、边讲边画、斜线排线 ----------------
  // 参考:prompt-motion tak3sh8-be5012(白板讲解);RSA Animate。标题用马克笔黑体,讲解字用手写体
  {
    const c = {
      bg: '#F8F8F5', ink: '#1E2A3A', blue: '#2457C5', red: '#D2352B', green: '#1F8A4C', muted: '#5F6B76', accent: '#2457C5', marker: '#FFE36E', mark: '#D2352B',
      chatU: '#F8F8F5', chatA: '#F8F8F5', chatTxt: '#1E2A3A', termTxt: '#1E2A3A', termHi: '#2457C5', bubble: '#F8F8F5', line: '#DDE1E4',
    };
    VC.styles['whiteboard'] = {
      id: 'whiteboard', name: '白板手绘', nameEn: 'Whiteboard', c, vig: .06,
      roles: {
        R1: { zh: 'LXGW Marker Gothic:400', en: 'LXGW Marker Gothic:400', size: 84, fill: c.ink, entrance: 'hand', cps: 7 },
        R2: { zh: 'LXGW Marker Gothic:400', en: 'LXGW Marker Gothic:400', size: 52, fill: c.ink, entrance: 'hand', cps: 9 },
        R3: { zh: 'Jason Handwriting 1:400', en: 'Jason Handwriting 1:400', size: 32, fill: c.muted, entrance: 'hand', cps: 12, jit: .6 },
        R4: { zh: 'LXGW Marker Gothic:400', en: 'LXGW Marker Gothic:400', size: 110, fill: c.blue },
        R5: { zh: 'Jason Handwriting 1:400', en: 'Jason Handwriting 1:400', size: 40, fill: c.ink, entrance: 'hand', cps: 10, jit: .6 },   // 原文在白板上也是抄写的
        R6: { zh: 'Jason Handwriting 1:400', en: 'Jason Handwriting 1:400', size: 42, fill: c.red, entrance: 'hand', cps: 8 },
        R7: { zh: 'Jason Handwriting 1:400', en: 'Jason Handwriting 1:400', size: 38, fill: c.ink, entrance: 'static', zhUI: 'Jason Handwriting 1:400', enUI: 'Jason Handwriting 1:400' },
        R8: { zh: 'Jason Handwriting 1:400', en: 'Jason Handwriting 1:400', size: 46, fill: c.blue, entrance: 'hand', cps: 9, cpsEn: 20, jit: 1 },
        R9: { zh: 'LXGW Marker Gothic:400', en: 'LXGW Marker Gothic:400', size: 42, fill: c.red },
        R10: { zh: 'Jason Handwriting 1:400', en: 'Jason Handwriting 1:400', size: 24, fill: c.muted, entrance: 'fadeUp' },
      },
      mono: { zh: 'Jason Handwriting 1:400', en: 'JetBrains Mono:400' },
      carriers: { backdrop: 'whiteboard', mark: 'pencil', stamp: 'circled', counter: 'flat', bubble: 'sketch', window: 'sketch' },
      bar: { font: 'Noto Sans SC:900', accent: c.blue, track: '#9AA3AA', text: '#fff', ink: c.ink, shade: .22 },
    };
  }
  // ---------------- 黑底数学:3Blue1Brown 一路。黑底、颜色 = 概念、一个对象连续变形 ----------------
  // 色值【一手】manimgl default_config.yml(blue_c、teal_c、green_c、yellow_c、gold_c、red_c、blue_e、grey_a/b/c);
  // 底色:manimgl 默认 #333333,3b1b 成片更黑,这里取近黑 #111214(我们的选择)。字:中文思源黑体,英文与数字 STIX Two Text(OFL,衬线数学字)
  {
    const c = {
      bg: '#111214', ink: '#FFFFFF', text: '#FFFFFF', muted: '#BBBBBB', line: '#888888', accent: '#58C4DD', glow: '#58C4DD',
      mark: '#FFFF00', marker: '#FFFF00', teal: '#5CD0B3', green: '#83C167', gold: '#F0AC5F', red: '#FC6255', pi: '#1C758A',
      card: '#17191C', chatU: '#1C758A', chatA: '#1E2124', chatTxt: '#FFFFFF', term: '#000000', termTxt: '#DDDDDD', termHi: '#83C167', bubble: '#111214',
    };
    VC.styles['dark-math'] = {
      id: 'dark-math', name: '黑底数学', nameEn: 'Dark math', c, vig: .2,
      roles: {
        R1: { zh: 'Noto Sans SC:500', en: 'STIX Two Text:500', size: 84, fill: c.text, entrance: 'write', cps: 6 },
        R2: { zh: 'Noto Sans SC:500', en: 'STIX Two Text:500', size: 54, fill: c.text, entrance: 'write', cps: 8 },
        R3: { zh: 'Noto Sans SC:500', en: 'STIX Two Text:400', size: 30, fill: c.muted, entrance: 'fadeUp' },
        R4: { zh: 'Noto Sans SC:500', en: 'STIX Two Text:500', size: 120, fill: c.accent },
        R5: { zh: 'Noto Sans SC:500', en: 'STIX Two Text:400', size: 40, fill: c.text, entrance: 'write', cps: 10 },
        R6: { zh: 'Noto Sans SC:500', en: 'STIX Two Text:500', size: 40, fill: c.mark, entrance: 'write', cps: 8 },
        R7: { zh: 'Noto Sans SC:500', en: 'STIX Two Text:400', size: 36, fill: c.text, entrance: 'static' },
        R8: { zh: 'Noto Sans SC:500', en: 'STIX Two Text:400', size: 44, fill: c.teal, entrance: 'write', cps: 9 },
        R9: { zh: 'Noto Sans SC:500', en: 'STIX Two Text:500', size: 40, fill: c.mark },
        R10: { zh: 'Noto Sans SC:500', en: 'STIX Two Text:400', size: 22, fill: c.line, entrance: 'fadeUp' },
      },
      mono: { zh: 'Noto Sans SC:500', en: 'JetBrains Mono:400' },
      carriers: { backdrop: 'solid', mark: 'box', stamp: 'box', counter: 'flat', bubble: 'line', window: 'line' },
      bar: { font: 'Noto Sans SC:900', accent: c.accent, track: '#888888', text: '#fff', ink: '#000', shade: .3 },
    };
  }
  // ---------------- 黑板粉笔:深绿黑板、粉笔(白 / 黄 / 粉 / 蓝)、手写逐字 + 粉笔颗粒、边讲边画 ----------------
  // 在白板手绘的部件上换板面、换粉笔质感(chalk: true ⇒ 字、线、框统一套颗粒滤镜;tool: 'chalk' ⇒ 笔尖是一截粉笔)
  // 字:全部清松手写体 1(粉笔定稿,design/fonts.md);数字也用它(Gochi Hand 的数字认不清),英文版的手写英文再换 Gochi Hand
  {
    const c = {
      bg: '#2E4A3E', ink: '#F2F1EA', text: '#F2F1EA', muted: '#B9C7BE', blue: '#A9D3F0', accent: '#A9D3F0', mark: '#F4E39A', marker: '#F4E39A',
      pink: '#F2A7A0', line: '#B9C7BE', chatU: '#2E4A3E', chatA: '#2E4A3E', chatTxt: '#F2F1EA', termTxt: '#F2F1EA', termHi: '#F4E39A', bubble: '#2E4A3E',
    };
    const J = 'Jason Handwriting 1:400';
    VC.styles['chalkboard'] = {
      id: 'chalkboard', name: '黑板粉笔', nameEn: 'Chalkboard', c, vig: .35, chalk: true, tool: 'chalk',
      roles: {
        R1: { zh: J, en: J, size: 88, fill: c.ink, entrance: 'hand', cps: 6 },
        R2: { zh: J, en: J, size: 56, fill: c.mark, entrance: 'hand', cps: 8 },
        R3: { zh: J, en: J, size: 32, fill: c.muted, entrance: 'hand', cps: 12, jit: .6 },
        R4: { zh: J, en: J, size: 120, fill: c.ink },
        R5: { zh: J, en: J, size: 40, fill: c.ink, entrance: 'hand', cps: 10, jit: .6 },
        R6: { zh: J, en: J, size: 42, fill: c.pink, entrance: 'hand', cps: 8 },
        R7: { zh: J, en: J, size: 38, fill: c.ink, entrance: 'static', zhUI: J, enUI: J },
        R8: { zh: J, en: J, size: 46, fill: c.blue, entrance: 'hand', cps: 9, cpsEn: 20, jit: 1 },
        R9: { zh: J, en: J, size: 42, fill: c.pink },
        R10: { zh: J, en: J, size: 24, fill: c.muted, entrance: 'fadeUp' },
      },
      mono: { zh: J, en: 'JetBrains Mono:400' },
      carriers: { backdrop: 'chalkboard', mark: 'ring', stamp: 'circled', counter: 'flat', bubble: 'sketch', window: 'sketch' },
      bar: { font: 'Noto Sans SC:900', accent: c.mark, track: '#fff', text: '#fff', ink: '#14231C', shade: .3 },
    };
  }
  // ---------------- 动态文字:字就是演员。近黑底 + 一个响亮的强调色,关键词踩重音砸进来,落地后钉住不动 ----------------
  // 参数【我们】:小词滑入 4 帧;主词甩入 6 帧 + 2 帧过冲;砸进来 0.35s 后钉住。签名转场 fill-zoom、bands
  {
    const c = {
      bg: '#0E0E10', ink: '#0E0E10', text: '#F5F2EA', muted: '#9C9890', accent: '#FF4D2E', marker: '#FFD23F', blockFill: '#FF4D2E', slabTxt: '#0E0E10',   // 色块划重点用红橙:上面压白字,黄底上白字看不清
      card: '#1B1B1E', cardD: '#141416', title: '#F5F2EA', bubble: '#F5F2EA', chatU: '#FFD23F', chatA: '#F5F2EA', chatTxt: '#0E0E10',
      term: '#000000', termTxt: '#F5F2EA', termHi: '#FFD23F', line: '#3A3A3E',
    };
    const H = 'Noto Sans SC:900', A = 'Anton:400';
    VC.styles['kinetic'] = {
      id: 'kinetic', name: '动态文字', nameEn: 'Kinetic type', c, vig: .25,
      roles: {
        R1: { zh: H, en: A, size: 110, fill: c.text, entrance: 'slam' },
        R2: { zh: H, en: A, size: 64, fill: c.text, entrance: 'slam' },
        R3: { zh: 'Noto Sans SC:500', en: A, size: 30, fill: c.muted, entrance: 'slide' },
        R4: { zh: H, en: A, size: 150, fill: c.marker },
        R5: { zh: 'Noto Sans SC:500', en: A, size: 40, fill: c.text, entrance: 'slide' },   // 原文:引号 + 滑入,不做打字机
        R6: { zh: H, en: A, size: 44, fill: c.accent, entrance: 'slam' },
        R7: { zh: H, en: A, size: 38, fill: c.ink, entrance: 'static' },
        R8: { zh: 'Smiley Sans:400', en: A, size: 48, fill: c.text, entrance: 'slide' },   // 本画风没有手写层:手记用斜体感的得意黑滑入
        R9: { zh: H, en: A, size: 44, fill: c.ink },
        R10: { zh: 'Noto Sans SC:500', en: 'Noto Sans SC:500', size: 22, fill: c.muted, entrance: 'slide' },
      },
      mono: { zh: 'Noto Sans SC:500', en: 'JetBrains Mono:400' },
      carriers: { backdrop: 'solid', mark: 'block', stamp: 'slab', counter: 'punch', bubble: 'flat', window: 'flat' },
      bar: { font: 'Noto Sans SC:900', accent: c.marker, track: '#fff', text: '#fff', ink: '#000', shade: .3 },
    };
  }
  // ---------------- 孔版印刷 Risograph:两种油墨(蓝 / 荧光粉)、网点、颗粒、套色错位,米白纸 ----------------
  // riso: true ⇒ 对外组件统一套轻颗粒(vc-riso-l);页面里的大色块用 kit.ink(油墨, 内容) 分版叠印、kit.tone(油墨, 深浅) 出网点。
  // 规矩(第 11 期样片 owner 2026-10-08 反馈后定):中文一律直立黑体(斜体 + 颗粒 + 重影会「看着花」);字上的颗粒只用轻档;
  //   套色错位固定不逐帧抖;双色重影只给开头那一个大标题。颜色即含义:粉只给「重点 / 要警惕的量」,其余都是蓝。
  {
    const c = {
      bg: '#F3EEE3', paper: '#F3EEE3', ink: '#0078BF', text: '#0078BF', muted: '#4F93C7', accent: '#FF48B0', pink: '#FF48B0', mark: '#FF48B0', marker: '#FF9ACF',
      line: '#0078BF', card: '#F3EEE3', cardD: '#FF48B0', title: '#F3EEE3', bubble: '#F3EEE3', chatU: '#DCEAF4', chatA: '#F3EEE3', chatTxt: '#0078BF',
      term: '#0078BF', termTxt: '#F3EEE3', termHi: '#FF9ACF', surface: '#F3EEE3', edge: '#0078BF', lw: 4,
    };
    const H = 'Noto Sans SC:900', B = 'Noto Sans SC:500', A = 'Anton:400', M = 'Space Mono:700';
    VC.styles['risograph'] = {
      id: 'risograph', name: '孔版印刷', nameEn: 'Risograph', c, vig: 0, riso: true,
      inks: { b: c.ink, p: c.pink }, misreg: { p: [3, -2] },   // 每种油墨一个色;粉版固定错位(px)
      roles: {
        R1: { zh: H, en: A, size: 88, fill: c.ink, entrance: 'fadeUp' },
        R2: { zh: H, en: A, size: 52, fill: c.ink, entrance: 'fadeUp' },
        R3: { zh: B, en: 'Space Mono:400', size: 28, fill: c.ink, entrance: 'fadeUp' },
        R4: { zh: H, en: A, size: 130, fill: c.pink },
        R5: { zh: B, en: 'Space Mono:400', size: 38, fill: c.ink, entrance: 'type', cps: 16, cpsEn: 36 },
        R6: { zh: H, en: A, size: 44, fill: c.pink, entrance: 'pop' },
        R7: { zh: B, en: B, size: 36, fill: c.ink, entrance: 'static' },
        R8: { zh: H, en: 'Cormorant Italic:700', size: 44, fill: c.ink, entrance: 'fadeUp' },   // 本画风没有手写层:手记改成印刷字;拉丁学名走 en(斜体)
        R9: { zh: H, en: A, size: 50, fill: c.pink },
        R10: { zh: B, en: 'Space Mono:400', size: 22, fill: c.ink, entrance: 'fadeUp' },
      },
      mono: { zh: B, en: 'Space Mono:400' },
      carriers: { backdrop: 'riso', mark: 'marker', stamp: 'ink', counter: 'print', bubble: 'riso', window: 'riso' },
      bar: { font: H, accent: c.pink, track: c.ink, text: c.ink, ink: c.paper, shade: 0 },
    };
  }
})();
