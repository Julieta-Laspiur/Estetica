import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "./utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3 bg-white rounded-xl shadow-xs border border-[#DDD5C8]", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                month_caption: "flex justify-center pt-1 relative items-center text-sm font-semibold text-[#2A2825]",
                nav: "space-x-1 flex items-center",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-[#DDD5C8] absolute left-1"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-[#DDD5C8] absolute right-1"
                ),
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex",
                weekday: "text-[#7A7269] rounded-md w-9 font-normal text-[0.8rem]",
                week: "flex w-full mt-2",
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                range_end: "day-range-end",
                selected:
                    "bg-[#3C3530] text-[#F7F4F0] hover:bg-[#2A2825] hover:text-[#F7F4F0] focus:bg-[#3C3530] focus:text-[#F7F4F0]",
                today: "bg-[#EDE8E1] text-[#2A2825] font-semibold",
                outside:
                    "day-outside text-[#A8A199] opacity-50 aria-selected:bg-[#EDE8E1]/50 aria-selected:text-[#7A7269] aria-selected:opacity-30",
                disabled: "text-[#A8A199] opacity-50",
                range_middle:
                    "aria-selected:bg-[#EDE8E1] aria-selected:text-[#2A2825]",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, className: iconClassName, ...chevronProps }) => {
                    const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
                    return <Icon className={cn("h-4 w-4", iconClassName)} {...chevronProps} />;
                },
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };
