Ext.define('AuthDelegateLogModel', {
	extend: 'Ext.data.Model',
	idProperty: 'authdelegate_log_id',
	fields: [
		{name: 'authdelegate_log_id',  type: 'int'},
		{name: 'authdelegate_log_timestamp',   type: 'int'},
		{name: 'authdelegate_log_user',   type: 'string'},
		{name: 'authdelegate_log_ipaddr',   type: 'string'},
		{name: 'authdelegate_log_failcode',   type: 'string'}
	]
});


Ext.define('Optima5.Modules.CrmBase.AuthDelegatePanel' ,{
	extend: 'Ext.tab.Panel',
			  
	requires: ['Optima5.Modules.CrmBase.AuthDelegateForm'] ,
			 
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:AuthDelegateForm','No module reference ?') ;
		}
		
		Ext.apply(me,{
			layout: 'fit',
			bodyCls: 'ux-noframe-bg',
			defaults: {
				border: false
			},
			items:[{
				xtype: 'gridpanel',
				itemId:'mGridPanel',
				flex:3,
				title: 'Attached devices',
				store: {
					model: 'AuthDelegateLogModel',
					proxy: me.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_action: 'auth_delegate_getLog'
						},
						reader: {
							type: 'json',
							rootProperty: 'data',
							totalProperty: 'total'
						}
					}),
					listeners: {
						load:function() {
							me.isLoaded = true ;
						},
						scope:me
					},
					autoLoad: true
				},
				columns:{
					defaults:{
						menuDisabled: true,
						draggable: false,
						sortable: true,
						hideable: false,
						resizable: true
					},
					items:[{
						text: '',
						width: 20,
						dataIndex: 'authdelegate_log_failcode',
						renderer: function( value, metadata, record )
						{
							if( value=='' ) {
								metadata.tdCls = 'op5-device-yes'
							} else {
								metadata.tdCls = 'op5-device-no'
							}
						}
					},{
						text: 'Date',
						flex: 1,
						dataIndex: 'authdelegate_log_timestamp',
						renderer: function( value ) {
							var tmpDate = new Date() ;
							tmpDate.setTime(value * 1000) ;
							return Ext.util.Format.date( tmpDate , 'd/m/Y H:i' ) ;
						}
					},{
						text: 'User',
						flex: 1,
						dataIndex: 'authdelegate_log_user'
					},{
						text: 'IP Addr.',
						flex: 1,
						dataIndex: 'authdelegate_log_ipaddr'
					},{
						text: 'FailCode',
						flex: 1,
						dataIndex: 'authdelegate_log_failcode'
					}]
				}
			},Ext.create('Optima5.Modules.CrmBase.AuthDelegateForm',{
				title: 'Config',
				optimaModule: me.optimaModule,
				listeners: {
					saved: function() {
						this.up('window').destroy() ;
					},
					scope: this
				}
			})]
		});
		
		this.callParent() ;
	}
});