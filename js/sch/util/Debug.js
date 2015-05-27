Ext.define("Sch.util.Debug", {
    singleton: true,
    runDiagnostics: function () {
        var d;
        var g = this;
        var b = window.console;
        if (b && b.log) {
            d = function (m) {
                b.log(m)
            }
        } else {
            if (!g.schedulerDebugWin) {
                g.schedulerDebugWin = new Ext.Window({
                    height: 400,
                    width: 500,
                    bodyStyle: "padding:10px",
                    closeAction: "hide",
                    autoScroll: true
                })
            }
            g.schedulerDebugWin.show();
            g.schedulerDebugWin.update("");
            d = function (m) {
                g.schedulerDebugWin.update((g.schedulerDebugWin.body.dom.innerHTML || "") + m + "<br/>")
            }
        }
        var e = Ext.select(".sch-schedulerpanel");
        if (e.getCount() === 0) {
            d("No scheduler component found")
        }
        var l = Ext.getCmp(e.elements[0].id),
            j = l.getResourceStore(),
            c = l.getEventStore();
        if (!c.isEventStore) {
            d("Your event store must be or extend Sch.data.EventStore")
        }
        d("Scheduler view start: " + l.getStart() + ", end: " + l.getEnd());
        if (!j) {
            d("No store configured");
            return
        }
        if (!c) {
            d("No event store configured");
            return
        }
        d(j.getCount() + " records in the resource store");
        d(c.getCount() + " records in the eventStore");
        var k = c.model.prototype.idProperty;
        var a = j.model.prototype.idProperty;
        var i = c.model.prototype.fields.getByKey(k);
        var f = j.model.prototype.fields.getByKey(a);
        if (!(c.model.prototype instanceof Sch.model.Event)) {
            d("Your event model must extend Sch.model.Event")
        }
        if (!(j.model.prototype instanceof Sch.model.Resource)) {
            d("Your resource model must extend Sch.model.Resource")
        }
        if (!i) {
            d("idProperty on the event model is incorrectly setup, value: " + k)
        }
        if (!f) {
            d("idProperty on the resource model is incorrectly setup, value: " + a)
        }
        var h = l.getSchedulingView();
        d(h.el.select(h.eventSelector).getCount() + " events present in the DOM");
        if (c.getCount() > 0) {
            if (!c.first().getStartDate() || !(c.first().getStartDate() instanceof Date)) {
                d("The eventStore reader is misconfigured - The StartDate field is not setup correctly, please investigate");
                d("StartDate is configured with dateFormat: " + c.model.prototype.fields.getByKey("StartDate").dateFormat);
                d("See Ext JS docs for information about different date formats: http://docs.sencha.com/ext-js/4-0/#!/api/Ext.Date")
            }
            if (!c.first().getEndDate() || !(c.first().getEndDate() instanceof Date)) {
                d("The eventStore reader is misconfigured - The EndDate field is not setup correctly, please investigate");
                d("EndDate is configured with dateFormat: " + c.model.prototype.fields.getByKey("EndDate").dateFormat);
                d("See Ext JS docs for information about different date formats: http://docs.sencha.com/ext-js/4-0/#!/api/Ext.Date")
            }
            if (c.proxy && c.proxy.reader && c.proxy.reader.jsonData) {
                d("Dumping jsonData to console");
                console && console.dir && console.dir(c.proxy.reader.jsonData)
            }
            d("Records in the event store:");
            c.each(function (n, m) {
                d((m + 1) + ". " + n.startDateField + ":" + n.getStartDate() + ", " + n.endDateField + ":" + n.getEndDate() + ", " + n.resourceIdField + ":" + n.getResourceId());
                if (!n.getStartDate()) {
                    d(n.getStartDate())
                }
            })
        } else {
            d("Event store has no data. Has it been loaded properly?")
        } if (j instanceof Ext.data.TreeStore) {
            j = j.nodeStore
        }
        if (j.getCount() > 0) {
            d("Records in the resource store:");
            j.each(function (n, m) {
                d((m + 1) + ". " + n.idProperty + ":" + n.getId());
                return
            })
        } else {
            d("Resource store has no data.");
            return
        }
        d("Everything seems to be setup ok!")
    }
});
