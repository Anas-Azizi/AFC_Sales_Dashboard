// Sales data for July 2026 (till July 7)
export const keyMetrics = {
  total_target: 55532065,
  total_achieved: 10775459,
  overall_achievement: 19.4,
  expected_rate: 23,
  overall_diff: -3.6,
  working_days: 26,
  current_day: 6,
  days_progress: 23
};

export const categoryData = [
  { name: 'ديمة', target: 5012097, achieved: 2341522, achievement_pct: 47, diff_pct: 24, expected: 23 },
  { name: 'ماستر', target: 22000000, achieved: 4399093, achievement_pct: 20, diff_pct: -3, expected: 23 },
  { name: 'شويكي', target: 11004857, achieved: 912060, achievement_pct: 8, diff_pct: -15, expected: 23 },
  { name: 'هاريتوز', target: 509594, achieved: 159319, achievement_pct: 31, diff_pct: 8, expected: 23 },
  { name: 'تورابيكا', target: 17005517, achieved: 2963465, achievement_pct: 17, diff_pct: -6, expected: 23 }
];

export const repData = [
  { name: 'أحمد باش', full_name: 'احمد باش - مندوب حلب', target: 833581, achieved: 322299, achievement_pct: 38.7, diff_pct: 15.7, categories: ['ديمة', 'تورابيكا'] },
  { name: 'محمد قبوات', full_name: 'محمد قبوات - مندوب حلب', target: 833581, achieved: 284577, achievement_pct: 34.1, diff_pct: 11.1, categories: ['ديمة', 'تورابيكا'] },
  { name: 'علي عطري', full_name: 'علي عطري - مندوب حلب', target: 2379382, achieved: 800325, achievement_pct: 33.6, diff_pct: 10.6, categories: ['ديمة', 'شويكي', 'هاريتوز', 'تورابيكا'] },
  { name: 'محمد رضوان', full_name: 'محمد رضوان - مندوب حلب', target: 833581, achieved: 253624, achievement_pct: 30.4, diff_pct: 7.4, categories: ['ديمة', 'تورابيكا'] },
  { name: 'مصطفى نجار', full_name: 'مصطفى نجار - مندوب حلب', target: 833581, achieved: 232712, achievement_pct: 27.9, diff_pct: 4.9, categories: ['ديمة', 'تورابيكا'] },
  { name: 'حبيب السبع', full_name: 'حبيب السبع - مندوب', target: 23595158, achieved: 4145930, achievement_pct: 17.6, diff_pct: -5.4, categories: ['ديمة', 'ماستر', 'شويكي', 'هاريتوز', 'تورابيكا'] },
  { name: 'ابراهيم الحطاب', full_name: 'ابراهيم الحطاب - مندوب حلب', target: 854426, achieved: 161520, achievement_pct: 18.9, diff_pct: -4.1, categories: ['شويكي', 'هاريتوز', 'تورابيكا'] },
  { name: 'سامر باطوس', full_name: 'سامر باطوس - مندوب حلب', target: 2155874, achieved: 436254, achievement_pct: 20.2, diff_pct: -2.8, categories: ['ماستر'] },
  { name: 'محمد عموري', full_name: 'محمد عموري - مندوب', target: 4011082, achieved: 1080142, achievement_pct: 26.9, diff_pct: 3.9, categories: ['ماستر'] },
  { name: 'عبد المجيد النقشي', full_name: 'عبد المجيد النقشي - مندوب حلب', target: 2155874, achieved: 583746, achievement_pct: 27.1, diff_pct: 4.1, categories: ['ماستر'] },
  { name: 'عمر عيسى', full_name: 'عمر عيسى- مندوب حلب', target: 2155874, achieved: 471846, achievement_pct: 21.9, diff_pct: -1.1, categories: ['ماستر'] },
  { name: 'مازن نعمة', full_name: 'مازن نعمة - مندوب حلب', target: 2155874, achieved: 446673, achievement_pct: 20.7, diff_pct: -2.3, categories: ['ماستر'] },
  { name: 'احمد قصاب', full_name: 'احمد قصاب - مندوب حلب', target: 791703, achieved: 101550, achievement_pct: 12.8, diff_pct: -10.2, categories: ['شويكي', 'هاريتوز'] },
  { name: 'ابراهيم الحبيب', full_name: 'ابراهيم الحبيب - مندوب حلب', target: 791703, achieved: 129599, achievement_pct: 16.4, diff_pct: -6.6, categories: ['شويكي', 'هاريتوز', 'تورابيكا'] },
  { name: 'رمضان النعسان', full_name: 'رمضان النعسان - مندوب حلب', target: 6523821, achieved: 972285, achievement_pct: 14.9, diff_pct: -8.1, categories: ['ديمة', 'شويكي', 'تورابيكا'] },
  { name: 'همام خوام', full_name: 'همام خوام - مندوب حلب', target: 2800000, achieved: 313889, achievement_pct: 11.2, diff_pct: -11.8, categories: ['ماستر'] },
  { name: 'محمد امينو', full_name: 'محمد امينو - مندوب حلب', target: 791703, achieved: 38487, achievement_pct: 4.9, diff_pct: -18.1, categories: ['شويكي', 'هاريتوز'] }
];

