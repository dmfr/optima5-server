Ext.define("Sch.plugin.CellPlugin", {
    extend: "Ext.AbstractPlugin",
    alias: "plugin.scheduler_cellplugin",
    requires: ["Ext.form.field.Base"],
    mixins: {
        observable: "Ext.util.Observable"
    },
    frameCls: "sch-cellplugin-highlighter",
    frameTemplate: new Ext.Template(['<div class="{cls} active" style="width: {width}px; height: {height}px;">', '<div class="sch-cellplugin-border sch-cellplugin-border-horizontal sch-cellplugin-border-top"></div>', '<div class="sch-cellplugin-border sch-cellplugin-border-horizontal sch-cellplugin-border-bottom"></div>', '<div class="sch-cellplugin-border sch-cellplugin-border-vertical sch-cellplugin-border-left"></div>', '<div class="sch-cellplugin-border sch-cellplugin-border-vertical sch-cellplugin-border-right"></div>', "</div>"]),
    editor: "Sch.field.CellEditor",
    singleClickEditing: true,
    dblClickTimeout: 100,
    clickTimer: [],
    editing: false,
    context: {},
    selContext: [],
    constructor: function(a) {
        Ext.apply(this, a || {}, {
            context: {},
            editing: false,
            tickIndex: null,
            resource: null,
            startDate: null,
            eventIndexInCell: -1,
            eventRecord: null
        });
        this.mixins.observable.constructor.call(this);
        this.callParent(arguments)
    },
    init: function(a) {
        var b = this;
        b.view = a.getSchedulingView();
        b.lockedView = a.lockedGrid.getView();
        a.getNavigationModel().setPosition = Ext.emptyFn;
        b.timeAxisViewModel = a.timeAxisViewModel;
        b.tickCount = a.timeAxis.getCount();
        b.rowsCount = a.resourceStore.getCount();
        b.keyNav = new Ext.util.KeyNav({
            target: a.lockedGrid.view,
            eventName: "itemkeydown",
            processEvent: function(d, c, g, e, f) {
                return f
            },
            ignoreInputFields: true,
            up: this.onKeyUp,
            down: this.onKeyDown,
            right: this.onKeyRight,
            left: this.onKeyLeft,
            tab: this.onKeyTab,
            enter: this.onKeyEnter,
            esc: this.onKeyEsc,
            scope: this
        });
        if (b.view.bufferedRenderer) {
            b.view.on("afterrender", function() {
                b.view.el.on("scroll", b.onViewScroll, b)
            }, b, {
                single: true
            });
            b.mon(b.view, "itemadd", b.onItemAdd, b)
        }
        b.mon(a, {
            headerclick: b.onContainerClick,
            zoomchange: b.destroyHighlighter,
            scope: b
        });
        b.mon(b.view, {
            containerclick: b.onContainerClick,
            scheduleclick: b.onCellClick,
            scheduledblclick: b.onCellDblClick,
            eventclick: b.onEventClick,
            eventdblclick: b.onEventDblClick,
            containerkeydown: b.onEditorKeyDown,
            groupcollapse: b.onGroupCollapse,
            groupexpand: b.onGroupExpand,
            scope: b
        });
        b.mon(b.timeAxisViewModel, {
            update: b.onViewModelUpdate,
            scope: b
        });
        b.mon(b.view.timeAxis, {
            beforereconfigure: b.onBeforeReconfigure,
            scope: b
        });
        b.mon(b.view.resourceStore, {
            load: b.onResourceLoad,
            add: b.onResourceAdd,
            remove: b.onResourceRemove,
            clear: b.destroyHighlighter,
            scope: b
        });
        b.mon(b.view.eventStore, {
            load: b.destroyHighlighter,
            scope: b
        });
        b.mon(b.lockedView, {
            cellclick: b.onLockedCellClick,
            beforeitemkeydown: b.onBeforeItemKeyDown,
            scope: b
        })
    },
    onEditorKeyDown: function(a, c, b) {
        switch (c.getKey()) {
            case c.TAB:
                c.preventDefault();
                if (c.shiftKey) {
                    this.moveLeft(c)
                } else {
                    this.moveRight(c)
                }
                break;
            case c.ENTER:
                this.onEditorKeyEnter();
                break;
            case c.ESC:
                this.cancelEdit(c);
                break;
            default:
                break
        }
    },
    onEditorKeyEnter: function() {
        if (this.completeEdit()) {
            this.beginEditBelow()
        } else {
            this.showEditorInCell(this.getEventOrCell(this.context, true))
        }
    },
    destroy: function() {
        this.keyNav.destroy()
    },
    destroyHighlighter: function() {
        var a = this;
        a.clearSelection();
        a.containerEl && a.containerEl.destroy();
        delete a.containerEl;
        delete a.startDate;
        delete a.resource;
        delete a.resourceIndex;
        delete a.eventRecord;
        delete a.tickIndex
    },
    onGroupCollapse: function() {
        var a = this;
        a.rowsCount = a.view.getNodes().length;
        if (a.getResourceIndex() === -1) {
            a.destroyHighlighter()
        } else {
            a.refreshCell()
        }
    },
    onGroupExpand: function() {
        var a = this;
        a.rowsCount = a.view.getNodes().length;
        a.refreshCell()
    },
    onViewScroll: function() {
        var b = this;
        if (b.containerEl) {
            var a = Ext.get(b.view.getNodeByRecord(b.resource));
            if (a) {
                b.containerEl.setY(a.getY() - 1)
            }
        }
    },
    onItemAdd: function() {
        var b = this;
        if (!b.resource) {
            return
        }
        var a = b.view.getNodeByRecord(b.resource);
        if (a) {
            b.containerEl.show()
        } else {
            b.containerEl.hide()
        }
    },
    getResourceIndex: function(b) {
        var a = this;
        b = b || a.resource;
        return a.view.dataSource.data.indexOf(b)
    },
    getResource: function(a) {
        return this.view.dataSource.getAt(a)
    },
    onResourceLoad: function(b, a, c) {
        if (c) {
            this.rowsCount = a.length
        }
    },
    onResourceAdd: function(b, a) {
        this.rowsCount += a.length;
        this.refreshCell()
    },
    onResourceRemove: function(c, b, d, a) {
        var e = this;
        e.rowsCount = c.getCount();
        if (e.rowsCount === 0) {
            e.destroyHighlighter()
        }
        if (Ext.Array.indexOf(b, e.resource) !== -1) {
            e.destroyHighlighter()
        }
        e.refreshCell()
    },
    onBeforeReconfigure: function(a) {
        if (!this.startDate && Ext.isNumber(this.tickIndex)) {
            this.startDate = a.getAt(this.tickIndex).getStartDate()
        }
    },
    onLockedCellClick: function(c, h, b, a, d, g, f) {
        this.showEditorInCell({
            tickIndex: this.tickIndex || 0,
            resourceIndex: g,
            eventIndexInCell: 0
        }, f)
    },
    onBeforeItemKeyDown: function(f, a, d, b, g, c) {
        if (!g.isSpecialKey()) {
            this.beginEdit()
        }
    },
    onViewModelUpdate: function(d) {
        var b = this,
            c = d.timeAxis;
        b.tickCount = c.getCount();
        if (b.startDate) {
            var a = c.getTickFromDate(b.startDate);
            if (a >= 0) {
                delete b.startDate;
                b.tickIndex = a;
                if (!b.containerEl) {
                    b.renderElement()
                }
                b.refreshCell()
            } else {
                b.containerEl.destroy();
                delete b.containerEl;
                b.clearSelection()
            }
        } else {
            b.refreshCell()
        }
    },
    refreshCell: function() {
        var b = this;
        var a = b.timeAxisViewModel.getTickWidth();
        if (b.containerEl) {
            b.containerEl.setWidth(a);
            b.containerEl.setLeft(a);
            b.showEditorInCell({
                tickIndex: b.tickIndex,
                resourceIndex: b.getResourceIndex()
            })
        }
        if (b.editor instanceof Ext.form.field.Base) {
            b.editor.setMaxWidth(a)
        }
    },
    clearSelection: function() {
        var a = this;
        a.view.getSecondaryCanvasEl().select("." + a.frameCls + ".clone").remove();
        a.selContext = []
    },
    addSelection: function() {
        var a = this;
        var b = a.frameTemplate.apply({
            cls: a.frameCls,
            width: a.containerEl.getWidth(),
            height: a.containerEl.getHeight()
        });
        b = Ext.get(Ext.DomHelper.append(a.containerEl.parent(), b));
        b.setStyle("top", a.containerEl.getStyle("top"));
        b.setStyle("left", a.containerEl.getStyle("left"));
        b.removeCls("active");
        b.addCls("clone");
        a.selContext.push(Ext.apply({}, a.context))
    },
    renderElement: function() {
        var e = this;
        e.containerEl = e.view.getSecondaryCanvasEl();
        var d = e.timeAxisViewModel.getTickWidth();
        var a = e.timeAxisViewModel.getViewRowHeight();
        var c = e.frameTemplate.apply({
            cls: e.frameCls,
            width: d,
            height: a
        });
        e.containerEl = Ext.get(Ext.DomHelper.append(e.containerEl, c));
        var b = {
            height: a,
            maxHeight: a,
            width: d,
            maxWidth: d,
            renderTo: e.containerEl
        };
        if (Ext.isObject(e.editor) && !(e.editor instanceof Ext.Base)) {
            e.editor = Ext.create(Ext.apply(b, e.editor, {
                xclass: "Sch.field.CellEditor"
            }))
        } else {
            if (Ext.isString(e.editor)) {
                e.editor = Ext.create(e.editor, b)
            } else {
                e.containerEl.appendChild(e.editor.el)
            }
        }
    },
    onContainerClick: function() {
        var a = this;
        if (a.lockedView.getSelectionModel().getSelection().length > 0) {
            if (a.editor.isVisible && a.editor.isVisible()) {
                a.lockedView.getFocusEl().focus()
            }
        }
    },
    onCellClick: function(a, b, g, d, f) {
        var c = this;
        c.clickTimer.push(setTimeout(function() {
            c.handleCellClick(a, b, g, d, f)
        }, c.dblClickTimeout))
    },
    handleCellClick: function(a, c, h, f, g) {
        var d = this;
        var b = Math.floor(d.view.timeAxis.getTickFromDate(c));
        if (d.fireEvent("cellclick", d, b, h) !== false) {
            d.showEditorInCell({
                tickIndex: b,
                resourceIndex: h
            }, g);
            if (d.singleClickEditing) {
                d.beginEdit()
            }
        }
    },
    onCellDblClick: function(a, b, f, c, d) {
        Ext.each(this.clickTimer, function(e) {
            clearTimeout(e)
        });
        this.handleCellDblClick(a, b, f, c, d)
    },
    handleCellDblClick: function(a, c, h, f, g) {
        var d = this;
        var b = Math.floor(d.view.timeAxis.getTickFromDate(c));
        if (d.fireEvent("celldblclick", d, b, h) !== false) {
            d.showEditorInCell({
                tickIndex: b,
                resourceIndex: h
            }, g);
            d.beginEdit()
        }
    },
    onEventClick: function(b, a, g) {
        var f = this;
        var d = f.view.getDateFromDomEvent(g);
        var c = Math.floor(f.view.timeAxis.getTickFromDate(d));
        var h = f.view.dataSource.data.indexOf(a.getResource());
        f.showEditorInCell({
            tickIndex: c,
            resourceIndex: h,
            eventRecord: a
        }, g)
    },
    onEventDblClick: function(b, a, g) {
        var f = this;
        var d = f.view.getDateFromDomEvent(g);
        var c = Math.floor(f.view.timeAxis.getTickFromDate(d));
        var h = f.view.dataSource.data.indexOf(a.getResource());
        f.showEditorInCell({
            tickIndex: c,
            resourceIndex: h,
            eventRecord: a
        }, g);
        f.beginEdit()
    },
    showEditorInCell: function(d, h) {
        var i = this;
        var b = "tickIndex" in d ? d.tickIndex : i.tickIndex;
        var j = "resourceIndex" in d ? d.resourceIndex : i.resourceIndex;
        if (b === -1 || j === -1) {
            return
        }
        var f = i.view.timeAxis.getAt(b);
        var a = f.getStartDate();
        var g = f.getEndDate();
        var c = i.view.dataSource.getAt(j);
        if (h && h.type === "click" && !d.eventRecord) {
            d.eventRecord = i.getCellEvents({
                startDate: a,
                endDate: g,
                resource: c
            }).getAt(0)
        }
        if (i.fireEvent("beforeselect", i, c, a, g, d.eventRecord) === false) {
            return
        }
        i.onBeforeSelect(h);
        if (!i.containerEl) {
            i.renderElement()
        } else {
            if (h && h.ctrlKey) {
                i.addSelection()
            } else {
                i.clearSelection()
            }
        }
        Ext.apply(i.context, {
            startDate: a,
            endDate: g,
            resource: c
        });
        if (d.eventRecord) {
            i.context.eventRecord = d.eventRecord
        } else {
            delete i.context.eventRecord
        }
        i.tickIndex = b;
        i.resource = c;
        i.resourceIndex = j;
        i.eventIndexInCell = d.eventIndexInCell;
        if (d.eventRecord) {
            i.alignEditorWithRecord(d.eventRecord, d.resource)
        } else {
            i.alignEditorWithCell()
        }
        i.onAfterSelect(h);
        i.fireEvent("select", i, c, a, g);
        i.fireEvent("selectionchange", i, i.getSelection())
    },
    alignEditorWithRecord: function(a, e) {
        var d = this;
        var b = d.view.getElementsFromEventRecord(a, e),
            c = b[0].getBox();
        c.y--;
        c.x--;
        d.alignEditor(c)
    },
    alignEditorWithCell: function() {
        var b = this;
        var a = Ext.get(b.view.getRowByRecord(b.resource));
        a && b.alignEditor({
            left: b.timeAxisViewModel.getTickWidth() * b.tickIndex,
            y: a.getTop() - 1,
            height: a.getHeight(),
            width: b.timeAxisViewModel.getTickWidth()
        })
    },
    alignEditor: function(b) {
        var a = this;
        a.containerEl.setY(b.y);
        if ("x" in b) {
            a.containerEl.setX(b.x)
        } else {
            a.containerEl.setLeft(b.left)
        }
        a.containerEl.setWidth(b.width);
        if (Ext.isIE8m) {
            a.containerEl.setHeight(b.height + 1);
            a.containerEl.setStyle("padding-top", 1);
            a.containerEl.select(".sch-cellplugin-border-top").setStyle("top", 1);
            a.containerEl.select(".sch-cellplugin-border-vertical").setHeight(b.height);
            a.containerEl.select(".sch-cellplugin-border-horizontal").setWidth(b.width)
        } else {
            a.containerEl.setHeight(b.height)
        }
        a.containerEl.show()
    },
    getSelection: function() {
        return this.selContext.concat(this.context)
    },
    getEventRecord: function(a) {
        return a.eventRecord
    },
    getResourceRecord: function(a) {
        return a.resource
    },
    onKeyUp: function(a) {
        this.moveUp(a)
    },
    onKeyDown: function(a) {
        this.moveDown(a)
    },
    onKeyLeft: function(a) {
        this.moveLeft(a)
    },
    onKeyRight: function(a) {
        this.moveRight(a)
    },
    onKeyTab: function(a) {
        if (a.shiftKey) {
            this.moveLeft(a)
        } else {
            this.moveRight(a)
        }
    },
    onKeyEnter: function() {
        this.beginEdit()
    },
    onKeyEsc: function() {
        this.destroyHighlighter()
    },
    findPreviousIndex: function(d) {
        var c = this;
        var b = c.getResourceIndex();
        var a = c.view.walkRecs(c.resource, -1);
        if (a !== c.resource) {
            return c.getResourceIndex(a)
        } else {
            return -1
        }
    },
    findNextIndex: function(d) {
        var c = this;
        var b = c.getResourceIndex();
        var a = c.view.walkRecs(c.resource, 1);
        if (a !== c.resource) {
            return c.getResourceIndex(a)
        } else {
            return -1
        }
    },
    getCellEvents: function(b) {
        var c = this;
        b = b || c.context;
        if (b.resourceIndex === -1 || b.tickIndex === -1) {
            return new Ext.util.MixedCollection()
        }
        var a = c.view.eventStore.queryBy(function(d) {
            return d.getResourceId() === b.resource.getId() && d.getStartDate() >= b.startDate && d.getStartDate() < b.endDate
        });
        a.sortBy(function(f, e) {
            var g = c.view.getElementsFromEventRecord(f, b.resource)[0],
                d = c.view.getElementsFromEventRecord(e, b.resource)[0];
            return g.getY() < d.getY() ? -1 : 1
        });
        return a
    },
    getAbove: function(c) {
        var d = this,
            a;
        c = c || d.context;
        if (c.eventRecord && d.eventIndexInCell == null) {
            d.eventIndexInCell = d.getCellEvents(c).indexOf(c.eventRecord)
        }
        if (d.eventIndexInCell > 0) {
            a = d.eventIndexInCell - 1;
            return {
                eventIndexInCell: a,
                eventRecord: d.getCellEvents(c).getAt(a)
            }
        }
        var b = d.findPreviousIndex();
        if (b === -1) {
            return {
                resourceIndex: -1
            }
        }
        return d.getEventOrCell(Ext.applyIf({
            resourceIndex: b
        }, c), true)
    },
    getBelow: function(d) {
        var e = this;
        d = d || e.context;
        if (d.eventRecord && e.eventIndexInCell == null) {
            e.eventIndexInCell = e.getCellEvents(d).indexOf(d.eventRecord)
        }
        if (e.eventIndexInCell >= 0) {
            var c = e.getCellEvents(d);
            var a = e.eventIndexInCell + 1;
            if (c.getCount() > a) {
                return {
                    eventIndexInCell: a,
                    eventRecord: c.getAt(a)
                }
            }
        }
        var b = e.findNextIndex();
        if (b === -1) {
            return {
                resourceIndex: -1
            }
        }
        return e.getEventOrCell(Ext.applyIf({
            resourceIndex: b
        }, d))
    },
    getEventOrCell: function(c, a) {
        var g = this,
            f = -1,
            h = null,
            b = g.tickIndex,
            e = g.resourceIndex;
        if ("tickIndex" in c) {
            b = c.tickIndex;
            var d = g.view.timeAxis.getAt(b);
            c.startDate = d.getStartDate();
            c.endDate = d.getEndDate()
        }
        if ("resourceIndex" in c) {
            e = c.resourceIndex;
            c.resource = g.view.dataSource.getAt(e)
        }
        var i = g.getCellEvents(c);
        if (i.getCount()) {
            if (a === true) {
                f = i.getCount() - 1;
                h = i.getAt(f)
            } else {
                f = 0;
                h = i.getAt(0)
            }
        }
        return {
            tickIndex: b,
            resourceIndex: e,
            eventIndexInCell: f,
            eventRecord: h
        }
    },
    getPrevious: function(a) {
        var b = this;
        a = a || b.context;
        var c = b.getResourceIndex();
        if (b.tickIndex > 0) {
            return b.getEventOrCell(Ext.applyIf({
                tickIndex: b.tickIndex - 1
            }, a))
        } else {
            return b.getEventOrCell(Ext.applyIf({
                tickIndex: b.tickCount - 1,
                resourceIndex: b.findPreviousIndex()
            }, a))
        }
    },
    getNext: function(a) {
        var b = this;
        a = a || b.context;
        if (b.tickIndex < b.tickCount - 1) {
            return b.getEventOrCell(Ext.applyIf({
                tickIndex: ++b.tickIndex,
                resourceIndex: b.getResourceIndex()
            }, a))
        } else {
            return b.getEventOrCell(Ext.applyIf({
                tickIndex: 0,
                resourceIndex: b.findNextIndex()
            }, a))
        }
    },
    moveUp: function(b) {
        var a = this;
        if (!a.containerEl) {
            return
        }
        a.showEditorInCell(a.getAbove(), b)
    },
    moveDown: function(b) {
        var a = this;
        if (!a.containerEl) {
            return
        }
        a.showEditorInCell(a.getBelow(), b)
    },
    moveLeft: function(b) {
        var a = this;
        if (!a.containerEl) {
            return
        }
        a.showEditorInCell(a.getPrevious(), b)
    },
    moveRight: function(b) {
        var a = this;
        if (!a.containerEl) {
            return
        }
        a.showEditorInCell(a.getNext(), b)
    },
    expandResourceRow: function(a) {
        var e = this;
        var f = Ext.get(e.view.getNodeByRecord(e.context.resource));
        var d = f.getBox();
        var b = e.getCellEvents().last();
        if (b) {
            var c = e.view.getElementsFromEventRecord(b, e.context.resource)[0].getBox();
            if (Math.abs(c.bottom - d.bottom) <= a) {
                f.setHeight(d.height + a);
                Ext.get(e.lockedView.getNodeByRecord(e.context.resource)).setHeight(d.height + a);
                e.__oldHeight = d.height;
                return d.bottom
            } else {
                return c.bottom
            }
        }
    },
    collapseResourceRow: function() {
        var a = this;
        if (a.__oldHeight) {
            Ext.get(a.view.getNodeByRecord(a.context.resource)).setHeight(a.__oldHeight);
            Ext.get(a.lockedView.getNodeByRecord(a.context.resource)).setHeight(a.__oldHeight);
            delete a.__oldHeight
        }
    },
    beginEditBelow: function() {
        var c = this;
        if (!c.containerEl) {
            return
        }
        delete c.context.eventRecord;
        c.beginEdit();
        var a = c.timeAxisViewModel.getViewRowHeight();
        var b = c.expandResourceRow(a);
        c.alignEditor({
            left: c.timeAxisViewModel.getTickWidth() * c.tickIndex,
            y: b,
            width: c.timeAxisViewModel.getTickWidth(),
            height: a
        })
    },
    beginEdit: function() {
        var d = this;
        if (!d.containerEl) {
            return
        }
        if (d.fireEvent("beforecelledit", d, d.getSelection()) === false) {
            return
        }
        d.editing = true;
        d.editor.startDate = d.context.startDate;
        d.editor.bottomUnit = Sch.util.Date.getSubUnit(d.timeAxisViewModel.getBottomHeader().unit);
        d.containerEl.select(".sch-cellplugin-border").hide();
        d.containerEl.setStyle("z-index", 1);
        var c = d.getEventRecord(d.context),
            e = d.getResourceRecord(d.context);
        if (c) {
            var b = Ext.Date;
            var g = Ext.isArray(d.editor.dateFormat) ? d.editor.dateFormat[0] : d.editor.dateFormat;
            var a = b.format(c.getStartDate(), g);
            var f = b.format(c.getEndDate(), g);
            d.editor.record = c;
            d.editor.setValue([a, f].join(d.editor.divider));
            d.editor.recordNode = d.view.getElementsFromEventRecord(c, e)[0];
            Ext.fly(d.editor.recordNode).hide()
        }
        d.editor.show();
        d.editor.setWidth(d.editor.getMaxWidth());
        d.editor.focus();
        d.fireEvent("begincelledit", d, d.getSelection())
    },
    cancelEdit: function() {
        var b = this;
        var c = b.editor.getValue();
        var a = b.getSelection();
        if (b.fireEvent("beforecancelcelledit", b, c, a) === false) {
            return
        }
        b.stopEditing();
        b.fireEvent("cancelcelledit", b, c, a)
    },
    completeEdit: function() {
        var h = this,
            c = false;
        if (!h.editing || !h.containerEl) {
            return
        }
        var i = h.editor.getValue();
        var k = h.getSelection();
        if (h.fireEvent("beforecompletecelledit", h, i, k) === false) {
            return
        }
        if (i && h.editor.isValid()) {
            var e = h.editor.record;
            var d = Sch.util.Date;
            var j = d.getSubUnit(h.timeAxisViewModel.getBottomHeader().unit);
            var a = h.editor.getDates(i);
            var b = a[0];
            var f = a[1];
            if (e) {
                e.setStartEndDate(b, f);
                delete h.editor.record
            } else {
                var g = new h.view.eventStore.model({
                    StartDate: b,
                    EndDate: f,
                    ResourceId: h.context.resource.getId()
                });
                h.view.onEventCreated(g);
                h.view.eventStore.add(g)
            }
            c = true
        }
        h.stopEditing();
        h.fireEvent("completecelledit", h, i, k);
        return c
    },
    stopEditing: function() {
        var b = this;
        if (b.editor.recordNode) {
            Ext.fly(b.editor.recordNode).show();
            delete b.editor.recordNode
        }
        b.collapseResourceRow();
        b.editor.setValue("");
        b.editing = false;
        b.clearSelection();
        b.containerEl.select(".sch-cellplugin-border").show();
        b.containerEl.setStyle("z-index", "auto");
        b.editor.hide();
        var a = b.lockedView.getRowByRecord(b.resource);
        a && Ext.fly(a).down("td").focus()
    },
    onBeforeSelect: function(b) {
        var a = this;
        b && b.isNavKeyPress && b.isNavKeyPress() && a.clearSelection();
        a.restoreEditing = a.editing;
        a.editing && a.completeEdit()
    },
    onAfterSelect: function(b) {
        var a = this;
        a.lockedView.getSelectionModel().select(a.resource);
        a.lockedView.getNodeByRecord(a.resource).focus();
        a.editor.setValue("");
        if (a.restoreEditing && (b === true || b && b.isNavKeyPress())) {
            a.beginEdit()
        }
        a.restoreEditing = false;
        a.containerEl.scrollIntoView(a.view.getEl())
    }
});
