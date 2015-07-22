Ext.define("Sch.plugin.TreeCellEditing", {
    extend: "Ext.grid.plugin.CellEditing",
    alias: "plugin.scheduler_treecellediting",
    lockableScope: "locked",
    editorsStarted: 0,
    init: function(a) {
        this._grid = a;
        this.on("beforeedit", this.onMyBeforeEdit, this);
        this.callParent(arguments)
    },
    showEditor: function(a) {
        var b = this,
            c = a.field;
        if (!a._cancelEdit) {
            a._cancelEdit = a.cancelEdit;
            a.cancelEdit = b.myCancelEdit
        }
        if (c.setSuppressTaskUpdate) {
            c.setSuppressTaskUpdate(true)
        }
        this.callParent(arguments);
        if (c.setSuppressTaskUpdate) {
            c.setSuppressTaskUpdate(false)
        }
    },
    checkReadOnly: function() {
        var a = this._grid;
        if (!(a instanceof Sch.panel.TimelineTreePanel)) {
            a = a.up("tablepanel")
        }
        return !a.isReadOnly()
    },
    onEditComplete: function(b, d, a) {
        var c = this;
        if (b.field.applyChanges) {
            b.field.applyChanges(b.field.task || c.context.record);
            return c.callParent([b, d, d])
        } else {
            return c.callParent([b, d, a])
        }
    },
    myCancelEdit: function() {
        var b = this,
            d = b.field;
        if (d && d.applyChanges) {
            var c = d.instantUpdate;
            d.instantUpdate = true;
            var a = b._cancelEdit.apply(this, arguments);
            d.instantUpdate = c;
            return a
        } else {
            return b._cancelEdit.apply(this, arguments)
        }
    },
    onMyBeforeEdit: function(b, a) {
        var c = a.column.getEditor();
        if (this.editing) {
            this.completeEdit()
        }
        if (c) {
            if (c.setTask) {
                c.setTask(a.record);
                a.value = a.originalValue = c.getValue()
            }
        }
        return this.checkReadOnly()
    }
});
