Ext.define('Optima5.Modules.Spec.DbsLam.GunInput',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsLam.GunInputList',
		'Optima5.Modules.Spec.DbsLam.GunInputForm'
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
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunInputList',{
			border: false,
			optimaModule: this.optimaModule,
			listeners: {
				quit: function() {
					this.destroy() ;
				},
				openfilters: function() {
					this.openFilters() ;
				},
				opentransferstep: function(p,transferstepFilerecordId) {
					this.openTransferStep(transferstepFilerecordId) ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openTransferStep: function(transferstepFilerecordId) {
		this._runTransferstepFilerecordId = transferstepFilerecordId ;
		var formPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunInputForm',{
			border: false,
			optimaModule: this.optimaModule,
			_transferstepFilerecordId: transferstepFilerecordId,
			listeners: {
				quit: function() {
					this._runTransferstepFilerecordId = null ;
					this.openList() ;
				},
				openforwardtransferlig: function(p,transferligFilerecordId) {
					this.openForwardTransferLig(transferligFilerecordId) ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(formPanel) ;
	},
}) ;
