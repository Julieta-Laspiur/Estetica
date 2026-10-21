import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { ChevronRight } from "lucide-react";
import { cn } from "./utils";

const MenubarMenu = MenubarPrimitive.Menu;
const MenubarGroup = MenubarPrimitive.Group;
const MenubarPortal = MenubarPrimitive.Portal;
const MenubarSub = MenubarPrimitive.Sub;
const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

const Menubar = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Root
        ref={ref}
        className={cn(
            "flex h-10 items-center space-x-1 rounded-md border border-[#DDD5C8] bg-[#F7F4F0] p-1",
            className
        )}
        {...props}
    />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

const MenubarTrigger = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Trigger
        ref={ref}
        className={cn(
            "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-hidden focus:bg-[#EDE8E1] focus:text-[#2A2825] data-[state=open]:bg-[#EDE8E1]",
            className
        )}
        {...props}
    />
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

const MenubarSubTrigger = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
        inset?: boolean;
    }
>(({ className, inset, children, ...props }, ref) => (
    <MenubarPrimitive.SubTrigger
        ref={ref}
        className={cn(
            "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-[#EDE8E1] focus:text-[#2A2825] data-[state=open]:bg-[#EDE8E1]",
            inset && "pl-8",
            className
        )}
        {...props}
    >
        {children}
        <ChevronRight className="ml-auto h-4 w-4" />
    </MenubarPrimitive.SubTrigger>
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

const MenubarSubContent = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.SubContent
        ref={ref}
        className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border border-[#DDD5C8] bg-[#F7F4F0] p-1 text-[#2A2825] shadow-md",
            className
        )}
        {...props}
    />
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

const MenubarContent = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
    (
        { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
        ref
    ) => (
        <MenubarPrimitive.Portal>
            <MenubarPrimitive.Content
                ref={ref}
                align={align}
                alignOffset={alignOffset}
                sideOffset={sideOffset}
                className={cn(
                    "z-50 min-w-[12rem] overflow-hidden rounded-md border border-[#DDD5C8] bg-[#F7F4F0] p-1 text-[#2A2825] shadow-md",
                    className
                )}
                {...props}
            />
        </MenubarPrimitive.Portal>
    )
);
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

const MenubarItem = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
        inset?: boolean;
    }
>(({ className, inset, ...props }, ref) => (
    <MenubarPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-[#EDE8E1] focus:text-[#2A2825] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            inset && "pl-8",
            className
        )}
        {...props}
    />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

const MenubarSeparator = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Separator
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-[#DDD5C8]", className)}
        {...props}
    />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

const MenubarLabel = MenubarPrimitive.Label;
const MenubarCheckboxItem = MenubarPrimitive.CheckboxItem;
const MenubarRadioItem = MenubarPrimitive.RadioItem;

export {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
    MenubarLabel,
    MenubarCheckboxItem,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarPortal,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarGroup,
    MenubarSub,
};
