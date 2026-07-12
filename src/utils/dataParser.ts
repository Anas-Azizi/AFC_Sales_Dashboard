/**
 * Data Parser - Converts raw Excel/table paste into structured dashboard data
 * Supports tab-separated values with the same format as the original data
 */

export interface ParsedRep {
  name: string;
  full_name: string;
  target: number;
  achieved: number;
  achievement_pct: number;
  diff_pct: number;
  category: string;
}

export interface ParsedCategory {
  name: string;
  target: number;
  achieved: number;
  achievement_pct: number;
  diff_pct: number;
  expected: number;
  reps: ParsedRep[];
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
    // Match patterns like "اجمالي ايام العمل 26" or "26\tايام العمل"
    const totalMatch = trimmed.match(/(?:اجمالي|إجمالي)\s+ايام\s+العمل\s*(?:\t|\s)*[:=]?\s*(\d+)/i);
    if (totalMatch) workingDays = parseInt(totalMatch[1]);

    const totalMatch2 = trimmed.match(/(\d+)\s*(?:\t|\s)*(?:اجمالي|إجمالي)\s+ايام\s+العمل/i);
    if (totalMatch2) workingDays = parseInt(totalMatch2[1]);

    // Match current day: "عدد الايام الحالي 6" or "6\tعدد الايام الحالي"
    const currentMatch = trimmed.match(/(?:عدد\s+الايام|الايام\s+الحالي)\s*(?:\t|\s)*[:=]?\s*(\d+)/i);
    if (currentMatch) currentDay = parseInt(currentMatch[1]);

    const currentMatch2 = trimmed.match(/(\d+)\s*(?:\t|\s)*(?:عدد\s+الايام|الايام\s+الحالي)/i);
    if (currentMatch2) currentDay = parseInt(currentMatch2[1]);
  }

  return { workingDays, currentDay };
}

export function parseRawData(text: string): ParsedData {
  const lines = text.split('\n').filter(l => l.trim());

  // Parse working days info
  const { workingDays, currentDay } = parseWorkingDays(text);
  const daysProgress = Math.round((currentDay / workingDays) * 100);
  const expectedRate = daysProgress; // Expected achievement rate equals days progress

  // Parse data rows
  const categories: ParsedCategory[] = [];
  let currentCategory: ParsedCategory | null = null;
  const allReps: ParsedRep[] = [];

  // Known category names
  const categoryNames = ['ديمة', 'ماستر', 'شويكي', 'هاريتوز', 'تورابيكا'];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip working days summary lines
    if (trimmed.match(/^(?:اجمالي|إجمالي|عدد|الفراغ)/i)) continue;
    if (trimmed.match(/^(?:\d+\s*(?:%)?\s*){1,3}$/)) continue; // Just numbers

    const parts = trimmed.split('\t').map(p => p.trim());
    while (parts.length > 0 && !parts[parts.length - 1]) parts.pop();

    if (parts.length === 0) continue;

    const name = parts[0];

    // Check if this is a category header
    const isCategoryHeader = categoryNames.includes(name) && !name.includes('مندوب');

    if (isCategoryHeader) {
      currentCategory = {
        name,
        target: parseNumber(parts[1]),
        achieved: parseNumber(parts[2]),
        achievement_pct: parseNumber(parts[3]),
        diff_pct: parseNumber(parts[4]),
        expected: expectedRate,
        reps: []
      };
      categories.push(currentCategory);
    } else if (currentCategory && name.includes('مندوب')) {
      // This is a rep entry
      const target = parseNumber(parts[1]);
      const achieved = parseNumber(parts[2]);
      const achievement_pct = parseNumber(parts[3]);
      let diff_pct = parseNumber(parts[4]);

      // Calculate diff if not provided
      if (diff_pct === 0 && parts.length > 4 && parts[4]) {
        diff_pct = parseNumber(parts[4]);
      } else if (diff_pct === 0) {
        diff_pct = achievement_pct - expectedRate;
      }

      const rep: ParsedRep = {
        name: name.replace(/ - مندوب حلب/g, '').replace(/ - مندوب/g, '').replace(/- مندوب حلب/g, ''),
        full_name: name,
        target,
        achieved,
        achievement_pct,
        diff_pct,
        category: currentCategory.name
      };

      allReps.push(rep);
      currentCategory.reps.push(rep);
    }
  }

  // Use provided category totals as source of truth.
  // Only recalculate achievement_pct if it wasn't provided.
  for (const cat of categories) {
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
    } else {
      repMap.set(rep.full_name, {
        name: rep.name,
        full_name: rep.full_name,
        target: rep.target,
        achieved: rep.achieved,
        achievement_pct: 0,
        diff_pct: 0,
        categories: [rep.category]
      });
    }
  }

  // Calculate percentages for aggregated reps
  const repAggregates: RepAggregate[] = [];
  for (const agg of repMap.values()) {
    agg.achievement_pct = agg.target > 0 ? Math.round((agg.achieved / agg.target) * 100 * 10) / 10 : 0;
    agg.diff_pct = Math.round((agg.achievement_pct - expectedRate) * 10) / 10;
    repAggregates.push(agg);
  }

  // Sort by achievement
  repAggregates.sort((a, b) => b.achievement_pct - a.achievement_pct);

  // Generate insights
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

