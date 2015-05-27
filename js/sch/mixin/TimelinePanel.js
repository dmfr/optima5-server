    Ext.define("Sch.mixin.TimelinePanel", {
        extend: "Sch.mixin.AbstractTimelinePanel",
        requires: ["Sch.util.Patch", "Sch.column.timeAxis.Horizontal", "Sch.preset.Manager"],
        mixins: ["Sch.mixin.Zoomable", "Sch.mixin.Lockable"],
        bufferCoef: 5,
        bufferThreshold: 0.2,
        infiniteScroll: false,
        waitingForAutoTimeSpan: false,
        columnLinesFeature: null,
        tipCfg: {
            cls: "sch-tip",
            showDelay: 1000,
            hideDelay: 0,
            autoHide: true,
            anchor: "b"
        },
        inheritables: function () {
            return {
                columnLines: true,
                enableLocking: true,
                lockable: true,
                initComponent: function () {
                    if (this.partnerTimelinePanel) {
                        this.timeAxisViewModel = this.partnerTimelinePanel.timeAxisViewModel;
                        this.timeAxis = this.partnerTimelinePanel.getTimeAxis();
                        this.startDate = this.timeAxis.getStart();
                        this.endDate = this.timeAxis.getEnd()
                    }
                    if (this.viewConfig && this.viewConfig.forceFit) {
                        this.forceFit = true
                    }
                    if (Ext.versions.extjs.isGreaterThanOrEqual("4.2.1")) {
                        this.cellTopBorderWidth = 0
                    }
                    this._initializeTimelinePanel();
                    this.configureColumns();
                    var c = this.normalViewConfig = this.normalViewConfig || {};
                    var e = this.getId();
                    Ext.apply(this.normalViewConfig, {
                        id: e + "-timelineview",
                        eventPrefix: this.autoGenId ? null : e,
                        timeAxisViewModel: this.timeAxisViewModel,
                        eventBorderWidth: this.eventBorderWidth,
                        timeAxis: this.timeAxis,
                        readOnly: this.readOnly,
                        orientation: this.orientation,
                        rtl: this.rtl,
                        cellBorderWidth: this.cellBorderWidth,
                        cellTopBorderWidth: this.cellTopBorderWidth,
                        cellBottomBorderWidth: this.cellBottomBorderWidth,
                        infiniteScroll: this.infiniteScroll,
                        bufferCoef: this.bufferCoef,
                        bufferThreshold: this.bufferThreshold
                    });
                    Ext.Array.forEach(["eventRendererScope", "eventRenderer", "dndValidatorFn", "resizeValidatorFn", "createValidatorFn", "tooltipTpl", "validatorFnScope", "eventResizeHandles", "enableEventDragDrop", "enableDragCreation", "resizeConfig", "createConfig", "tipCfg", "getDateConstraints"], function (f) {
                        if (f in this) {
                            c[f] = this[f]
                        }
                    }, this);
                    this.mon(this.timeAxis, "reconfigure", this.onMyTimeAxisReconfigure, this);
                    this.addEvents("timeheaderclick", "timeheaderdblclick", "timeheadercontextmenu", "beforeviewchange", "viewchange");
                    this.callParent(arguments);
                    this.switchViewPreset(this.viewPreset, this.startDate || this.timeAxis.getStart(), this.endDate || this.timeAxis.getEnd(), true);
                    if (!this.startDate) {
                        var a = this.getTimeSpanDefiningStore();
                        if (Ext.data.TreeStore && a instanceof Ext.data.TreeStore ? a.getRootNode().childNodes.length : a.getCount()) {
                            var d = a.getTotalTimeSpan();
                            this.setTimeSpan(d.start || new Date(), d.end)
                        } else {
                            this.bindAutoTimeSpanListeners()
                        }
                    }
                    var b = this.columnLines;
                    if (b) {
                        this.columnLinesFeature = new Sch.feature.ColumnLines(Ext.isObject(b) ? b : undefined);
                        this.columnLinesFeature.init(this);
                        this.columnLines = true
                    }
                    this.relayEvents(this.getSchedulingView(), ["beforetooltipshow"]);
                    this.on("afterrender", this.__onAfterRender, this);
                    this.on("zoomchange", function () {
                        this.normalGrid.scrollTask.cancel()
                    })
                },
                getState: function () {
                    var a = this,
                        b = a.callParent(arguments);
                    Ext.apply(b, {
                        viewPreset: a.viewPreset,
                        startDate: a.getStart(),
                        endDate: a.getEnd(),
                        zoomMinLevel: a.zoomMinLevel,
                        zoomMaxLevel: a.zoomMaxLevel,
                        currentZoomLevel: a.currentZoomLevel
                    });
                    return b
                },
                applyState: function (b) {
                    var a = this;
                    a.callParent(arguments);
                    if (b && b.viewPreset) {
                        a.switchViewPreset(b.viewPreset, b.startDate, b.endDate)
                    }
                    if (b && b.currentZoomLevel) {
                        a.zoomToLevel(b.currentZoomLevel)
                    }
                },
                setTimeSpan: function () {
                    if (this.waitingForAutoTimeSpan) {
                        this.unbindAutoTimeSpanListeners()
                    }
                    this.callParent(arguments);
                    if (!this.normalGrid.getView().viewReady) {
                        this.getView().refresh()
                    }
                }
            }
        },
        bindAutoTimeSpanListeners: function () {
            var a = this.getTimeSpanDefiningStore();
            this.waitingForAutoTimeSpan = true;
            this.normalGrid.getView().on("beforerefresh", this.refreshStopper, this);
            this.lockedGrid.getView().on("beforerefresh", this.refreshStopper, this);
            this.mon(a, "load", this.applyStartEndDatesFromStore, this);
            if (Ext.data.TreeStore && a instanceof Ext.data.TreeStore) {
                this.mon(a, "rootchange", this.applyStartEndDatesFromStore, this);
                this.mon(a.tree, "append", this.applyStartEndDatesAfterTreeAppend, this)
            } else {
                this.mon(a, "add", this.applyStartEndDatesFromStore, this)
            }
        },
        refreshStopper: function (a) {
            return a.store.getCount() === 0
        },
        getTimeSpanDefiningStore: function () {
            throw "Abstract method called"
        },
        unbindAutoTimeSpanListeners: function () {
            this.waitingForAutoTimeSpan = false;
            var a = this.getTimeSpanDefiningStore();
            this.normalGrid.getView().un("beforerefresh", this.refreshStopper, this);
            this.lockedGrid.getView().un("beforerefresh", this.refreshStopper, this);
            a.un("load", this.applyStartEndDatesFromStore, this);
            if (Ext.data.TreeStore && a instanceof Ext.data.TreeStore) {
                a.un("rootchange", this.applyStartEndDatesFromStore, this);
                a.tree.un("append", this.applyStartEndDatesAfterTreeAppend, this)
            } else {
                a.un("add", this.applyStartEndDatesFromStore, this)
            }
        },
        applyStartEndDatesAfterTreeAppend: function () {
            var a = this.getTimeSpanDefiningStore();
            if (!a.isSettingRoot) {
                this.applyStartEndDatesFromStore()
            }
        },
        applyStartEndDatesFromStore: function () {
            var a = this.getTimeSpanDefiningStore();
            var b = a.getTotalTimeSpan();
            var c = this.lockedGridDependsOnSchedule;
            this.lockedGridDependsOnSchedule = true;
            this.setTimeSpan(b.start || new Date(), b.end);
            this.lockedGridDependsOnSchedule = c
        },
        onMyTimeAxisReconfigure: function (a) {
            if (this.stateful && this.rendered) {
                this.saveState()
            }
        },
        onLockedGridItemDblClick: function (b, a, c, e, d) {
            if (this.orientation === "vertical" && a) {
                this.fireEvent("timeheaderdblclick", this, a.get("start"), a.get("end"), e, d)
            }
        },
        getSchedulingView: function () {
            return this.normalGrid.getView()
        },
        getTimeAxisColumn: function () {
            if (!this.timeAxisColumn) {
                this.timeAxisColumn = this.down("timeaxiscolumn")
            }
            return this.timeAxisColumn
        },
        configureColumns: function () {
            var a = this.columns || [];
            if (a.items) {
                a = a.items
            } else {
                a = this.columns = a.slice()
            }
            var c = [];
            var b = [];
            Ext.Array.each(a, function (d) {
                if (d.position === "right") {
                    if (!Ext.isNumber(d.width)) {
                        Ext.Error.raise('"Right" columns must have a fixed width')
                    }
                    d.locked = false;
                    b.push(d)
                } else {
                    d.locked = true;
                    c.push(d)
                }
                d.lockable = false
            });
            Ext.Array.erase(a, 0, a.length);
            Ext.Array.insert(a, 0, c.concat({
                xtype: "timeaxiscolumn",
                timeAxisViewModel: this.timeAxisViewModel,
                trackHeaderOver: this.trackHeaderOver,
                renderer: this.mainRenderer,
                scope: this
            }).concat(b));
            this.horizontalColumns = Ext.Array.clone(a);
            this.verticalColumns = [Ext.apply({
                xtype: "verticaltimeaxis",
                width: 100,
                timeAxis: this.timeAxis,
                timeAxisViewModel: this.timeAxisViewModel,
                cellTopBorderWidth: this.cellTopBorderWidth,
                cellBottomBorderWidth: this.cellBottomBorderWidth
            }, this.timeAxisColumnCfg || {})];
            if (this.orientation === "vertical") {
                this.columns = this.verticalColumns;
                this.store = this.timeAxis;
                this.on("beforerender", this.refreshResourceColumns, this)
            }
        },
        mainRenderer: function (b, m, g, j, l) {
            var c = this.renderers,
                k = this.orientation === "horizontal",
                d = k ? g : this.resourceStore.getAt(l),
                a = "&nbsp;";
            m.rowHeight = null;
            for (var e = 0; e < c.length; e++) {
                a += c[e].fn.call(c[e].scope || this, b, m, d, j, l) || ""
            }
            if (this.variableRowHeight) {
                var h = this.getSchedulingView();
                var f = this.timeAxisViewModel.getViewRowHeight();
                m.style = "height:" + ((m.rowHeight || f) - h.cellTopBorderWidth - h.cellBottomBorderWidth) + "px"
            }
            return a
        },
        __onAfterRender: function () {
            var a = this;
            a.normalGrid.on({
                collapse: a.onNormalGridCollapse,
                expand: a.onNormalGridExpand,
                scope: a
            });
            a.lockedGrid.on({
                collapse: a.onLockedGridCollapse,
                itemdblclick: a.onLockedGridItemDblClick,
                scope: a
            });
            if (a.lockedGridDependsOnSchedule) {
                a.normalGrid.getView().on("itemupdate", a.onNormalViewItemUpdate, a)
            }
            if (this.partnerTimelinePanel) {
                if (this.partnerTimelinePanel.rendered) {
                    this.setupPartnerTimelinePanel()
                } else {
                    this.partnerTimelinePanel.on("afterrender", this.setupPartnerTimelinePanel, this)
                }
            }
        },
        onLockedGridCollapse: function () {
            if (this.normalGrid.collapsed) {
                this.normalGrid.expand()
            }
        },
        onNormalGridCollapse: function () {
            var a = this;
            if (!a.normalGrid.reExpander) {
                a.normalGrid.reExpander = a.normalGrid.placeholder
            }
            if (!a.lockedGrid.rendered) {
                a.lockedGrid.on("render", a.onNormalGridCollapse, a, {
                    delay: 1
                })
            } else {
                a.lockedGrid.flex = 1;
                a.lockedGrid.doLayout();
                if (a.lockedGrid.collapsed) {
                    a.lockedGrid.expand()
                }
                a.addCls("sch-normalgrid-collapsed")
            }
        },
        onNormalGridExpand: function () {
            this.removeCls("sch-normalgrid-collapsed");
            delete this.lockedGrid.flex;
            this.lockedGrid.doLayout()
        },
        onNormalViewItemUpdate: function (a, b, d) {
            if (this.lockedGridDependsOnSchedule) {
                var c = this.lockedGrid.getView();
                c.suspendEvents();
                c.refreshNode(b);
                c.resumeEvents()
            }
        },
        setupPartnerTimelinePanel: function () {
            var f = this.partnerTimelinePanel;
            var d = f.down("splitter");
            var c = this.down("splitter");
            if (d) {
                d.on("dragend", function () {
                    this.lockedGrid.setWidth(f.lockedGrid.getWidth())
                }, this)
            }
            if (c) {
                c.on("dragend", function () {
                    f.lockedGrid.setWidth(this.lockedGrid.getWidth())
                }, this)
            }
            var b = f.isVisible() ? f.lockedGrid.getWidth() : f.lockedGrid.width;
            this.lockedGrid.setWidth(b);
            var a = f.getSchedulingView().getEl(),
                e = this.getSchedulingView().getEl();
            f.mon(e, "scroll", function (h, g) {
                a.scrollTo("left", g.scrollLeft)
            });
            this.mon(a, "scroll", function (h, g) {
                e.scrollTo("left", g.scrollLeft)
            });
            this.on("viewchange", function () {
                f.viewPreset = this.viewPreset
            }, this);
            f.on("viewchange", function () {
                this.viewPreset = f.viewPreset
            }, this)
        }
    }, function () {
        var a = "4.2.1";
        Ext.apply(Sch, {
            VERSION: "2.2.19"
        });
        if (Ext.versions.extjs.isLessThan(a)) {
            alert("The Ext JS version you are using needs to be updated to at least " + a)
        }
    }) ;

