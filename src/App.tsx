import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users,
  PieChart as PieIcon,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Store,
  Upload,
  Clock
} from 'lucide-react';
import { useSalesData } from '@/hooks/useSalesData';
import { DataInput } from '@/components/DataInput';
import type { ParsedCategory } from '@/utils/dataParser';
import './App.css';

const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'];

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

function getDiffColor(diff: number): string {
  return diff >= 0 ? 'text-green-600' : 'text-red-600';
}

function MetricCard({ title, value, subtitle, icon: Icon, color, diff }: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: string;
  diff?: number;
}) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            <div className="flex items-center gap-2">
              {diff !== undefined && (
                <span className={`flex items-center text-sm font-semibold ${getDiffColor(diff)}`}>
                  {diff >= 0 ? <ArrowUpRight className="w-4 h-4 ml-1" /> : <ArrowDownRight className="w-4 h-4 ml-1" />}
                  {Math.abs(diff)}%
                </span>
              )}
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({ title, description, type }: {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'danger' | 'info';
}) {
  const typeConfig = {
    success: { border: 'border-green-400', bg: 'bg-green-50', icon: CheckCircle2, iconColor: 'text-green-600' },
    warning: { border: 'border-amber-400', bg: 'bg-amber-50', icon: AlertTriangle, iconColor: 'text-amber-600' },
    danger: { border: 'border-red-400', bg: 'bg-red-50', icon: TrendingDown, iconColor: 'text-red-600' },
    info: { border: 'border-blue-400', bg: 'bg-blue-50', icon: PieIcon, iconColor: 'text-blue-600' }
  };
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-lg border-r-4 ${config.border} ${config.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${config.iconColor}`} />
        <div>
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: ParsedCategory }) {
  const sortedReps = [...category.reps].sort((a, b) => b.achievement_pct - a.achievement_pct);

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{category.name}</CardTitle>
            <CardDescription className="mt-1">
              {formatNumber(category.target)} ل.س | {category.reps.length} مناديب
            </CardDescription>
          </div>
          <Badge className={`text-lg px-3 py-1 ${category.diff_pct >= 0 ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}`}>
            {category.achievement_pct}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Progress value={category.achievement_pct} className="h-3 mb-4" />
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {sortedReps.map((rep, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span className="text-sm font-medium">{rep.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{formatNumber(rep.achieved)}</span>
                <Badge variant={rep.diff_pct >= 0 ? 'default' : 'destructive'} className="text-xs">
                  {rep.achievement_pct}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  const { parsedData, rawText, isInputOpen, setIsInputOpen, applyData, resetToDefault, lastUpdated } = useSalesData();

  const { metrics, categories, repAggregates, insights } = parsedData;

  const pieData = categories.map(c => ({
    name: c.name,
    value: c.target,
    achieved: c.achieved
  }));

  const radarData = categories.map(c => ({
    category: c.name,
    achievement: c.achievement_pct,
    expected: c.expected
  }));

  const repBarData = [...repAggregates]
    .sort((a, b) => b.achievement_pct - a.achievement_pct)
    .map(r => ({
      name: r.name,
      achievement: r.achievement_pct,
      diff: r.diff_pct
    }));

  const formattedDate = new Date(lastUpdated).toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Data Input Modal */}
      <DataInput
        isOpen={isInputOpen}
        onOpenChange={setIsInputOpen}
        currentRaw={rawText}
        onApply={applyData}
        onReset={resetToDefault}
      />

      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم المبيعات:</h1>
                <p className="text-muted-foreground">تقرير مبيعات: شهر يوليو 2026 (حتى 15 يوليو)</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">تم التحديث: {formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">{metrics.current_day} / {metrics.working_days} يوم عمل</span>
              </div>
              <div className="px-4 py-2 bg-amber-50 rounded-lg">
                <span className="font-semibold text-amber-800">{metrics.days_progress}% من الشهر</span>
              </div>
              <Button
                onClick={() => setIsInputOpen(true)}
                className="gap-2 bg-amber-500 hover:bg-amber-600"
              >
                <Upload className="w-4 h-4" />
                تحديث البيانات
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Key Metrics */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            المؤشرات الرئيسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="إجمالي الهدف"
              value={`${formatNumber(metrics.total_target)} ل.س`}
              subtitle="هدف الشهر"
              icon={Target}
              color="#2563eb"
            />
            <MetricCard
              title="إجمالي المحقق"
              value={`${formatNumber(metrics.total_achieved)} ل.س`}
              subtitle="المبيعات المحققة"
              icon={CheckCircle2}
              color="#059669"
            />
            <MetricCard
              title="نسبة التحقيق"
              value={`${metrics.overall_achievement}%`}
              subtitle={`المتوقع: ${metrics.expected_rate}%`}
              icon={TrendingUp}
              color="#d97706"
              diff={metrics.overall_diff}
            />
            <MetricCard
              title="عدد المناديب"
              value={`${repAggregates.length}`}
              subtitle="مندوب نشط"
              icon={Users}
              color="#7c3aed"
            />
          </div>
        </section>

        {/* Insights */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            التحليلات والملاحظات
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, i) => (
              <InsightCard key={i} title={insight.title} description={insight.description} type={insight.type} />
            ))}
          </div>
        </section>

        <Separator />

        {/* Charts Section */}
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="categories">الفئات</TabsTrigger>
            <TabsTrigger value="reps">المناديب</TabsTrigger>
            <TabsTrigger value="distribution">التوزيع</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Achievement Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    نسب التحقيق حسب الفئة
                  </CardTitle>
                  <CardDescription>مقارنة نسبة التحقيق مع المعدل المتوقع ({metrics.expected_rate}%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categories} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis dataKey="name" type="category" width={60} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="achievement_pct" name="نسبة التحقيق" fill="#2563eb" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="expected" name="المتوقع" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Target vs Achieved */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-blue-600" />
                    الهدف vs المحقق (بالآلاف)
                  </CardTitle>
                  <CardDescription>مقارنة الأهداف بالمبيعات المحققة لكل فئة</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categories.map(c => ({
                      name: c.name,
                      target_k: Math.round(c.target / 1000),
                      achieved_k: Math.round(c.achieved / 1000)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="target_k" name="الهدف (آلاف)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="achieved_k" name="المحقق (آلاف)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  أداء الفئات - رادار
                </CardTitle>
                <CardDescription>مقارنة نسب التحقيق بين الفئات</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Radar name="نسبة التحقيق" dataKey="achievement" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="المتوقع" dataKey="expected" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat, i) => (
                <CategoryCard key={i} category={cat} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reps" className="space-y-6">
            {/* Rep Achievement Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  أداء المناديب - نسبة التحقيق
                </CardTitle>
                <CardDescription>ترتيب المناديب حسب نسبة التحقيق</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(400, repAggregates.length * 30)}>
                  <BarChart data={repBarData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 50]} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="achievement" name="نسبة التحقيق" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rep Diff Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  الفرق عن المعدل المتوقع
                </CardTitle>
                <CardDescription>الفرق (+/-) عن المعدل المتوقع {metrics.expected_rate}% لكل مندوب</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(400, repAggregates.length * 30)}>
                  <BarChart data={[...repBarData].reverse()} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[-20, 20]} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="diff" name="الفرق عن المتوقع" radius={[0, 4, 4, 0]}>
                      {repBarData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={repBarData[index].diff >= 0 ? '#059669' : '#dc2626'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top & Bottom Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Award className="w-5 h-5" />
                    أفضل 5 مناديب
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {repAggregates.slice(0, 5).map((rep, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-green-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{rep.name}</p>
                            <p className="text-xs text-muted-foreground">{rep.categories.join(' - ')}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-green-700">{rep.achievement_pct}%</p>
                          <p className="text-xs text-muted-foreground">{formatNumber(rep.achieved)} ل.س</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    المناديب الأقل تحقيقاً
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {repAggregates.slice(-5).map((rep, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-red-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm">
                            {repAggregates.length - 4 + i}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{rep.name}</p>
                            <p className="text-xs text-muted-foreground">{rep.categories.join(' - ')}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-red-700">{rep.achievement_pct}%</p>
                          <p className="text-xs text-muted-foreground">{formatNumber(rep.achieved)} ل.س</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart - Target Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-blue-600" />
                    توزيع الأهداف
                  </CardTitle>
                  <CardDescription>نسبة كل فئة من إجمالي الهدف</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatNumber(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart - Achieved Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    توزيع المحقق
                  </CardTitle>
                  <CardDescription>نسبة كل فئة من إجمالي المبيعات المحققة</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={pieData.map(p => ({ name: p.name, value: p.achieved }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatNumber(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Category Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  ملخص الفئات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="py-3 px-4 font-semibold text-start">الفئة</th>
                        <th className="py-3 px-4 font-semibold text-start">الهدف</th>
                        <th className="py-3 px-4 font-semibold text-start">المحقق</th>
                        <th className="py-3 px-4 font-semibold text-start">نسبة التحقيق</th>
                        <th className="py-3 px-4 font-semibold text-start">الفرق</th>
                        <th className="py-3 px-4 font-semibold text-start">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...categories].sort((a, b) => b.achievement_pct - a.achievement_pct).map((cat, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-start">{cat.name}</td>
                          <td className="py-3 px-4 text-start">{formatNumber(cat.target)} ل.س</td>
                          <td className="py-3 px-4 text-start">{formatNumber(cat.achieved)} ل.س</td>
                          <td className="py-3 px-4 text-start">
                            <div className="flex items-center gap-2 justify-start">
                              <Progress value={cat.achievement_pct} className="w-20 h-2" />
                              <span>{cat.achievement_pct}%</span>
                            </div>
                          </td>
                          <td className={`py-3 px-4 font-semibold text-start ${getDiffColor(cat.diff_pct)}`}>
                            {cat.diff_pct > 0 ? '+' : ''}{cat.diff_pct}%
                          </td>
                          <td className="py-3 px-4 text-start">
                            {cat.diff_pct >= 0 ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 justify-start">
                                <ArrowUpRight className="w-3 h-3 ml-1" />
                                متقدم
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="justify-start">
                                <ArrowDownRight className="w-3 h-3 ml-1" />
                                متأخر
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Full Rep Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  تفاصيل المناديب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="py-3 px-4 font-semibold text-start">#</th>
                        <th className="py-3 px-4 font-semibold text-start">المندوب</th>
                        <th className="py-3 px-4 font-semibold text-start">الفئات</th>
                        <th className="py-3 px-4 font-semibold text-start">الهدف</th>
                        <th className="py-3 px-4 font-semibold text-start">المحقق</th>
                        <th className="py-3 px-4 font-semibold text-start">نسبة التحقيق</th>
                        <th className="py-3 px-4 font-semibold text-start">الفرق</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repAggregates.map((rep, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-start">{i + 1}</td>
                          <td className="py-3 px-4 font-semibold text-start">{rep.name}</td>
                          <td className="py-3 px-4 text-start">
                            <div className="flex flex-wrap gap-1">
                              {rep.categories.map((cat, j) => (
                                <Badge key={j} variant="outline" className="text-xs">{cat}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-start">{formatNumber(rep.target)} ل.س</td>
                          <td className="py-3 px-4 text-start">{formatNumber(rep.achieved)} ل.س</td>
                          <td className="py-3 px-4 text-start">
                            <div className="flex items-center gap-2 justify-start">
                              <Progress value={Math.min(rep.achievement_pct, 100)} className="w-20 h-2" />
                              <span className="font-semibold">{rep.achievement_pct}%</span>
                            </div>
                          </td>
                          <td className={`py-3 px-4 font-semibold text-start ${getDiffColor(rep.diff_pct)}`}>
                            {rep.diff_pct > 0 ? '+' : ''}{rep.diff_pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center py-8 text-muted-foreground text-sm border-t">
          <p>تم إنشاء هذا التقرير تلقائياً | البيانات محفوظة محلياً في المتصفح</p>
          <p className="mt-1">
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsInputOpen(true)}
              className="gap-1 text-amber-600"
            >
              <Upload className="w-3 h-3" />
              اضغط هنا لتحديث البيانات
            </Button>
          </p>
        </footer>
      </main>
    </div>
  );
}
