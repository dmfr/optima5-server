Ext.define('Optima5.Modules.Spec.DbsLam.GunContainers',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsLam.GunContainersList',
		'Optima5.Modules.Spec.DbsLam.GunContainersFilters',
		'Optima5.Modules.Spec.DbsLam.GunContainersTake'
	],
	
	initComponent: function(){
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			layout: 'fit',
			items: []
		});
		this.callParent() ;
		this.openList() ;
	},
	openList: function() {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunContainersList',{
			border: false,
			optimaModule: this.optimaModule,
			listeners: {
				quit: function() {
					this.destroy() ;
				},
				openfilters: function() {
					this.openFilters() ;
				},
				opentransferlig: function(p,transferligFilerecordId) {
					this.openTransferLig(transferligFilerecordId) ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openFilters: function() {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunContainersFilters',{
			border: false,
			optimaModule: this.optimaModule,
			listeners: {
				quit: function() {
					this.openList() ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openTransferLig: function(transferligFilerecordId) {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunContainersTake',{
			border: false,
			optimaModule: this.optimaModule,
			_transferligFilerecordId: transferligFilerecordId,
			listeners: {
				quit: function() {
					this.openList() ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	}
}) ;
