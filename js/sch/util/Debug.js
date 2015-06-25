Ext.define("Sch.util.Debug", {
    singleton: true,
    runDiagnostics: function() {
        var d;
        var k = this;
        var b = window.console;
        if (b && b.log) {
            d = function() {
                b.log.apply(b, arguments)
            }
        } else {
            if (!k.schedulerDebugWin) {
                k.schedulerDebugWin = new Ext.Window({
                    height: 400,
                    width: 500,
                    bodyStyle: "padding:10px",
                    closeAction: "hide",
                    autoScroll: true
                })
            }
            k.schedulerDebugWin.show();
            k.schedulerDebugWin.update("");
            d = function(i) {
                k.schedulerDebugWin.update((k.schedulerDebugWin.body.dom.innerHTML || "") + i + "<br/>")
            }
        }
        var e = Ext.select(".sch-schedulerpanel");
        if (e.getCount() === 0) {
            d("No scheduler component found")
        }
        var p = Ext.getCmp(e.elements[0].id),
            n = p.getResourceStore(),
            c = p.getEventStore();
        if (!c.isEventStore) {
            d("Your event store must be or extend Sch.data.EventStore")
        }
        d("Scheduler view start: " + p.getStart() + ", end: " + p.getEnd());
        if (!n) {
            d("No store configured");
            return
        }
        if (!c) {
            d("No event store configured");
            return
        }
        var g = new Ext.util.MixedCollection(),
            j = new Ext.util.MixedCollection();
        for (var f = 0; f < c.model.prototype.fields.length; f++) {
            g.add(c.model.prototype.fields[f].name, c.model.prototype.fields[f])
        }
        for (f = 0; f < n.model.prototype.fields.length; f++) {
            j.add(n.model.prototype.fields[f].name, n.model.prototype.fields[f])
        }
        d(n.getCount() + " records in the resource store");
        d(c.getCount() + " records in the eventStore");
        var o = c.model.prototype.idProperty;
        var a = n.model.prototype.idProperty;
        var m = g.getByKey(o);
        var h = j.getByKey(a);
        if (!(new c.model() instanceof Sch.model.Event)) {
            d("Your event model must extend Sch.model.Event")
        }
        if (!(new n.model() instanceof Sch.model.Resource)) {
            d("Your resource model must extend Sch.model.Resource")
        }
        if (!m) {
            d("idProperty on the event model is incorrectly setup, value: " + o)
        }
        if (!h) {
            d("idProperty on the resource model is incorrectly setup, value: " + a)
        }
        var l = p.getSchedulingView();
        d(l.el.select(l.eventSelector).getCount() + " events present in the DOM");
        if (c.getCount() > 0) {
            if (!c.first().getStartDate() || !(c.first().getStartDate() instanceof Date)) {
                d("The eventStore reader is misconfigured - The StartDate field is not setup correctly, please investigate");
                d("StartDate is configured with dateFormat: " + g.getByKey(c.model.prototype.startDateField).dateFormat);
                d("See Ext JS docs for information about different date formats: http://docs.sencha.com/extjs/#!/api/Ext.Date")
            }
            if (!c.first().getEndDate() || !(c.first().getEndDate() instanceof Date)) {
                d("The eventStore reader is misconfigured - The EndDate field is not setup correctly, please investigate");
                d("EndDate is configured with dateFormat: " + g.getByKey(c.model.prototype.endDateField).dateFormat);
                d("See Ext JS docs for information about different date formats: http://docs.sencha.com/extjs/#!/api/Ext.Date")
            }
            if (c.proxy && c.proxy.reader && c.proxy.reader.jsonData) {
                d("Dumping jsonData to console");
                console && console.dir && console.dir(c.proxy.reader.rawData)
            }
            d("Records in the event store:");
            c.each(function(s, q) {
                d((q + 1) + ". " + s.startDateField + ":" + s.getStartDate() + ", " + s.endDateField + ":" + s.getEndDate() + ", " + s.resourceIdField + ":" + s.getResourceId());
                if (!s.getStartDate()) {
                    d(s.getStartDate())
                }
            })
        } else {
            d("Event store has no data. Has it been loaded properly?")
        }
        if (n instanceof Ext.data.TreeStore) {
            n = n.nodeStore
        }
        if (n.getCount() > 0) {
            d("Records in the resource store:");
            n.each(function(s, q) {
                d((q + 1) + ". " + s.idProperty + ":" + s.getId());
                return
            })
        } else {
            d("Resource store has no data.");
            return
        }
        d("Everything seems to be setup ok!")
    }
});
