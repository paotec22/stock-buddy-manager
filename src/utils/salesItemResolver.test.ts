import { describe, it, expect } from "vitest";
import {
  CUSTOM_SALE_SENTINEL_ITEM_NAME,
  formatCustomSaleNotes,
  isSystemSentinelInventoryItem,
  preserveSaleNotesMetadata,
  resolveSaleItemDisplay,
} from "./salesItemResolver";

describe("salesItemResolver utility", () => {
  describe("formatCustomSaleNotes", () => {
    it("should format custom product with location and optional user notes", () => {
      const result = formatCustomSaleNotes({
        customName: "Special Solar Inverter 5kVA",
        location: "Lekki",
        notes: "Customer requested expedited delivery",
      });

      expect(result).toBe(
        "[Product: Special Solar Inverter 5kVA | Location: Lekki] Customer requested expedited delivery"
      );
    });

    it("should fallback to Showroom when location is omitted", () => {
      const result = formatCustomSaleNotes({
        customName: "Custom Battery Cable",
      });

      expect(result).toBe("[Product: Custom Battery Cable | Location: Showroom]");
    });
  });

  describe("preserveSaleNotesMetadata", () => {
    it("should retain the product metadata prefix when updating notes", () => {
      const original = "[Product: Custom Item | Location: Ikeja] Deposit paid";
      const updated = preserveSaleNotesMetadata(original, "Balance settled via POS");

      expect(updated).toBe(
        "[Product: Custom Item | Location: Ikeja] Balance settled via POS"
      );
    });

    it("should return the updated note if no metadata prefix exists", () => {
      const updated = preserveSaleNotesMetadata("Regular note", "New updated note");
      expect(updated).toBe("New updated note");
    });
  });

  describe("resolveSaleItemDisplay", () => {
    it("should resolve linked inventory items with description and location", () => {
      const sale = {
        item_id: "item-123",
        notes: "Paid in full",
        "inventory list": {
          "Item Description": "Tubular Battery 220Ah",
          location: "Abuja",
        },
      };

      const resolved = resolveSaleItemDisplay(sale);
      expect(resolved.itemName).toBe("Tubular Battery 220Ah");
      expect(resolved.location).toBe("Abuja");
      expect(resolved.isCustomItem).toBe(false);
      expect(resolved.notes).toBe("Paid in full");
    });

    it("should parse custom item metadata from notes when no inventory link exists", () => {
      const sale = {
        item_id: null,
        notes: "[Product: Off-grid Controller | Location: Port Harcourt] Priority batch",
        "inventory list": null,
      };

      const resolved = resolveSaleItemDisplay(sale);
      expect(resolved.itemName).toBe("Off-grid Controller");
      expect(resolved.location).toBe("Port Harcourt");
      expect(resolved.isCustomItem).toBe(true);
      expect(resolved.notes).toBe("Priority batch");
    });

    it("should prioritize custom product metadata when backed by sentinel inventory row", () => {
      const sale = {
        item_id: 9999,
        notes: "[Product: Custom Breaker Box | Location: Uyo] Express delivery",
        "inventory list": {
          "Item Description": CUSTOM_SALE_SENTINEL_ITEM_NAME,
          location: "Ikeja",
        },
      };

      const resolved = resolveSaleItemDisplay(sale);
      expect(resolved.itemName).toBe("Custom Breaker Box");
      expect(resolved.location).toBe("Uyo");
      expect(resolved.isCustomItem).toBe(true);
      expect(resolved.notes).toBe("Express delivery");
      expect(isSystemSentinelInventoryItem(CUSTOM_SALE_SENTINEL_ITEM_NAME)).toBe(true);
      expect(isSystemSentinelInventoryItem("Regular Product")).toBe(false);
    });

    it("should recognize installation service notes", () => {
      const sale = {
        item_id: null,
        notes: "Installation: Rooftop Solar Mounting - Complete Rigging",
        "inventory list": null,
      };

      const resolved = resolveSaleItemDisplay(sale);
      expect(resolved.itemName).toBe("Rooftop Solar Mounting");
      expect(resolved.isCustomItem).toBe(true);
    });

    it("should return fallback values if record has no item info", () => {
      const sale = {
        item_id: null,
        notes: null,
        "inventory list": null,
      };

      const resolved = resolveSaleItemDisplay(sale, "Custom Fallback Item", "Custom Fallback Location");
      expect(resolved.itemName).toBe("Custom Fallback Item");
      expect(resolved.location).toBe("Custom Fallback Location");
      expect(resolved.isCustomItem).toBe(false);
    });
  });
});
