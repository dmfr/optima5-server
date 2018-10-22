Ext.define('Optima5.Modules.Spec.DbsLam.GunPicking',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsLam.GunPickingList',
		'Optima5.Modules.Spec.DbsLam.GunPickingRun',
		'Optima5.Modules.Spec.DbsLam.GunPickingTake'
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
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunPickingList',{
			border: false,
			optimaModule: this.optimaModule,
			listeners: {
				quit: function() {
					this.destroy() ;
				},
				openfilters: function() {
					this.openFilters() ;
				},
				openpickingdst: function(p,transferligDstAdr) {
					this.openPickingDst(transferligDstAdr) ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openPickingDst: function(transferligDstAdr) {
		this._runTransferligDstAdr = transferligDstAdr ;
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunPickingRun',{
			border: false,
			optimaModule: this.optimaModule,
			_transferligDstAdr: transferligDstAdr,
			listeners: {
				quit: function() {
					this._runTransferligDstAdr = null ;
					this.openList() ;
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
	openTransferLig: function(transferligFilerecordId) {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunPickingTake',{
			border: false,
			optimaModule: this.optimaModule,
			_transferligFilerecordId: transferligFilerecordId,
			listeners: {
				quit: function() {
					if( this._runTransferligDstAdr ) {
						this.openPickingDst( this._runTransferligDstAdr ) ;
					} else {
						this.openList() ;
					}
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	}
}) ;
