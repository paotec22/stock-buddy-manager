import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/utils/inventoryUtils";
import { getInventoryImageUrl, uploadInventoryImage } from "@/lib/inventoryImages";

interface Props {
  item: InventoryItem & { image_url?: string | null };
  onUpdated?: () => void;
}

export function InventoryImageCell({ item, onUpdated }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    getInventoryImageUrl(item.image_url).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [item.image_url]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const path = await uploadInventoryImage(file, item.id);
      const { error } = await supabase
        .from("inventory list")
        .update({ image_url: path } as never)
        .eq("id", item.id)
        .eq("location", item.location);
      if (error) throw error;
      toast.success("Image saved");
      onUpdated?.();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
        className="relative h-10 w-10 rounded-md overflow-hidden border bg-muted flex items-center justify-center hover:ring-2 hover:ring-primary/40 transition"
        title={url ? "Change image" : "Add image"}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : url ? (
          <img src={url} alt={item["Item Description"]} className="h-full w-full object-cover" loading="lazy" decoding="async" width={40} height={40} />
        ) : (
          <ImagePlus className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}
