import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SalesViewToggle, SalesViewMode } from "./SalesViewToggle";

describe("SalesViewToggle Component", () => {
  it("renders all three view options: Transactions, Monthly, and Analytics", () => {
    const handleViewChange = vi.fn();
    render(
      <SalesViewToggle
        currentView="transactions"
        onViewChange={handleViewChange}
      />
    );

    expect(screen.getByTitle("View Transactions Ledger")).toBeInTheDocument();
    expect(screen.getByTitle("View Monthly & Branch Summary")).toBeInTheDocument();
    expect(screen.getByTitle("View Graphical Analytics & Charts")).toBeInTheDocument();
  });

  it("calls onViewChange with 'monthly' when Monthly Summary button is clicked", () => {
    const handleViewChange = vi.fn();
    render(
      <SalesViewToggle
        currentView="transactions"
        onViewChange={handleViewChange}
      />
    );

    const monthlyButton = screen.getByTitle("View Monthly & Branch Summary");
    fireEvent.click(monthlyButton);

    expect(handleViewChange).toHaveBeenCalledTimes(1);
    expect(handleViewChange).toHaveBeenCalledWith("monthly");
  });

  it("calls onViewChange with 'chart' when Analytics button is clicked", () => {
    const handleViewChange = vi.fn();
    render(
      <SalesViewToggle
        currentView="transactions"
        onViewChange={handleViewChange}
      />
    );

    const chartButton = screen.getByTitle("View Graphical Analytics & Charts");
    fireEvent.click(chartButton);

    expect(handleViewChange).toHaveBeenCalledTimes(1);
    expect(handleViewChange).toHaveBeenCalledWith("chart");
  });

  it("calls onViewChange with 'transactions' when Ledger button is clicked", () => {
    const handleViewChange = vi.fn();
    render(
      <SalesViewToggle
        currentView="monthly"
        onViewChange={handleViewChange}
      />
    );

    const transactionsButton = screen.getByTitle("View Transactions Ledger");
    fireEvent.click(transactionsButton);

    expect(handleViewChange).toHaveBeenCalledTimes(1);
    expect(handleViewChange).toHaveBeenCalledWith("transactions");
  });
});
