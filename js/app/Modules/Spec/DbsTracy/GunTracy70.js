Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy70',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsTracy.GunTracy70selectTrspt',
		'Optima5.Modules.Spec.DbsTracy.GunTracy70transactionBuild',
		'Optima5.Modules.Spec.DbsTracy.GunTracy70transactionScanResult',
		'Optima5.Modules.Spec.DbsTracy.GunTracy70transactionFinalForm',
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
		this.handleInit() ;
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
		this._run_tracy70transactionId = null ;
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunTracy70selectTrspt',{
			border: false,
			optimaModule: this.optimaModule,
			listeners: {
				quit: function() {
					this.destroy() ;
				},
				selecttrspt: function(p,data) {
					this.handleSelectTrspt(data) ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openTransactionBuild: function(tracy70transactionId) {
		this._run_tracy70transactionId = tracy70transactionId ;
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunTracy70transactionBuild',{
			border: false,
			optimaModule: this.optimaModule,
			_transactionId: tracy70transactionId,
			listeners: {
				validate: function() {
					this.handleTransactionValidate() ;
				},
				scan: function(p,scanval) {
					this.handleTransactionScan(scanval) ;
				},
				quit: function() {
					this.handleInit() ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openTransactionScanResult: function(formData) {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunTracy70transactionScanResult',{
			border: false,
			optimaModule: this.optimaModule,
			_data: formData,
			listeners: {
				quit: function() {
					this.openTransactionBuild(this._run_tracy70transactionId) ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openTransactionScanFinal: function(formData) {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunTracy70transactionFinalForm',{
			border: false,
			optimaModule: this.optimaModule,
			_data: formData,
			listeners: {
				submit: function(p,values) {
					this.handleTransactionSubmit(values) ;
				},
				back: function() {
					this.openTransactionBuild(this._run_tracy70transactionId) ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	openTransactionScanEnd: function(formData) {
		var listPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunTracy70transactionScanResult',{
			border: false,
			optimaModule: this.optimaModule,
			_data: formData,
			listeners: {
				quit: function() {
					this.handleInit() ;
				},
				scope: this
			}
		}) ;
		this.removeAll() ;
		this.add(listPanel) ;
	},
	
	handleInit: function() {
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
					var error = ajaxResponse.success || 'Error' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				if( ajaxResponse.transaction_id ) {
					this.openTransactionBuild(ajaxResponse.transaction_id) ;
				} else {
					this.openSelectTrspt() ;
				}
			},
			callback: function() {},
			scope: this
		}) ;
	},
	handleSelectTrspt: function(data) {
		this.openBlank() ;
		// resume session OR list ?
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'gun_t70_transactionPostAction',
				
				_subaction: 'create',
				data: Ext.JSON.encode(data)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'Error' ;
					Ext.MessageBox.alert('Error',error, function(){this.handleInit();},this) ;
					return ;
				}
				if( ajaxResponse.transaction_id ) {
					this.openTransactionBuild(ajaxResponse.transaction_id) ;
				} else {
					this.openSelectTrspt() ;
				}
			},
			callback: function() {},
			scope: this
		}) ;
	},
	handleTransactionScan: function(scanval) {
		this.openBlank() ;
		// resume session OR list ?
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'gun_t70_transactionPostAction',
				
				_transaction_id: this._run_tracy70transactionId,
				_subaction: 'scan',
				scanval: scanval
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'Error' ;
					Ext.MessageBox.alert('Error',error, function(){this.openTransactionBuild(this._run_tracy70transactionId);},this) ;
					return ;
				}
				this.openTransactionScanResult( ajaxResponse.data ) ;
			},
			callback: function() {},
			scope: this
		}) ;
	},
	handleTransactionValidate: function() {
		this.openBlank() ;
		// resume session OR list ?
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'gun_t70_transactionPostAction',
				
				_transaction_id: this._run_tracy70transactionId,
				_subaction: 'validate'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.error || 'Manifest build incomplete' ;
					Ext.MessageBox.alert('Error',error, function(){this.openTransactionBuild(this._run_tracy70transactionId);},this) ;
					return ;
				}
				this.openTransactionScanFinal( ajaxResponse.data ) ;
			},
			callback: function() {},
			scope: this
		}) ;
	},
	handleTransactionSubmit: function(values) {
		this.openBlank() ;
		// resume session OR list ?
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'gun_t70_transactionPostAction',
				
				_transaction_id: this._run_tracy70transactionId,
				_subaction: 'submit',
				data: Ext.JSON.encode(values)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'Manifest build error' ;
					Ext.MessageBox.alert('Error',error, function(){this.openTransactionBuild(this._run_tracy70transactionId);},this) ;
					return ;
				}
				this.openTransactionScanEnd( ajaxResponse.data ) ;
			},
			callback: function() {},
			scope: this
		}) ;
	}
}) ;
