import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { isSuperAdminUser } from "@/utils/roles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Download, Upload, Lock, Crown, Loader2 } from "lucide-react";

export const DatabaseManagementSection = () => {
  const { session } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const isSuperAdmin = isSuperAdminUser(session?.user?.email);

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

      toast.success("Database backup exported successfully!");
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

    if (!isSuperAdmin) {
      toast.error("Permission denied: Only the Super Admin (paotec22) can replace database data");
      event.target.value = '';
      return;
    }

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

      toast.success("Database restored and imported successfully!");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import database");
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Export Section - Available to all admins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <span>Export Database Backup</span>
          </CardTitle>
          <CardDescription>
            Download a full JSON snapshot of your current inventory list, sales records, and business expenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto font-semibold gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Exporting Database...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Database Backup (JSON)</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import / Overwrite Section - Super Admin Only */}
      <Card className={!isSuperAdmin ? "opacity-90 border-muted" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <span>Import & Replace Database</span>
            </CardTitle>
            {isSuperAdmin ? (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 text-[10px]">
                <Crown className="h-3 w-3 text-amber-500" />
                <span>Super Admin Authorized</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1 text-[10px]">
                <Lock className="h-3 w-3" />
                <span>Super Admin Only</span>
              </Badge>
            )}
          </div>
          <CardDescription>
            Restore system records from a JSON file. This operation permanently replaces existing database records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-xs font-bold uppercase tracking-wider">
              Destructive Database Operation
            </AlertTitle>
            <AlertDescription className="text-xs">
              Importing data will replace all existing sales, inventory, and expense records.
              {!isSuperAdmin && " Only the designated Super Admin (paotec22) can perform this action."}
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="import-file" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Choose Backup JSON File
            </Label>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting || !isSuperAdmin}
              className="mt-1.5 cursor-pointer disabled:cursor-not-allowed"
            />
            {!isSuperAdmin && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>Locked: Only the Super Admin (paotec22) can replace or overwrite database tables.</span>
              </p>
            )}
            {isImporting && (
              <p className="text-xs text-primary mt-2 flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Importing data into database... Please wait.</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
