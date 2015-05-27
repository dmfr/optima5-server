Ext.define("Sch.mixin.AbstractSchedulerView", {
    requires: ["Sch.eventlayout.Horizontal", "Sch.view.Vertical", "Sch.eventlayout.Vertical"],
    _cmpCls: "sch-schedulerview",
    scheduledEventName: "event",
    barMargin: 1,
    constrainDragToResource: false,
    allowOverlap: null,
    readOnly: null,
    dynamicRowHeight: true,
    managedEventSizing: true,
    eventAnimations: true,
    horizontalLayoutCls: "Sch.eventlayout.Horizontal",
    verticalLayoutCls: "Sch.eventlayout.Vertical",
    eventCls: "sch-event",
    verticalViewClass: "Sch.view.Vertical",
    eventTpl: ['<tpl for=".">', '<div unselectable="on" id="{{evt-prefix}}{id}" style="right:{right}px;left:{left}px;top:{top}px;height:{height}px;width:{width}px;{style}" class="sch-event ' + Ext.baseCSSPrefix + 'unselectable {internalCls} {cls}">', '<div unselectable="on" class="sch-event-inner {iconCls}">', "{body}", "</div>", "</div>", "</tpl>"],
    eventStore: null,
    resourceStore: null,
    eventLayout: null,
    _initializeSchedulerView: function () {
        var a = Ext.ClassManager.get(this.horizontalLayoutCls);
        var b = Ext.ClassManager.get(this.verticalLayoutCls);
        this.eventSelector = "." + this.eventCls;
        this.eventLayout = {};
        if (a) {
            this.eventLayout.horizontal = new a({
                view: this,
                timeAxisViewModel: this.timeAxisViewModel
            })
        }
        if (b) {
            this.eventLayout.vertical = new b({
                view: this,
                timeAxisViewModel: this.timeAxisViewModel
            })
        }
        this.store = this.store || this.resourceStore;
        this.resourceStore = this.resourceStore || this.store
    },
    generateTplData: function (d, c, g) {
        var f = this[this.orientation].getEventRenderData(d),
            h = d.getStartDate(),
            b = d.getEndDate(),
            a = d.getCls() || "";
        a += " sch-event-resizable-" + d.getResizable();
        if (d.dirty) {
            a += " sch-dirty "
        }
        if (f.endsOutsideView) {
            a += " sch-event-endsoutside "
        }
        if (f.startsOutsideView) {
            a += " sch-event-startsoutside "
        }
        if (this.eventBarIconClsField) {
            a += " sch-event-withicon "
        }
        if (d.isDraggable() === false) {
            a += " sch-event-fixed "
        }
        if (b - h === 0) {
            a += " sch-event-milestone "
        }
        f.id = d.internalId;
        f.internalCls = a;
        f.start = h;
        f.end = b;
        f.iconCls = d.data[this.eventBarIconClsField] || "";
        if (this.eventRenderer) {
            var e = this.eventRenderer.call(this.eventRendererScope || this, d, c, f, g);
            if (Ext.isObject(e) && this.eventBodyTemplate) {
                f.body = this.eventBodyTemplate.apply(e)
            } else {
                f.body = e
            }
        } else {
            if (this.eventBodyTemplate) {
                f.body = this.eventBodyTemplate.apply(d.data)
            } else {
                if (this.eventBarTextField) {
                    f.body = d.data[this.eventBarTextField] || ""
                }
            }
        }
        return f
    },
    resolveResource: function (a) {
        return this[this.orientation].resolveResource(a)
    },
    getResourceRegion: function (b, a, c) {
        return this[this.orientation].getResourceRegion(b, a, c)
    },
    resolveEventRecord: function (a) {
        a = a.dom ? a.dom : a;
        if (!(Ext.fly(a).hasCls(this.eventCls))) {
            a = Ext.fly(a).up(this.eventSelector)
        }
        return this.getEventRecordFromDomId(a.id)
    },
    getResourceByEventRecord: function (a) {
        return a.getResource()
    },
    getEventRecordFromDomId: function (b) {
        var a = this.getEventIdFromDomNodeId(b);
        return this.eventStore.getByInternalId(a)
    },
    isDateRangeAvailable: function (d, a, b, c) {
        return this.eventStore.isDateRangeAvailable(d, a, b, c)
    },
    getEventsInView: function () {
        var b = this.timeAxis.getStart(),
            a = this.timeAxis.getEnd();
        return this.eventStore.getEventsInTimeSpan(b, a)
    },
    getEventNodes: function () {
        return this.getEl().select(this.eventSelector)
    },
    onEventCreated: function (a) {},
    getEventStore: function () {
        return this.eventStore
    },
    registerEventEditor: function (a) {
        this.eventEditor = a
    },
    getEventEditor: function () {
        return this.eventEditor
    },
    onEventUpdate: function (b, c, a) {
        this[this.orientation].onEventUpdate(b, c, a)
    },
    onEventAdd: function (a, b) {
        this[this.orientation].onEventAdd(a, b)
    },
    onEventRemove: function (a, b) {
        this[this.orientation].onEventRemove(a, b)
    },
    bindEventStore: function (c, b) {
        var d = this;
        var a = {
            scope: d,
            refresh: d.onEventDataRefresh,
            addrecords: d.onEventAdd,
            updaterecord: d.onEventUpdate,
            removerecords: d.onEventRemove,
            add: d.onEventAdd,
            update: d.onEventUpdate,
            remove: d.onEventRemove
        };
        if (!Ext.versions.touch) {
            a.clear = d.onEventDataRefresh
        }
        if (!b && d.eventStore) {
            d.eventStore.setResourceStore(null);
            if (c !== d.eventStore && d.eventStore.autoDestroy) {
                d.eventStore.destroy()
            } else {
                if (d.mun) {
                    d.mun(d.eventStore, a)
                } else {
                    d.eventStore.un(a)
                }
            } if (!c) {
                if (d.loadMask && d.loadMask.bindStore) {
                    d.loadMask.bindStore(null)
                }
                d.eventStore = null
            }
        }
        if (c) {
            c = Ext.data.StoreManager.lookup(c);
            if (d.mon) {
                d.mon(c, a)
            } else {
                c.on(a)
            } if (d.loadMask && d.loadMask.bindStore) {
                d.loadMask.bindStore(c)
            }
            d.eventStore = c;
            c.setResourceStore(d.resourceStore)
        }
        if (c && !b) {
            d.refresh()
        }
    },
    onEventDataRefresh: function () {
        this.refreshKeepingScroll()
    },
    onEventSelect: function (a) {
        var b = this.getEventNodesByRecord(a);
        if (b) {
            b.addCls(this.selectedEventCls)
        }
    },
    onEventDeselect: function (a) {
        var b = this.getEventNodesByRecord(a);
        if (b) {
            b.removeCls(this.selectedEventCls)
        }
    },
    refresh: function () {
        throw "Abstract method call"
    },
    repaintEventsForResource: function (a) {
        throw "Abstract method call"
    },
    repaintAllEvents: function () {
        this.refreshKeepingScroll()
    },
    scrollEventIntoView: function (j, e, a, n, o) {
        o = o || this;
        var k = this;
        var l = function (p) {
            if (Ext.versions.extjs) {
                k.up("panel").scrollTask.cancel();
                k.scrollElementIntoView(p, k.el, true, a)
            } else {
                p.scrollIntoView(k.el, true, a)
            } if (e) {
                if (typeof e === "boolean") {
                    p.highlight()
                } else {
                    p.highlight(null, e)
                }
            }
            n && n.call(o)
        };
        if (Ext.data.TreeStore && this.resourceStore instanceof Ext.data.TreeStore) {
            var d = j.getResources(k.eventStore);
            if (d.length > 0 && !d[0].isVisible()) {
                d[0].bubble(function (p) {
                    p.expand()
                })
            }
        }
        var i = this.timeAxis;
        var c = j.getStartDate();
        var h = j.getEndDate();
        if (!i.dateInAxis(c) || !i.dateInAxis(h)) {
            var g = i.getEnd() - i.getStart();
            i.setTimeSpan(new Date(c.getTime() - g / 2), new Date(h.getTime() + g / 2))
        }
        var b = this.getElementFromEventRecord(j);
        if (b) {
            l(b)
        } else {
            if (this.bufferedRenderer) {
                var m = this.resourceStore;
                var f = j.getResource(null, k.eventStore);
                Ext.Function.defer(function () {
                    var p = m.getIndexInTotalDataset ? m.getIndexInTotalDataset(f) : m.indexOf(f);
                    this.bufferedRenderer.scrollTo(p, false, function () {
                        var q = k.getElementFromEventRecord(j);
                        if (q) {
                            l(q)
                        }
                    })
                }, 10, this)
            }
        }
    }
});
