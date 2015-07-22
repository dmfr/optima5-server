    Ext.define("Sch.mixin.TimelinePanel", {
        extend: "Sch.mixin.AbstractTimelinePanel",
        requires: ["Sch.util.Patch", "Sch.column.timeAxis.Horizontal", "Sch.preset.Manager", "Sch.patches.NodeCache", "Sch.patches.BufferedRenderer", "Sch.patches.RowSynchronizer"],
        mixins: ["Sch.mixin.Zoomable"],
        bufferCoef: 5,
        bufferThreshold: 0.2,
        infiniteScroll: false,
        showCrudManagerMask: true,
        waitingForAutoTimeSpan: false,
        columnLinesFeature: null,
        renderWaitListener: null,
        schedulePinchThreshold: 30,
        pinchStartDistanceX: null,
        pinchStartDistanceY: null,
        pinchDistanceX: null,
        pinchDistanceY: null,
        horizontalColumns: null,
        verticalColumns: null,
        calendarColumns: null,
        forceDefineTimeSpanByStore: false,
        tipCfg: {
            cls: "sch-tip",
            showDelay: 1000,
            hideDelay: 0,
            autoHide: true,
            anchor: "b"
        },
        inheritables: function() {
            return {
                columnLines: true,
                enableLocking: true,
                lockable: true,
                stateEvents: ["viewchange"],
                syncRowHeight: false,
                cellTopBorderWidth: 0,
                constructor: function(a) {
                    a = a || {};
                    if (this.layout === "border") {
                        a.layout = "border"
                    }
                    this.callParent([a])
                },
                initComponent: function() {
                    if (this.partnerTimelinePanel) {
                        if (typeof this.partnerTimelinePanel === "string") {
                            this.partnerTimelinePanel = Ext.getCmp(this.partnerTimelinePanel)
                        }
                        this.timeAxisViewModel = this.partnerTimelinePanel.timeAxisViewModel;
                        this.timeAxis = this.partnerTimelinePanel.getTimeAxis();
                        this.startDate = this.timeAxis.getStart();
                        this.endDate = this.timeAxis.getEnd()
                    }
                    this._initializeTimelinePanel();
                    this.configureChildGrids();
                    this.forceFit = false;
                    this.configureColumns();
                    var c = this.normalViewConfig = this.normalViewConfig || {};
                    var d = this.getId();
                    Ext.apply(this.normalViewConfig, {
                        id: d + "-timelineview",
                        eventPrefix: this.autoGenId ? null : d,
                        timeAxisViewModel: this.timeAxisViewModel,
                        eventBorderWidth: this.eventBorderWidth,
                        timeAxis: this.timeAxis,
                        readOnly: this.readOnly,
                        mode: this.mode,
                        rtl: this.rtl,
                        cellBorderWidth: this.cellBorderWidth,
                        cellTopBorderWidth: this.cellTopBorderWidth,
                        cellBottomBorderWidth: this.cellBottomBorderWidth,
                        infiniteScroll: this.infiniteScroll,
                        bufferCoef: this.bufferCoef,
                        bufferThreshold: this.bufferThreshold
                    });
                    Ext.Array.forEach(["eventRendererScope", "eventRenderer", "dndValidatorFn", "resizeValidatorFn", "createValidatorFn", "tooltipTpl", "validatorFnScope", "eventResizeHandles", "enableEventDragDrop", "enableDragCreation", "resizeConfig", "createConfig", "tipCfg", "getDateConstraints"], function(e) {
                        if (e in this) {
                            c[e] = this[e]
                        }
                    }, this);
                    this.callParent(arguments);
                    this.patchNavigationModel(this);
                    this.setViewPreset(this.viewPreset, this.startDate || this.timeAxis.getStart(), this.endDate || this.timeAxis.getEnd(), true);
                    if (!this.startDate) {
                        var a = this.getTimeSpanDefiningStore();
                        if (Ext.data.TreeStore && a instanceof Ext.data.TreeStore ? a.getRootNode().childNodes.length : a.getCount()) {
                            this.applyStartEndDatesFromStore()
                        } else {
                            if (a.isLoading() || this.forceDefineTimeSpanByStore) {
                                this.bindAutoTimeSpanListeners()
                            }
                        }
                    }
                    var b = this.columnLines;
                    if (b) {
                        this.columnLinesFeature = new Sch.feature.ColumnLines(Ext.isObject(b) ? b : undefined);
                        this.columnLinesFeature.init(this);
                        this.columnLines = true
                    }
                    this.relayEvents(this.getSchedulingView(), ["beforetooltipshow", "scheduleclick", "scheduledblclick", "schedulecontextmenu", "schedulepinch", "schedulepinchstart", "schedulepinchend"]);
                    this.on("boxready", this.__onBoxReady, this);
                    this.on("zoomchange", function() {
                        this.normalGrid.scrollTask.cancel()
                    });
                    if (this.crudManager && !this.crudManager.autoSync && this.showCrudManagerMask) {
                        this.mon(this.crudManager, {
                            beforesend: this.beforeCrudOperationStart,
                            synccanceled: this.onCrudOperationComplete,
                            loadcanceled: this.onCrudOperationComplete,
                            load: this.onCrudOperationComplete,
                            sync: this.onCrudOperationComplete,
                            loadfail: this.onCrudOperationComplete,
                            syncfail: this.onCrudOperationComplete,
                            scope: this
                        });
                        if (this.crudManager.isLoading()) {
                            this.beforeCrudOperationStart(this.crudManager, null, "load")
                        }
                    }
                    this.afterInitComponent()
                },
                getState: function() {
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
                applyState: function(b) {
                    var a = this;
                    a.callParent(arguments);
                    if (b && b.viewPreset) {
                        a.setViewPreset(b.viewPreset, b.startDate, b.endDate)
                    }
                    if (b && b.currentZoomLevel) {
                        a.zoomToLevel(b.currentZoomLevel)
                    }
                },
                setTimeSpan: function() {
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
        bindAutoTimeSpanListeners: function() {
            var a = this.getTimeSpanDefiningStore();
            this.waitingForAutoTimeSpan = true;
            this.normalGrid.getView().on("beforerefresh", this.refreshStopper, this);
            this.lockedGrid.getView().on("beforerefresh", this.refreshStopper, this);
            this.mon(a, "load", this.applyStartEndDatesFromStore, this);
            if (Ext.data.TreeStore && a instanceof Ext.data.TreeStore) {
                this.mon(a, "rootchange", this.applyStartEndDatesFromStore, this);
                this.mon(a, "nodeappend", this.applyStartEndDatesAfterTreeAppend, this)
            } else {
                this.mon(a, "add", this.applyStartEndDatesFromStore, this)
            }
        },
        refreshStopper: function(a) {
            return a.store.getCount() === 0
        },
        getTimeSpanDefiningStore: function() {
            throw "Abstract method called"
        },
        unbindAutoTimeSpanListeners: function() {
            this.waitingForAutoTimeSpan = false;
            var a = this.getTimeSpanDefiningStore();
            this.normalGrid.getView().un("beforerefresh", this.refreshStopper, this);
            this.lockedGrid.getView().un("beforerefresh", this.refreshStopper, this);
            a.un("load", this.applyStartEndDatesFromStore, this);
            if (Ext.data.TreeStore && a instanceof Ext.data.TreeStore) {
                a.un("rootchange", this.applyStartEndDatesFromStore, this);
                a.un("nodeappend", this.applyStartEndDatesAfterTreeAppend, this)
            } else {
                a.un("add", this.applyStartEndDatesFromStore, this)
            }
        },
        applyStartEndDatesAfterTreeAppend: function() {
            var a = this.getTimeSpanDefiningStore();
            if (!a.isSettingRoot && !a.__loading) {
                this.applyStartEndDatesFromStore()
            }
        },
        applyStartEndDatesFromStore: function() {
            var a = this.getTimeSpanDefiningStore();
            var b = a.getTotalTimeSpan();
            var c = this.lockedGridDependsOnSchedule;
            if (b.end && b.start && b.end - b.start === 0) {
                b.start = Sch.util.Date.add(b.start, this.timeAxis.mainUnit, -1);
                b.end = Sch.util.Date.add(b.end, this.timeAxis.mainUnit, 1)
            }
            this.lockedGridDependsOnSchedule = true;
            this.setTimeSpan(b.start || new Date(), b.end);
            this.lockedGridDependsOnSchedule = c
        },
        onLockedGridItemDblClick: function(b, a, c, e, d) {
            if (this.mode === "vertical" && a) {
                this.fireEvent("timeheaderdblclick", this, a.get("start"), a.get("end"), e, d)
            }
        },
        getSchedulingView: function() {
            return this.normalGrid.getView()
        },
        getHorizontalTimeAxisColumn: function() {
            return this.getSchedulingView().getHorizontalTimeAxisColumn()
        },
        configureColumns: function() {
            var a = this.columns || [];
            if (a.items) {
                a = a.items
            } else {
                a = this.columns = a.slice()
            }
            var c = [];
            var b = [];
            Ext.Array.forEach(a, function(d) {
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
            this.calendarColumns = [Ext.apply({
                xtype: "verticaltimeaxis",
                width: 60,
                timeAxis: this.timeAxis,
                timeAxisViewModel: this.timeAxisViewModel,
                cellTopBorderWidth: this.cellTopBorderWidth,
                cellBottomBorderWidth: this.cellBottomBorderWidth
            }, this.calendarTimeAxisCfg || {})];
            if (this.mode === "vertical") {
                this.columns = this.verticalColumns.concat(this.createResourceColumns(this.resourceColumnWidth || this.timeAxisViewModel.resourceColumnWidth));
                this.store = this.timeAxis
            } else {
                if (this.mode === "calendar") {
                    this.columns = [];
                    this.store = null;
                    this.on("afterrender", this.refreshCalendarColumns, this)
                }
            }
        },
        mainRenderer: function(b, l, g, j, k) {
            var c = this.renderers,
                d = this.mode === "horizontal" || this.mode === "calendar" ? g : this.resourceStore.getAt(k),
                a = "&nbsp;";
            l.rowHeight = null;
            for (var e = 0; e < c.length; e++) {
                a += c[e].fn.call(c[e].scope || this, b, l, d, j, k) || ""
            }
            if (this.variableRowHeight) {
                var h = this.getSchedulingView();
                var f = this.getRowHeight();
                l.style = "height:" + ((l.rowHeight || f) - h.cellTopBorderWidth - h.cellBottomBorderWidth) + "px"
            }
            return a
        },
        __onBoxReady: function() {
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
                    this.partnerTimelinePanel.on("boxready", this.setupPartnerTimelinePanel, this)
                }
            }
            if (Ext.supports.Touch) {
                this.getSchedulingView().on({
                    schedulepinchstart: this.onSchedulePinchStart,
                    schedulepinch: this.onSchedulePinch,
                    schedulepinchend: this.onSchedulePinchEnd,
                    scope: this
                })
            }
        },
        onLockedGridCollapse: function() {
            if (this.normalGrid.collapsed) {
                this.normalGrid.expand()
            }
        },
        onNormalGridCollapse: function() {
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
                a.lockedGrid.updateLayout();
                if (a.lockedGrid.collapsed) {
                    a.lockedGrid.expand()
                }
                a.addCls("sch-normalgrid-collapsed")
            }
        },
        onNormalGridExpand: function() {
            this.removeCls("sch-normalgrid-collapsed");
            delete this.lockedGrid.flex;
            this.lockedGrid.updateLayout()
        },
        onNormalViewItemUpdate: function(a, b, d) {
            if (this.lockedGridDependsOnSchedule) {
                var c = this.lockedGrid.getView();
                c.suspendEvents();
                c.refreshNode(c.indexOf(a));
                c.resumeEvents()
            }
        },
        onPartnerCollapseExpand: function(a) {
            if (a.getCollapsed()) {
                this.lockedGrid.collapse()
            } else {
                this.lockedGrid.expand()
            }
        },
        setupPartnerTimelinePanel: function() {
            var i = this.partnerTimelinePanel;
            var j = i.down("splitter");
            var a = this.down("splitter");
            if (j) {
                j.on("dragend", function() {
                    this.lockedGrid.setWidth(i.lockedGrid.getWidth())
                }, this)
            }
            if (a) {
                a.on("dragend", function() {
                    i.lockedGrid.setWidth(this.lockedGrid.getWidth())
                }, this)
            }
            var d = i.isVisible() ? i.lockedGrid.getWidth() : i.lockedGrid.width;
            if (i.lockedGrid.getCollapsed()) {
                i.lockedGrid.on("viewready", function(m) {
                    this.lockedGrid.setWidth(m.getWidth())
                }, this)
            } else {
                this.lockedGrid.setWidth(d)
            }
            this.on("afterlayout", function() {
                if (i.lockedGrid.getCollapsed()) {
                    this.lockedGrid.collapse()
                } else {
                    this.lockedGrid.expand();
                    this.lockedGrid.setWidth(d)
                }
            }, this, {
                single: true
            });
            i.lockedGrid.on({
                collapse: this.onPartnerCollapseExpand,
                expand: this.onPartnerCollapseExpand,
                scope: this
            });
            this.lockedGrid.on({
                collapse: this.onPartnerCollapseExpand,
                expand: this.onPartnerCollapseExpand,
                scope: i
            });
            var k = i.getSchedulingView(),
                f = k.scrollManager ? k.scrollManager.scroller : k.getEl(),
                b = this.getSchedulingView(),
                l = b.scrollManager ? b.scrollManager.scroller : b.getEl(),
                h, g = false,
                e = Ext.Function.createBuffered(function() {
                    h = null;
                    g = false
                }, 300);
            var c = function(p, o) {
                var m = o.id === b.id ? b : k;
                var n = o.id === b.id ? k : b;
                if (!h) {
                    h = m
                }
                e();
                if (n !== h && !g) {
                    n.setScrollX(m.getScroll().left)
                }
            };
            k.mon(l, "scroll", c);
            b.mon(f, "scroll", c);
            b.mon(i, "zoomchange", function(n, p, m, o) {
                g = true;
                if (m) {
                    b.setScrollX(m)
                }
            });
            this.on("viewchange", function() {
                i.viewPreset = this.viewPreset
            }, this);
            i.on("viewchange", function() {
                this.viewPreset = i.viewPreset
            }, this)
        },
        beforeCrudOperationStart: function(a, c, b) {
            if (this.rendered) {
                this.setLoading({
                    msg: b === "load" ? this.L("loadingText") : this.L("savingText")
                })
            } else {
                Ext.destroy(this.renderWaitListener);
                this.renderWaitListener = this.on("render", Ext.Function.bind(this.beforeCrudOperationStart, this, Array.prototype.slice.apply(arguments)), this, {
                    delay: 1,
                    destroyable: true
                })
            }
        },
        onCrudOperationComplete: function() {
            Ext.destroy(this.renderWaitListener);
            this.setLoading(false)
        },
        onSchedulePinchStart: function(a, b) {
            this.pinchStartDistanceX = Math.abs(b.touches[0].pageX - b.touches[1].pageX);
            this.pinchStartDistanceY = Math.abs(b.touches[0].pageY - b.touches[1].pageY)
        },
        onSchedulePinch: function(a, b) {
            this.pinchDistanceX = Math.abs(b.touches[0].pageX - b.touches[1].pageX);
            this.pinchDistanceY = Math.abs(b.touches[0].pageY - b.touches[1].pageY)
        },
        onSchedulePinchEnd: function(a, g) {
            var f = this.pinchDistanceX;
            var d = this.pinchDistanceY;
            var h = this.getMode()[0] === "h";
            if (Math.abs(f - this.pinchStartDistanceX) > this.schedulePinchThreshold) {
                var c = Math.abs(f / this.pinchStartDistanceX);
                if (h) {
                    c > 1 ? this.zoomIn() : this.zoomOut()
                } else {
                    this.timeAxisViewModel.setViewColumnWidth(c * this.timeAxisViewModel.resourceColumnWidth)
                }
            }
            if (Math.abs(d - this.pinchStartDistanceY) > this.schedulePinchThreshold) {
                var b = Math.abs(d / this.pinchStartDistanceY);
                a.setRowHeight(a.getRowHeight() * b)
            }
            this.pinchStartDistanceX = this.pinchStartDistanceY = this.pinchDistanceX = this.pinchDistanceY = null
        },
        patchNavigationModel: function(c) {
            c.getView().getNavigationModel().focusItem = function(d) {
                d.addCls(this.focusCls);
                if ((Ext.isIE && !d.hasCls("sch-timetd")) || (!Ext.isIE && c.getOrientation() === "horizontal")) {
                    d.focus()
                }
            };
            var b = c.lockedGrid.getView();
            var a = c.normalGrid.getView();
            b.on("rowclick", function(e, d, f, g) {
                if (a.lastFocused) {
                    a.lastFocused.rowIdx = g;
                    a.lastFocused.record = d
                }
            });
            a.on("rowclick", function(e, d, f, g) {
                if (b.lastFocused) {
                    b.lastFocused.rowIdx = g;
                    b.lastFocused.record = d
                }
            })
        },
        configureChildGrids: function() {
            var a = this;
            a.lockedGridConfig = Ext.apply({}, a.lockedGridConfig || {});
            a.normalGridConfig = Ext.apply({}, a.schedulerConfig || a.normalGridConfig || {});
            var c = a.lockedGridConfig,
                b = a.normalGridConfig;
            if (a.lockedXType) {
                c.xtype = a.lockedXType
            }
            if (a.normalXType) {
                b.xtype = a.normalXType
            }
            Ext.applyIf(c, {
                useArrows: true,
                split: true,
                animCollapse: false,
                collapseDirection: "left",
                trackMouseOver: false,
                region: "west"
            });
            Ext.applyIf(b, {
                viewType: a.viewType,
                layout: "fit",
                enableColumnMove: false,
                enableColumnResize: false,
                enableColumnHide: false,
                trackMouseOver: false,
                collapseDirection: "right",
                collapseMode: "placeholder",
                animCollapse: false,
                region: "center"
            });
            if (a.mode === "vertical") {
                c.store = b.store = a.timeAxis
            }
            if (c.width) {
                a.syncLockedWidth = Ext.emptyFn;
                c.scroll = Ext.supports.Touch ? "both" : "horizontal";
                c.scrollerOwner = true
            }
        },
        afterInitComponent: function() {
            var d = this;
            var c = d.lockedGrid.getView();
            var b = d.normalGrid.getView();
            var a = Ext.data.TreeStore && d.store instanceof Ext.data.TreeStore;
            if (d.normalGrid.collapsed) {
                d.normalGrid.collapsed = false;
                b.on("boxready", function() {
                    d.normalGrid.collapse()
                }, d, {
                    delay: 10
                })
            }
            if (d.lockedGrid.collapsed) {
                if (c.bufferedRenderer) {
                    c.bufferedRenderer.disabled = true
                }
            }
            if (Ext.getScrollbarSize().width === 0) {
                c.addCls("sch-ganttpanel-force-locked-scroll")
            }
            if (a) {
                this.setupLockableFilterableTree()
            }
            this.on("afterrender", function() {
                var e = this.lockedGrid.headerCt.showMenuBy;
                this.lockedGrid.headerCt.showMenuBy = function() {
                    e.apply(this, arguments);
                    d.showMenuBy.apply(this, arguments)
                }
            })
        },
        setupLockableFilterableTree: function() {
            var c = this;
            var b = c.lockedGrid.getView();
            var a = Sch.mixin.FilterableTreeView.prototype;
            b.initTreeFiltering = a.initTreeFiltering;
            b.onFilterChangeStart = a.onFilterChangeStart;
            b.onFilterChangeEnd = a.onFilterChangeEnd;
            b.onFilterCleared = a.onFilterCleared;
            b.onFilterSet = a.onFilterSet;
            b.initTreeFiltering()
        },
        showMenuBy: function(b, f) {
            var e = this.getMenu(),
                c = e.down("#unlockItem"),
                d = e.down("#lockItem"),
                a = c.prev();
            a.hide();
            c.hide();
            d.hide()
        },
        zoomToFit: function(a) {
            a = Ext.apply({
                adjustStart: 1,
                adjustEnd: 1
            }, a);
            var b = this.getEventStore();
            var c = b.getTotalTimeSpan();
            if (this.zoomToSpan(c, a) === null) {
                this.getSchedulingView().fitColumns()
            }
        }
    }, function() {
        var a = "5.1.0";
        Ext.apply(Sch, {
            VERSION: "3.0.5"
        });
    });