// Default raw data (July 2026)
export const DEFAULT_RAW_DATA = `اجمالي ايام العمل\t26\t
عدد الايام الحالي\t6\t23%\n\nديمة\t 5,012,097 \t 2,341,522 \t47%\t24%\t
احمد باش - مندوب حلب\t 409,967 \t 226,091 \t55%\t32%\t
حبيب السبع - مندوب\t 1,917,050 \t 1,107,520 \t58%\t35%\t
رمضان النعسان - مندوب حلب\t 1,120,008 \t 199,266 \t18%\t-5%\t
علي عطري - مندوب حلب\t 335,170 \t 318,742 \t95%\t72%\t
محمد رضوان - مندوب حلب\t 409,967 \t 188,466 \t46%\t23%\t
محمد قبوات - مندوب حلب\t 409,967 \t 158,129 \t39%\t15%\t
مصطفى نجار - مندوب حلب\t 409,967 \t 143,308 \t35%\t12%\t
ماستر\t 22,000,000 \t 4,399,093 \t20%\t-3%\t
حبيب السبع - مندوب\t 6,565,422 \t 1,066,543 \t16%\t-7%\t
سامر باطوس - مندوب حلب\t 2,155,874 \t 436,254 \t20%\t-3%\t
عبد المجيد النقشي - مندوب حلب\t 2,155,874 \t 583,746 \t27%\t4%\t
عمر عيسى- مندوب حلب\t 2,155,874 \t 471,846 \t22%\t-1%\t
مازن نعمة - مندوب حلب\t 2,155,874 \t 446,673 \t21%\t-2%\t
محمد عموري - مندوب\t 4,011,082 \t 1,080,142 \t27%\t4%\t
همام خوام - مندوب حلب\t 2,800,000 \t 313,889 \t11%\t-12%\t
شويكي\t 11,004,857 \t 912,060 \t8%\t-15%\t
ابراهيم الحبيب - مندوب حلب\t 728,980 \t 74,180 \t10%\t-13%\t
ابراهيم الحطاب - مندوب حلب\t 728,980 \t 133,030 \t18%\t-5%\t
احمد قصاب - مندوب حلب\t 728,980 \t 80,166 \t11%\t-12%\t
حبيب السبع - مندوب\t 5,032,751 \t 208,367 \t4%\t-19%\t
رمضان النعسان - مندوب حلب\t 2,710,540 \t 249,085 \t9%\t-14%\t
علي عطري - مندوب حلب\t 345,646 \t 137,753 \t40%\t17%\t
محمد امينو - مندوب حلب\t 728,980 \t 29,479 \t4%\t-19%\t
هاريتوز\t 509,594 \t 159,319 \t31%\t8%\t
ابراهيم الحبيب - مندوب حلب\t 62,723 \t 50,263 \t80%\t57%\t
ابراهيم الحطاب - مندوب حلب\t 62,723 \t 21,000 \t33%\t10%\t
احمد قصاب - مندوب حلب\t 62,723 \t 21,384 \t34%\t11%\t
حبيب السبع - مندوب\t 80,535 \t 22,800 \t28%\t5%\t
رمضان النعسان - مندوب حلب\t 44,455 \t\t0%\t-23%\t
علي عطري - مندوب حلب\t 133,712 \t 34,864 \t26%\t3%\t
محمد امينو - مندوب حلب\t 62,723 \t 9,008 \t14%\t-9%\t
تورابيكا\t 17,005,517 \t 2,963,465 \t17%\t-6%\t
ابراهيم الحبيب - مندوب حلب\t\t 5,156 \t\t\t
ابراهيم الحطاب - مندوب حلب\t\t 7,490 \t\t\t
احمد باش - مندوب حلب\t 423,614 \t 96,208 \t23%\t0%\t
حبيب السبع - مندوب\t 11,097,391 \t 1,740,700 \t16%\t-7%\t
رمضان النعسان - مندوب حلب\t 2,648,818 \t 523,934 \t20%\t-3%\t
علي عطري - مندوب حلب\t 1,564,854 \t 308,966 \t20%\t-3%\t
محمد رضوان - مندوب حلب\t 423,614 \t 65,158 \t15%\t-8%\t
محمد قبوات - مندوب حلب\t 423,614 \t 126,448 \t30%\t7%\t
مصطفى نجار - مندوب حلب\t 423,614 \t 89,404 \t21%\t-2%`;
