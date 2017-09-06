Ext.define('Ext.ux.RowExpanderSummary', {
	extend: 'Ext.grid.plugin.RowExpander',

	alias: 'plugin.rowexpandersum',

	getFeatureConfig: function(grid) {
        var me = this,
            features = [],
            featuresCfg = {
                ftype: 'rowbodybis',
                rowExpander: me,
                bodyBefore: me.bodyBefore,
                recordsExpanded: me.recordsExpanded,
                rowBodyHiddenCls: me.rowBodyHiddenCls,
                rowCollapsedCls: me.rowCollapsedCls,
                setupRowData: me.getRowBodyFeatureData,
                setup: me.setup
            };
 
        features.push(Ext.apply({
            lockableScope: 'normal',
            getRowBodyContents: me.getRowBodyContentsFn(me.rowBodyTpl)
        }, featuresCfg));
 
        // Locked side will need a copy to keep the two DOM structures symmetrical. 
        // A lockedTpl config is available to create content in locked side. 
        // The enableLocking flag is set early in Ext.panel.Table#initComponent if any columns are locked. 
        if (grid.enableLocking) {
            features.push(Ext.apply({
                lockableScope: 'locked',
                getRowBodyContents: me.lockedTpl ? me.getRowBodyContentsFn(me.lockedTpl) : function() {return '';}
            }, featuresCfg));
        }
 
        return features;
    }
});
