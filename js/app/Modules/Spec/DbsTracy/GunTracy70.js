Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy70',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.GunTracy70example',
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
		this.openInit() ;
	},
	openInit: function() {
		this.openBlank() ;
		
		// resume session OR list ?
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'gun_t70_transactionGetActiveId'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				if( ajaxResponse.transaction_id ) {
					this.openTrsptSession(ajaxResponse.transaction_id) ;
				} else {
					this.openSelectTrspt() ;
				}
			},
			callback: function() {},
			scope: this
		}) ;
	},
	openBlank: function() {
		var blankPanel = {
			xtype: 'box',
			cls:'op5-waiting'
		}
		this.removeAll() ;
		this.add(blankPanel) ;
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
				brtbegin: function(p,cfg) {
					//console.log('openfilters') ;
					//this.fireEvent('openfilters',this,cfg) ;
					this.openTrsptSession(151516) ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openTrsptSession: function(tracy70transactionId) {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunTracy70example',{
			border: false,
			optimaModule: this.optimaModule,
			listeners: {
				quit: function() {
					this.openInit() ;
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
