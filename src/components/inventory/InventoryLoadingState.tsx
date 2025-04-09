
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function InventoryLoadingState() {
  return (
    <div className="space-y-4 animate-pulse p-4">
      <div className="h-16 bg-muted rounded-lg" />
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
