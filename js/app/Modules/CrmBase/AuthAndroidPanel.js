Ext.define('AuthAndroidModel', {
	extend: 'Ext.data.Model',
	idProperty: 'authandroid_id',
	fields: [
		{name: 'authandroid_id',  type: 'int'},
		{name: 'device_android_id',   type: 'string'},
		{name: 'device_is_allowed',   type: 'boolean'},
		{name: 'device_desc',   type: 'string'},
		{name: 'ping_timestamp',   type: 'int'},
		{name: 'ping_version',   type: 'int'}
	]
});


Ext.define('Optima5.Modules.CrmBase.AuthAndroidPanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5crmbaseauthandroid',
			  
	requires: [
		'Optima5.Modules.CrmBase.AuthAndroidForm'
	] ,
			  
	isLoaded: false,
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:AuthAndroidPanel','No module reference ?') ;
		}
		
		Ext.apply( me, {
			border:false,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			autoDestroy: true
		}) ;
		
		me.queryPanelCfg = {} ;
		Ext.apply(me.queryPanelCfg,{
			
			
		});
		
		me.callParent() ;
		
		me.addComponents();
	},
			  
			  
	
	
	reload: function() {
		var me = this ;
		if( this.query('>gridpanel').length == 1 && this.isLoaded == true ) {
			this.query('>gridpanel')[0].getStore().load() ;
			me.setFormpanelRecord(null) ;
		}
	},
	  
	  
	addComponents: function() {
		var me = this ;
		
		me.add({
			xtype: 'gridpanel',
			itemId:'mGridPanel',
			flex:3,
			title: 'Attached devices',
			store: {
				model: 'AuthAndroidModel',
				proxy: me.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_action: 'auth_android_getDevicesList'
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
			columns:[{
				text: '',
				width: 20,
				sortable: false,
				dataIndex: 'device_is_allowed',
				menuDisabled: true,
				renderer: function( value, metadata, record )
				{
					if( value ) {
						metadata.tdCls = 'op5-device-yes'
					} else {
						metadata.tdCls = 'op5-device-no'
					}
				}
			},{
				text: 'Android ID',
				flex: 1,
				sortable: false,
				dataIndex: 'device_android_id',
				menuDisabled: true
			},{
				text: 'Device Info',
				flex: 1,
				sortable: false,
				dataIndex: 'device_desc',
				menuDisabled: true
			},{
				text: 'Last Ping',
				flex: 1,
				sortable: false,
				dataIndex: 'ping_timestamp',
				menuDisabled: true,
				renderer: function( value ) {
					var tmpDate = new Date() ;
					tmpDate.setTime(value * 1000) ;
					return Ext.util.Format.date( tmpDate , 'd/m/Y H:i' ) ;
				}
			},{
				text: 'Version',
				flex: 0.5,
				sortable: false,
				dataIndex: 'ping_version',
				menuDisabled: true,
				renderer: function( value ) {
					if( value <= 0 ) {
						return "" ;
					}
					return value ;
				}
			}],
			listeners: {
				itemclick:function( view, record, item, index, event ) {
					me.setFormpanelRecord( record ) ;
				},
				scope:me
			}
		},{
			xtype:'panel',
			itemId:'mFormPanel',
			flex: 2 ,
			layout:'fit',
			border:false
		}) ;
		
		me.setFormpanelRecord(null) ;
	},
	setFormpanelRecord: function( record ){
		var me = this ;
		
		var formpanel = me.getComponent('mFormPanel') ;
		
		formpanel.removeAll() ;
		if( record === null ) {
			formpanel.add({
				xtype:'panel',
				border:false,
				frame:true
			});
			return ;
		}
		
		var mform = Ext.create('Optima5.Modules.CrmBase.AuthAndroidForm',{
			optimaModule: me.optimaModule,
			frame:true,
			listeners: {
				saved: function() {
					me.reload() ;
				},
				scope:me
			}
		}) ;
		mform.loadRecord(record) ;
		formpanel.add( mform ) ;
	}
});