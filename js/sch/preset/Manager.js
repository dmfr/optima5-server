Ext.define("Sch.preset.Manager", {
    extend: "Ext.util.MixedCollection",
    requires: ["Sch.util.Date", "Sch.preset.ViewPreset"],
    mixins: ["Sch.mixin.Localizable"],
    singleton: true,
    constructor: function () {
        this.callParent(arguments);
        this.registerDefaults()
    },
    registerPreset: function (b, a) {
        if (a) {
            var c = a.headerConfig;
            var f = Sch.util.Date;
            for (var g in c) {
                if (c.hasOwnProperty(g)) {
                    if (f[c[g].unit]) {
                        c[g].unit = f[c[g].unit.toUpperCase()]
                    }
                }
            }
            if (!a.timeColumnWidth) {
                a.timeColumnWidth = 50
            }
            if (!a.rowHeight) {
                a.rowHeight = 24
            }
            var d = a.timeResolution;
            if (d && f[d.unit]) {
                d.unit = f[d.unit.toUpperCase()]
            }
            var e = a.shiftUnit;
            if (e && f[e]) {
                a.shiftUnit = f[e.toUpperCase()]
            }
        }
        if (this.isValidPreset(a)) {
            if (this.containsKey(b)) {
                this.removeAtKey(b)
            }
            a.name = b;
            this.add(b, new Sch.preset.ViewPreset(a))
        } else {
            throw "Invalid preset, please check your configuration"
        }
    },
    isValidPreset: function (a) {
        var e = Sch.util.Date,
            c = true,
            d = Sch.util.Date.units,
            b = {};
        for (var f in a.headerConfig) {
            if (a.headerConfig.hasOwnProperty(f)) {
                b[f] = true;
                c = c && Ext.Array.indexOf(d, a.headerConfig[f].unit) >= 0
            }
        }
        if (!(a.columnLinesFor in b)) {
            a.columnLinesFor = "middle"
        }
        if (a.timeResolution) {
            c = c && Ext.Array.indexOf(d, a.timeResolution.unit) >= 0
        }
        if (a.shiftUnit) {
            c = c && Ext.Array.indexOf(d, a.shiftUnit) >= 0
        }
        return c
    },
    getPreset: function (a) {
        return this.get(a)
    },
    deletePreset: function (a) {
        this.removeAtKey(a)
    },
    registerDefaults: function () {
        var b = this,
            a = this.defaultPresets;
        for (var c in a) {
            b.registerPreset(c, a[c])
        }
    },
    defaultPresets: {
        secondAndMinute: {
            timeColumnWidth: 30,
            rowHeight: 24,
            resourceColumnWidth: 100,
            displayDateFormat: "G:i:s",
            shiftIncrement: 10,
            shiftUnit: "MINUTE",
            defaultSpan: 24,
            timeResolution: {
                unit: "SECOND",
                increment: 5
            },
            headerConfig: {
                middle: {
                    unit: "SECOND",
                    increment: 10,
                    align: "center",
                    dateFormat: "s"
                },
                top: {
                    unit: "MINUTE",
                    align: "center",
                    dateFormat: "D, d g:iA"
                }
            }
        },
        minuteAndHour: {
            timeColumnWidth: 100,
            rowHeight: 24,
            resourceColumnWidth: 100,
            displayDateFormat: "G:i",
            shiftIncrement: 1,
            shiftUnit: "HOUR",
            defaultSpan: 24,
            timeResolution: {
                unit: "MINUTE",
                increment: 30
            },
            headerConfig: {
                middle: {
                    unit: "MINUTE",
                    increment: "30",
                    align: "center",
                    dateFormat: "i"
                },
                top: {
                    unit: "HOUR",
                    align: "center",
                    dateFormat: "D, gA/d"
                }
            }
        },
        hourAndDay: {
            timeColumnWidth: 60,
            rowHeight: 24,
            resourceColumnWidth: 100,
            displayDateFormat: "G:i",
            shiftIncrement: 1,
            shiftUnit: "DAY",
            defaultSpan: 24,
            timeResolution: {
                unit: "MINUTE",
                increment: 30
            },
            headerConfig: {
                middle: {
                    unit: "HOUR",
                    align: "center",
                    dateFormat: "G:i"
                },
                top: {
                    unit: "DAY",
                    align: "center",
                    dateFormat: "D d/m"
                }
            }
        },
        dayAndWeek: {
            timeColumnWidth: 100,
            rowHeight: 24,
            resourceColumnWidth: 100,
            displayDateFormat: "Y-m-d G:i",
            shiftUnit: "DAY",
            shiftIncrement: 1,
            defaultSpan: 5,
            timeResolution: {
                unit: "HOUR",
                increment: 1
            },
            headerConfig: {
                middle: {
                    unit: "DAY",
                    align: "center",
                    dateFormat: "D d M"
                },
                top: {
                    unit: "WEEK",
                    align: "center",
                    renderer: function (c, b, a) {
                        return Sch.util.Date.getShortNameOfUnit("WEEK") + "." + Ext.Date.format(c, "W M Y")
                    }
                }
            }
        },
        weekAndDay: {
            timeColumnWidth: 100,
            rowHeight: 24,
            resourceColumnWidth: 100,
            displayDateFormat: "Y-m-d",
            shiftUnit: "WEEK",
            shiftIncrement: 1,
            defaultSpan: 1,
            timeResolution: {
                unit: "DAY",
                increment: 1
            },
            headerConfig: {
                bottom: {
                    unit: "DAY",
                    align: "center",
                    increment: 1,
                    dateFormat: "d/m"
                },
                middle: {
                    unit: "WEEK",
                    dateFormat: "D d M"
                }
            }
        },
        weekAndMonth: {
            timeColumnWidth: 100,
            rowHeight: 24,
            resourceColumnWidth: 100,
            displayDateFormat: "Y-m-d",
            shiftUnit: "WEEK",
            shiftIncrement: 5,
            defaultSpan: 6,
            timeResolution: {
                unit: "DAY",
                increment: 1
            },
            headerConfig: {
                middle: {
                    unit: "WEEK",
                    renderer: function (c, b, a) {
                        return Ext.Date.format(c, "d M")
                    }
                },
                top: {
                    unit: "MONTH",
                    align: "center",
                    dateFormat: "M Y"
                }
            }
        },
        monthAndYear: {
            timeColumnWidth: 110,
            rowHeight: 24,
            resourceColumnWidth: 100,
            displayDateFormat: "Y-m-d",
            shiftIncrement: 3,
            shiftUnit: "MONTH",
            defaultSpan: 12,
            timeResolution: {
                unit: "DAY",
                increment: 1
            },
            headerConfig: {
                middle: {
                    unit: "MONTH",
                    align: "center",
                    dateFormat: "M Y"
                },
                top: {
                    unit: "YEAR",
                    align: "center",
                    dateFormat: "Y"
                }
            }
        },
        year: {
            timeColumnWidth: 100,
            rowHeight: 24,
            resourceColumnWidth: 100,
            displayDateFormat: "Y-m-d",
            shiftUnit: "YEAR",
            shiftIncrement: 1,
            defaultSpan: 1,
            timeResolution: {
                unit: "MONTH",
                increment: 1
            },
            headerConfig: {
                middle: {
                    unit: "QUARTER",
                    align: "center",
                    renderer: function (c, b, a) {
                        return Ext.String.format(Sch.util.Date.getShortNameOfUnit("QUARTER").toUpperCase() + "{0}", Math.floor(c.getMonth() / 3) + 1)
                    }
                },
                top: {
                    unit: "YEAR",
                    align: "center",
                    dateFormat: "Y"
                }
            }
        },
        manyYears: {
            timeColumnWidth: 50,
            rowHeight: 24,
            resourceColumnWidth: 100,
            displayDateFormat: "Y-m-d",
            shiftUnit: "YEAR",
            shiftIncrement: 1,
            defaultSpan: 1,
            timeResolution: {
                unit: "YEAR",
                increment: 1
            },
            headerConfig: {
                middle: {
                    unit: "YEAR",
                    align: "center",
                    dateFormat: "Y"
                }
            }
        },
        weekAndDayLetter: {
            timeColumnWidth: 20,
            rowHeight: 24,
            resourceColumnWidth: 100,
            displayDateFormat: "Y-m-d",
            shiftUnit: "WEEK",
            shiftIncrement: 1,
            defaultSpan: 10,
            timeResolution: {
                unit: "DAY",
                increment: 1
            },
            headerConfig: {
                bottom: {
                    unit: "DAY",
                    align: "center",
                    renderer: function (a) {
                        return Ext.Date.dayNames[a.getDay()].substring(0, 1)
                    }
                },
                middle: {
                    unit: "WEEK",
                    dateFormat: "D d M Y"
                }
            }
        },
        weekDateAndMonth: {
            timeColumnWidth: 30,
            rowHeight: 24,
            resourceColumnWidth: 100,
            displayDateFormat: "Y-m-d",
            shiftUnit: "WEEK",
            shiftIncrement: 1,
            defaultSpan: 10,
            timeResolution: {
                unit: "DAY",
                increment: 1
            },
            headerConfig: {
                middle: {
                    unit: "WEEK",
                    align: "center",
                    dateFormat: "d"
                },
                top: {
                    unit: "MONTH",
                    dateFormat: "Y F"
                }
            }
        }
    }
});

