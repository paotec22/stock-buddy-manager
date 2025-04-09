
import { Card, CardContent } from "@/components/ui/card";

export function InventoryErrorState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error loading inventory</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </CardContent>
      </Card>
    </div>
  );
}