// All individual rep entries grouped by category for detail view
export const categoryRepsDetail: Record<string, Array<{
  name: string;
  target: number;
  achieved: number;
  achievement_pct: number;
  diff_pct: number;
}>> = {
  'ديمة': [
    { name: 'احمد باش', target: 409967, achieved: 226091, achievement_pct: 55, diff_pct: 32 },
    { name: 'حبيب السبع', target: 1917050, achieved: 1107520, achievement_pct: 58, diff_pct: 35 },
    { name: 'رمضان النعسان', target: 1120008, achieved: 199266, achievement_pct: 18, diff_pct: -5 },
    { name: 'علي عطري', target: 335170, achieved: 318742, achievement_pct: 95, diff_pct: 72 },
    { name: 'محمد رضوان', target: 409967, achieved: 188466, achievement_pct: 46, diff_pct: 23 },
    { name: 'محمد قبوات', target: 409967, achieved: 158129, achievement_pct: 39, diff_pct: 15 },
    { name: 'مصطفى نجار', target: 409967, achieved: 143308, achievement_pct: 35, diff_pct: 12 }
  ],
  'ماستر': [
    { name: 'حبيب السبع', target: 6565422, achieved: 1066543, achievement_pct: 16, diff_pct: -7 },
    { name: 'سامر باطوس', target: 2155874, achieved: 436254, achievement_pct: 20, diff_pct: -3 },
    { name: 'عبد المجيد النقشي', target: 2155874, achieved: 583746, achievement_pct: 27, diff_pct: 4 },
    { name: 'عمر عيسى', target: 2155874, achieved: 471846, achievement_pct: 22, diff_pct: -1 },
    { name: 'مازن نعمة', target: 2155874, achieved: 446673, achievement_pct: 21, diff_pct: -2 },
    { name: 'محمد عموري', target: 4011082, achieved: 1080142, achievement_pct: 27, diff_pct: 4 },
    { name: 'همام خوام', target: 2800000, achieved: 313889, achievement_pct: 11, diff_pct: -12 }
  ],
  'شويكي': [
    { name: 'ابراهيم الحبيب', target: 728980, achieved: 74180, achievement_pct: 10, diff_pct: -13 },
    { name: 'ابراهيم الحطاب', target: 728980, achieved: 133030, achievement_pct: 18, diff_pct: -5 },
    { name: 'احمد قصاب', target: 728980, achieved: 80166, achievement_pct: 11, diff_pct: -12 },
    { name: 'حبيب السبع', target: 5032751, achieved: 208367, achievement_pct: 4, diff_pct: -19 },
    { name: 'رمضان النعسان', target: 2710540, achieved: 249085, achievement_pct: 9, diff_pct: -14 },
    { name: 'علي عطري', target: 345646, achieved: 137753, achievement_pct: 40, diff_pct: 17 },
    { name: 'محمد امينو', target: 728980, achieved: 29479, achievement_pct: 4, diff_pct: -19 }
  ],
  'هاريتوز': [
    { name: 'ابراهيم الحبيب', target: 62723, achieved: 50263, achievement_pct: 80, diff_pct: 57 },
    { name: 'ابراهيم الحطاب', target: 62723, achieved: 21000, achievement_pct: 33, diff_pct: 10 },
    { name: 'احمد قصاب', target: 62723, achieved: 21384, achievement_pct: 34, diff_pct: 11 },
    { name: 'حبيب السبع', target: 80535, achieved: 22800, achievement_pct: 28, diff_pct: 5 },
    { name: 'رمضان النعسان', target: 44455, achieved: 0, achievement_pct: 0, diff_pct: -23 },
    { name: 'علي عطري', target: 133712, achieved: 34864, achievement_pct: 26, diff_pct: 3 },
    { name: 'محمد امينو', target: 62723, achieved: 9008, achievement_pct: 14, diff_pct: -9 }
  ],
  'تورابيكا': [
    { name: 'ابراهيم الحبيب', target: 0, achieved: 5156, achievement_pct: 0, diff_pct: 0 },
    { name: 'ابراهيم الحطاب', target: 0, achieved: 7490, achievement_pct: 0, diff_pct: 0 },
    { name: 'احمد باش', target: 423614, achieved: 96208, achievement_pct: 23, diff_pct: 0 },
    { name: 'حبيب السبع', target: 11097391, achieved: 1740700, achievement_pct: 16, diff_pct: -7 },
    { name: 'رمضان النعسان', target: 2648818, achieved: 523934, achievement_pct: 20, diff_pct: -3 },
    { name: 'علي عطري', target: 1564854, achieved: 308966, achievement_pct: 20, diff_pct: -3 },
    { name: 'محمد رضوان', target: 423614, achieved: 65158, achievement_pct: 15, diff_pct: -8 },
    { name: 'محمد قبوات', target: 423614, achieved: 126448, achievement_pct: 30, diff_pct: 7 },
    { name: 'مصطفى نجار', target: 423614, achieved: 89404, achievement_pct: 21, diff_pct: -2 }
  ]
};

