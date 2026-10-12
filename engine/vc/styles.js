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
  // ---------------- 热敏小票 Thermal receipt:收银台面 + 米白热敏纸条,点阵字逐行打出,黑 + 红两色(双色热敏纸) ----------------
  // 第 13 期定(owner 2026-10-10 从三张新画风静帧里选 A)。比喻:「账单」——打印机打出来的是机器记的账,人在上面用圆珠笔写、用红章盖。
  // 规矩:点阵字字号只能是 12 的整数倍(pixel:12,kit 自动吸附;24/36/48/72/96/144);组件上的字套墨迹斑驳(thermal:true);
  //   颜色即含义:红只给「身体的账 / 要警惕的量 / 印章」,其余都是黑。
  //   画风默认是浅色台面(底子与小票同一明暗,通用组件放哪都看得清);深色收银台是场景的选择:页面自己铺深色台面,台面上的字传 c.paper。
  {
    const c = {
      bg: '#D9D3C6', bg2: '#D5CFC1', paper: '#F6F3EC', ink: '#1D1C1A', text: '#1D1C1A', muted: '#6D6A64', accent: '#C8312B', red: '#C8312B',
      desk: '#2A2B2E', desk2: '#2D2E31',   // 场景用的深色收银台(第 13 期)
      pen: '#24324C', note: '#F6F3EC', tape: '#E9DDB4', line: '#1D1C1A', card: '#F6F3EC', cardD: '#1D1C1A', title: '#F6F3EC',
      bezel: '#18191B', screen: '#0F1F1B', scrTxt: '#8FB8A8', scrHi: '#6FD6A8', scrGrid: '#24443B', chatU: '#E9E4D8', chatA: '#F6F3EC', chatTxt: '#1D1C1A',
      term: '#18191B', termTxt: '#F6F3EC', termHi: '#C8312B', surface: '#F6F3EC', edge: '#1D1C1A', lw: 3,
    };
    const P = 'Fusion Pixel 12:400';
    VC.styles['thermal'] = {
      id: 'thermal', name: '热敏小票', nameEn: 'Thermal receipt', c, vig: .2, thermal: true, pixel: 12,
      roles: {
        R1: { zh: P, en: P, size: 72, fill: c.ink, entrance: 'print', printDur: .35 },
        R2: { zh: P, en: P, size: 36, fill: c.ink, entrance: 'print' },
        R3: { zh: P, en: P, size: 24, fill: c.ink, entrance: 'print', printDur: .2 },
        R4: { zh: P, en: P, size: 96, fill: c.ink },
        R5: { zh: 'Noto Serif SC:500', en: 'Noto Serif SC:500', size: 36, fill: c.ink, entrance: 'fadeUp' },   // 期刊 / 新闻稿原文:复印件上的印刷体,不是小票打的
        R6: { zh: 'Zhi Mang Xing:400', en: 'Caveat Brush:400', size: 44, fill: c.red, entrance: 'hand', cps: 6, blend: 'multiply' },   // 红笔在小票上圈改
        R7: { zh: 'Xiaolai:400', en: 'Kalam:400', size: 36, fill: c.pen, entrance: 'static', zhUI: 'Noto Sans SC:500', enUI: 'Noto Sans SC:500' },
        R8: { zh: 'Xiaolai:400', en: 'Kalam:400', size: 44, fill: c.pen, entrance: 'hand', cps: 8, cpsEn: 18, jit: 1 },   // 圆珠笔手记
        R9: { zh: 'Noto Sans SC:900', en: 'Noto Sans SC:900', size: 44, fill: c.red },   // 红色印章
        R10: { zh: P, en: P, size: 24, fill: c.muted, entrance: 'print', printDur: .2 },
      },
      mono: { zh: P, en: P },
      carriers: { backdrop: 'counter', mark: 'pencil', stamp: 'ink', counter: 'print', bubble: 'note', window: 'bezel', panel: 'receipt' },
      bar: { font: 'Noto Sans SC:900', accent: c.red, track: c.ink, text: c.ink, ink: c.paper, shade: 0 },
    };
  }
  // ---------------- 星夜光点 Starlight:近黑星空底、发光光点、冷暖两色细线、细衬线字 + 中英双语 ----------------
  // 参考:抖音「Vibe 知识大赏|信息论」(2026-09,owner 2026-10-10 让拆解;画面逐帧看过,只学做法不搬素材)。
  // 颜色即含义:暖金只给「这期的核心量 / 答案 / 惊奇」,冷蓝给结构(数轴、示意线稿),红只给噪声 / 要警惕的量,其余是暖白。
  // 字:中文思源黑体 300(大字)/ 400(小字,300 在 30px 以下太虚),整组带霓虹辉光(neon:true ⇒ 组件统一套 vc-neon);
  //   第一版用思源宋体细体,owner 2026-10-10 看第二版样片:「上边配的字体有点不搭」—— 宋体的书卷气和霓虹线稿是两套东西;
  //   四种字体并排对比后定了「思源黑体细体 + 霓虹辉光」(笔画粗细一致,和发光线稿最接近)。
  //   英文与数字也走思源黑体(和标签同一套;衬线数字混在黑体里像两套字)。原文 R5 仍用思源宋体 300 + STIX(印刷原件)。
  //   Cormorant 斜体只给页面上的英文副字幕整行用:它的数字是悬挂式的,混进中文句子里像下标(样张实测)。
  // 出场方式 glow:从虚到实、从暗到亮(光聚起来),不弹不甩。
  {
    const c = {
      bg: '#05070D', bg2: '#0E1830', ink: '#05070D', text: '#EEEAE2', muted: '#8C95A8', line: '#56769E', cool: '#86B6E6', star: '#D6E4FF',
      accent: '#F2C27A', glow: '#F2C27A', warm: '#FFB45E', mark: '#F2C27A', marker: '#F2C27A', red: '#E8646E',
      card: '#0A1020', cardD: '#121C33', edge: '#2B3C5A', surface: '#0A1020', title: '#EEEAE2', bubble: '#05070D',
      chatU: '#13213A', chatA: '#0A1020', chatTxt: '#EEEAE2', term: '#03050A', termTxt: '#D8DCE6', termHi: '#F2C27A', lw: 2,
    };
    const L = 'Noto Sans SC:300', M = 'Noto Sans SC:400', Q = 'Noto Serif SC:300', X = 'STIX Two Text:400';
    VC.styles['starlight'] = {
      id: 'starlight', name: '星夜光点', nameEn: 'Starlight', c, vig: .55, neon: true,
      roles: {
        R1: { zh: L, en: L, size: 96, fill: c.text, entrance: 'glow', glowDur: 1.1 },
        R2: { zh: L, en: L, size: 56, fill: c.text, entrance: 'glow' },
        R3: { zh: M, en: M, size: 30, fill: c.muted, entrance: 'fadeUp' },
        R4: { zh: L, en: L, size: 150, fill: c.text },
        R5: { zh: Q, en: X, size: 42, fill: c.text, entrance: 'glow' },   // 原文 / 引语:印刷原件用宋体
        R6: { zh: M, en: M, size: 40, fill: c.accent, entrance: 'glow' },
        R7: { zh: M, en: M, size: 34, fill: c.text, entrance: 'static' },
        R8: { zh: M, en: M, size: 38, fill: c.cool, entrance: 'glow' },   // 本画风没有手写层:手记改成冷蓝细字亮起
        R9: { zh: M, en: M, size: 34, fill: c.accent },
        R10: { zh: M, en: M, size: 22, fill: c.muted, entrance: 'fadeUp' },
      },
      mono: { zh: 'Noto Sans SC:500', en: 'JetBrains Mono:400' },
      carriers: { backdrop: 'starfield', mark: 'glow', stamp: 'chip', counter: 'glow', bubble: 'line', window: 'line' },
      bar: { font: 'Noto Sans SC:900', accent: c.accent, track: '#8C95A8', text: '#fff', ink: '#000', shade: .3 },
    };
  }
  // ---------------- 体育转播 Broadcast:夜场看台 + 电视包装条(比分板、裁判条、场边 LED 广告板),斜黑体队名 + Anton 比分 ----------------
  // 第 14 期定(owner 2026-10-11 从六张新画风静帧里选 F「对抗赛」)。比喻:「比赛」—— 两组 = 两支队,结果 = 比分,统计判定 = 裁判条,资助方 = 场边赞助广告。
  // 颜色即含义:两队各一种颜色(橙 / 蓝,页面传 c.home / c.away),黄只给「转播包装」(时间标签、裁判、赞助板),其余白。
  // 字:中文思源黑体 900(电视包装字);比分与大数字 Anton(窄体粗);说明小字思源黑体 500。
  // 出场方式 wipe:被遮罩从左擦出来 + 往右滑 24px 落定(角标、下三分之一条);不弹不甩。
  // 比喻的分寸(本画风的硬规矩):统计上「不显著」只能写「判不出谁赢 / 不显著」,不写「打平 / 平局」——不显著 ≠ 证明一样。
  {
    const c = {
      bg: '#070B14', bg2: '#0D1B33', ink: '#070B14', text: '#FFFFFF', muted: '#AAB6CC', accent: '#FFD23F', glow: '#FFD23F', mark: '#FFD23F', marker: '#FFD23F',
      home: '#FF7A2F', away: '#3D8BFF', grass: '#2C7A3A', grass2: '#1F5C2B', navy: '#0D1B33', navy2: '#14284A', led: '#05070B', red: '#E5484D',
      surface: '#0D1B33', edge: '#2A3B5E', card: '#0D1B33', cardD: '#14284A', title: '#FFFFFF', win: '#0D1B33', dot: '#2A3B5E', line: '#2A3B5E',
      slabTxt: '#0D1B33', chatU: '#14284A', chatA: '#0D1B33', chatTxt: '#FFFFFF', term: '#05070B', termTxt: '#E8EEF9', termHi: '#FFD23F', lw: 3,
      crowd: ['#C94B4B', '#E8E2D0', '#4B6FC9', '#D9A441'],
    };
    const H = 'Noto Sans SC:900', B = 'Noto Sans SC:500', A = 'Anton:400';
    VC.styles['broadcast'] = {
      id: 'broadcast', name: '体育转播', nameEn: 'Sports broadcast', c, vig: .45,
      roles: {
        R1: { zh: H, en: H, size: 88, fill: c.text, entrance: 'wipe' },
        R2: { zh: H, en: H, size: 52, fill: c.text, entrance: 'wipe' },
        R3: { zh: B, en: B, size: 30, fill: c.muted, entrance: 'wipe', wipeDur: .3 },
        R4: { zh: H, en: A, size: 160, fill: c.text },
        R5: { zh: 'Noto Serif SC:500', en: 'Noto Serif SC:500', size: 40, fill: c.text, entrance: 'fadeUp' },   // 论文原文:印刷体,不是转播包装
        R6: { zh: H, en: H, size: 44, fill: c.accent, entrance: 'wipe' },
        R7: { zh: B, en: B, size: 36, fill: c.text, entrance: 'static' },
        R8: { zh: B, en: B, size: 40, fill: c.accent, entrance: 'wipe' },   // 本画风没有手写层:解说的补充字用黄色小字擦入
        R9: { zh: H, en: H, size: 44, fill: c.navy },
        R10: { zh: B, en: B, size: 24, fill: c.muted, entrance: 'wipe', wipeDur: .3 },
      },
      mono: { zh: B, en: 'JetBrains Mono:400' },
      carriers: { backdrop: 'stadium', mark: 'box', stamp: 'slab', counter: 'punch', bubble: 'card', window: 'win', panel: 'flat' },
      bar: { font: H, accent: c.accent, track: '#8C9BB8', text: '#fff', ink: '#000', shade: .3 },
    };
  }
  // ---------------- 8-bit 像素 Pixel:低分辨率像素画(一个像素 = 4px)、有限色板、分带抖动的天空;字全是点阵字,对话进 RPG 对话框 ----------------
  // 2026-10-12 定(owner 从六张跨题材静帧里选了它、报纸号外、地铁线路图三张)。比喻:「一局游戏、一关」—— 年代 = 关卡,数量 = 生命值 / 分数,旁白 = 对话框。
  // 规矩:点阵字字号只能是 12 的整数倍(pixel:12,kit 自动吸附);所有形状对齐 4px 网格,不用圆角、不用渐变、不用模糊;
  //   动效是「步进」的:出现 = 闪(blink)或分两三步放大,没有缓动曲线。颜色即含义:黄只给「要看的那个」(分数、名牌、印章),红给危险 / 失去。
  {
    const c = {
      bg: '#1d1838', sky: ['#1d1838', '#2a2050', '#3a2a5c', '#4f2f63'], star: '#fff4e0',
      ink: '#0d0b14', box: '#0d0b14', text: '#fff4e0', muted: '#b9b0d6', accent: '#ffd27a', marker: '#ffd27a', mark: '#ffd27a', glow: '#ffd27a', red: '#e0505a', cool: '#8fd3ff',
      green: '#5aa14a', grassHi: '#a8d36b', dirt: '#7b4a2a', dirt2: '#4a2c22', bodyHi: '#ffe7a8',
      edge: '#fff4e0', surface: '#0d0b14', card: '#0d0b14', cardD: '#2a2050', title: '#ffd27a', panel: '#0d0b14',
      chatU: '#2a2050', chatA: '#0d0b14', chatTxt: '#fff4e0', term: '#0d0b14', termTxt: '#fff4e0', termHi: '#ffd27a', lw: 4,
    };
    const P = 'Fusion Pixel 12:400';
    VC.styles['pixel'] = {
      id: 'pixel', name: '8-bit 像素', nameEn: '8-bit pixel', c, vig: 0, bit8: true, pixel: 12,
      roles: {
        R1: { zh: P, en: P, size: 72, fill: c.text, entrance: 'type', cps: 14 },
        R2: { zh: P, en: P, size: 48, fill: c.text, entrance: 'type', cps: 20 },
        R3: { zh: P, en: P, size: 24, fill: c.muted, entrance: 'type', cps: 40 },
        R4: { zh: P, en: P, size: 96, fill: c.accent },
        R5: { zh: P, en: P, size: 36, fill: c.text, entrance: 'type', cps: 16, cpsEn: 32 },   // 原文:同样点阵逐字打出(RPG 读信 / 读告示)
        R6: { zh: P, en: P, size: 48, fill: c.red, entrance: 'blink' },
        R7: { zh: P, en: P, size: 36, fill: c.text, entrance: 'static' },
        R8: { zh: P, en: P, size: 36, fill: c.cool, entrance: 'type', cps: 16, cpsEn: 32 },   // 本画风没有手写层:手记改成「系统提示」青色点阵字
        R9: { zh: P, en: P, size: 36, fill: c.ink },
        R10: { zh: P, en: P, size: 24, fill: c.muted, entrance: 'type', cps: 40 },
      },
      mono: { zh: P, en: P },
      carriers: { backdrop: 'pixel', mark: 'pixbox', stamp: 'pixbadge', counter: 'punch', bubble: 'rpg', window: 'rpg', panel: 'rpg' },
      bar: { font: 'Noto Sans SC:900', accent: c.accent, track: c.muted, text: '#fff', ink: '#000', shade: .3 },
    };
  }
  // ---------------- 报纸号外 Newsprint:新闻纸、黑油墨 + 一个红、宋体大标题、粗细双线分栏、45° 网点 ----------------
  // 2026-10-12 定(同上一轮)。比喻:「这件事在当时就是头条」—— 历史事件、翻案、更正;更正启事、电讯稿是这个画风天生的部件。
  // 颜色即含义:红只给报头 / 校对红笔 / 印章,其余黑;照片一律网点化(kit 里的 vc-ht-news 图案),图注写清是「示意」还是真照片。
  // 字:标题思源宋体 900,正文宋体 500;电讯原文(R5)逐字打出,英文走 Special Elite(电传打字机);手写只有两种:校对红笔(R6)、读者圆珠笔(R8)。
  {
    const c = {
      bg: '#ebe3cf', paper: '#ebe3cf', card: '#f1ead9', ink: '#1d1b17', text: '#1d1b17', muted: '#5a5348', accent: '#c3241b', red: '#c3241b', mark: '#c3241b', marker: '#c3241b',
      pen: '#24324C', note: '#f1ead9', tape: '#E9DDB4', surface: '#f1ead9', edge: '#1d1b17', title: '#1d1b17',
      bezel: '#2B3236', screen: '#0F1F1B', scrTxt: '#8FB8A8', scrHi: '#6FD6A8', scrGrid: '#24443B',
      chatU: '#e3dac4', chatA: '#f1ead9', chatTxt: '#1d1b17', term: '#1d1b17', termTxt: '#ebe3cf', termHi: '#e8b04a', lw: 3,
    };
    const H = 'Noto Serif SC:900', B = 'Noto Serif SC:500';
    VC.styles['newsprint'] = {
      id: 'newsprint', name: '报纸号外', nameEn: 'Newsprint', c, vig: .22, news: true,
      roles: {
        // 字号 2026-10-12 按决策者看 N15 整片的反馈整体调大(「很多字太小,感官不好」):说明字 40 起、用黑墨不用灰,图注 30 起
        R1: { zh: H, en: H, size: 110, fill: c.ink, entrance: 'fadeUp' },
        R2: { zh: H, en: H, size: 60, fill: c.ink, entrance: 'fadeUp' },
        R3: { zh: B, en: B, size: 42, fill: c.ink, entrance: 'fadeUp' },
        R4: { zh: H, en: H, size: 150, fill: c.ink },
        R5: { zh: B, en: 'Special Elite:400', size: 46, fill: c.ink, entrance: 'type', cps: 14, cpsEn: 30, ink: .2, jit: .04 },   // 电讯稿 / 原文:电传打字机逐字打出
        R6: { zh: 'Zhi Mang Xing:400', en: 'Caveat Brush:400', size: 64, fill: c.red, entrance: 'hand', cps: 6, blend: 'multiply' },   // 校对红笔
        R7: { zh: B, en: B, size: 46, fill: c.ink, entrance: 'static' },
        R8: { zh: 'Xiaolai:400', en: 'Kalam:400', size: 56, fill: c.pen, entrance: 'hand', cps: 8, cpsEn: 18, jit: 1 },   // 读者在报上写的圆珠笔字
        R9: { zh: H, en: H, size: 48, fill: c.red },
        R10: { zh: B, en: B, size: 30, fill: c.muted, entrance: 'fadeUp' },
      },
      mono: { zh: B, en: 'Special Elite:400' },
      carriers: { backdrop: 'newsprint', mark: 'pencil', stamp: 'ink', counter: 'print', bubble: 'quote', window: 'column', panel: 'column' },
      bar: { font: 'Noto Sans SC:900', accent: c.red, track: c.ink, text: c.ink, ink: c.paper, shade: 0 },
    };
  }
  // ---------------- 地铁线路图 Transit map:米白底、粗彩线只走横竖和 45°、白圈站、黑粗圈换乘、站牌式黑底白字 ----------------
  // 2026-10-12 定(同上一轮)。比喻:「一段路要换乘」—— 流程的每一步 = 一站,换了机制 = 换乘,要走的线上色、别的线压灰。
  // 颜色即含义:每条线一种颜色(橙 / 蓝 / 绿,页面按线路传),红只给「你在这里」和要警惕的量;字全是黑体(站牌字),英文 Space Grotesk;
  //   没有手写层。出场方式 wipe(像站牌条滑出);批注 = 字底下画一段线路(route)。
  {
    const c = {
      bg: '#f5f3ed', ink: '#1b1b1b', text: '#1b1b1b', muted: '#7a776f', accent: '#d6312b', red: '#d6312b',
      orange: '#ef7d1a', blue: '#1f6db5', green: '#2a9d5c', grey: '#c9c6bd', marker: '#ef7d1a', mark: '#1f6db5',
      bubble: '#1b1b1b', card: '#ffffff', cardD: '#1b1b1b', title: '#ffffff', surface: '#ffffff', edge: '#1b1b1b',
      chatU: '#ebe8df', chatA: '#ffffff', chatTxt: '#1b1b1b', term: '#1b1b1b', termTxt: '#f5f3ed', termHi: '#ef7d1a', lw: 4,
    };
    const H = 'Noto Sans SC:900', B = 'Noto Sans SC:500', GH = H, GB = B;   // 角色里的英文 / 数字也走思源黑体:Space Grotesk 的「1」带大钩,大数字很怪(样张实测);双语站名的英文小字由页面用 Space Grotesk 画
    VC.styles['transit'] = {
      id: 'transit', name: '地铁线路图', nameEn: 'Transit map', c, vig: 0,
      roles: {
        R1: { zh: H, en: GH, size: 88, fill: c.ink, entrance: 'wipe' },
        R2: { zh: H, en: GH, size: 52, fill: c.ink, entrance: 'wipe' },
        R3: { zh: B, en: GB, size: 28, fill: c.muted, entrance: 'wipe', wipeDur: .3 },
        R4: { zh: H, en: GH, size: 140, fill: c.ink },
        R5: { zh: 'Noto Serif SC:500', en: 'Noto Serif SC:500', size: 38, fill: c.ink, entrance: 'fadeUp' },   // 原文:印刷原件,不是站牌字
        R6: { zh: H, en: GH, size: 44, fill: c.red, entrance: 'pop' },
        R7: { zh: B, en: GB, size: 34, fill: '#ffffff', entrance: 'static' },   // 对白在黑底站牌气泡里
        R8: { zh: B, en: GB, size: 38, fill: c.blue, entrance: 'wipe' },   // 本画风没有手写层:手记改成蓝色「站内提示」小字
        R9: { zh: H, en: GH, size: 36, fill: '#ffffff' },   // 印章 = 线路色胶囊牌,白字
        R10: { zh: B, en: GB, size: 22, fill: c.muted, entrance: 'wipe', wipeDur: .3 },
      },
      mono: { zh: B, en: 'JetBrains Mono:400' },
      carriers: { backdrop: 'transit', mark: 'route', stamp: 'capsule', counter: 'punch', bubble: 'flat', window: 'legend', panel: 'legend' },
      bar: { font: H, accent: c.orange, track: c.ink, text: c.ink, ink: '#fff', shade: 0 },
    };
  }
})();
