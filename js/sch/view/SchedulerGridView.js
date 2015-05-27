Ext.define("Sch.view.SchedulerGridView", {
    extend: "Sch.view.TimelineGridView",
    mixins: ["Sch.mixin.SchedulerView", "Sch.mixin.Localizable"],
    alias: "widget.schedulergridview"
}, function () {
    this.override(Sch.mixin.SchedulerView.prototype.inheritables() || {})
});
