Ext.define('DataImportLogModel', {
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id', type: 'string'},
		{name: 'sdomain_id', type: 'string'},
		{name: 'qlog_id', type: 'int'},
		{name: 'request_date', type: 'date', dateFormat: 'Y-m-d H:i:s'},
		{name: 'request_user', type: 'string'},
		{name: 'request_ip', type: 'string'},
		{name: 'store_type', type: 'string'},
		{name: 'store_code', type: 'string'},
		{name: 'log_success', type: 'boolean'},
		{name: 'log_duration', type: 'number'}
	]
});

Ext.define('Optima5.Modules.CrmBase.DataImportLogsPanel',{
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
				text: 'Request',
				columns: [{
					text: 'Date/time',
					width: 120,
					dataIndex: 'request_date',
					renderer: Ext.util.Format.dateRenderer('d/m/Y H:i')
				},{
					text: 'User account',
					width: 120,
					dataIndex: 'request_user'
				},{
					text: 'Orig. IP',
					dataIndex: 'request_ip'
				},{
					text: 'Size',
					dataIndex: 'request_size'
				}]
			},{
				text: 'Store/Table',
				columns: [{
					text: 'Sdomain',
					dataIndex: 'sdomain_id',
					filter: {type: 'stringlist'},
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				},{
					text: 'Type',
					dataIndex: 'store_type',
					filter: {type: 'stringlist'}
				},{
					text: 'Code',
					width: 200,
					dataIndex: 'store_code',
					filter: {type: 'stringlist'}
				}]
			},{
				text: 'Result',
				columns: [{
					text: 'Warning ?',
					dataIndex: 'log_success',
					renderer: function(value,metadata) {
						if( value ) {
							metadata.tdCls = 'op5-device-yes'
						} else {
							metadata.tdCls = 'op5-device-no'
						}
					}
				},{
					text: 'Duration',
					align: 'center',
					dataIndex: 'log_duration',
					renderer: Ext.util.Format.numberRenderer('0.0')
				}]
			}],
			store: {
				model: 'DataImportLogModel',
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_action: 'data_importDirect_getLogs'
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
		this.getStore().load() ;
	}
});
