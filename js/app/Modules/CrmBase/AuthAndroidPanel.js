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
			  
	alias: 'widget.op5paracrmauthandroid',
			  
	isLoaded: false,
			  
	initComponent: function() {
		var me = this ;
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
		
		me.createPanel();
	},
			  
			  
	
	
	createPanel: function(){
		var me = this ;
		
		me.isActive = true ;
		
		me.removeAll();
		me.addComponents();
	},
	destroyPanel: function(){
		var me = this ;
		
		me.isActive = false ;
		me.removeAll();
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
						_action: 'auth_android_getDevicesList' ,
					},
					reader: {
						type: 'json',
						root: 'data',
						totalProperty: 'total'
					}
				}),
				listeners: {
					load:function(thisstore) {
						console.log('is loaded') ;
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
				scrollershow: function(scroller) {
					if (scroller && scroller.scrollEl) {
						scroller.clearManagedListeners(); 
						scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
					}
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
		
	}
}); 
