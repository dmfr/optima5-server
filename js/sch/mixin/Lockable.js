Ext.define("Sch.mixin.Lockable", {
    extend: "Ext.grid.locking.Lockable",
    useSpacer: true,
    syncRowHeight: false,
    horizontalScrollForced: false,
    injectLockable: function () {
        var j = this;
        var h = Ext.data.TreeStore && j.store instanceof Ext.data.TreeStore;
        var c = j.getEventSelectionModel ? j.getEventSelectionModel() : j.getSelectionModel();
        j.lockedGridConfig = Ext.apply({}, j.lockedGridConfig || {});
        j.normalGridConfig = Ext.apply({}, j.schedulerConfig || j.normalGridConfig || {});
        if (j.lockedXType) {
            j.lockedGridConfig.xtype = j.lockedXType
        }
        if (j.normalXType) {
            j.normalGridConfig.xtype = j.normalXType
        }
        var a = j.lockedGridConfig,
            i = j.normalGridConfig;
        Ext.applyIf(j.lockedGridConfig, {
            useArrows: true,
            trackMouseOver: false,
            split: true,
            animCollapse: false,
            collapseDirection: "left",
            region: "west"
        });
        Ext.applyIf(j.normalGridConfig, {
            viewType: j.viewType,
            layout: "fit",
            sortableColumns: false,
            enableColumnMove: false,
            enableColumnResize: false,
            enableColumnHide: false,
            getSchedulingView: function () {
                var m = typeof console !== "undefined" ? console : false;
                if (m && m.log) {
                    m.log('getSchedulingView is deprecated on the inner grid panel. Instead use getView on the "normal" subgrid.')
                }
                return this.getView()
            },
            selModel: c,
            collapseDirection: "right",
            animCollapse: false,
            region: "center"
        });
        if (j.orientation === "vertical") {
            a.store = i.store = j.timeAxis
        }
        if (a.width) {
            j.syncLockedWidth = Ext.emptyFn;
            a.scroll = "horizontal";
            a.scrollerOwner = true
        }
        var e = j.lockedViewConfig = j.lockedViewConfig || {};
        var k = j.normalViewConfig = j.normalViewConfig || {};
        if (h) {
            var g = Ext.tree.View.prototype.onUpdate;
            e.onUpdate = function () {
                this.refreshSize = function () {
                    var n = this,
                        m = n.getBodySelector();
                    if (m) {
                        n.body.attach(n.el.child(m, true))
                    }
                };
                Ext.suspendLayouts();
                g.apply(this, arguments);
                Ext.resumeLayouts();
                this.refreshSize = Ext.tree.View.prototype.refreshSize
            };
            e.store = k.store = j.store.nodeStore
        }
        var f = j.layout;
        var d = a.width;
        this.callParent(arguments);
        this.on("afterrender", function () {
            var m = this.lockedGrid.headerCt.showMenuBy;
            this.lockedGrid.headerCt.showMenuBy = function () {
                m.apply(this, arguments);
                j.showMenuBy.apply(this, arguments)
            }
        });
        var l = j.lockedGrid.getView();
        var b = j.normalGrid.getView();
        this.patchViews();
        if (d || f === "border") {
            if (d) {
                j.lockedGrid.setWidth(d)
            }
            b.addCls("sch-timeline-horizontal-scroll");
            l.addCls("sch-locked-horizontal-scroll");
            j.horizontalScrollForced = true
        }
        if (j.normalGrid.collapsed) {
            j.normalGrid.collapsed = false;
            b.on("boxready", function () {
                j.normalGrid.collapse()
            }, j, {
                delay: 10
            })
        }
        if (j.lockedGrid.collapsed) {
            if (l.bufferedRenderer) {
                l.bufferedRenderer.disabled = true
            }
        }
        if (Ext.getScrollbarSize().width === 0) {
            l.addCls("sch-ganttpanel-force-locked-scroll")
        }
        if (h) {
            this.setupLockableTree()
        }
        if (j.useSpacer) {
            b.on("refresh", j.updateSpacer, j);
            l.on("refresh", j.updateSpacer, j)
        }
        if (f !== "fit") {
            j.layout = f
        }
        if (l.store !== b.store) {
            Ext.Error.raise("Sch.mixin.Lockable setup failed, not sharing store between the two views")
        }
        if (b.bufferedRenderer) {
            this.lockedGrid.on("expand", function () {
                l.el.dom.scrollTop = b.el.dom.scrollTop
            });
            this.patchSubGrid(this.lockedGrid, true);
            this.patchSubGrid(this.normalGrid, false);
            this.patchBufferedRenderingPlugin(b.bufferedRenderer);
            this.patchBufferedRenderingPlugin(l.bufferedRenderer)
        }
        this.patchSyncHorizontalScroll(this.lockedGrid);
        this.patchSyncHorizontalScroll(this.normalGrid);
        this.delayReordererPlugin(this.lockedGrid);
        this.delayReordererPlugin(this.normalGrid);
        this.fixHeaderResizer(this.lockedGrid);
        this.fixHeaderResizer(this.normalGrid)
    },
    setupLockableTree: function () {
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
    patchSyncHorizontalScroll: function (a) {
        a.scrollTask = new Ext.util.DelayedTask(function (d, b) {
            var c = this.getScrollTarget().el;
            if (c) {
                this.syncHorizontalScroll(c.dom.scrollLeft, b)
            }
        }, a)
    },
    delayReordererPlugin: function (b) {
        var c = b.headerCt;
        var a = c.reorderer;
        if (a) {
            c.un("render", a.onHeaderCtRender, a);
            c.on("render", function () {
                if (!c.isDestroyed) {
                    a.onHeaderCtRender()
                }
            }, a, {
                single: true,
                delay: 10
            })
        }
    },
    fixHeaderResizer: function (a) {
        var c = a.headerCt;
        var d = c.resizer;
        if (d) {
            var b = d.onBeforeStart;
            d.onBeforeStart = function () {
                if (this.activeHd && this.activeHd.isDestroyed) {
                    return false
                }
                return b.apply(this, arguments)
            }
        }
    },
    updateSpacer: function () {
        var g = this.lockedGrid.getView();
        var e = this.normalGrid.getView();
        if (g.rendered && e.rendered && g.el.child("table")) {
            var f = this,
                c = g.el,
                d = e.el.dom,
                b = c.dom.id + "-spacer",
                h = (d.offsetHeight - d.clientHeight) + "px";
            f.spacerEl = Ext.getDom(b);
            if (Ext.isIE6 || Ext.isIE7 || (Ext.isIEQuirks && Ext.isIE8) && f.spacerEl) {
                Ext.removeNode(f.spacerEl);
                f.spacerEl = null
            }
            if (f.spacerEl) {
                f.spacerEl.style.height = h
            } else {
                var a = c;
                Ext.core.DomHelper.append(a, {
                    id: b,
                    style: "height: " + h
                })
            }
        }
    },
    onLockedViewScroll: function () {
        this.callParent(arguments);
        var a = this.lockedGrid.getView().bufferedRenderer;
        if (a) {
            a.onViewScroll()
        }
    },
    onNormalViewScroll: function () {
        this.callParent(arguments);
        var a = this.normalGrid.getView().bufferedRenderer;
        if (a) {
            a.onViewScroll()
        }
    },
    patchSubGrid: function (f, h) {
        var d = f.getView();
        var g = d.bufferedRenderer;
        f.on({
            collapse: function () {
                g.disabled = true
            },
            expand: function () {
                g.disabled = false
            }
        });
        var e = d.collectData;
        d.collectData = function () {
            var j = e.apply(this, arguments);
            var i = j.tableStyle;
            if (i && i[i.length - 1] != "x") {
                j.tableStyle += "px"
            }
            return j
        };
        var c = Ext.data.TreeStore && this.store instanceof Ext.data.TreeStore;
        if (!h && c) {
            var b = d.onRemove;
            d.onRemove = function () {
                var i = this;
                if (i.rendered && i.bufferedRenderer) {
                    i.refreshView()
                } else {
                    b.apply(this, arguments)
                }
            }
        }
        var a = d.onAdd;
        d.onAdd = function () {
            var i = this;
            if (i.rendered && i.bufferedRenderer) {
                i.refreshView()
            } else {
                a.apply(this, arguments)
            }
        };
        d.bindStore(null);
        d.bindStore(c ? this.store.nodeStore : this.resourceStore)
    },
    afterLockedViewLayout: function () {
        if (!this.horizontalScrollForced) {
            return this.callParent(arguments)
        }
    },
    patchBufferedRenderingPlugin: function (c) {
        c.variableRowHeight = true;
        if (Ext.getVersion("extjs").isLessThan("4.2.1.883")) {
            c.view.on("afterrender", function () {
                c.view.el.un("scroll", c.onViewScroll, c)
            }, this, {
                single: true,
                delay: 1
            });
            var b = c.stretchView;
            c.stretchView = function (e, d) {
                var g = this,
                    f = (g.store.buffered ? g.store.getTotalCount() : g.store.getCount());
                if (f && (g.view.all.endIndex === f - 1)) {
                    d = g.bodyTop + e.body.dom.offsetHeight
                }
                b.apply(this, [e, d])
            }
        } else {
            var a = c.enable;
            c.enable = function () {
                if (c.grid.collapsed) {
                    return
                }
                return a.apply(this, arguments)
            }
        }
    },
    showMenuBy: function (b, f) {
        var e = this.getMenu(),
            c = e.down("#unlockItem"),
            d = e.down("#lockItem"),
            a = c.prev();
        a.hide();
        c.hide();
        d.hide()
    },
    patchViews: function () {
        if (Ext.isIE) {
            var e = this.getSelectionModel();
            var h = this;
            var g = h.lockedGrid.view;
            var f = h.normalGrid.view;
            var a = e.processSelection;
            var d = Ext.getVersion("extjs").isLessThan("4.2.2.1144") ? "mousedown" : "click";
            var c = g.doFocus ? "doFocus" : "focus";
            e.processSelection = function (k, j, m, l, o) {
                var i, n;
                if (o.type == d) {
                    i = g.scrollRowIntoView;
                    n = g[c];
                    g.scrollRowIntoView = f.scrollRowIntoView = Ext.emptyFn;
                    g[c] = f[c] = Ext.emptyFn
                }
                a.apply(this, arguments);
                if (o.type == d) {
                    g.scrollRowIntoView = f.scrollRowIntoView = i;
                    g[c] = f[c] = n;
                    g.el.focus()
                }
            };
            var b = f.onRowFocus;
            f.onRowFocus = function (j, i, k) {
                b.call(this, j, i, true)
            };
            if (Ext.tree && Ext.tree.plugin && Ext.tree.plugin.TreeViewDragDrop) {
                g.on("afterrender", function () {
                    Ext.each(g.plugins, function (i) {
                        if (i instanceof Ext.tree.plugin.TreeViewDragDrop) {
                            var j = g[c];
                            i.dragZone.view.un("itemmousedown", i.dragZone.onItemMouseDown, i.dragZone);
                            i.dragZone.view.on("itemmousedown", function () {
                                g[c] = Ext.emptyFn;
                                if (g.editingPlugin) {
                                    g.editingPlugin.completeEdit()
                                }
                                i.dragZone.onItemMouseDown.apply(i.dragZone, arguments);
                                g[c] = j
                            });
                            return false
                        }
                    })
                }, null, {
                    delay: 100
                })
            }
        }
    }
});

