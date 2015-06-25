Ext.define("Sch.template.Event", {
    extend: "Ext.XTemplate",
    eventPrefix: null,
    resizeHandles: null,
    resizeTpl: '<div class="sch-resizable-handle sch-resizable-handle-{0}"></div>',
    constructor: function(b) {
        Ext.apply(this, b);
        var a = (this.resizeHandles === "start" || this.resizeHandles === "both" ? '<div class="sch-resizable-handle sch-resizable-handle-start"></div>' : "");
        var c = (this.resizeHandles === "end" || this.resizeHandles === "both" ? '<div class="sch-resizable-handle sch-resizable-handle-end"></div>' : "");
        this.callParent(['<tpl for="."><div unselectable="on" tabindex="-1" id="' + this.eventPrefix + '{id}" style="right:{right}px;left:{left}px;top:{top}px;height:{height}px;width:{width}px;{style}" class="sch-event ' + Ext.baseCSSPrefix + 'unselectable {internalCls} {cls}">' + a + '<div unselectable="on" class="sch-event-inner {iconCls}">{body}</div>' + c + "</div></tpl>"])
    }
});
