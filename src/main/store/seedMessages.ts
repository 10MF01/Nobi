import type { MessageCategory } from '../../../shared/types'

/** 首次启动时导入的种子文案，覆盖 reactionEngine 会用到的四类 + 预留给 M5 的 neutral */
export const SEED_MESSAGES: { category: MessageCategory; text: string }[] = [
  { category: 'encourage', text: '不错哦，今天已经迈出一步了，保持这个节奏～' },
  { category: 'encourage', text: '稳步向前，のび酱看到你的努力啦！' },
  { category: 'encourage', text: '这样的状态很好，慢慢来，积累起来就是大进步。' },
  { category: 'encourage', text: '今天完成了一部分，已经很棒了，继续加油！' },
  { category: 'encourage', text: '每一次打卡都是在为将来的自己铺路，继续保持～' },
  { category: 'encourage', text: '看到你在坚持，のび酱也想跟着一起加油！' },
  { category: 'encourage', text: '进度不错，再接再厉，胜利就在前面。' },

  { category: 'comfort', text: '今天有点累吧？没关系，休息好了明天再出发。' },
  { category: 'comfort', text: '不是每天都要完美，慢下来也是一种前进。' },
  { category: 'comfort', text: 'のび酱在这里陪着你，什么时候准备好了都可以。' },
  { category: 'comfort', text: '偶尔状态不好很正常，别对自己太苛刻哦。' },
  { category: 'comfort', text: '先照顾好自己，计划永远都在，随时可以回来。' },
  { category: 'comfort', text: '深呼吸一下，今天辛苦了，明天再一起努力吧。' },
  { category: 'comfort', text: '没关系的，重要的是不放弃，不是一天不落。' },

  { category: 'stern', text: '好不容易攒起来的连续记录，就这么断了，可惜吗？' },
  { category: 'stern', text: '说好要坚持的呢？今天的状态离目标有点远哦。' },
  { category: 'stern', text: '永住权和加薪不会自己实现，今天这样真的可以吗？' },
  { category: 'stern', text: '之前的坚持很不容易，别让它就这样白费。' },
  { category: 'stern', text: '如果当初的决心还在，现在是不是该振作一下？' },
  { category: 'stern', text: 'のび酱有点担心你是不是又开始松懈了。' },
  { category: 'stern', text: '别忘了当初为什么要开始，今天要不要补回来？' },

  { category: 'celebrate', text: '太厉害了！连续这么多天都做到了，为你骄傲！' },
  { category: 'celebrate', text: '这个状态简直完美，のび酱都想为你鼓掌！' },
  { category: 'celebrate', text: '看看这份坚持，未来的你一定会感谢现在的自己。' },
  { category: 'celebrate', text: '全部完成，还是连续达成，今天可以好好奖励自己！' },
  { category: 'celebrate', text: '这就是稳定输出的实力，继续保持这个节奏！' },
  { category: 'celebrate', text: '了不起，这样的自律迟早会带来看得见的改变。' },
  { category: 'celebrate', text: '如此漂亮的连续记录，のび酱已经飘起来了！' },

  { category: 'neutral', text: '今天的计划都安排好了吗？' },
  { category: 'neutral', text: '记得留一点时间给今天的任务哦。' },
  { category: 'neutral', text: 'のび酱在桌面上等你回来打卡～' },
  { category: 'neutral', text: '新的一天，新的进度，出发吧！' },
  { category: 'neutral', text: '别忘了看一眼今天还剩下的待办。' },
  { category: 'neutral', text: '工作再忙，也抽空看看今天的计划吧。' },
  { category: 'neutral', text: '有空的时候，来跟のび酱打个卡吧。' }
]
