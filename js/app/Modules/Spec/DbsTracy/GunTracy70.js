Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy70',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.GunTracy70selectTrspt',
		
	],
	
	_printerUri: null,
	_runTransferligSrcAdr: null,
	
	initComponent: function(){
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			layout: 'fit',
			items: []
		});
		this.callParent() ;
		this.openSelectTrspt() ;
	},
	openSelectTrspt: function() {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunTracy70selectTrspt',{
			border: false,
			optimaModule: this.optimaModule,
			listeners: {
				quit: function() {
					this.destroy() ;
				},
				selecttrspt: function(p,printerUri) {
					//this._printerUri = printerUri ;
					//this.openList(this._printerUri) ;
				},
				openfilters: function(p,cfg) {
					console.log('openfilters') ;
					this.fireEvent('openfilters',this,cfg) ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openList: function(printerUri) {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunPackingList',{
			border: false,
			optimaModule: this.optimaModule,
			_printerUri: printerUri,
			listeners: {
				openpackingsrc: function(p,srcAdr) {
					this.openPackingSrc(this._printerUri,srcAdr) ;
				},
				quit: function() {
					this.destroy() ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openPackingSrc: function(printerUri,transferligSrcAdr) {
		this._runTransferligSrcAdr = transferligSrcAdr ;
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunPackingRun',{
			border: false,
			optimaModule: this.optimaModule,
			_printerUri: printerUri,
			_transferligSrcAdr: transferligSrcAdr,
			listeners: {
				quit: function() {
					this._runTransferligSrcAdr = null ;
					this.openList(this._printerUri) ;
				},
				openpackingrecord: function(p,transferCdePackFilerecordId) {
					this.openPackingRecord(this._printerUri,transferCdePackFilerecordId) ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openPackingRecord: function(printerUri, transferCdePackFilerecordId) {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunPackingResult',{
			border: false,
			optimaModule: this.optimaModule,
			_printerUri: printerUri,
			_transferCdePackFilerecordId: transferCdePackFilerecordId,
			listeners: {
				quit: function() {
					if( this._runTransferligSrcAdr ) {
						this.openPackingSrc( this._printerUri, this._runTransferligSrcAdr ) ;
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
