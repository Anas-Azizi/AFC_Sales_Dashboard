/**
 * Data Parser - Converts raw Excel/table paste into structured dashboard data
 * Supports tab-separated values with categories, channels, and reps
 */

export interface ParsedRep {
  name: string;
  full_name: string;
  target: number;
  achieved: number;
  achievement_pct: number;
  diff_pct: number;
  category: string;
  channel: string;
}

export interface ParsedChannel {
  name: string;
  target: number;
  achieved: number;
  achievement_pct: number;
  diff_pct: number;
  expected: number;
  category: string;
  reps: ParsedRep[];
}

export interface ParsedCategory {
  name: string;
  target: number;
  achieved: number;
  achievement_pct: number;
  diff_pct: number;
  expected: number;
  channels: ParsedChannel[];
}

export interface ParsedMetrics {
  total_target: number;
  total_achieved: number;
  overall_achievement: number;
  expected_rate: number;
  overall_diff: number;
  working_days: number;
  current_day: number;
  days_progress: number;
}

export interface ParsedData {
  metrics: ParsedMetrics;
  categories: ParsedCategory[];
  repAggregates: RepAggregate[];
  insights: Insight[];
}

export interface RepAggregate {
  name: string;
  full_name: string;
  target: number;
  achieved: number;
  achievement_pct: number;
  diff_pct: number;
  categories: string[];
  channels: string[];
}

export interface Insight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  icon: string;
}

