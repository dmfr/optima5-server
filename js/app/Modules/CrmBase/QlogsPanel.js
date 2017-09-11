Ext.define('QlogModel', {
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id', type: 'string'},
		{name: 'sdomain_id', type: 'string'},
		{name: 'qlog_id', type: 'int'},
		{name: 'request_date', type: 'date', dateFormat: 'Y-m-d H:i:s'},
		{name: 'request_user', type: 'string'},
		{name: 'request_ip', type: 'string'},
		{name: 'q_type', type: 'string'},
		{name: 'q_id', type: 'int'},
		{name: 'q_name', type: 'string'},
		{name: 'log_success', type: 'boolean'},
		{name: 'log_duration', type: 'number'}
	]
});

Ext.define('Optima5.Modules.CrmBase.QlogsPanel',{
	extend: 'Ext.grid.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			tbar: [{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doLoad() ;
				},
				scope: this
			},'->',{
				xtype: 'checkboxfield',
				margin: '0 10',
				itemId: 'chkFilterLast',
				boxLabel: 'Last request only',
				checked: true,
				handler: function() {
					this.doLoad() ;
				},
				scope: this
			},'-',{
				xtype: 'checkboxfield',
				margin: '0 10',
				itemId: 'chkFilterSdomain',
				boxLabel: 'All domains',
				checked: true,
				handler: function() {
					this.doLoad() ;
				},
				scope: this
			}],
			//xtype: 'grid',
			columns: [{
				text: 'ID',
				dataIndex: 'id'
			},{
				text: 'ts',
				dataIndex: 'request_ts'
			},{
				text: 'name',
				dataIndex: 'q_name'
			}],
			store: {
				model: 'QlogModel',
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_action: 'queries_direct_getLogs'
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				}),
				listeners: {
					beforeload: this.onStoreBeforeLoad,
					scope: this
				}
			}
		});
		this.callParent() ;
		this.doLoad() ;
	},
	onStoreBeforeLoad: function(store,options) {
		console.dir(arguments) ;
		var filterLast = this.down('toolbar').down('#chkFilterLast').getValue(),
			filterSdomain = this.down('toolbar').down('#chkFilterSdomain').getValue();
			
		var params = (options.getParams() || {}) ;
		Ext.apply(params,{
			filter_last: (filterLast ? 1 : 0),
			filter_sdomain: (filterSdomain ? 0 : 1)
		}) ;
		options.setParams(params) ;
	},
	doLoad: function() {
		this.getStore().load() ;
	}
});
