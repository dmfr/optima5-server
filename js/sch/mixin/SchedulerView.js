Ext.define("Sch.mixin.SchedulerView", {
    extend: "Sch.mixin.AbstractSchedulerView",
    requires: ["Sch.tooltip.Tooltip", "Sch.feature.DragCreator", "Sch.feature.DragDrop", "Sch.feature.ResizeZone", "Sch.column.Resource", "Ext.XTemplate"],
    eventResizeHandles: "end",
    dndValidatorFn: Ext.emptyFn,
    resizeValidatorFn: Ext.emptyFn,
    createValidatorFn: Ext.emptyFn,
    _initializeSchedulerView: function () {
        this.callParent(arguments);
        this.on("destroy", this._destroy, this);
        this.on("afterrender", this._afterRender, this);
        this.trackOver = false;
        this.addEvents("eventclick", "eventmousedown", "eventmouseup", "eventdblclick", "eventcontextmenu", "eventmouseenter", "eventmouseout", "beforeeventresize", "eventresizestart", "eventpartialresize", "beforeeventresizefinalize", "eventresizeend", "beforeeventdrag", "eventdragstart", "beforeeventdropfinalize", "eventdrop", "aftereventdrop", "beforedragcreate", "dragcreatestart", "beforedragcreatefinalize", "dragcreateend", "afterdragcreate", "beforeeventadd", "scheduleclick", "scheduledblclick", "schedulecontextmenu");
        var c = this;
        if (!this.eventPrefix) {
            throw "eventPrefix missing"
        }
        if (Ext.isArray(c.eventTpl)) {
            var d = Ext.Array.clone(c.eventTpl),
                b = '<div class="sch-resizable-handle sch-resizable-handle-{0}"></div>';
            var a = this.eventResizeHandles;
            if (a === "start" || a === "both") {
                d.splice(2, 0, Ext.String.format(b, "start"))
            }
            if (a === "end" || a === "both") {
                d.splice(2, 0, Ext.String.format(b, "end"))
            }
            c.eventTpl = new Ext.XTemplate(d.join("").replace("{{evt-prefix}}", this.eventPrefix))
        }
    },
    inheritables: function () {
        return {
            loadingText: "Loading events...",
            overItemCls: "",
            setReadOnly: function (a) {
                if (this.dragCreator) {
                    this.dragCreator.setDisabled(a)
                }
                this.callParent(arguments)
            },
            repaintEventsForResource: function (e, d) {
                var b = this.orientation === "horizontal" ? this.store.indexOf(e) : 0;
                if (this.orientation === "horizontal") {
                    this.eventLayout.horizontal.clearCache(e)
                }
                if (b >= 0) {
                    this.refreshNode(b);
                    this.lockingPartner.refreshNode(b);
                    if (d) {
                        var a = this.getSelectionModel();
                        var c = e.getEvents();
                        Ext.each(c, function (f) {
                            if (a.isSelected(f)) {
                                this.onEventSelect(f, true)
                            }
                        }, this)
                    }
                }
            },
            repaintAllEvents: function () {
                if (this.orientation === "horizontal") {
                    this.refresh()
                } else {
                    this.refreshNode(0)
                }
            },
            handleScheduleEvent: function (f) {
                var i = f.getTarget("." + this.timeCellCls, 2);
                if (i) {
                    var j = this.getDateFromDomEvent(f, "floor");
                    var g = this.findRowByChild(i);
                    var d = this.indexOf(g);
                    var a;
                    if (this.orientation == "horizontal") {
                        a = this.getRecordForRowNode(g)
                    } else {
                        var b = f.getTarget(this.timeCellSelector, 5);
                        if (b) {
                            var h = typeof b.cellIndex == "number" ? b.cellIndex : b.getAttribute("data-cellIndex");
                            var c = this.headerCt.getGridColumns()[h];
                            a = c && c.model
                        }
                    }
                    this.fireEvent("schedule" + f.type, this, j, d, a, f)
                }
            },
            onEventDataRefresh: function () {
                this.clearRowHeightCache();
                this.callParent(arguments)
            },
            onUnbindStore: function (a) {
                a.un({
                    refresh: this.clearRowHeightCache,
                    clear: this.clearRowHeightCache,
                    load: this.clearRowHeightCache,
                    scope: this
                });
                this.callParent(arguments)
            },
            bindStore: function (a) {
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
    _afterRender: function () {
        this.bindEventStore(this.eventStore, true);
        this.setupEventListeners();
        this.configureFunctionality();
        var a = this.headerCt.resizer;
        if (a) {
            a.doResize = Ext.Function.createSequence(a.doResize, this.afterHeaderResized, this)
        }
    },
    _destroy: function () {
        this.bindEventStore(null)
    },
    clearRowHeightCache: function () {
        if (this.orientation === "horizontal") {
            this.eventLayout.horizontal.clearCache()
        }
    },
    configureFunctionality: function () {
        var a = this.validatorFnScope || this;
        if (this.eventResizeHandles !== "none" && Sch.feature.ResizeZone) {
            this.resizePlug = new Sch.feature.ResizeZone(Ext.applyIf({
                schedulerView: this,
                validatorFn: function (d, c, b, e) {
                    return (this.allowOverlap || this.isDateRangeAvailable(b, e, c, d)) && this.resizeValidatorFn.apply(a, arguments) !== false
                },
                validatorFnScope: this
            }, this.resizeConfig || {}))
        }
        if (this.enableEventDragDrop !== false && Sch.feature.DragDrop) {
            this.dragdropPlug = new Sch.feature.DragDrop(this, {
                validatorFn: function (c, b, d, e) {
                    return (this.allowOverlap || this.isDateRangeAvailable(d, Sch.util.Date.add(d, Sch.util.Date.MILLI, e), c[0], b)) && this.dndValidatorFn.apply(a, arguments) !== false
                },
                validatorFnScope: this,
                dragConfig: this.dragConfig || {}
            })
        }
        if (this.enableDragCreation !== false && Sch.feature.DragCreator) {
            this.dragCreator = new Sch.feature.DragCreator(Ext.applyIf({
                schedulerView: this,
                disabled: this.readOnly,
                validatorFn: function (c, b, d) {
                    return (this.allowOverlap || this.isDateRangeAvailable(b, d, null, c)) && this.createValidatorFn.apply(a, arguments) !== false
                },
                validatorFnScope: this
            }, this.createConfig || {}))
        }
    },
    onBeforeDragDrop: function (a, c, b) {
        return !this.readOnly && !b.getTarget().className.match("sch-resizable-handle")
    },
    onDragDropStart: function () {
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
    onDragDropEnd: function () {
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
    onBeforeDragCreate: function (b, c, a, d) {
        return !this.readOnly && !d.ctrlKey
    },
    onDragCreateStart: function () {
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(false)
        }
        if (this.tip) {
            this.tip.hide();
            this.tip.disable()
        }
    },
    onDragCreateEnd: function (b, a) {
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
    onEventCreated: function (a) {},
    onAfterDragCreate: function () {
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(true)
        }
        if (this.tip) {
            this.tip.enable()
        }
    },
    onBeforeResize: function () {
        return !this.readOnly
    },
    onResizeStart: function () {
        if (this.tip) {
            this.tip.hide();
            this.tip.disable()
        }
        if (this.dragCreator) {
            this.dragCreator.setDisabled(true)
        }
    },
    onResizeEnd: function () {
        if (this.tip) {
            this.tip.enable()
        }
        if (this.dragCreator) {
            this.dragCreator.setDisabled(false)
        }
    },
    setupEventListeners: function () {
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
    afterHeaderResized: function () {
        var b = this.headerCt.resizer;
        if (b && b.dragHd instanceof Sch.column.Resource) {
            var a = b.dragHd.getWidth();
            this.setColumnWidth(a)
        }
    },
    columnRenderer: function (e, c, a, d, b) {
        return this[this.orientation].columnRenderer(e, c, a, d, b)
    }
});
