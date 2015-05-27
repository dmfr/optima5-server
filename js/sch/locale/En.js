Ext.define("Sch.locale.En", {
    extend: "Sch.locale.Locale",
    singleton: true,
    l10n: {
        "Sch.util.Date": {
            unitNames: {
                YEAR: {
                    single: "year",
                    plural: "years",
                    abbrev: "yr"
                },
                QUARTER: {
                    single: "quarter",
                    plural: "quarters",
                    abbrev: "q"
                },
                MONTH: {
                    single: "month",
                    plural: "months",
                    abbrev: "mon"
                },
                WEEK: {
                    single: "week",
                    plural: "weeks",
                    abbrev: "w"
                },
                DAY: {
                    single: "day",
                    plural: "days",
                    abbrev: "d"
                },
                HOUR: {
                    single: "hour",
                    plural: "hours",
                    abbrev: "h"
                },
                MINUTE: {
                    single: "minute",
                    plural: "minutes",
                    abbrev: "min"
                },
                SECOND: {
                    single: "second",
                    plural: "seconds",
                    abbrev: "s"
                },
                MILLI: {
                    single: "ms",
                    plural: "ms",
                    abbrev: "ms"
                }
            }
        },
        "Sch.view.SchedulerGridView": {
            loadingText: "Loading events..."
        },
        "Sch.plugin.CurrentTimeLine": {
            tooltipText: "Current time"
        },
        "Sch.plugin.EventEditor": {
            saveText: "Save",
            deleteText: "Delete",
            cancelText: "Cancel"
        },
        "Sch.plugin.SimpleEditor": {
            newEventText: "New booking..."
        },
        "Sch.widget.ExportDialog": {
            generalError: "An error occured, try again.",
            title: "Export Settings",
            formatFieldLabel: "Paper format",
            orientationFieldLabel: "Orientation",
            rangeFieldLabel: "Export range",
            showHeaderLabel: "Add page number",
            orientationPortraitText: "Portrait",
            orientationLandscapeText: "Landscape",
            completeViewText: "Complete schedule",
            currentViewText: "Current view",
            dateRangeText: "Date range",
            dateRangeFromText: "Export from",
            pickerText: "Resize column/rows to desired value",
            dateRangeToText: "Export to",
            exportButtonText: "Export",
            cancelButtonText: "Cancel",
            progressBarText: "Exporting...",
            exportToSingleLabel: "Export as single page",
            adjustCols: "Adjust column width",
            adjustColsAndRows: "Adjust column width and row height",
            specifyDateRange: "Specify date range"
        },
        "Sch.preset.Manager": function () {
            var b = Sch.preset.Manager,
                a = b.getPreset("hourAndDay");
            if (a) {
                a.displayDateFormat = "G:iA";
                a.headerConfig.middle.dateFormat = "G:iA";
                a.headerConfig.top.dateFormat = "D d/m"
            }
            a = b.getPreset("secondAndMinute");
            if (a) {
                a.displayDateFormat = "g:i:s";
                a.headerConfig.top.dateFormat = "D, d g:iA"
            }
            a = b.getPreset("dayAndWeek");
            if (a) {
                a.displayDateFormat = "m/d h:i A";
                a.headerConfig.middle.dateFormat = "D d M"
            }
            a = b.getPreset("weekAndDay");
            if (a) {
                a.displayDateFormat = "m/d";
                a.headerConfig.bottom.dateFormat = "d M";
                a.headerConfig.middle.dateFormat = "Y F d"
            }
            a = b.getPreset("weekAndMonth");
            if (a) {
                a.displayDateFormat = "m/d/Y";
                a.headerConfig.middle.dateFormat = "m/d";
                a.headerConfig.top.dateFormat = "m/d/Y"
            }
            a = b.getPreset("weekAndDayLetter");
            if (a) {
                a.displayDateFormat = "m/d/Y";
                a.headerConfig.middle.dateFormat = "D d M Y"
            }
            a = b.getPreset("weekDateAndMonth");
            if (a) {
                a.displayDateFormat = "m/d/Y";
                a.headerConfig.middle.dateFormat = "d";
                a.headerConfig.top.dateFormat = "Y F"
            }
            a = b.getPreset("monthAndYear");
            if (a) {
                a.displayDateFormat = "m/d/Y";
                a.headerConfig.middle.dateFormat = "M Y";
                a.headerConfig.top.dateFormat = "Y"
            }
            a = b.getPreset("year");
            if (a) {
                a.displayDateFormat = "m/d/Y";
                a.headerConfig.middle.dateFormat = "Y"
            }
            a = b.getPreset("manyYears");
            if (a) {
                a.displayDateFormat = "m/d/Y";
                a.headerConfig.middle.dateFormat = "Y"
            }
        }
    }
});
