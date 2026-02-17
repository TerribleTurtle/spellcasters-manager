import { useState } from "react";
import { Unit } from "@/domain/schemas";
import { PreviewCard } from "./PreviewCard";
import { PreviewDetailPage } from "./PreviewDetailPage";
import { TabBar } from "@/components/ui/TabBar";
import { Square, FileText } from "lucide-react";

interface SitePreviewProps {
  data: Unit;
}

export function SitePreview({ data }: SitePreviewProps) {
  const [activeTab, setActiveTab] = useState<string>("page");

  const tabItems = [
    { 
        value: "card", 
        label: (
            <div className="flex items-center gap-2">
                <Square className="w-4 h-4" />
                <span className="hidden sm:inline">Archive Card</span>
                <span className="sm:hidden">Card</span>
            </div>
        )
    },
    { 
        value: "page", 
        label: (
            <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Detail Page</span>
                <span className="sm:hidden">Page</span>
            </div>
        )
    }
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-4 pt-2 shrink-0">
          <TabBar 
            items={tabItems}
            activeValue={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "card" && (
            <div className="h-full overflow-y-auto p-6 focus-visible:outline-none">
                <div className="flex flex-col items-center justify-center min-h-[300px] h-full space-y-8">
                    <div className="w-full max-w-[320px]">
                        <PreviewCard data={data} />
                    </div>
                    <p className="text-muted-foreground text-sm text-center max-w-xs">
                        This is how the unit appears in the main unit archive grid.
                    </p>
                </div>
            </div>
        )}

        {activeTab === "page" && (
            <div className="h-full overflow-y-auto px-6 py-4 focus-visible:outline-none custom-scrollbar">
                 <PreviewDetailPage data={data} />
            </div>
        )}
      </div>
    </div>
  );
}