function parseNumber(s: string): number {
  if (!s || s.trim() === '' || s.trim() === '%') return 0;
  const cleaned = s.trim().replace(/,/g, '').replace(/ /g, '').replace(/%/g, '');
  if (!cleaned) return 0;
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseWorkingDays(text: string): { workingDays: number; currentDay: number } {
  const lines = text.split('\n');
  let workingDays = 26;
  let currentDay = 6;

  for (const line of lines) {
    const trimmed = line.trim();
    const totalMatch = trimmed.match(/(?:اجمالي|إجمالي)\s+ايام\s+العمل\s*(?:\t|\s)*[:=]?\s*(\d+)/i);
    if (totalMatch) workingDays = parseInt(totalMatch[1]);

    const totalMatch2 = trimmed.match(/(\d+)\s*(?:\t|\s)*(?:اجمالي|إجمالي)\s+ايام\s+العمل/i);
    if (totalMatch2) workingDays = parseInt(totalMatch2[1]);

    const currentMatch = trimmed.match(/(?:عدد\s+الايام|الايام\s+الحالي)\s*(?:\t|\s)*[:=]?\s*(\d+)/i);
    if (currentMatch) currentDay = parseInt(currentMatch[1]);

    const currentMatch2 = trimmed.match(/(\d+)\s*(?:\t|\s)*(?:عدد\s+الايام|الايام\s+الحالي)/i);
    if (currentMatch2) currentDay = parseInt(currentMatch2[1]);
  }

  return { workingDays, currentDay };
}

function cleanRepName(name: string): string {
  return name
    .replace(/ - مندوب حلب/g, '')
    .replace(/ - مندوب/g, '')
    .replace(/- مندوب حلب/g, '')
    .replace(/-مندوب حلب/g, '')
    .replace(/مندوب حلب/g, '')
    .replace(/مندوب/g, '')
    .trim();
}

function isCategoryName(name: string, knownNames: string[]): boolean {
  return knownNames.includes(name);
}

function looksLikeChannel(name: string): boolean {
  return name.startsWith('قناة') || name.toLowerCase().includes('channel');
}

function looksLikeRep(name: string): boolean {
  return name.includes('مندوب');
}

export function parseRawData(text: string): ParsedData {
  const lines = text.split('\n').filter(l => l.trim());

  const { workingDays, currentDay } = parseWorkingDays(text);
  const daysProgress = Math.round((currentDay / workingDays) * 100);
  const expectedRate = daysProgress;

  const categories: ParsedCategory[] = [];
  let currentCategory: ParsedCategory | null = null;
  let currentChannel: ParsedChannel | null = null;
  const allReps: ParsedRep[] = [];

  const knownCategoryNames = ['ديمة', 'ماستر', 'شويكي', 'هاريتوز', 'تورابيكا'];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip working days summary lines and standalone numbers
    if (trimmed.match(/^(?:اجمالي|إجمالي|عدد)/i)) continue;
    if (trimmed.match(/^(?:\d+\s*(?:%)?\s*){1,3}$/)) continue;

    // Skip Excel header/label rows
    if (trimmed.startsWith('Sum of')) continue;
    if (trimmed.includes('Sum of قيمة')) continue;
    if (trimmed.includes('هدف شهر')) continue;
    if (trimmed.includes('محقق حتى')) continue;
    if (trimmed.includes('نسبة المحقق')) continue;
    if (trimmed === 'الفرق') continue;

    const parts = trimmed.split('\t').map(p => p.trim());
    while (parts.length > 0 && !parts[0]) parts.shift();
    while (parts.length > 0 && !parts[parts.length - 1]) parts.pop();

    if (parts.length === 0) continue;

    const name = parts[0];

    if (looksLikeChannel(name)) {
      if (!currentCategory) continue;
      currentChannel = {
        name,
        target: parseNumber(parts[1]),
        achieved: parseNumber(parts[2]),
        achievement_pct: parseNumber(parts[3]),
        diff_pct: parseNumber(parts[4]),
        expected: expectedRate,
        category: currentCategory.name,
        reps: []
      };
      currentCategory.channels.push(currentChannel);
    } else if (looksLikeRep(name)) {
      if (!currentCategory) continue;

      const target = parseNumber(parts[1]);
      const achieved = parseNumber(parts[2]);
      const achievement_pct = parseNumber(parts[3]);
      let diff_pct = parseNumber(parts[4]);

      if (diff_pct === 0) {
        diff_pct = achievement_pct - expectedRate;
      }

      const channelName = currentChannel ? currentChannel.name : 'عام';
      const rep: ParsedRep = {
        name: cleanRepName(name),
        full_name: name,
        target,
        achieved,
        achievement_pct,
        diff_pct,
        category: currentCategory.name,
        channel: channelName
      };

      allReps.push(rep);

      if (currentChannel) {
        currentChannel.reps.push(rep);
      } else {
        // Backward compatibility: create a default channel if no channel was defined
        currentChannel = {
          name: 'عام',
          target: 0,
          achieved: 0,
          achievement_pct: 0,
          diff_pct: 0,
          expected: expectedRate,
          category: currentCategory.name,
          reps: [rep]
        };
        currentCategory.channels.push(currentChannel);
      }
    } else if (isCategoryName(name, knownCategoryNames) || currentCategory === null) {
      // New category
      currentCategory = {
        name,
        target: parseNumber(parts[1]),
        achieved: parseNumber(parts[2]),
        achievement_pct: parseNumber(parts[3]),
        diff_pct: parseNumber(parts[4]),
        expected: expectedRate,
        channels: []
      };
      currentChannel = null;
      categories.push(currentCategory);
    } else {
      // Treat unknown non-channel, non-rep lines as a new category
      currentCategory = {
        name,
        target: parseNumber(parts[1]),
        achieved: parseNumber(parts[2]),
        achievement_pct: parseNumber(parts[3]),
        diff_pct: parseNumber(parts[4]),
        expected: expectedRate,
        channels: []
      };
      currentChannel = null;
      categories.push(currentCategory);
    }
  }

  // Calculate channel totals from reps if not provided
  for (const cat of categories) {
    for (const ch of cat.channels) {
      if (ch.target === 0 && ch.reps.length > 0) {
        ch.target = ch.reps.reduce((sum, r) => sum + r.target, 0);
        ch.achieved = ch.reps.reduce((sum, r) => sum + r.achieved, 0);
      }
      if (ch.achievement_pct === 0 && ch.target > 0) {
        ch.achievement_pct = Math.round((ch.achieved / ch.target) * 100);
      }
      ch.diff_pct = ch.achievement_pct - expectedRate;
      ch.expected = expectedRate;
    }
  }

  // Calculate category totals from channels if not provided
  for (const cat of categories) {
    if (cat.target === 0 && cat.channels.length > 0) {
      cat.target = cat.channels.reduce((sum, ch) => sum + ch.target, 0);
      cat.achieved = cat.channels.reduce((sum, ch) => sum + ch.achieved, 0);
    }
    if (cat.achievement_pct === 0 && cat.target > 0) {
      cat.achievement_pct = Math.round((cat.achieved / cat.target) * 100);
    }
    cat.diff_pct = cat.achievement_pct - expectedRate;
    cat.expected = expectedRate;
  }

  // Calculate metrics
  const total_target = categories.reduce((sum, c) => sum + c.target, 0);
  const total_achieved = categories.reduce((sum, c) => sum + c.achieved, 0);
  const overall_achievement = total_target > 0 ? Math.round((total_achieved / total_target) * 100 * 10) / 10 : 0;
  const overall_diff = Math.round((overall_achievement - expectedRate) * 10) / 10;

  const metrics: ParsedMetrics = {
    total_target,
    total_achieved,
    overall_achievement,
    expected_rate: expectedRate,
    overall_diff,
    working_days: workingDays,
    current_day: currentDay,
    days_progress: daysProgress
  };

  // Aggregate reps by name
  const repMap = new Map<string, RepAggregate>();
  for (const rep of allReps) {
    const existing = repMap.get(rep.full_name);
    if (existing) {
      existing.target += rep.target;
      existing.achieved += rep.achieved;
      if (!existing.categories.includes(rep.category)) {
        existing.categories.push(rep.category);
      }
      if (!existing.channels.includes(rep.channel)) {
        existing.channels.push(rep.channel);
      }
    } else {
      repMap.set(rep.full_name, {
        name: rep.name,
        full_name: rep.full_name,
        target: rep.target,
        achieved: rep.achieved,
        achievement_pct: 0,
        diff_pct: 0,
        categories: [rep.category],
        channels: [rep.channel]
      });
    }
  }

  const repAggregates: RepAggregate[] = [];
  for (const agg of repMap.values()) {
    agg.achievement_pct = agg.target > 0 ? Math.round((agg.achieved / agg.target) * 100 * 10) / 10 : 0;
    agg.diff_pct = Math.round((agg.achievement_pct - expectedRate) * 10) / 10;
    repAggregates.push(agg);
  }

  repAggregates.sort((a, b) => b.achievement_pct - a.achievement_pct);

  const insights = generateInsights(categories, repAggregates, metrics);

  return { metrics, categories, repAggregates, insights };
}

