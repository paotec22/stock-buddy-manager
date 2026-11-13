import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { AddSaleForm } from "./AddSaleForm";

const mockInsert = vi.fn();

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({
    session: {
      user: { id: "user-123", email: "staff@example.com" },
    },
    loading: false,
  }),
}));

vi.mock("@/components/customers/CustomerSelector", () => ({
  CustomerSelector: () => <div data-testid="customer-selector" />,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "sales") {
        return { insert: mockInsert };
      }
      return {
        select: () => ({
          eq: async () => ({
            data: [
              { id: 1, "Item Description": "Solar Panel 450W", Quantity: 10, Price: 120000, location: "Ikeja" },
            ],
            error: null,
          }),
        }),
      };
    }),
  },
}));

describe("AddSaleForm sale date selection", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockInsert.mockResolvedValue({ error: null });
  });

  const renderForm = () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={qc}>
        <AddSaleForm open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
      </QueryClientProvider>
    );
  };

  it("defaults to today and lets user select yesterday and persist the chosen sale_date", async () => {
    renderForm();

    const dateTrigger = screen.getByRole("button", { name: /sale date/i });
    const today = new Date();
    const yesterday = subDays(today, 1);

    expect(dateTrigger).toHaveTextContent(format(today, "MMM d, yyyy"));

    // Open calendar popover and pick Yesterday preset
    fireEvent.click(dateTrigger);
    const yesterdayBtn = await screen.findByRole("button", { name: "Yesterday" });
    fireEvent.click(yesterdayBtn);

    expect(dateTrigger).toHaveTextContent(format(yesterday, "MMM d, yyyy"));

    // Switch line item to Custom Product so test does not depend on Select portal
    fireEvent.click(screen.getByRole("button", { name: "Custom Product" }));
    fireEvent.change(screen.getByPlaceholderText(/type product name not in inventory/i), {
      target: { value: "Solar Cable 6mm" },
    });
    fireEvent.change(screen.getByPlaceholderText("0"), {
      target: { value: "25000" },
    });

    fireEvent.click(screen.getByRole("button", { name: /complete & record sale/i }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    const insertedRows = mockInsert.mock.calls[0][0];
    expect(insertedRows[0].sale_date.startsWith(format(yesterday, "yyyy-MM-dd"))).toBe(true);
  });
});
