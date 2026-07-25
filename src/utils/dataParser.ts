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
  report_date: string;
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

function parseDate(text: string): string {
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.includes('التاريخ')) continue;

    // Match date formats: 22/07/2026, 22-07-2026, or any date-like pattern
    const dateMatch = trimmed.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/);
    if (dateMatch) return dateMatch[1];
  }

  return '';
}

function formatReportDate(dateStr: string): string {
  if (!dateStr) return '';

  const parts = dateStr.split(/[\/\-.]/);
  if (parts.length !== 3) return dateStr;

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return dateStr;

  // Convert 2-digit year to 4-digit
  const fullYear = year < 50 ? 2000 + year : year;

  const date = new Date(fullYear, month - 1, day);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function parseGrandTotal(text: string): { total_target: number; total_achieved: number } | null {
  const lines = text.split('\n');

  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const isGrandTotal = /grand total|المجموع|الاجمالي|الإجمالي/i.test(trimmed);
    if (!isGrandTotal) continue;

    const parts = trimmed.split('\t').map(p => p.trim());
    while (parts.length > 0 && !parts[0]) parts.shift();
    while (parts.length > 0 && !parts[parts.length - 1]) parts.pop();

    // Extract first two numeric values after the label (target, achieved)
    const numericParts = parts.slice(1).map(parseNumber).filter(n => n > 0);
    if (numericParts.length >= 2) {
      return { total_target: numericParts[0], total_achieved: numericParts[1] };
    }
  }

  return null;
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

  const rawDate = parseDate(text);
  const reportDate = formatReportDate(rawDate);

  const grandTotal = parseGrandTotal(text);

  const categories: ParsedCategory[] = [];
  let currentCategory: ParsedCategory | null = null;
  let currentChannel: ParsedChannel | null = null;
  const allReps: ParsedRep[] = [];

  const knownCategoryNames = ['ديمة', 'ماستر', 'شويكي', 'هاريتوز', 'تورابيكا', 'جبري', 'امريكانا', 'أمريكانا', 'أصيل'];

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
    if (trimmed.includes('التاريخ')) continue;
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

  // Calculate metrics - prefer Grand Total row when available
  const total_target = grandTotal ? grandTotal.total_target : categories.reduce((sum, c) => sum + c.target, 0);
  const total_achieved = grandTotal ? grandTotal.total_achieved : categories.reduce((sum, c) => sum + c.achieved, 0);
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
    days_progress: daysProgress,
    report_date: reportDate
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
export const DEFAULT_RAW_DATA = `اجمالي ايام العمل\t26\t\t
عدد الايام الحالي\t19\t73%\t\t
التاريخ\t22/07/2026\t\t\t
\t\t\t\t\t
Sum of قيمة\t\t\t\t\t
\tهدف شهر 7\tمحقق حتى 22.7.26\tنسبة المحقق\tالفرق
ديمة\t 5,012,097 \t 6,405,810 \t128%\t55%\t
قناة الجملة\t 3,037,059 \t 3,657,492 \t120%\t47%\t
حبيب السبع - مندوب\t 1,917,050 \t 2,064,417 \t108%\t35%\t
رمضان النعسان - مندوب حلب\t 1,120,008 \t 1,593,075 \t142%\t69%\t
قناة المفرق\t 1,639,869 \t 2,018,446 \t123%\t50%\t
احمد باش - مندوب حلب\t 409,967 \t 555,706 \t136%\t62%\t
عبد المجيد النقشي - مندوب حلب\t\t -   \t\t\t
محمد رضوان - مندوب حلب\t 409,967 \t 504,201 \t123%\t50%\t
محمد قبوات - مندوب حلب\t 409,967 \t 548,320 \t134%\t61%\t
مصطفى نجار - مندوب حلب\t 409,967 \t 410,220 \t100%\t27%\t
قناة كبار العملاء\t 335,170 \t 729,871 \t218%\t145%\t
علي عطري - مندوب حلب\t 335,170 \t 729,871 \t218%\t145%\t
ماستر\t 22,000,000 \t 14,552,941 \t66%\t-7%\t
قناة الجملة\t 9,365,422 \t 5,058,797 \t54%\t-19%\t
حبيب السبع - مندوب\t 6,565,422 \t 3,526,106 \t54%\t-19%\t
همام خوام - مندوب حلب\t 2,800,000 \t 1,532,691 \t55%\t-18%\t
قناة المفرق\t 8,623,496 \t 5,982,881 \t69%\t-4%\t
سامر باطوس - مندوب حلب\t 2,155,874 \t 1,581,360 \t73%\t0%\t
عبد المجيد النقشي - مندوب حلب\t 2,155,874 \t 1,752,536 \t81%\t8%\t
عمر عيسى- مندوب حلب\t 2,155,874 \t 1,267,068 \t59%\t-14%\t
مازن نعمة - مندوب حلب\t 2,155,874 \t 505,145 \t23%\t-50%\t
قناة كبار العملاء\t 4,011,082 \t 3,511,263 \t88%\t14%\t
محمد عموري - مندوب\t 4,011,082 \t 3,511,263 \t88%\t14%\t
شويكي\t 11,004,857 \t 7,685,728 \t70%\t-3%\t
قناة الجملة\t 7,743,291 \t 6,154,419 \t79%\t6%\t
حبيب السبع - مندوب\t 5,032,751 \t 4,624,921 \t92%\t19%\t
رمضان النعسان - مندوب حلب\t 2,710,540 \t 1,529,499 \t56%\t-17%\t
قناة المفرق\t 2,915,920 \t 1,167,481 \t40%\t-33%\t
ابراهيم الحبيب - مندوب حلب\t 728,980 \t 234,967 \t32%\t-41%\t
ابراهيم الحطاب - مندوب حلب\t 728,980 \t 386,587 \t53%\t-20%\t
احمد قصاب - مندوب حلب\t 728,980 \t 309,578 \t42%\t-31%\t
مبيعات حلب مندوب احتياط\t\t 42,371 \t\t\t
محمد امينو - مندوب حلب\t 728,980 \t 193,978 \t27%\t-46%\t
قناة كبار العملاء\t 345,646 \t 363,827 \t105%\t32%\t
علي عطري - مندوب حلب\t 345,646 \t 363,827 \t105%\t32%\t
هاريتوز\t 509,594 \t 467,691 \t92%\t19%\t
قناة الجملة\t 124,990 \t 66,998 \t54%\t-19%\t
حبيب السبع - مندوب\t 80,535 \t 36,480 \t45%\t-28%\t
رمضان النعسان - مندوب حلب\t 44,455 \t 30,518 \t69%\t-4%\t
قناة المفرق\t 250,892 \t 323,874 \t129%\t56%\t
ابراهيم الحبيب - مندوب حلب\t 62,723 \t 98,947 \t158%\t85%\t
ابراهيم الحطاب - مندوب حلب\t 62,723 \t 59,384 \t95%\t22%\t
احمد قصاب - مندوب حلب\t 62,723 \t 76,164 \t121%\t48%\t
مبيعات حلب مندوب احتياط\t\t 15,320 \t\t\t
محمد امينو - مندوب حلب\t 62,723 \t 74,060 \t118%\t45%\t
قناة كبار العملاء\t 133,712 \t 76,819 \t57%\t-16%\t
علي عطري - مندوب حلب\t 133,712 \t 76,819 \t57%\t-16%\t
تورابيكا\t 17,005,517 \t 7,074,998 \t42%\t-31%\t
قناة الجملة\t 13,746,209 \t 4,844,642 \t35%\t-38%\t
حبيب السبع - مندوب\t 11,097,391 \t 3,838,743 \t35%\t-38%\t
رمضان النعسان - مندوب حلب\t 2,648,818 \t 1,005,899 \t38%\t-35%\t
قناة المفرق\t 1,694,454 \t 1,165,293 \t69%\t-4%\t
احمد باش - مندوب حلب\t 423,614 \t 359,105 \t85%\t12%\t
محمد رضوان - مندوب حلب\t 423,614 \t 163,174 \t39%\t-35%\t
محمد قبوات - مندوب حلب\t 423,614 \t 365,256 \t86%\t13%\t
مصطفى نجار - مندوب حلب\t 423,614 \t 242,201 \t57%\t-16%\t
قناة كبار العملاء\t 1,564,854 \t 1,065,062 \t68%\t-5%\t
علي عطري - مندوب حلب\t 1,564,854 \t 1,065,062 \t68%\t-5%\t
جبري\t 18,240 \t 8,800 \t48%\t-25%\t
امريكانا\t\t 115,731 \t\t\t
أصيل\t\t 323,407 \t\t\t
Grand Total\t 55,550,305 \t 36,635,105 \t66%\t-7%\t`;
