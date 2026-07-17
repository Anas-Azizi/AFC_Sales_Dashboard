import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Upload, RotateCcw, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DEFAULT_RAW_DATA } from '@/utils/dataParser';

interface DataInputProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentRaw: string;
  onApply: (text: string) => void;
  onReset: () => void;
}

export function DataInput({ isOpen, onOpenChange, currentRaw, onApply, onReset }: DataInputProps) {
  const [text, setText] = useState(currentRaw);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleApply = () => {
    if (!text.trim()) {
      setStatus('error');
      setMessage('الرجاء إدخال البيانات');
      return;
    }

    // Basic validation: check if data contains expected keywords
    const hasCategories = ['ديمة', 'ماستر', 'شويكي', 'هاريتوز', 'تورابيكا'].some(cat => text.includes(cat));
    const hasReps = text.includes('مندوب');

    if (!hasCategories && !hasReps) {
      setStatus('error');
      setMessage('لم يتم العثور على بيانات مبيعات صالحة. تأكد من أن البيانات تحتوي على أسماء الفئات والمناديب.');
      return;
    }

    onApply(text);
    setStatus('success');
    setMessage('تم تحديث البيانات بنجاح!');

    // Clear success message after 3 seconds
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 3000);
  };

  const handleReset = () => {
    setText(DEFAULT_RAW_DATA);
    onReset();
    setStatus('success');
    setMessage('تم إعادة تعيين البيانات إلى الافتراضي');
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 3000);
  };

  // Also provide an inline version for the main page
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="w-6 h-6 text-blue-600" />
            تحديث بيانات المبيعات
          </DialogTitle>
          <DialogDescription>
            الصق بياناتك من Excel أو الجدول مباشرة هنا. يجب أن يحتوي على أسماء الفئات والمناديب والأرقام.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-blue-800">طريقة الاستخدام:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>انسخ بياناتك من Excel (Ctrl+C)</li>
                    <li>الصقها في المربع أدناه (Ctrl+V)</li>
                    <li>اضغط "تطبيق البيانات"</li>
                  </ol>
                  <p className="text-xs text-blue-600 mt-2">
                    المطلوب: أسماء الفئات (ديمة، ماستر، ...) + القنوات (قناة الجملة، قناة العملاء) + أسماء المناديب + الأهداف والمبيعات
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Area */}
          <div>
            <label className="text-sm font-medium mb-2 block">بيانات المبيعات:</label>
            <Textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setStatus('idle');
              }}
              className="min-h-[300px] font-mono text-sm leading-relaxed"
              placeholder="الصق البيانات هنا..."
              dir="rtl"
            />
          </div>

          {/* Status Message */}
          {status !== 'idle' && message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة تعيين
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleApply}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                تطبيق البيانات
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
