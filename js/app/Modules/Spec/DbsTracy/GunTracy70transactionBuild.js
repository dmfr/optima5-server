Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy70transactionBuild',{
	extend:'Ext.panel.Panel',
	requires: [
		'Ext.grid.column.Action',
		'Optima5.Modules.Spec.DbsTracy.GunTracy70transactionBuildWarning'
	],
	mixins: {
		focusable: 'Optima5.Modules.Spec.DbsTracy.GunFocusableMixin',
		loadmaskable: 'Optima5.Modules.Spec.DbsTracy.GunLoadmaskableMixin'
	},
	
	_transactionId: null,
	
	initComponent: function(){
		Ext.apply(this,{
			tbar: [{
				icon: 'images/op5img/ico_save_16.gif',
				text: '<b>Create manifest</b>',
				handler: function(){
					this.handleValidate() ;
				},
				scope: this
			},'->',{
				icon: 'images/op5img/ico_cancel_small.gif',
				text: 'Abort',
				handler: function() {
					this.handleAbort() ;
				},
				scope: this
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
				xtype: 'form',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 10,
				layout: 'anchor',
				cls: 'op5-spec-dbstracy-field-narrowline',
				fieldDefaults: {
					labelWidth: 90,
					anchor: '100%',
					labelStyle: 'font-weight: bold;'
				},
				items: [{
					xtype: 'displayfield',
					fieldLabel: 'Carrier',
					name: 'mvt_carrier_txt',
				},{
					xtype: 'displayfield',
					name: 'date_create_txt',
					fieldLabel: 'Date created',
				}]
			},{
				flex: 1,
				xtype: 'grid',
				store: {
					model: 'DbsTracyGun70transactionSummary',
					sorters: [{
						property: 'id_hat',
						direction: 'ASC'
					}],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				},
				columns: [{
				xtype: 'actioncolumn',
				align: 'center',
				width: 36,
				items: [{
					getClass: function(v,metadata,r) {
						if( r.get('is_warning') ) {
							return 'op5-spec-dbstracy-gun-warning-on' ;
						} else {
							return 'op5-spec-dbstracy-gun-warning-off' ;
						}
					},
					//tooltip: 'Take',
					handler: function(grid, rowIndex, colIndex) {
						var rec = grid.getStore().getAt(rowIndex);
						this.openWarningPanel( rec.getData() ) ;
					},
					scope: this
				}]
			},{
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
				_action: 'gun_t70_transactionGetSummary',
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
		console.dir(ajaxData) ;
		
		this.down('form').getForm().setValues(ajaxData.header) ;
		this.down('grid').getStore().loadData(ajaxData.grid) ;
	},
	
	handleAbort: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'gun_t70_transactionPostAction',
				
				_transaction_id: this._transactionId,
				_subaction: 'abort',
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
	handleValidate: function() {
		this.fireEvent('validate',this) ;
	},
	
	openWarningPanel: function(gridRow) {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunTracy70transactionBuildWarning',{
			_gridRow: gridRow,
			
			optimaModule: this.optimaModule,
			width:400, // dummy initial size, for border layout to work
			height:null, // ...
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}]
		});
		createPanel.on('submit', function(p) {
			p.destroy() ;
		},this,{single:true}) ;
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		createPanel.show();
		createPanel.getEl().alignTo(this.getEl(), 'c-c?');
		this.floatingPanel = createPanel ;
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