export const insights = [
  {
    title: 'التحقيق العام متأخر عن المعدل المتوقع',
    description: `نسبة التحقيق العامة ${keyMetrics.overall_achievement}% مقارنة بالمعدل المتوقع ${keyMetrics.expected_rate}% (بناءً على 6 أيام من أصل 26 يوم عمل)`,
    type: 'warning' as const,
    icon: 'trending-down'
  },
  {
    title: 'فئة ديمة الأفضل أداءً',
    description: `حققت فئة ديمة نسبة ${categoryData[0].achievement_pct}% وهي الأعلى بين جميع الفئات، متقدمة بـ ${categoryData[0].diff_pct} نقطة عن المعدل المتوقع`,
    type: 'success' as const,
    icon: 'trending-up'
  },
  {
    title: 'فئة شويكي الأقل تحقيقاً',
    description: `حققت فئة شويكي نسبة ${categoryData[2].achievement_pct}% فقط وهي الأدنى بين جميع الفئات، متأخرة بـ ${Math.abs(categoryData[2].diff_pct)} نقطة عن المعدل المتوقع`,
    type: 'danger' as const,
    icon: 'alert'
  },
  {
    title: 'علي عطري أفضل مندوب',
    description: `المندوب علي عطري حقق نسبة ${repData[2].achievement_pct}% بإجمالي مبيعات ${repData[2].achieved.toLocaleString()} ليرة سورية`,
    type: 'success' as const,
    icon: 'award'
  },
  {
    title: '3 مناديب متأخرون بأكثر من 10 نقاط',
    description: 'همام خوام (-11.8%)، احمد قصاب (-10.2%)، ومحمد امينو (-18.1%) يحتاجون لمتابعة عاجلة',
    type: 'danger' as const,
    icon: 'users'
  },
  {
    title: 'فئة ماستر تمثل 40% من الهدف الإجمالي',
    description: `هدف ماستر ${(22000000).toLocaleString()} ل.س وهو الأعلى، لكن التحقيق ${categoryData[1].achievement_pct}% فقط`,
    type: 'info' as const,
    icon: 'pie'
  }
];
