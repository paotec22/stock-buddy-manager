import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Download, Upload } from "lucide-react";

export const DatabaseManagementSection = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/database-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'export' }),
      });

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Database exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export database");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const fileContent = await file.text();
      const importData = JSON.parse(fileContent);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/database-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'import',
          data: importData
        }),
      });

      if (!response.ok) throw new Error('Import failed');

      toast.success("Database imported successfully!");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import database");
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Importing data will replace all existing records. Make sure to backup your current data before proceeding.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-4">
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export Database"}
        </Button>

        <div>
          <Label htmlFor="import-file">Import Database</Label>
          <Input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
};