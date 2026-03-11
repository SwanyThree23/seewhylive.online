import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Table, FileSpreadsheet, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

function downloadCSV(filename, data) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(title, data) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(9);
  let y = 32;
  if (!data.length) {
    doc.text('No data available.', 14, y);
  } else {
    const headers = Object.keys(data[0]);
    const colW = Math.min(40, Math.floor(180 / headers.length));
    // Header row
    doc.setFont(undefined, 'bold');
    headers.forEach((h, i) => doc.text(String(h).slice(0, 14), 14 + i * colW, y));
    doc.setFont(undefined, 'normal');
    y += 6;
    data.slice(0, 60).forEach(row => {
      if (y > 270) { doc.addPage(); y = 20; }
      headers.forEach((h, i) => {
        const val = String(row[h] ?? '').slice(0, 14);
        doc.text(val, 14 + i * colW, y);
      });
      y += 6;
    });
  }
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

const EXPORT_SETS = [
  {
    id: 'activity',
    label: 'Activity History',
    description: 'All your platform activities and events',
    entity: 'Activity',
    filterKey: 'user_id',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-500',
  },
  {
    id: 'subscriptions',
    label: 'My Subscriptions',
    description: 'Your active and past creator subscriptions',
    entity: 'Subscription',
    filterKey: 'user_id',
    color: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-500',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Your notification history',
    entity: 'Notification',
    filterKey: 'user_id',
    color: 'bg-yellow-50 border-yellow-200',
    iconColor: 'text-yellow-500',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'All tips, purchases, and payments',
    entity: 'Transaction',
    filterKey: 'user_id',
    color: 'bg-green-50 border-green-200',
    iconColor: 'text-green-500',
  },
];

export default function DataExportPage() {
  const [loading, setLoading] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleExport = async (set, format) => {
    const key = `${set.id}-${format}`;
    setLoading(l => ({ ...l, [key]: true }));
    try {
      const data = await base44.entities[set.entity].filter({ [set.filterKey]: user?.id });
      const filename = `${set.label.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}`;

      if (format === 'csv') downloadCSV(`${filename}.csv`, data);
      else if (format === 'json') downloadJSON(`${filename}.json`, data);
      else if (format === 'pdf') downloadPDF(set.label, data);

      toast.success(`${set.label} exported as ${format.toUpperCase()}`);
    } catch (e) {
      toast.error('Export failed');
    }
    setLoading(l => ({ ...l, [key]: false }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-3">
          <Download className="w-8 h-8 text-slate-700" />
          <div>
            <h1 className="text-3xl font-bold">Export My Data</h1>
            <p className="text-muted-foreground text-sm">Download your data for external record keeping and analysis</p>
          </div>
        </div>

        <div className="grid gap-4">
          {EXPORT_SETS.map(set => (
            <Card key={set.id} className={`border ${set.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{set.label}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{set.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">Personal Data</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    { format: 'csv', icon: Table, label: 'CSV' },
                    { format: 'json', icon: FileText, label: 'JSON' },
                    { format: 'pdf', icon: FileSpreadsheet, label: 'PDF' },
                  ].map(({ format, icon: Icon, label }) => {
                    const key = `${set.id}-${format}`;
                    const isLoading = loading[key];
                    return (
                      <Button
                        key={format}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        disabled={isLoading || !user}
                        onClick={() => handleExport(set, format)}
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                        Export {label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border bg-slate-50">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              All exports contain only <strong>your own data</strong>. Files are generated locally in your browser and never sent to any server.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}