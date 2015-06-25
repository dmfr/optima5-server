Ext.define("Sch.plugin.TimeGap", {
    extend: "Sch.plugin.Zones",
    alias: "plugin.scheduler_timegap",
    requires: ["Ext.data.JsonStore"],
    getZoneCls: Ext.emptyFn,
    init: function(a) {
        this.store = new Ext.data.JsonStore({
            model: "Sch.model.Range"
        });
        this.scheduler = a;
        a.mon(a.eventStore, {
            load: this.populateStore,
            update: this.populateStore,
            remove: this.populateStore,
            add: this.populateStore,
            datachanged: this.populateStore,
            scope: this
        });
        a.on("viewchange", this.populateStore, this);
        this.schedulerView = a.getSchedulingView();
        this.callParent(arguments)
    },
    populateStore: function(c) {
        var b = this.schedulerView.getEventsInView(),
            f = [],
            e = this.scheduler.getStart(),
            i = this.scheduler.getEnd(),
            d = b.getCount(),
            j = e,
            h, g = 0,
            a;
        b.sortBy(function(l, k) {
            return l.getStartDate() - k.getStartDate()
        });
        a = b.getAt(0);
        while (j < i && g < d) {
            h = a.getStartDate();
            if (!Sch.util.Date.betweenLesser(j, h, a.getEndDate()) && j < h) {
                f.push(new this.store.model({
                    StartDate: j,
                    EndDate: h,
                    Cls: this.getZoneCls(j, h) || ""
                }))
            }
            j = Sch.util.Date.max(a.getEndDate(), j);
            g++;
            a = b.getAt(g)
        }
        if (j < i) {
            f.push(new this.store.model({
                StartDate: j,
                EndDate: i,
                Cls: this.getZoneCls(j, i) || ""
            }))
        }
        this.store.removeAll(f.length > 0);
        this.store.add(f)
    }
});