function generateInsights(
  categories: ParsedCategory[],
  reps: RepAggregate[],
  metrics: ParsedMetrics
): Insight[] {
  const insights: Insight[] = [];
  const sortedCats = [...categories].sort((a, b) => b.achievement_pct - a.achievement_pct);
  const sortedReps = [...reps].sort((a, b) => b.achievement_pct - a.achievement_pct);

  // Overall status
  if (metrics.overall_diff < 0) {
    insights.push({
      title: 'التحقيق العام متأخر عن المعدل المتوقع',
      description: `نسبة التحقيق العامة ${metrics.overall_achievement}% مقارنة بالمعدل المتوقع ${metrics.expected_rate}% (بناءً على ${metrics.current_day} أيام من أصل ${metrics.working_days} يوم عمل)`,
      type: 'warning',
      icon: 'trending-down'
    });
  } else {
    insights.push({
      title: 'التحقيق العام متقدم عن المعدل المتوقع',
      description: `نسبة التحقيق العامة ${metrics.overall_achievement}% متقدمة عن المعدل المتوقع ${metrics.expected_rate}% (بناءً على ${metrics.current_day} أيام من أصل ${metrics.working_days} يوم عمل)`,
      type: 'success',
      icon: 'trending-up'
    });
  }

  // Best category
  if (sortedCats.length > 0 && sortedCats[0].diff_pct > 0) {
    insights.push({
      title: `فئة ${sortedCats[0].name} الأفضل أداءً`,
      description: `حققت فئة ${sortedCats[0].name} نسبة ${sortedCats[0].achievement_pct}% وهي الأعلى بين جميع الفئات، متقدمة بـ ${sortedCats[0].diff_pct} نقطة عن المعدل المتوقع`,
      type: 'success',
      icon: 'trending-up'
    });
  }

  // Worst category
  if (sortedCats.length > 0 && sortedCats[sortedCats.length - 1].diff_pct < 0) {
    const worst = sortedCats[sortedCats.length - 1];
    insights.push({
      title: `فئة ${worst.name} الأقل تحقيقاً`,
      description: `حققت فئة ${worst.name} نسبة ${worst.achievement_pct}% فقط وهي الأدنى بين جميع الفئات، متأخرة بـ ${Math.abs(worst.diff_pct)} نقطة عن المعدل المتوقع`,
      type: 'danger',
      icon: 'alert'
    });
  }

  // Best rep
  if (sortedReps.length > 0) {
    const best = sortedReps[0];
    insights.push({
      title: `${best.name} أفضل مندوب`,
      description: `المندوب ${best.name} حقق نسبة ${best.achievement_pct}% بإجمالي مبيعات ${best.achieved.toLocaleString()} ليرة سورية`,
      type: 'success',
      icon: 'award'
    });
  }

  // Reps needing attention (diff < -10)
  const strugglingReps = sortedReps.filter(r => r.diff_pct < -10);
  if (strugglingReps.length > 0) {
    const repNames = strugglingReps.slice(0, 3).map(r => `${r.name} (${r.diff_pct}%)`).join('، ');
    insights.push({
      title: `${strugglingReps.length} مناديب متأخرون بأكثر من 10 نقاط`,
      description: `${repNames} يحتاجون لمتابعة عاجلة`,
      type: 'danger',
      icon: 'users'
    });
  }

  // Category with biggest target share
  const biggestCat = [...categories].sort((a, b) => b.target - a.target)[0];
  if (biggestCat) {
    const share = Math.round((biggestCat.target / metrics.total_target) * 100);
    insights.push({
      title: `فئة ${biggestCat.name} تمثل ${share}% من الهدف الإجمالي`,
      description: `هدف ${biggestCat.name} ${biggestCat.target.toLocaleString()} ل.س وهو الأعلى، لكن التحقيق ${biggestCat.achievement_pct}% فقط`,
      type: 'info',
      icon: 'pie'
    });
  }

  return insights;
}

