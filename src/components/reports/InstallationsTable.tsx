import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Download, X, ChevronDown, Save, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileInstallationCard } from "./MobileInstallationCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InstallationsExportModal } from "./InstallationsExportModal";
import { formatCurrency } from "@/utils/formatters";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface InstallationRecord {
  id: number;
  date: string;
  description: string;
  amount: number;
}

interface Installation {
  id: number;
  description: string;
  amount: number;
  installation_date: string;
  user_id: string;
  created_at: string;
}

interface InstallationsTableProps {
  searchTerm?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function InstallationsTable({ searchTerm = "", isCollapsed = false, onToggleCollapse, dateFrom, dateTo, onDateFromChange, onDateToChange, onClearDates }: InstallationsTableProps & {
  dateFrom?: Date;
  dateTo?: Date;
  onDateFromChange?: (date: Date | undefined) => void;
  onDateToChange?: (date: Date | undefined) => void;
  onClearDates?: () => void;
}) {
  const isMobile = useIsMobile();
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Installation>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: installations = [], isLoading, error } = useQuery({
    queryKey: ['installations', dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('installations')
        .select('*')
        .order('installation_date', { ascending: false });

      if (dateFrom) {
        query = query.gte('installation_date', dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('installation_date', endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Installation[];
    }
  });

  const installationRecords: InstallationRecord[] = installations.map(installation => ({
    id: installation.id,
    date: format(new Date(installation.installation_date), 'MMM dd, yyyy'),
    description: installation.description,
    amount: installation.amount,
  }));

  const allInstallations = installations;

  const filteredRecords = installationRecords.filter(record =>
    record.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (installation: Installation) => {
    setEditingId(installation.id);
    setEditValues({
      description: installation.description,
      amount: installation.amount
    });
  };

  const handleSave = async () => {
    if (!editingId || !editValues) return;
    
    try {
      const { error } = await supabase
        .from('installations')
        .update(editValues)
        .eq('id', editingId);

      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['installations'] });
      setEditingId(null);
      setEditValues({});
      toast.success('Installation updated successfully');
    } catch (error) {
      console.error('Error updating installation:', error);
      toast.error('Failed to update installation');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase
        .from('installations')
        .delete()
        .eq('id', itemToDelete);

      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['installations'] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setEditingId(null);
      setEditValues({});
      toast.success('Installation deleted successfully');
    } catch (error) {
      console.error('Error deleting installation:', error);
      toast.error('Failed to delete installation');
    }
  };

  const confirmDelete = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (isLoading) return <div>Loading installations...</div>;
  if (error) return <div>Error loading installations</div>;

  const totalAmount = filteredRecords.reduce((sum, record) => sum + record.amount, 0);

  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapse?.()}>
      <Card className="glass-effect">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ChevronDown className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
                <CardTitle>Installation Records</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExportModal(true);
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
          {!isMobile && (
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[150px] justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM dd") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={onDateFromChange}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[150px] justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM dd") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={onDateToChange}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearDates}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  Clear Dates
                </Button>
              )}
            </div>
          )}

          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No installation records found
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-auto">
                  {filteredRecords.map((record) => {
                    const originalInstallation = installations.find(i => i.id === record.id);
                    const isEditing = editingId === record.id;
                    
                    return originalInstallation ? (
                      <MobileInstallationCard
                        key={record.id}
                        installation={originalInstallation}
                        date={record.date}
                        onEdit={handleEdit}
                        onSave={async (id, values) => {
                          setEditingId(id);
                          setEditValues(values);
                          await handleSave();
                        }}
                        onCancel={handleCancel}
                        onDelete={confirmDelete}
                        isEditing={isEditing}
                        editValues={editValues}
                        onEditValuesChange={setEditValues}
                      />
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="rounded-md border max-h-[calc(100vh-450px)] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => {
                        const originalInstallation = installations.find(i => i.id === record.id);
                        const isEditing = editingId === record.id;
                        
                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.date}</TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  value={editValues.description || ''}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                                  className="h-8"
                                />
                              ) : (
                                record.description
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={editValues.amount || ''}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                                  className="h-8 text-right"
                                />
                              ) : (
                                formatCurrency(record.amount)
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={handleSave}>
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancel}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => confirmDelete(record.id)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => originalInstallation && handleEdit(originalInstallation)}
                                >
                                  Edit
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {filteredRecords.length} installation{filteredRecords.length !== 1 ? 's' : ''}
                </span>
                <div className="text-lg font-semibold">
                  Total: {formatCurrency(totalAmount)}
                </div>
              </div>
            </>
          )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      <InstallationsExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        installations={allInstallations}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Installation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this installation record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  );
}