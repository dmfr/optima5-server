Ext.define('QsqlTokenModel', {
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id', type: 'string'},
		{name: 'sdomain_id', type: 'string'},
		{name: 'qsql_autorun_id', type: 'int'},
		{name: 'exec_date', type: 'date', dateFormat: 'Y-m-d H:i:s'},
		{name: 'exec_duration', type: 'number'},
		{name: 'qsql_id', type: 'int'},
		{name: 'qsql_name', type: 'string'}
	]
});

Ext.define('Optima5.Modules.CrmBase.QsqlTokensPanel',{
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
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			columns: [{
				text: 'Token',
				columns: [{
					text: 'Key',
					width: 120,
					dataIndex: 'exec_date',
					renderer: Ext.util.Format.dateRenderer('d/m/Y H:i')
				},{
					text: 'Desc',
					width: 250,
					align: 'center',
					dataIndex: 'exec_duration',
					renderer: Ext.util.Format.numberRenderer('0.0')
				}]
			},{
				text: 'Query',
				columns: [{
					text: 'Sdomain',
					dataIndex: 'sdomain_id',
					filter: {type: 'stringlist'},
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				},{
					text: 'Query',
					width: 200,
					dataIndex: 'qsql_name',
					filter: {type: 'stringlist'}
				}]
			},{
				text: 'Execution',
				columns: [{
					text: 'Date/time',
					width: 120,
					dataIndex: 'exec_date',
					renderer: Ext.util.Format.dateRenderer('d/m/Y H:i')
				},{
					text: 'Duration',
					align: 'center',
					dataIndex: 'exec_duration',
					renderer: Ext.util.Format.numberRenderer('0.0')
				}]
			}],
			store: {
				model: 'QsqlTokenModel',
				autoLoad: false,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_action: 'queries_qsqlToken_getSummary'
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
		//this.getStore().load() ;
	}
});
