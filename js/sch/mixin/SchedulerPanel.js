Ext.define("Sch.mixin.SchedulerPanel", {
    extend: "Sch.mixin.AbstractSchedulerPanel",
    requires: ["Sch.view.SchedulerGridView", "Sch.selection.EventModel", "Sch.column.timeAxis.Vertical"],
    eventSelModelType: null,
    eventSelModel: null,
    enableEventDragDrop: true,
    enableDragCreation: true,
    dragConfig: null,
    componentCls: "sch-schedulerpanel",
    lockedGridDependsOnSchedule: true,
    verticalListeners: null,
    horizontalLockedWidth: null,
    inheritables: function() {
        return {
            variableRowHeight: true,
            initComponent: function() {
                var b = this.normalViewConfig = this.normalViewConfig || {};
                this._initializeSchedulerPanel();
                this.verticalListeners = {
                    clear: this.refreshResourceColumns,
                    datachanged: this.refreshResourceColumns,
                    update: this.refreshResourceColumns,
                    load: this.refreshResourceColumns,
                    scope: this
                };
                this.calendarListeners = {
                    reconfigure: this.refreshCalendarColumns,
                    priority: 1,
                    scope: this
                };
                this.calendarViewListeners = {
                    columnresize: this.onCalendarColumnResize,
                    scope: this
                };
                Ext.apply(b, {
                    eventStore: this.eventStore,
                    resourceStore: this.resourceStore,
                    eventBarTextField: this.eventBarTextField || this.eventStore.model.prototype.nameField
                });
                Ext.Array.forEach(["barMargin", "eventBodyTemplate", "eventTpl", "allowOverlap", "dragConfig", "eventBarIconClsField", "onEventCreated", "constrainDragToResource", "snapRelativeToEventStartDate", "eventSelModelType", "simpleSelect", "multiSelect", "allowDeselect"], function(e) {
                    if (e in this) {
                        b[e] = this[e]
                    }
                }, this);
                this.callParent(arguments);
                if (this.mode === "vertical") {
                    this.mon(this.resourceStore, this.verticalListeners)
                }
                var d = this.lockedGrid.getView();
                var c = this.getSchedulingView();
                this.registerRenderer(c.columnRenderer, c);
                if (this.resourceZones) {
                    var a = Ext.StoreManager.lookup(this.resourceZones);
                    a.setResourceStore(this.resourceStore);
                    this.resourceZonesPlug = new Sch.plugin.ResourceZones(Ext.apply({
                        store: a
                    }, this.resourceZonesConfig));
                    this.resourceZonesPlug.init(this)
                }
                c.on("columnwidthchange", this.onColWidthChange, this);
                this.relayEvents(c, ["eventclick", "eventmousedown", "eventmouseup", "eventdblclick", "eventcontextmenu", "eventmouseenter", "eventmouseleave", "eventkeydown", "eventkeyup", "beforeeventresize", "eventresizestart", "eventpartialresize", "beforeeventresizefinalize", "eventresizeend", "beforeeventdrag", "eventdragstart", "eventdrag", "beforeeventdropfinalize", "eventdrop", "aftereventdrop", "beforedragcreate", "dragcreatestart", "beforedragcreatefinalize", "dragcreateend", "afterdragcreate", "beforeeventadd"]);
                if (!this.syncRowHeight) {
                    this.enableRowHeightInjection(d, c)
                }
            },
            applyViewSettings: function(c, b) {
                this.callParent(arguments);
                var d = this.getSchedulingView(),
                    a;
                b = b || !this.rendered;
                if (this.orientation === "vertical") {
                    a = c.timeColumnWidth || 60;
                    d.setColumnWidth(c.resourceColumnWidth || 100, true);
                    d.setRowHeight(a, true)
                }
            },
            afterRender: function() {
                this.callParent(arguments);
                if (this.mode === "calendar") {
                    this.mon(this.timeAxis, this.calendarListeners);
                    this.normalGrid.on(this.calendarViewListeners)
                }
                this.getSchedulingView().on({
                    eventdragstart: this.doSuspendLayouts,
                    aftereventdrop: this.doResumeLayouts,
                    eventresizestart: this.doSuspendLayouts,
                    eventresizeend: this.doResumeLayouts,
                    scope: this
                });
                this.relayEvents(this.getEventSelectionModel(), ["selectionchange", "deselect", "select"], "event")
            },
            getTimeSpanDefiningStore: function() {
                return this.eventStore
            }
        }
    },
    doSuspendLayouts: function() {
        var a = this.getSchedulingView();
        a.infiniteScroll && a.timeAxis.on({
            beginreconfigure: this.onBeginReconfigure,
            endreconfigure: this.onEndReconfigure,
            scope: this
        });
        this.lockedGrid.suspendLayouts();
        this.normalGrid.suspendLayouts()
    },
    doResumeLayouts: function() {
        var a = this.getSchedulingView();
        a.infiniteScroll && a.timeAxis.un({
            beginreconfigure: this.onBeginReconfigure,
            endreconfigure: this.onEndReconfigure,
            scope: this
        });
        this.lockedGrid.resumeLayouts();
        this.normalGrid.resumeLayouts()
    },
    onBeginReconfigure: function() {
        this.normalGrid.resumeLayouts()
    },
    onEndReconfigure: function() {
        this.normalGrid.suspendLayouts()
    },
    onColWidthChange: function(b, a) {
        switch (this.getMode()) {
            case "vertical":
                this.resourceColumnWidth = a;
                this.refreshResourceColumns();
                break;
            case "calendar":
                this.calendarColumnWidth = a;
                this.refreshCalendarColumns();
                break
        }
    },
    enableRowHeightInjection: function(b, d) {
        var a = this;
        var c = new Ext.XTemplate("{%", "this.processCellValues(values);", "this.nextTpl.applyOut(values, out, parent);", "%}", {
            priority: 1,
            processCellValues: function(e) {
                if (d.mode === "horizontal") {
                    var f = 1;
                    if (d.dynamicRowHeight) {
                        var i = e.record;
                        var h = d.eventLayout.horizontal;
                        f = h.getNumberOfBands(i, function() {
                            return d.eventStore.filterEventsForResource(i, d.timeAxis.isRangeInAxis, d.timeAxis)
                        })
                    }
                    var g = (f * a.getRowHeight()) - ((f - 1) * d.barMargin) - d.cellTopBorderWidth - d.cellBottomBorderWidth;
                    e.style = (e.style || "") + ";height:" + g + "px;"
                }
            }
        });
        b.addCellTpl(c);
        Ext.Array.forEach(b.getColumnManager().getColumns(), function(e) {
            e.hasCustomRenderer = true
        });
        b.store.un("refresh", b.onDataRefresh, b);
        b.store.on("refresh", b.onDataRefresh, b);
        b.on("destroy", function() {
            b.store.un("refresh", b.onDataRefresh, b)
        })
    },
    getEventSelectionModel: function() {
        return this.getSchedulingView().getEventSelectionModel()
    },
    refreshResourceColumns: function() {
        var a = this.resourceColumnWidth || this.timeAxisViewModel.resourceColumnWidth;
        this.normalGrid.reconfigure(null, this.createResourceColumns(a))
    },
    onCalendarColumnResize: function(d, c, b) {
        this.timeAxisViewModel.setViewColumnWidth(b, true);
        var a = this.getSchedulingView().calendar;
        a.repaintEventsForColumn(c, c.getIndex())
    },
    refreshCalendarColumns: function() {
        var b = this.createCalendarRows();
        var a = this.createCalendarColumns();
        this.reconfigure(b, this.calendarColumns.concat(a))
    },
    setOrientation: function() {
        this.setMode.apply(this, arguments)
    },
    setMode: function(d, a) {
        if (!this.normalGrid) {
            this.on("afterrender", function() {
                this.setMode(d, true)
            });
            return
        }
        if (d === this.mode && !a) {
            return
        }
        switch (d) {
            case "horizontal":
                this.addCls("sch-horizontal");
                this.removeCls(["sch-vertical", "sch-calendar", "sch-vertical-resource"]);
                break;
            case "vertical":
                this.addCls(["sch-vertical-resource", "sch-vertical"]);
                this.removeCls(["sch-calendar", "sch-horizontal"]);
                break;
            case "calendar":
                this.addCls(["sch-calendar", "sch-vertical"]);
                this.removeCls(["sch-vertical-resource", "sch-horizontal"]);
                break
        }
        this.mode = d;
        var h = this,
            e = function() {
                return false
            },
            g = h.normalGrid,
            i = h.lockedGrid.getView(),
            f = h.getSchedulingView(),
            c = g.headerCt;
        i.on("beforerefresh", e);
        f.on("beforerefresh", e);
        f.blockRefresh = i.blockRefresh = true;
        f.setMode(d);
        Ext.suspendLayouts();
        c.removeAll(true);
        Ext.resumeLayouts();
        if (d !== "calendar") {
            h.timeAxis.setMode("plain");
            h.mun(h.timeAxis, h.calendarListeners);
            if (h._oldViewPreset) {
                h.setViewPreset.apply(h, h._oldViewPreset);
                delete h._oldViewPreset
            }
        } else {
            h._oldViewPreset = [h.viewPreset, h.timeAxis.getStart(), h.timeAxis.getEnd()];
            h.timeAxis.setMode("calendar");
            h.setViewPreset(h.calendarViewPreset);
            h.mon(h.timeAxis, h.calendarListeners)
        }
        if (d === "horizontal") {
            h.mun(h.resourceStore, h.verticalListeners);
            h.normalGrid.un(h.calendarViewListeners);
            f.setRowHeight(h.rowHeight || h.timeAxisViewModel.rowHeightHorizontal, true);
            h.reconfigure(h.resourceStore, h.horizontalColumns);
            if (this.horizontalLockedWidth !== null) {
                this.lockedGrid.setWidth(this.horizontalLockedWidth)
            }
        } else {
            if (d === "calendar") {
                h.mun(h.resourceStore, h.verticalListeners);
                h.normalGrid.on(h.calendarViewListeners);
                h.refreshCalendarColumns();
                f.setRowHeight(h.rowHeight || h.timeAxisViewModel.rowHeightVertical, true);
                f.setColumnWidth(h.timeAxisViewModel.calendarColumnWidth || 100, true)
            } else {
                h.normalGrid.un(h.calendarViewListeners);
                var b = 0;
                this.horizontalLockedWidth = this.lockedGrid.getWidth();
                h.mon(h.resourceStore, h.verticalListeners);
                h.reconfigure(h.timeAxis, h.verticalColumns.concat(h.createResourceColumns(h.resourceColumnWidth || h.timeAxisViewModel.resourceColumnWidth)));
                Ext.Array.forEach(h.lockedGrid.query("gridcolumn"), function(j) {
                    b += j.rendered ? j.getWidth() : j.width || 100
                });
                f.setColumnWidth(h.timeAxisViewModel.resourceColumnWidth || 100, true);
                h.lockedGrid.setWidth(b)
            }
        }
        i.un("beforerefresh", e);
        f.un("beforerefresh", e);
        f.blockRefresh = i.blockRefresh = false;
        h.getView().refresh();
        this.fireEvent("modechange", this, d);
        this.fireEvent("orientationchange", this, d)
    },
    createCalendarRows: function() {
        var a = this;
        var b = a.timeAxis.getRowTicks();
        a.timeAxisViewModel.calendarRowsAmount = b.length;
        return new Ext.data.Store({
            model: "Sch.model.TimeAxisTick",
            data: b
        })
    },
    createCalendarColumns: function() {
        var b = this;
        var c = b.timeAxis.headerConfig.middle;
        var a = [];
        b.timeAxis.forEachAuxInterval(c.splitUnit, null, function(g, d, e) {
            g.setHours(this.startTime);
            d = new Date(g);
            d.setHours(this.endTime);
            var f = {
                xtype: "weekview-day",
                renderer: b.mainRenderer,
                scope: b,
                start: g,
                end: d
            };
            if (c.renderer) {
                f.text = c.renderer.call(c.scope || b, g, d, f, e, b.eventStore)
            } else {
                f.text = Ext.Date.format(g, c.dateFormat)
            }
            a.push(f)
        });
        return a
    },
    setRowHeight: function(a, b) {
        b = b || !this.lockedGrid;
        this.timeAxisViewModel.setViewRowHeight(a, b)
    }
});
