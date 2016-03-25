Ext.define('Optima5.Modules.Spec.DbsTracy.TrsptFilesGrid',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.CfgParamButton'
	],
	
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
			},Ext.create('Optima5.Modules.Spec.DbsTracy.CfgParamButton',{
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
			}),'-',{
				icon: 'images/op5img/ico_search_16.gif',
				handler: function(btn) {
					btn.up().down('#txtSearch').reset() ;
				}
			},{
				xtype: 'textfield',
				itemId: 'txtSearch',
				width: 100,
				listeners: {
					change: function(field) {
						var value = field.getValue(),
							store = this.down('grid').getStore() ;
						if( Ext.isEmpty(value) ) {
							store.clearFilter() ;
							return ;
						}
						store.filter('prod_id',value) ;
					},
					scope: this
				}
			},'->',{
				icon:'images/op5img/ico_new_16.gif',
				text:'Création Article',
				handler: function() {},
				scope: this
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
		
		this.doConfigure() ;
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
		if( this.isVisible() ) {
			this.setViewRecord(null);
			this.down('gridpanel').getStore().load() ;
		} else {
			this.on('activate',function(){this.onDataChange();}, this, {single:true}) ;
		}
	},
	
	doConfigure: function() {
		// Create grid ?
		
		
	},
	
	
	doQuit: function() {
		this.destroy() ;
	}
});
