Ext.define("Sch.mixin.SchedulerView", {
    extend: "Sch.mixin.AbstractSchedulerView",
    mixins: ["Sch.mixin.Localizable"],
    requires: ["Sch.feature.DragCreator", "Sch.feature.DragDrop", "Sch.feature.ResizeZone", "Sch.column.Resource", "Sch.view.Calendar", "Ext.XTemplate"],
    eventResizeHandles: "end",
    dndValidatorFn: Ext.emptyFn,
    resizeValidatorFn: Ext.emptyFn,
    createValidatorFn: Ext.emptyFn,
    calendarViewClass: "Sch.view.Calendar",
    _initializeSchedulerView: function() {
        this.callParent(arguments);
        this.on({
            destroy: this._destroy,
            afterrender: this._afterRender,
            itemupdate: this.onRowUpdated,
            scope: this
        });
        var a = this;
        if (!this.eventPrefix) {
            throw "eventPrefix missing"
        }
        a.eventTpl = a.eventTpl || Ext.create(this.eventTemplateClass, {
            eventPrefix: this.eventPrefix,
            resizeHandles: this.eventResizeHandles
        })
    },
    inheritables: function() {
        return {
            loadingText: this.L("loadingText"),
            overItemCls: "",
            trackOver: false,
            selectedItemCls: "",
            setReadOnly: function(a) {
                if (this.dragCreator) {
                    this.dragCreator.setDisabled(a)
                }
                this.callParent(arguments)
            },
            repaintEventsForResource: function(e, c) {
                var d = this,
                    g = d.getMode(),
                    f = g === "horizontal",
                    a = f ? d.indexOf(e) : 0;
                if (f) {
                    d.eventLayout.horizontal.clearCache(e)
                }
                if (a >= 0) {
                    Ext.suspendLayouts();
                    if (f) {
                        d.refreshNode(e);
                        d.lockingPartner.refreshNode(e)
                    } else {
                        d.refreshNode(a);
                        d.lockingPartner.refreshNode(a)
                    }
                    Ext.resumeLayouts();
                    if (c) {
                        var h = d.getEventSelectionModel();
                        var b = d.eventStore.getEventsForResource(e);
                        Ext.Array.forEach(b, function(i) {
                            h.forEachEventRelatedSelection(i, function(j) {
                                d.onEventBarSelect(j, true)
                            })
                        })
                    }
                }
            },
            repaintAllEvents: function() {
                if (this.mode === "horizontal") {
                    this.refresh()
                } else {
                    this.refreshNode(0)
                }
            },
            handleScheduleEvent: function(g) {
                var a = g.getTarget("." + this.eventCls, 3),
                    j = !a && g.getTarget("." + this.timeCellCls, 3);
                if (j) {
                    var k = this.getDateFromDomEvent(g, "floor");
                    var i = this.findRowByChild(j);
                    var f = this.indexOf(i);
                    var b;
                    if (this.mode == "horizontal") {
                        b = this.getRecordForRowNode(i)
                    } else {
                        var c = g.getTarget(this.timeCellSelector, 5);
                        if (c) {
                            var h = typeof c.cellIndex == "number" ? c.cellIndex : c.getAttribute("data-cellIndex");
                            var d = this.headerCt.getGridColumns()[h];
                            b = d && d.model
                        }
                    }
                    if (g.type.indexOf("pinch") >= 0) {
                        this.fireEvent("schedule" + g.type, this, g)
                    } else {
                        this.fireEvent("schedule" + g.type, this, k, f, b, g)
                    }
                }
            },
            onEventDataRefresh: function() {
                this.clearRowHeightCache();
                this.callParent(arguments)
            },
            onUnbindStore: function(a) {
                a.un({
                    refresh: this.clearRowHeightCache,
                    clear: this.clearRowHeightCache,
                    load: this.clearRowHeightCache,
                    scope: this
                });
                this.callParent(arguments)
            },
            bindStore: function(a) {
                a && a.on({
                    refresh: this.clearRowHeightCache,
                    clear: this.clearRowHeightCache,
                    load: this.clearRowHeightCache,
                    scope: this
                });
                this.callParent(arguments)
            }
        }
    },
    getEventSelectionModel: function() {
        var b = this,
            c = b.eventSelModel,
            a = b.eventSelModelType,
            d;
        if (c && c.events) {
            return c
        }
        if (!c) {
            c = {}
        }
        if (!a && b.eventStore.getAssignmentStore()) {
            a = "assignmentmodel"
        } else {
            if (!a) {
                a = "eventmodel"
            }
        }
        d = "SINGLE";
        if (b.simpleSelect) {
            d = "SIMPLE"
        } else {
            if (b.multiSelect) {
                d = "MULTI"
            }
        }
        Ext.applyIf(c, {
            allowDeselect: b.allowDeselect,
            mode: d
        });
        if (!c.events) {
            c = b.eventSelModel = Ext.create("selection." + a, c)
        }
        if (b.disableSelection) {
            c.locked = true
        }
        return c
    },
    _afterRender: function() {
        this.bindEventStore(this.eventStore, true);
        this.getEventSelectionModel().bindToView(this);
        this.setupEventListeners();
        this.configureFunctionality();
        var a = this.headerCt.resizer;
        if (a) {
            a.doResize = Ext.Function.createSequence(a.doResize, this.afterHeaderResized, this)
        }
    },
    _destroy: function() {
        this.bindEventStore(null)
    },
    clearRowHeightCache: function() {
        if (this.mode === "horizontal") {
            this.eventLayout.horizontal.clearCache()
        }
    },
    configureFunctionality: function() {
        var a = this.validatorFnScope || this;
        if (this.eventResizeHandles !== "none" && Sch.feature.ResizeZone) {
            this.resizePlug = new Sch.feature.ResizeZone(Ext.applyIf({
                schedulerView: this,
                validatorFn: function(d, c, b, e) {
                    return (this.allowOverlap || this.isDateRangeAvailable(b, e, c, d)) && this.resizeValidatorFn.apply(a, arguments)
                },
                validatorFnScope: this
            }, this.resizeConfig || {}))
        }
        if (this.enableEventDragDrop !== false && Sch.feature.DragDrop) {
            this.dragdropPlug = new Sch.feature.DragDrop(this, {
                validatorFn: function(c, b, d, e) {
                    return (this.allowOverlap || this.isDateRangeAvailable(d, Sch.util.Date.add(d, Sch.util.Date.MILLI, e), c[0], b)) && this.dndValidatorFn.apply(a, arguments)
                },
                validatorFnScope: this,
                dragConfig: this.dragConfig || {}
            })
        }
        if (this.enableDragCreation !== false && Sch.feature.DragCreator) {
            this.dragCreator = new Sch.feature.DragCreator(Ext.applyIf({
                schedulerView: this,
                disabled: this.readOnly,
                validatorFn: function(c, b, d) {
                    return (this.allowOverlap || this.isDateRangeAvailable(b, d, null, c)) && this.createValidatorFn.apply(a, arguments)
                },
                validatorFnScope: this
            }, this.createConfig || {}))
        }
    },
    onBeforeDragDrop: function(a, c, b) {
        return !this.readOnly && !b.getTarget().className.match("sch-resizable-handle")
    },
    onDragDropStart: function() {
        if (this.dragCreator) {
            this.dragCreator.setDisabled(true)
        }
        if (this.tip) {
            this.tip.hide();
            this.tip.disable()
        }
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(false)
        }
    },
    onDragDropEnd: function() {
        if (this.dragCreator) {
            this.dragCreator.setDisabled(false)
        }
        if (this.tip) {
            this.tip.enable()
        }
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(true)
        }
    },
    onBeforeDragCreate: function(b, c, a, d) {
        return !this.readOnly && !d.ctrlKey
    },
    onDragCreateStart: function() {
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(false)
        }
        if (this.tip) {
            this.tip.hide();
            this.tip.disable()
        }
        this.disableViewScroller(true)
    },
    onDragCreateEnd: function(b, a) {
        if (!this.getEventEditor()) {
            if (this.fireEvent("beforeeventadd", this, a) !== false) {
                this.onEventCreated(a);
                this.eventStore.append(a)
            }
            this.dragCreator.getProxy().hide()
        }
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(true)
        }
    },
    onEventCreated: function(a) {},
    onAfterDragCreate: function() {
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(true)
        }
        if (this.tip) {
            this.tip.enable()
        }
        this.disableViewScroller(false)
    },
    onBeforeResize: function() {
        return !this.readOnly
    },
    onResizeStart: function() {
        if (this.tip) {
            this.tip.hide();
            this.tip.disable()
        }
        if (this.dragCreator) {
            this.dragCreator.setDisabled(true)
        }
        this.disableViewScroller(true)
    },
    onResizeEnd: function() {
        if (this.tip) {
            this.tip.enable()
        }
        if (this.dragCreator) {
            this.dragCreator.setDisabled(false)
        }
        this.disableViewScroller(false)
    },
    setupEventListeners: function() {
        this.on({
            beforeeventdrag: this.onBeforeDragDrop,
            eventdragstart: this.onDragDropStart,
            aftereventdrop: this.onDragDropEnd,
            beforedragcreate: this.onBeforeDragCreate,
            dragcreatestart: this.onDragCreateStart,
            dragcreateend: this.onDragCreateEnd,
            afterdragcreate: this.onAfterDragCreate,
            beforeeventresize: this.onBeforeResize,
            eventresizestart: this.onResizeStart,
            eventresizeend: this.onResizeEnd,
            scope: this
        })
    },
    afterHeaderResized: function() {
        var b = this.headerCt.resizer;
        if (b && this.getMode() !== "horizontal") {
            if (this.panel.forceFit) {
                this.setColumnWidth(b.origWidth)
            } else {
                var a = b.dragHd.getWidth();
                this.setColumnWidth(a)
            }
        }
    },
    columnRenderer: function(e, c, a, d, b) {
        return this[this.mode].columnRenderer(e, c, a, d, b)
    },
    onRowUpdated: function(c) {
        var b = this,
            a;
        if (b.getMode() === "horizontal" && b.hasListener("eventrepaint")) {
            Ext.Array.forEach(c.getEvents(), function(d) {
                a = b.getElementsFromEventRecord(d, c, null, true);
                Ext.Array.forEach(a, function(e) {
                    b.fireEvent("eventrepaint", b, d, e)
                })
            })
        }
    }
});
