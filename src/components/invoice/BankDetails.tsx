import { Card, CardContent } from "@/components/ui/card";

export const BankDetails = () => {
  return (
    <Card className="mt-6 print:shadow-none">
      <CardContent className="p-6">
        <div className="text-sm space-y-1" style={{ color: "#081def" }}>
          <p className="font-semibold">PAYMENT METHOD:</p>
          <p>Bank Name: Globus Bank</p>
          <p>Acc Number: 1000145362</p>
          <p>Acc. Name: Puido Smart Solution Ltd.</p>
        </div>
        <div className="mt-4 text-sm" style={{ color: "#081def" }}>
          <p>Thanks for your Patronage</p>
        </div>
      </CardContent>
    </Card>
  );
};