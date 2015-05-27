Ext.define("Sch.plugin.TreeCellEditing", {
    extend: "Ext.grid.plugin.CellEditing",
    alias: "plugin.scheduler_treecellediting",
    lockableScope: "locked",
    init: function (a) {
        this._grid = a;
        this.on("beforeedit", this.checkReadOnly, this);
        this.callParent(arguments)
    },
    bindPositionFixer: function () {
        Ext.on({
            afterlayout: this.fixEditorPosition,
            scope: this
        })
    },
    unbindPositionFixer: function () {
        Ext.un({
            afterlayout: this.fixEditorPosition,
            scope: this
        })
    },
    fixEditorPosition: function (a) {
        var b = this.getActiveEditor();
        if (b) {
            var d = this.getEditingContext(this.context.record, this.context.column);
            if (d) {
                this.context.row = d.row;
                this.context.rowIdx = d.rowIdx;
                b.boundEl = this.getCell(d.record, d.column);
                b.realign();
                var c = this._grid.getView();
                c.focusedRow = c.getNode(d.rowIdx)
            }
        }
    },
    checkReadOnly: function () {
        var a = this._grid;
        if (!(a instanceof Sch.panel.TimelineTreePanel)) {
            a = a.up("tablepanel")
        }
        return !a.isReadOnly()
    },
    startEdit: function (a, c, b) {
        this._grid.suspendLayouts();
        var d = this.callParent(arguments);
        this._grid.resumeLayouts();
        return d
    },
    onEditComplete: function (c, f, b) {
        var e = this,
            a, d;
        if (c.field.applyChanges) {
            a = c.field.task || e.context.record;
            d = true;
            a.set = function () {
                delete a.set;
                d = false;
                c.field.applyChanges(a)
            }
        }
        this.callParent(arguments);
        if (d) {
            delete a.set
        }
        this.unbindPositionFixer()
    },
    showEditor: function (a, b, c) {
        var g = this.grid.getSelectionModel();
        var f = g.selectByPosition;
        if (Ext.getVersion("extjs").isLessThan("4.2.2.1144")) {
            g.selectByPosition = Ext.emptyFn
        }
        var e = a.field;
        if (e && e.setSuppressTaskUpdate) {
            e.setSuppressTaskUpdate(true)
        }
        var d = a.startEdit;
        a.startEdit = function () {
            a.startEdit = d;
            a.startEdit.apply(a, arguments);
            if (e && e.setSuppressTaskUpdate) {
                e.setSuppressTaskUpdate(false)
            }
        };
        if (e) {
            if (e.setTask) {
                e.setTask(b.record);
                c = b.value = b.originalValue = e.getValue()
            } else {
                if (!b.column.dataIndex && b.value === undefined) {
                    c = b.value = e.getDisplayValue(b.record)
                }
            }
        }
        if (Ext.isIE8m && Ext.getVersion("extjs").toString() === "4.2.2.1144") {
            Ext.EventObject.type = "click"
        }
        this.callParent([a, b, c]);
        if (Ext.getVersion("extjs").isLessThan("4.2.2.1144")) {
            g.selectByPosition = f
        }
        this.bindPositionFixer()
    },
    cancelEdit: function () {
        this.callParent(arguments);
        this.unbindPositionFixer()
    }
});
