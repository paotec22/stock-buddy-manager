import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function InventoryMobileNav() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/dashboard')}
      >
        <div className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </div>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/sales')}
      >
        <div className="flex items-center gap-2">
          <span>Sales</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </Button>
    </div>
  );
}