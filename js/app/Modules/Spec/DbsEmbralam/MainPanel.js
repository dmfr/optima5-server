Ext.define('Optima5.Modules.Spec.DbsEmbralam.MainPanel',{
	extend:'Ext.tab.Panel',
	requires:[
		'Optima5.Modules.Spec.DbsEmbralam.HelperCache',
		
		'Optima5.Modules.Spec.DbsEmbralam.LivePanel',
		'Optima5.Modules.Spec.DbsEmbralam.StockPanel',
		'Optima5.Modules.Spec.DbsEmbralam.ProductsPanel'
	],
	
	initComponent: function() {
		var me = this ;
			
		Ext.apply(me,{
			tabPosition: 'left',
			items:[
				Ext.create('Optima5.Modules.Spec.DbsEmbralam.LivePanel',{
					title: '<b>Live Adressage</b>',
					icon: 'images/op5img/ico_dataadd_16.gif',
					
					optimaModule: me.optimaModule
				})
			,
				Ext.create('Optima5.Modules.Spec.DbsEmbralam.StockPanel',{
					border: false,
					title: 'Carte magasin / Stock',
					icon: 'images/op5img/ico_blocs_small.gif',
					
					optimaModule: me.optimaModule
				})
			,
				Ext.create('Optima5.Modules.Spec.DbsEmbralam.ProductsPanel',{
					title: 'Table Produits',
					icon: 'images/op5img/ico_storeview_16.png',
					
					optimaModule: me.optimaModule
				})
			]
		});
		
		this.callParent() ;
		
		var helperCache = Optima5.Modules.Spec.DbsEmbralam.HelperCache ;
		helperCache.init(me.optimaModule) ;
		if( helperCache.isReady ) {
			this.switchToMainMenu() ;
		} else {
			helperCache.on('ready',function() {
				this.switchToMainMenu() ;
			},me) ;
		}
	}
}) ;