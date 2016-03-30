Ext.define('Optima5.Modules.Spec.DbsTracy.FilesGrid',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.CfgParamButton'
	],
	
	defaultViewMode: 'order',
	viewMode: null,
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'fit',
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'-',Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamButton',{
				cfgParam_id: 'SOC',
				icon: 'images/op5img/ico_blocs_small.gif',
				text: 'Companies / Customers',
				itemId: 'btnSoc',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onSocSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),'->',{
				//iconCls: 'op5-spec-dbsembramach-report-clock',
				itemId: 'tbViewmode',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:function(menuitem) {
							//console.log('ch view '+menuitem.itemId) ;
							this.onViewSet( menuitem.itemId ) ;
						},
						scope:this
					},
					items: [{
						itemId: 'order',
						text: 'Orders',
						iconCls: 'op5-spec-dbstracy-grid-view-order'
					},{
						itemId: 'order-group-trspt',
						text: 'Orders w/ Transport',
						iconCls: 'op5-spec-dbstracy-grid-view-ordergroup'
					},{
						itemId: 'trspt',
						text: 'Transport Files',
						iconCls: 'op5-spec-dbstracy-grid-view-trspt'
					}]
				}
			}],
			items: [{
				flex: 1,
				border: false,
				xtype: 'panel',
				itemId: 'pCenter',
				layout: {
					type: 'fit'
				},
				items: []
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			return ;
			if( this.down('gridpanel').getStore().loading || this.down('gridpanel').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		this.onViewSet(this.defaultViewMode) ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.onDataChange() ;
				break ;
			default: break ;
		}
	},
	onDataChange: function() {
		return ;
		if( this.isVisible() ) {
			this.setViewRecord(null);
			this.down('gridpanel').getStore().load() ;
		} else {
			this.on('activate',function(){this.onDataChange();}, this, {single:true}) ;
		}
	},
	
	onViewSet: function(viewId) {
		var tbViewmode = this.child('toolbar').getComponent('tbViewmode'),
			tbViewmodeItem = tbViewmode.menu.getComponent(viewId),
			iconCls, text ;
		if( tbViewmodeItem ) {
			this.viewMode = viewId ;
		}
		// View mode
		var tbViewmodeItem = tbViewmode.menu.getComponent(this.viewMode) ;
		if( tbViewmodeItem ) {
			tbViewmode.setText( 'View :'+'&#160;'+'<b>' + tbViewmodeItem.text + '</b>' );
			tbViewmode.setIconCls( tbViewmodeItem.iconCls );
		}
		
		// Create grid ?
		var withGrouping ;
		switch( this.viewMode ) {
			case 'order' :
			case 'order-group-trspt' :
				return this.doConfigureOrder(withGrouping=(this.viewMode=='order-group-trspt')) ;
				
			case 'trspt' :
				return this.doConfigureTrspt() ;
				
			default:
				return this.doConfigureNull() ;
		}
	},
	doConfigureNull: function() {
		var pCenter = this.down('#pCenter') ;
		pCenter.removeAll() ;
		pCenter.add({
			xtype:'box',
			cls:'op5-waiting',
			flex:1
		});
	},
	doConfigureTrspt: function(withGrouping) {
		this.doConfigureNull() ;
	},
	doConfigureOrder: function() {
		this.doConfigureNull() ;
	},
	
	onSocSet: function( socCode ) {
		
	},
	
	doQuit: function() {
		this.destroy() ;
	}
});
