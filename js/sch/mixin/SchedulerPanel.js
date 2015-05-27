Ext.define("Sch.mixin.SchedulerPanel", {
    extend: "Sch.mixin.AbstractSchedulerPanel",
    requires: ["Sch.view.SchedulerGridView", "Sch.selection.EventModel", "Sch.plugin.ResourceZones", "Sch.column.timeAxis.Vertical"],
    eventSelModelType: "eventmodel",
    eventSelModel: null,
    enableEventDragDrop: true,
    enableDragCreation: true,
    dragConfig: null,
    resourceZones: null,
    resourceZonesConfig: null,
    componentCls: "sch-schedulerpanel",
    lockedGridDependsOnSchedule: true,
    verticalListeners: null,
    inheritables: function () {
        return {
            initComponent: function () {
                var b = this.normalViewConfig = this.normalViewConfig || {};
                this._initializeSchedulerPanel();
                this.verticalListeners = {
                    clear: this.refreshResourceColumns,
                    datachanged: this.refreshResourceColumns,
                    update: this.refreshResourceColumns,
                    load: this.refreshResourceColumns,
                    scope: this
                };
                Ext.apply(b, {
                    eventStore: this.eventStore,
                    resourceStore: this.resourceStore,
                    eventBarTextField: this.eventBarTextField || this.eventStore.model.prototype.nameField
                });
                Ext.Array.forEach(["barMargin", "eventBodyTemplate", "eventTpl", "allowOverlap", "dragConfig", "eventBarIconClsField", "onEventCreated", "constrainDragToResource", "snapRelativeToEventStartDate"], function (e) {
                    if (e in this) {
                        b[e] = this[e]
                    }
                }, this);
                if (this.orientation === "vertical") {
                    this.mon(this.resourceStore, this.verticalListeners)
                }
                this.callParent(arguments);
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
                this.relayEvents(this.getSchedulingView(), ["eventclick", "eventmousedown", "eventmouseup", "eventdblclick", "eventcontextmenu", "eventmouseenter", "eventmouseleave", "beforeeventresize", "eventresizestart", "eventpartialresize", "beforeeventresizefinalize", "eventresizeend", "beforeeventdrag", "eventdragstart", "eventdrag", "beforeeventdropfinalize", "eventdrop", "aftereventdrop", "beforedragcreate", "dragcreatestart", "beforedragcreatefinalize", "dragcreateend", "afterdragcreate", "beforeeventadd", "scheduleclick", "scheduledblclick", "schedulecontextmenu"]);
                this.addEvents("orientationchange");
                if (!this.syncRowHeight) {
                    this.enableRowHeightInjection(d, c)
                }
            },
            afterRender: function () {
                this.callParent(arguments);
                this.getSchedulingView().on({
                    itemmousedown: this.onScheduleRowMouseDown,
                    eventmousedown: this.onScheduleEventBarMouseDown,
                    eventdragstart: this.doSuspendLayouts,
                    aftereventdrop: this.doResumeLayouts,
                    eventresizestart: this.doSuspendLayouts,
                    eventresizeend: this.doResumeLayouts,
                    scope: this
                })
            },
            getTimeSpanDefiningStore: function () {
                return this.eventStore
            }
        }
    },
    doSuspendLayouts: function () {
        this.lockedGrid.suspendLayouts();
        this.normalGrid.suspendLayouts()
    },
    doResumeLayouts: function () {
        this.lockedGrid.resumeLayouts();
        this.normalGrid.resumeLayouts()
    },
    onColWidthChange: function (a, b) {
        if (this.getOrientation() === "vertical") {
            this.resourceColumnWidth = b;
            this.refreshResourceColumns()
        }
    },
    enableRowHeightInjection: function (a, c) {
        var b = new Ext.XTemplate("{%", "this.processCellValues(values);", "this.nextTpl.applyOut(values, out, parent);", "%}", {
            priority: 1,
            processCellValues: function (e) {
                if (c.orientation === "horizontal") {
                    var f = c.eventLayout.horizontal;
                    var g = e.record;
                    var d = f.getRowHeight(g) - c.cellTopBorderWidth - c.cellBottomBorderWidth;
                    e.style = (e.style || "") + ";height:" + d + "px;"
                }
            }
        });
        a.addCellTpl(b);
        a.store.un("refresh", a.onDataRefresh, a);
        a.store.on("refresh", a.onDataRefresh, a)
    },
    getEventSelectionModel: function () {
        if (this.eventSelModel && this.eventSelModel.events) {
            return this.eventSelModel
        }
        if (!this.eventSelModel) {
            this.eventSelModel = {}
        }
        var a = this.eventSelModel;
        var b = "SINGLE";
        if (this.simpleSelect) {
            b = "SIMPLE"
        } else {
            if (this.multiSelect) {
                b = "MULTI"
            }
        }
        Ext.applyIf(a, {
            allowDeselect: this.allowDeselect,
            mode: b
        });
        if (!a.events) {
            a = this.eventSelModel = Ext.create("selection." + this.eventSelModelType, a)
        }
        if (!a.hasRelaySetup) {
            this.relayEvents(a, ["selectionchange", "deselect", "select"]);
            a.hasRelaySetup = true
        }
        if (this.disableSelection) {
            a.locked = true
        }
        return a
    },
    refreshResourceColumns: function () {
        var a = this.resourceColumnWidth || this.timeAxisViewModel.resourceColumnWidth;
        this.normalGrid.reconfigure(null, this.createResourceColumns(a))
    },
    setOrientation: function (a, d) {
        if (a === this.orientation && !d) {
            return
        }
        this.removeCls("sch-" + this.orientation);
        this.addCls("sch-" + a);
        this.orientation = a;
        var c = this,
            e = c.normalGrid,
            f = c.getSchedulingView(),
            b = e.headerCt;
        f.setOrientation(a);
        Ext.suspendLayouts();
        b.removeAll(true);
        Ext.resumeLayouts();
        if (a === "horizontal") {
            c.mun(c.resourceStore, c.verticalListeners);
            f.setRowHeight(c.rowHeight || c.timeAxisViewModel.rowHeight, true);
            c.reconfigure(c.resourceStore, c.horizontalColumns)
        } else {
            c.mon(c.resourceStore, c.verticalListeners);
            c.reconfigure(c.timeAxis, c.verticalColumns.concat(c.createResourceColumns(c.resourceColumnWidth || c.timeAxisViewModel.resourceColumnWidth)));
            f.setColumnWidth(c.timeAxisViewModel.resourceColumnWidth || 100, true)
        }
        this.fireEvent("orientationchange", this, a)
    },
    onScheduleRowMouseDown: function (a, c) {
        var b = this.lockedGrid.getSelectionModel();
        if (this.getOrientation() === "horizontal" && Ext.selection.RowModel && b instanceof Ext.selection.RowModel) {
            b.select(c)
        }
    },
    onScheduleEventBarMouseDown: function (a, d, f) {
        var c = this.normalGrid.view;
        var b = c.getRecord(c.findRowByChild(f.getTarget()));
        this.onScheduleRowMouseDown(a, b)
    }
});
