Ext.define("Sch.mixin.AbstractSchedulerView", {
    requires: ["Sch.model.Assignment", "Sch.template.Event", "Sch.eventlayout.Horizontal", "Sch.view.Vertical", "Sch.eventlayout.Vertical"],
    _cmpCls: "sch-schedulerview",
    scheduledEventName: "event",
    eventTemplateClass: "Sch.template.Event",
    eventTpl: null,
    barMargin: 1,
    constrainDragToResource: false,
    allowOverlap: null,
    readOnly: null,
    altColCls: "sch-col-alt",
    dynamicRowHeight: true,
    managedEventSizing: true,
    eventAnimations: true,
    horizontalLayoutCls: "Sch.eventlayout.Horizontal",
    horizontalEventSorterFn: null,
    verticalLayoutCls: "Sch.eventlayout.Vertical",
    verticalEventSorterFn: null,
    eventCls: "sch-event",
    verticalViewClass: "Sch.view.Vertical",
    eventStore: null,
    resourceStore: null,
    eventLayout: null,
    _initializeSchedulerView: function() {
        var a = Ext.ClassManager.get(this.horizontalLayoutCls);
        var b = Ext.ClassManager.get(this.verticalLayoutCls);
        this.eventSelector = "." + this.eventCls;
        this.eventLayout = {};
        if (a) {
            this.eventLayout.horizontal = new a(Ext.apply({
                timeAxisViewModel: this.timeAxisViewModel
            }, {
                bandIndexToPxConvertFn: this.horizontal.layoutEventVertically,
                bandIndexToPxConvertScope: this.horizontal
            }, this.horizontalEventSorterFn ? {
                sortEvents: this.horizontalEventSorterFn
            } : {}))
        }
        if (b) {
            this.eventLayout.vertical = new b(Ext.apply({}, {
                view: this
            }, this.verticalEventSorterFn ? {
                sortEvents: this.verticalEventSorterFn
            } : {}))
        }
        this.store = this.store || this.resourceStore;
        this.resourceStore = this.resourceStore || this.store
    },
    generateTplData: function(e, d, c) {
        var g = this[this.mode].getEventRenderData(e, d, c),
            h = e.getStartDate(),
            b = e.getEndDate(),
            a = e.getCls() || "";
        a += " sch-event-resizable-" + e.getResizable();
        if (e.dirty) {
            a += " sch-dirty "
        }
        if (g.endsOutsideView) {
            a += " sch-event-endsoutside "
        }
        if (g.startsOutsideView) {
            a += " sch-event-startsoutside "
        }
        if (this.eventBarIconClsField) {
            a += " sch-event-withicon "
        }
        if (e.isDraggable() === false) {
            a += " sch-event-fixed "
        }
        if (b - h === 0) {
            a += " sch-event-milestone "
        }
        g.id = e.internalId + "-" + d.internalId + (this.getMode() === "calendar" ? ("-" + c) : "-x");
        g.internalCls = a;
        g.start = h;
        g.end = b;
        g.iconCls = e.data[this.eventBarIconClsField] || "";
        g.event = e;
        if (this.eventRenderer) {
            var f = this.eventRenderer.call(this.eventRendererScope || this, e, d, g, c);
            if (Ext.isObject(f) && this.eventBodyTemplate) {
                g.body = this.eventBodyTemplate.apply(f)
            } else {
                g.body = f
            }
        } else {
            if (this.eventBodyTemplate) {
                g.body = this.eventBodyTemplate.apply(e.data)
            } else {
                if (this.eventBarTextField) {
                    g.body = e.data[this.eventBarTextField] || ""
                }
            }
        }
        return g
    },
    resolveResource: function(b) {
        var a = this;
        return a[a.mode].resolveResource(b)
    },
    getResourceRegion: function(b, a, c) {
        return this[this.mode].getResourceRegion(b, a, c)
    },
    resolveEventRecord: function(a) {
        a = a.dom ? a.dom : a;
        if (!(Ext.fly(a).is(this.eventSelector))) {
            a = Ext.fly(a).up(this.eventSelector)
        }
        return a && this.getEventRecordFromDomId(a.id)
    },
    resolveEventRecordFromResourceRow: function(a) {
        var c = this,
            e = c.getEventSelectionModel(),
            d, b;
        a = a.dom ? a.dom : a;
        d = c.getRecord(a);
        return e.getFirstSelectedEventForResource(d)
    },
    resolveAssignmentRecord: function(a) {
        var c = this,
            e = c.eventStore.getAssignmentStore(),
            f = null,
            b, d;
        if (e) {
            a = a.dom && a.dom || a;
            b = c.getEventRecordFromDomId(a.id);
            d = c.getResourceRecordFromDomId(a.id);
            if (b && d) {
                f = e.getAssignmentForEventAndResource(b, d)
            }
        }
        return f
    },
    getEventRecordFromDomId: function(a) {
        a = this.getEventIdFromDomNodeId(a);
        return this.eventStore.getModelByInternalId(a)
    },
    getResourceRecordFromDomId: function(a) {
        a = this.getResourceIdFromDomNodeId(a);
        return this.eventStore.getResourceStore().getByInternalId(a)
    },
    isDateRangeAvailable: function(d, a, b, c) {
        return this.eventStore.isDateRangeAvailable(d, a, b, c)
    },
    getEventsInView: function() {
        var b = this.timeAxis.getStart(),
            a = this.timeAxis.getEnd();
        return this.eventStore.getEventsInTimeSpan(b, a)
    },
    getEventNodes: function() {
        return this.getEl().select(this.eventSelector)
    },
    onEventCreated: function(a) {},
    getEventStore: function() {
        return this.eventStore
    },
    registerEventEditor: function(a) {
        this.eventEditor = a
    },
    getEventEditor: function() {
        return this.eventEditor
    },
    onEventUpdate: function(b, c, a) {
        this[this.mode].onEventUpdate(b, c, a)
    },
    onEventAdd: function(a, b) {
        if (!Ext.isArray(b)) {
            b = [b]
        }
        this[this.mode].onEventAdd(a, b)
    },
    onAssignmentAdd: function(b, a) {
        var c = this;
        Ext.Array.forEach(a, function(e) {
            var d = e.getResource();
            d && c.repaintEventsForResource(d)
        })
    },
    onAssignmentUpdate: function(d, g) {
        var f = this,
            a = g.previous && g.previous[g.resourceIdField],
            e = g.getResourceId(),
            b, c;
        if (a) {
            b = f.resourceStore.getModelById(a);
            f.repaintEventsForResource(b)
        }
        if (e) {
            c = f.resourceStore.getModelById(e);
            f.repaintEventsForResource(c)
        }
    },
    onAssignmentRemove: function(b, a) {
        var c = this;
        Ext.Array.forEach(a, function(e) {
            var f = e.getResourceId();
            var d = f && c.resourceStore.getModelById(f);
            d && c.repaintEventsForResource(d)
        })
    },
    onEventRemove: function(a, b) {
        this[this.mode].onEventRemove(a, b)
    },
    bindEventStore: function(d, b) {
        var f = this;
        var a = {
            scope: f,
            refresh: f.onEventDataRefresh,
            addrecords: f.onEventAdd,
            updaterecord: f.onEventUpdate,
            removerecords: f.onEventRemove,
            add: f.onEventAdd,
            update: f.onEventUpdate,
            remove: f.onEventRemove,
            nodeinsert: f.onEventAdd,
            nodeappend: f.onEventAdd
        };
        var c = {
            scope: f,
            refresh: f.onEventDataRefresh,
            load: f.onEventDataRefresh,
            update: f.onAssignmentUpdate,
            add: f.onAssignmentAdd,
            remove: f.onAssignmentRemove
        };
        if (!Ext.versions.touch) {
            a.clear = f.onEventDataRefresh
        }
        if (!b && f.eventStore) {
            f.eventStore.setResourceStore(null);
            if (d !== f.eventStore && f.eventStore.autoDestroy) {
                f.eventStore.destroy()
            } else {
                if (f.mun) {
                    f.mun(f.eventStore, a);
                    var e = f.eventStore.getAssignmentStore && f.eventStore.getAssignmentStore();
                    if (e) {
                        f.mun(e, c)
                    }
                } else {
                    f.eventStore.un(a)
                }
            }
            if (!d) {
                f.eventStore = null
            }
        }
        if (d) {
            d = Ext.data.StoreManager.lookup(d);
            if (f.mon) {
                f.mon(d, a)
            } else {
                d.on(a)
            }
            f.eventStore = d;
            d.setResourceStore(f.resourceStore);
            var g = d.getAssignmentStore && d.getAssignmentStore();
            if (g) {
                f.mon(g, c)
            }
        }
        if (d && !b) {
            f.refresh()
        }
    },
    onEventDataRefresh: function() {
        this.refreshKeepingScroll()
    },
    onEventBarSelect: function(a) {
        var c = this,
            b, d;
        if (a instanceof Sch.model.Assignment) {
            b = a.getEvent();
            d = a.getResource()
        } else {
            b = a;
            d = null
        }
        Ext.Array.forEach(c.getElementsFromEventRecord(b, d), function(e) {
            e.addCls(c.selectedEventCls)
        })
    },
    onEventBarDeselect: function(a) {
        var c = this,
            b, d;
        if (a instanceof Sch.model.Assignment) {
            b = a.getEvent();
            d = a.getResource()
        } else {
            b = a;
            d = null
        }
        b && Ext.Array.forEach(c.getElementsFromEventRecord(b, d), function(e) {
            e.removeCls(c.selectedEventCls)
        })
    },
    refresh: function() {
        throw "Abstract method call"
    },
    repaintEventsForResource: function(a) {
        throw "Abstract method call"
    },
    repaintAllEvents: function() {
        this.refreshKeepingScroll()
    },
    scrollEventIntoView: function(f, b, a, g, c) {
        var d = this,
            e = f.getResources();
        e.length && d.scrollResourceEventIntoView(e[0], f, null, b, a, g, c)
    },
    scrollResourceEventIntoView: function(e, g, h, d, a, k, l) {
        var j = this,
            i = g.getStartDate(),
            f = g.getEndDate(),
            c, b;
        if (Ext.data.TreeStore && j.resourceStore instanceof Ext.data.TreeStore) {
            e.bubble(function(m) {
                m.expand()
            })
        }
        if (!j.timeAxis.dateInAxis(i) || !j.timeAxis.dateInAxis(f)) {
            c = j.timeAxis.getEnd() - j.timeAxis.getStart();
            j.timeAxis.setTimeSpan(new Date(i.valueOf() - c / 2), new Date(f.getTime() + c / 2));
            j.up("panel").scrollTask.cancel()
        }
        j.panel.ownerCt.ensureVisible(e, {
            callback: function() {
                if (this.isLocked === false) {
                    b = j.getElementsFromEventRecord(g, e, h);
                    b = b.length && b[0] || null;
                    j.scrollElementIntoView(b, true, a, d, null, k, l)
                }
            }
        })
    }
});
