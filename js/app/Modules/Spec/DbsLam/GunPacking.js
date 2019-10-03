Ext.define('Optima5.Modules.Spec.DbsLam.GunPacking',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsLam.GunPackingPrinters',
		'Optima5.Modules.Spec.DbsLam.GunPackingList',
		'Optima5.Modules.Spec.DbsLam.GunPackingRun',
		'Optima5.Modules.Spec.DbsLam.GunPackingResult'
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
		this.openSelectPrinter() ;
	},
	openSelectPrinter: function() {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsLam.GunPackingPrinters',{
			border: false,
			optimaModule: this.optimaModule,
			listeners: {
				quit: function() {
					this.destroy() ;
				},
				selectprinter: function(p,printerUri) {
					this._printerUri = printerUri ;
					this.openList(this._printerUri) ;
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
