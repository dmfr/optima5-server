Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportPopupPanel', {
	extend: 'Ext.window.Window',

	initComponent: function () {

		Ext.apply(this, {
			items:[{
				xtype: 'dataview',
				itemId: 'popView',
				tpl: [
					'<tpl for=".">',
					'<div class="op5-spec-rsiveo-report-item-icon">',
						'<div class="op5-spec-rsiveo-mainmenu-action-icon {iconCls}"></div>',
						'<span>{name:htmlEncode}</span>',
					'</div>',
					'</tpl>'
				],
				overItemCls: 'op5-spec-rsiveo-report-item-over',
				itemSelector: 'div.op5-spec-rsiveo-report-item-icon',
				cls: 'op5-spec-rsiveo-mainmenu',
				emptyText: 'Nothing here',
				store: Ext.create('Ext.data.Store', {
					fields: [{name: 'iconCls', type: 'string'}, {name: 'name', type: 'string'}, {name: "action_sendEvent", type: "string"}],
					data: [
						{iconCls: 'op5-spec-rsiveo-mmenu-agenda', name: "Tuiles", action_sendEvent: "tiles"},
						{iconCls: 'op5-spec-rsiveo-mmenu-agenda', name: "Analyse dossier", action_sendEvent: "analyse"},
						{iconCls: 'op5-spec-rsiveo-mmenu-agenda', name: "Encaissements", action_sendEvent: "charts"}]
				})
			}]
		}) ;

		this.callParent() ;
		this.down('#popView').on('itemclick',this.onClickItem,this) ;

	},
	onClickItem: function( view, record ) {
		var me = this ;
		if(record.get('action_sendEvent') != '' ) {
			me.fireEvent('actionclick',view,record.get('action_sendEvent')) ;
		}
	}

})