// Default raw data (July 2026) - now with channels
export const DEFAULT_RAW_DATA = `اجمالي ايام العمل\t26\t
عدد الايام الحالي\t13\t50%\n\nديمة\t 5,012,097 \t 5,472,315 \t109%\t59%\t
قناة الجملة\t 3,037,059 \t 3,077,930 \t101%\t51%\t
حبيب السبع - مندوب\t 1,917,050 \t 1,871,978 \t98%\t48%\t
رمضان النعسان - مندوب حلب\t 1,120,008 \t 1,205,952 \t108%\t58%\t
قناة المفرق\t 1,639,869 \t 1,741,723 \t106%\t56%\t
احمد باش - مندوب حلب\t 409,967 \t 499,227 \t122%\t72%\t
عبد المجيد النقشي - مندوب حلب\t\t-\t\t\t
محمد رضوان - مندوب حلب\t 409,967 \t 434,227 \t106%\t56%\t
محمد قبوات - مندوب حلب\t 409,967 \t 450,504 \t110%\t60%\t
مصطفى نجار - مندوب حلب\t 409,967 \t 357,766 \t87%\t37%\t
قناة كبار العملاء\t 335,170 \t 652,662 \t195%\t145%\t
علي عطري - مندوب حلب\t 335,170 \t 652,662 \t195%\t145%\t
ماستر\t 22,000,000 \t 9,617,353 \t44%\t-6%\t
قناة الجملة\t 9,365,422 \t 3,159,809 \t34%\t-16%\t
حبيب السبع - مندوب\t 6,565,422 \t 2,246,559 \t34%\t-16%\t
همام خوام - مندوب حلب\t 2,800,000 \t 913,250 \t33%\t-17%\t
قناة المفرق\t 8,623,496 \t 4,069,295 \t47%\t-3%\t
سامر باطوس - مندوب حلب\t 2,155,874 \t 1,049,301 \t49%\t-1%\t
عبد المجيد النقشي - مندوب حلب\t 2,155,874 \t 1,188,091 \t55%\t5%\t
عمر عيسى- مندوب حلب\t 2,155,874 \t 953,302 \t44%\t-6%\t
مازن نعمة - مندوب حلب\t 2,155,874 \t 505,145 \t23%\t-27%\t
احمد خضر - مندوب حلب\t\t 373,457 \t\t\t
قناة كبار العملاء\t 4,011,082 \t 2,388,249 \t60%\t10%\t
محمد عموري - مندوب\t 4,011,082 \t 2,388,249 \t60%\t10%\t
شويكي\t 11,004,857 \t 5,481,861 \t50%\t0%\t
قناة الجملة\t 7,743,291 \t 4,425,411 \t57%\t7%\t
حبيب السبع - مندوب\t 5,032,751 \t 3,132,953 \t62%\t12%\t
رمضان النعسان - مندوب حلب\t 2,710,540 \t 1,292,459 \t48%\t-2%\t
قناة المفرق\t 2,915,920 \t 821,142 \t28%\t-22%\t
ابراهيم الحبيب - مندوب حلب\t 728,980 \t 176,787 \t24%\t-26%\t
ابراهيم الحطاب - مندوب حلب\t 728,980 \t 258,583 \t35%\t-15%\t
احمد قصاب - مندوب حلب\t 728,980 \t 207,711 \t28%\t-22%\t
مبيعات حلب مندوب احتياط\t\t 42,371 \t\t\t
محمد امينو - مندوب حلب\t 728,980 \t 135,691 \t19%\t-31%\t
قناة كبار العملاء\t 345,646 \t 235,308 \t68%\t18%\t
علي عطري - مندوب حلب\t 345,646 \t 235,308 \t68%\t18%\t
هاريتوز\t 509,594 \t 370,754 \t73%\t23%\t
قناة الجملة\t 124,990 \t 59,873 \t48%\t-2%\t
حبيب السبع - مندوب\t 80,535 \t 36,480 \t45%\t-5%\t
رمضان النعسان - مندوب حلب\t 44,455 \t 23,393 \t53%\t3%\t
قناة المفرق\t 250,892 \t 249,376 \t99%\t49%\t
ابراهيم الحبيب - مندوب حلب\t 62,723 \t 83,873 \t134%\t84%\t
ابراهيم الحطاب - مندوب حلب\t 62,723 \t 45,156 \t72%\t22%\t
احمد قصاب - مندوب حلب\t 62,723 \t 47,407 \t76%\t26%\t
مبيعات حلب مندوب احتياط\t\t 15,320 \t\t\t
محمد امينو - مندوب حلب\t 62,723 \t 57,620 \t92%\t42%\t
قناة كبار العملاء\t 133,712 \t 61,506 \t46%\t-4%\t
علي عطري - مندوب حلب\t 133,712 \t 61,506 \t46%\t-4%\t
تورابيكا\t 17,005,517 \t 4,609,169 \t27%\t-23%\t
قناة الجملة\t 13,746,209 \t 3,230,791 \t24%\t-26%\t
حبيب السبع - مندوب\t 11,097,391 \t 2,387,731 \t22%\t-28%\t
رمضان النعسان - مندوب حلب\t 2,648,818 \t 843,060 \t32%\t-18%\t
قناة المفرق\t 1,694,454 \t 728,585 \t43%\t-7%\t
ابراهيم الحبيب - مندوب حلب\t\t 6,412 \t\t\t
ابراهيم الحطاب - مندوب حلب\t\t 16,996 \t\t\t
احمد باش - مندوب حلب\t 423,614 \t 223,733 \t53%\t3%\t
احمد قصاب - مندوب حلب\t\t 3,029 \t\t\t
محمد رضوان - مندوب حلب\t 423,614 \t 113,718 \t27%\t-23%\t
محمد قبوات - مندوب حلب\t 423,614 \t 203,840 \t48%\t-2%\t
مصطفى نجار - مندوب حلب\t 423,614 \t 160,857 \t38%\t-12%\t
قناة كبار العملاء\t 1,564,854 \t 649,792 \t42%\t-8%\t
علي عطري - مندوب حلب\t 1,564,854 \t 649,792 \t42%\t-8%\t`;
