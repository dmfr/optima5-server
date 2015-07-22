    Ext.define("Sch.model.Range", {
        extend: "Sch.model.Customizable",
        requires: ["Sch.util.Date"],
        idProperty: "Id",
        config: Ext.versions.touch ? {
            idProperty: "Id"
        } : null,
        startDateField: "StartDate",
        endDateField: "EndDate",
        nameField: "Name",
        clsField: "Cls",
        customizableFields: [{
            name: "StartDate",
            type: "date",
            dateFormat: "c"
        }, {
            name: "EndDate",
            type: "date",
            dateFormat: "c"
        }, {
            name: "Cls",
            type: "string"
        }, {
            name: "Name",
            type: "string"
        }],
        setStartDate: function(a, d) {
            var c = this.getEndDate();
            var b = this.getStartDate();
            this.set(this.startDateField, a);
            if (d === true && c && b) {
                this.setEndDate(Sch.util.Date.add(a, Sch.util.Date.MILLI, c - b))
            }
        },
        setEndDate: function(b, d) {
            var a = this.getStartDate();
            var c = this.getEndDate();
            this.set(this.endDateField, b);
            if (d === true && a && c) {
                this.setStartDate(Sch.util.Date.add(b, Sch.util.Date.MILLI, -(c - a)))
            }
        },
        setStartEndDate: function(b, a) {
            this.beginEdit();
            this.set(this.startDateField, b);
            this.set(this.endDateField, a);
            this.endEdit()
        },
        getDates: function() {
            var c = [],
                b = this.getEndDate();
            for (var a = Ext.Date.clearTime(this.getStartDate(), true); a < b; a = Sch.util.Date.add(a, Sch.util.Date.DAY, 1)) {
                c.push(a)
            }
            return c
        },
        forEachDate: function(b, a) {
            return Ext.each(this.getDates(), b, a)
        },
        isValid: function() {
            var b = this.callParent(arguments);
            if (b) {
                var c = this.getStartDate(),
                    a = this.getEndDate();
                b = !c || !a || (a - c >= 0)
            }
            return b
        },
        shift: function(b, a) {
            this.setStartEndDate(Sch.util.Date.add(this.getStartDate(), b, a), Sch.util.Date.add(this.getEndDate(), b, a))
        },
        fullCopy: function() {
            return this.copy.apply(this, arguments)
        }
    });
