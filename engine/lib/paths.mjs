// 引擎的三个根目录(单一驻地):
//   ENGINE  = 本文件夹的上一级(engine/)        —— 引擎代码、共享组件、检查工具
//   SKILL   = engine/ 的上一级                  —— skill 文档、画风样张、缩略图
//   PROJECT = 你的项目(默认当前目录;可用环境变量 EXPLAINER_PROJECT 指定)—— 稿子、页面、产物、缓存、.env
import path from 'node:path';
export const ENGINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const SKILL = path.dirname(ENGINE);
export const PROJECT = path.resolve(process.env.EXPLAINER_PROJECT || process.cwd());
export const CACHE = path.join(PROJECT, 'cache');
