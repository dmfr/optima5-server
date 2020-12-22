Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy60summary',{
	extend:'Ext.panel.Panel',
	requires: [
		'Ext.grid.column.Action'
	],
	mixins: {
		focusable: 'Optima5.Modules.Spec.DbsTracy.GunFocusableMixin',
		loadmaskable: 'Optima5.Modules.Spec.DbsTracy.GunLoadmaskableMixin'
	},
	
	_transactionId: null,
	
	initComponent: function(){
		Ext.apply(this,{
			tbar: [{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.handleClose() ;
				},
				scope: this
			},'->',{
				icon: 'images/op5img/ico_print_16.png',
				text: ''+this._printerUri+''
			}],
			bbar : [{
				xtype:'textfield',
				itemId: 'txtScan',
				flex:1,
				listeners : {
					specialkey: function(field, e){
						if (e.getKey() == e.ENTER) {
							this.handleScan() ;
						}
					},
					change: {
						fn: function(field) {
							this.handleScan(true) ;
						},
						buffer: 500,
						scope: this
					},
					scope: this
				}
			},{
				xtype:'button',
				text: 'Send',
				handler : function(button,event) {
					this.handleScan() ;
				},
				scope : this
			}],
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				xtype: 'grid',
				store: {
					model: 'DbsTracyGun60transactionSummary',
					sorters: [{
						property: '_idx',
						direction: 'DESC'
					}],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				},
				columns: [{
					dataIndex: 'id_hat',
					width: 100,
					text: '#Doc',
				},{
					dataIndex: 'atr_consignee_txt',
					width: 150,
					text: 'Consignee'
				},{
					//dataIndex: 'count_parcel',
					align: 'center',
					width: 90,
					text: 'Packs',
					renderer: function(v,metadata,r) {
						var v = r.get('count_parcel_scan') + '/' + r.get('count_parcel_total') ;
						if( r.get('count_parcel_scan') < r.get('count_parcel_total') ) {
							metadata.style += 'color: red;' ;
						} else {
							metadata.style += 'color: green;' ;
						}
						metadata.style += 'font-weight: bold;' ;
						return v ;
					}
				}]
			}]
		});
		this.callParent() ;
		this.mixins.loadmaskable.constructor.call(this);
		this.mixins.focusable.constructor.call(this);
		
		this.registerFocusableComponent( this.down('#txtScan') ) ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		
		this.doLoad() ;
	},
	handleScan: function(dontSend) {
		var scanval = this.down('#txtScan').getValue() ;
		scanval = scanval.trim().toUpperCase() ;
		if( Ext.isEmpty(scanval) ) {
			return ;
		}
		
		this.fireEvent('scan',this,scanval) ;
		if(!dontSend) {
			//this.fireEvent('brtbegin',this,transferligFilerecordId) ;
		}
	},
	
	doLoad: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'gun_t60_getSummary',
				_transaction_id: this._transactionId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error, function(){this.doQuit;},this) ;
					return ;
				}
				this.onLoad( ajaxResponse.data ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function( ajaxData ) {
		this.down('grid').getStore().loadData(ajaxData.grid) ;
	},
	
	handleClose: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'gun_t60_postAction',
				
				_transaction_id: this._transactionId,
				_subaction: 'close',
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					return ;
				}
				
				this.doQuit() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	doQuit: function() {
		this.fireEvent('quit',this) ;
	},
	onDestroy: function() {
		if( this.floatingPanel ) {
			this.floatingPanel.destroy() ;
		}
	}
}) ;
