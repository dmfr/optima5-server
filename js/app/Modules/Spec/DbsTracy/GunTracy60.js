Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy60',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.GunTracy60selectPrinter',
		'Optima5.Modules.Spec.DbsTracy.GunTracy60summary',
		'Optima5.Modules.Spec.DbsTracy.GunTracy60scanResult',
	],
	
	_printerUri: null,
	_runTransferligSrcAdr: null,
	
	_run_tracy70transactionId: null,
	
	initComponent: function(){
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			layout: 'fit',
			items: []
		});
		this.callParent() ;
		this.openBlank() ;
		Ext.defer(function() {
			this.openSelectPrinter() ;
		},1000,this) ;
	},
	openBlank: function() {
		var blankPanel = {
			xtype: 'box',
			cls:'op5-waiting'
		}
		this.removeAll() ;
		this.add(blankPanel) ;
	},
	openSelectPrinter: function() {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunTracy60selectPrinter',{
			border: false,
			optimaModule: this.optimaModule,
			listeners: {
				quit: function() {
					this.destroy() ;
				},
				selectprinter: function(p,printerUri) {
					this._printerUri = printerUri ;
					this.openSummary() ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openSummary: function() {
		this._run_tracy60transactionId = null ;
		this.openBlank() ;
		// resume session OR list ?
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'gun_t60_postAction',
				
				_subaction: 'open'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'Error' ;
					Ext.MessageBox.alert('Error',error, function(){this.handleInit();},this) ;
					return ;
				}
				if( ajaxResponse.transaction_id ) {
					this._run_tracy60transactionId = ajaxResponse.transaction_id ;
					var listPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunTracy60summary',{
						border: false,
						optimaModule: this.optimaModule,
						_transactionId: this._run_tracy60transactionId,
						_printerUri: this._printerUri,
						listeners: {
							scan: function(p,scanval) {
								this.handleScan(scanval) ;
							},
							quit: function() {
								this._run_tracy60transactionId = null ;
								this.openSelectPrinter() ;
							},
							scope: this
						}
					}) ;
					this.removeAll() ;
					this.add(listPanel) ;
				} else {
					this.openSelectPrinter() ;
				}
			},
			callback: function() {},
			scope: this
		}) ;
	},
	openScanResult: function(formData) {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunTracy60scanResult',{
			border: false,
			optimaModule: this.optimaModule,
			_data: formData,
			listeners: {
				afteraction: function(p,afterAction) {
					this.handleTransactionScanAfter(p._data,afterAction) ;
				},
				quit: function() {
					this.openSummary() ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	
	handleScan: function(scanval) {
		this.openBlank() ;
		// resume session OR list ?
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'gun_t60_postAction',
				
				_transaction_id: this._run_tracy60transactionId,
				_subaction: 'scan',
				scanval: scanval
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'Error' ;
					Ext.MessageBox.alert('Error',error, function(){this.openSummary();},this) ;
					return ;
				}
				this.openScanResult( ajaxResponse.data ) ;
			},
			callback: function() {},
			scope: this
		}) ;
	},
}) ;
