Ext.define('Optima5.Modules.ParaCRM.DummyFilter', {
    extend: 'Ext.ux.grid.filter.Filter',
    alias: 'gridfilter.op5paracrmdummy',

    /**
     * @cfg {String} iconCls
     * The iconCls to be applied to the menu item.
     * Defaults to <tt>'ux-gridfilter-text-icon'</tt>.
     */
    iconCls : 'ux-gridfilter-text-icon',

    emptyText: 'Enter Filter Text...',
    selectOnFocus: true,
    width: 125,
			  
    init : function (config) {
        Ext.applyIf(config, {
            enableKeyEvents: true,
            iconCls: this.iconCls,
            hideLabel: true,
            listeners: {
                scope: this,
                keyup: this.onInputKeyUp,
                el: {
                    click: function(e) {
                        e.stopPropagation();
                    }
                }
            }
        });

        this.inputItem = Ext.create('Optima5.Modules.ParaCRM.BiblePicker', {bibleId:'PRODCOM'});
        this.menu.add(this.inputItem);
        this.updateTask = Ext.create('Ext.util.DelayedTask', this.fireUpdate, this);
    },

});