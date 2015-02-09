Ext.define('Optima5.Modules.Spec.DbsEmbralam.MainPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsEmbralam.HelperCache',
		
		'Optima5.Modules.Spec.DbsEmbralam.LivePanel',
		'Optima5.Modules.Spec.DbsEmbralam.StockPanel',
		'Optima5.Modules.Spec.DbsEmbralam.ProductsPanel'
	],
	
	initComponent: function() {
		Ext.apply(this,{
			layout:'fit',
			border: false,
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}]
		});
		this.callParent() ;
		
		var helperCache = Optima5.Modules.Spec.DbsEmbralam.HelperCache ;
		helperCache.init(this.optimaModule) ;
		if( helperCache.isReady ) {
			this.startComponent() ;
		} else {
			this.mon(helperCache,'ready',function(helperCache) {
				if( helperCache.authHelperQueryPage('ADMIN') ) {
					this.startComponentAdmin() ;
				} else {
					this.startComponentStd() ;
				}
			},this,{single:true}) ;
		}
	},
	startComponentStd: function() {
		this.removeAll() ;
		this.add({
			xtype: 'tabpanel',
			tabPosition: 'left',
			items:[
				Ext.create('Optima5.Modules.Spec.DbsEmbralam.LivePanel',{
					title: '<b>Live Adressage</b>',
					icon: 'images/op5img/ico_dataadd_16.gif',
					
					optimaModule: this.optimaModule
				})
			]
		});
	},
	startComponentAdmin: function() {
		this.removeAll() ;
		this.add({
			xtype: 'tabpanel',
			tabPosition: 'left',
			items:[
				Ext.create('Optima5.Modules.Spec.DbsEmbralam.LivePanel',{
					title: '<b>Live Adressage</b>',
					icon: 'images/op5img/ico_dataadd_16.gif',
					
					optimaModule: this.optimaModule
				})
			,
				Ext.create('Optima5.Modules.Spec.DbsEmbralam.StockPanel',{
					border: false,
					title: 'Carte magasin / Stock',
					icon: 'images/op5img/ico_blocs_small.gif',
					
					optimaModule: this.optimaModule
				})
			,
				Ext.create('Optima5.Modules.Spec.DbsEmbralam.ProductsPanel',{
					title: 'Table Produits',
					icon: 'images/op5img/ico_storeview_16.png',
					
					optimaModule: this.optimaModule
				})
			]
		});
	}
}) ;