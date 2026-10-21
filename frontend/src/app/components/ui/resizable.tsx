import * as React from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "./utils";

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<any>) => {
  const Comp = (ResizablePrimitive as any).PanelGroup || (ResizablePrimitive as any).Group;
  return (
    <Comp
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  );
};

const ResizablePanel = (ResizablePrimitive as any).Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<any> & {
  withHandle?: boolean;
}) => {
  const Comp = (ResizablePrimitive as any).PanelResizeHandle || (ResizablePrimitive as any).Separator;
  return (
    <Comp
      className={cn(
        "relative flex w-px items-center justify-center bg-[#DDD5C8] after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#3C3530] data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border border-[#DDD5C8] bg-[#EDE8E1]">
          <GripVertical className="h-2.5 w-2.5 text-[#7A7269]" />
        </div>
      )}
    </Comp>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
