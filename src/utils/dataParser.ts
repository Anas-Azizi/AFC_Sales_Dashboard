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
  return name.includes('مندوب') || name.includes('مبيعات حلب');
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

  // Hide rep rows without a July target, but keep original channel/category totals
  for (const cat of categories) {
    for (const ch of cat.channels) {
      ch.reps = ch.reps.filter(r => r.target > 0);
      // Recalculate achievement % from original channel target/achieved
      if (ch.target > 0) {
        ch.achievement_pct = Math.round((ch.achieved / ch.target) * 100);
      }
      ch.diff_pct = ch.target > 0 ? ch.achievement_pct - expectedRate : 0;
      ch.expected = expectedRate;
    }
    cat.channels = cat.channels.filter(ch => ch.target > 0);
    // Recalculate achievement % from original category target/achieved
    if (cat.target > 0) {
      cat.achievement_pct = Math.round((cat.achieved / cat.target) * 100);
    }
    cat.diff_pct = cat.target > 0 ? cat.achievement_pct - expectedRate : 0;
    cat.expected = expectedRate;
  }
  const visibleCategories = categories.filter(cat => cat.target > 0);

  // Rebuild allReps from visible categories/channels only
  const visibleReps: ParsedRep[] = [];
  for (const cat of visibleCategories) {
    for (const ch of cat.channels) {
      for (const rep of ch.reps) {
        visibleReps.push(rep);
      }
    }
  }

  // Calculate metrics - prefer Grand Total row when available
  const total_target = grandTotal ? grandTotal.total_target : visibleCategories.reduce((sum, c) => sum + c.target, 0);
  const total_achieved = grandTotal ? grandTotal.total_achieved : visibleCategories.reduce((sum, c) => sum + c.achieved, 0);
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
  for (const rep of visibleReps) {
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

  const insights = generateInsights(visibleCategories, repAggregates, metrics);

  return { metrics, categories: visibleCategories, repAggregates, insights };
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
export const DEFAULT_RAW_DATA = `اجمالي ايام العمل	26		
عدد الايام الحالي	26	100%		
التاريخ	31/07/2026			
					
Sum of القيمة					
	هدف شهر 7	محقق حتى 31.7.26	نسبة المحقق	الفرق
ديمة	 5,012,097 	 7,663,677 	153%	53%	
قناة الجملة	 3,037,059 	 4,426,777 	146%	46%	
حبيب السبع - مندوب	 1,917,050 	 2,570,961 	134%	34%	
رمضان النعسان - مندوب حلب	 1,120,008 	 1,855,816 	166%	66%	
قناة المفرق	 1,639,869 	 2,408,731 	147%	47%	
احمد باش - مندوب حلب	 409,967 	 613,841 	150%	50%	
محمد رضوان - مندوب حلب	 409,967 	 641,834 	157%	57%	
محمد قبوات - مندوب حلب	 409,967 	 646,523 	158%	58%	
مصطفى نجار - مندوب حلب	 409,967 	 506,534 	124%	24%	
قناة كبار العملاء	 335,170 	 828,169 	247%	147%	
علي عطري - مندوب حلب	 335,170 	 828,169 	247%	147%	
ماستر	 22,000,000 	 20,268,138 	92%	-8%	
قناة الجملة	 9,365,422 	 7,800,817 	83%	-17%	
حبيب السبع - مندوب	 6,565,422 	 4,888,960 	74%	-26%	
مبيعات حلب مباشر		 11,908 			
همام خوام - مندوب حلب	 2,800,000 	 2,899,949 	104%	4%	
قناة المفرق	 8,623,496 	 7,957,873 	92%	-8%	
سامر باطوس - مندوب حلب	 2,155,874 	 1,982,012 	92%	-8%	
عبد المجيد النقشي - مندوب حلب	 2,155,874 	 2,363,089 	110%	10%	
عمر عيسى- مندوب حلب	 2,155,874 	 1,709,081 	79%	-21%	
مازن نعمة - مندوب حلب	 2,155,874 	 505,145 	23%	-77%	
احمد خضر - مندوب حلب		 1,398,545 			
قناة كبار العملاء	 4,011,082 	 4,509,448 	112%	12%	
محمد عموري - مندوب	 4,011,082 	 4,509,448 	112%	12%	
شويكي	 11,004,857 	 11,673,353 	106%	6%	
قناة الجملة	 7,743,291 	 9,668,869 	125%	25%	
حبيب السبع - مندوب	 5,032,751 	 6,710,245 	133%	33%	
رمضان النعسان - مندوب حلب	 2,710,540 	 2,958,624 	109%	9%	
قناة المفرق	 2,915,920 	 1,608,506 	55%	-45%	
ابراهيم الحبيب - مندوب حلب	 728,980 	 311,738 	43%	-57%	
ابراهيم الحطاب - مندوب حلب	 728,980 	 536,236 	74%	-26%	
احمد قصاب - مندوب حلب	 728,980 	 419,536 	58%	-42%	
مبيعات حلب مندوب احتياط		 42,371 			
محمد امينو - مندوب حلب	 728,980 	 298,625 	41%	-59%	
قناة كبار العملاء	 345,646 	 395,977 	115%	15%	
علي عطري - مندوب حلب	 345,646 	 395,977 	115%	15%	
هاريتوز	 509,594 	 566,443 	111%	11%	
قناة الجملة	 124,990 	 89,096 	71%	-29%	
حبيب السبع - مندوب	 80,535 	 58,578 	73%	-27%	
رمضان النعسان - مندوب حلب	 44,455 	 30,518 	69%	-31%	
قناة المفرق	 250,892 	 391,585 	156%	56%	
ابراهيم الحبيب - مندوب حلب	 62,723 	 103,920 	166%	66%	
ابراهيم الحطاب - مندوب حلب	 62,723 	 85,380 	136%	36%	
احمد قصاب - مندوب حلب	 62,723 	 94,293 	150%	50%	
مبيعات حلب مندوب احتياط		 15,320 			
محمد امينو - مندوب حلب	 62,723 	 92,672 	148%	48%	
قناة كبار العملاء	 133,712 	 85,761 	64%	-36%	
علي عطري - مندوب حلب	 133,712 	 85,761 	64%	-36%	
تورابيكا	 17,005,517 	 9,283,628 	55%	-45%	
قناة الجملة	 13,746,209 	 6,548,060 	48%	-52%	
حبيب السبع - مندوب	 11,097,391 	 5,307,467 	48%	-52%	
رمضان النعسان - مندوب حلب	 2,648,818 	 1,240,593 	47%	-53%	
قناة المفرق	 1,694,454 	 1,563,044 	92%	-8%	
احمد باش - مندوب حلب	 423,614 	 400,447 	95%	-5%	
محمد رضوان - مندوب حلب	 423,614 	 286,249 	68%	-32%	
محمد قبوات - مندوب حلب	 423,614 	 493,409 	116%	16%	
مصطفى نجار - مندوب حلب	 423,614 	 327,896 	77%	-23%	
قناة كبار العملاء	 1,564,854 	 1,172,525 	75%	-25%	
علي عطري - مندوب حلب	 1,564,854 	 1,172,525 	75%	-25%	
جبري	 18,240 	 14,880 	82%	-18%	
امريكانا		 200,876 			
أصيل		 326,991 			
Grand Total	 55,550,305 	 49,997,987 	90%	-10%	`;
