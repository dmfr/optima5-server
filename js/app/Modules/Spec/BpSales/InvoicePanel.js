Ext.define('Optima5.Modules.Spec.BpSales.InvoicePanel',{
	extend:'Ext.window.Window',
	
	requires: [],
	
	initComponent: function() {
		
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
					this.doSave() ;
				},
				scope:this
			},{
				iconCls:'icon-bible-delete',
				text:'Delete',
				handler: function() {
					
				},
				scope:this
			},'->',{
				icon: 'images/op5img/ico_save_16.gif',
				text:'Download',
				handler: function() {
					this.handleDownload() ;
				},
				scope:this
			}],
			items:[{
				flex: 1,
				xtype: 'form',
				itemId: 'pHeaderForm',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 15,
				layout:'anchor',
				fieldDefaults: {
					labelWidth: 75,
					anchor: '100%'
				},
				items: [{
					xtype: 'fieldset',
					title: 'Invoice attributes',
					items: [{
						xtype: 'textfield',
						fieldLabel: '<b>Invoice #</b>',
						anchor: '',
						width: 250,
						name: 'id_inv',
						readOnly: true
					},{
						xtype: 'textfield',
						fieldLabel: '<b>Order #</b>',
						anchor: '',
						width: 250,
						name: 'id_cde_ref',
						readOnly: true
					},{
						xtype: 'op5crmbasebiblepicker',
						bibleId: 'CUSTOMER',
						optimaModule: this.optimaModule,
						fieldLabel: 'Customer',
						name: 'cli_link',
						readOnly: true
					},{
						xtype: 'datefield',
						fieldLabel: 'Created',
						format: 'd/m/Y',
						anchor: '',
						width: 250,
						submitFormat: 'Y-m-d',
						name: 'date_create',
						readOnly: true
					},{
						xtype: 'datefield',
						fieldLabel: '<b>Invoiced</b>',
						format: 'd/m/Y',
						anchor: '',
						width: 250,
						submitFormat: 'Y-m-d',
						name: 'date_invoice'
					}]
				},{
					xtype: 'fieldset',
					title: 'Location',
					items: [{
						xtype: 'textarea',
						fieldLabel: 'Send To',
						growMin: 80,
						name: 'adr_sendto',
						readOnly: false
					},{
						xtype: 'textarea',
						fieldLabel: 'Invoiced',
						growMin: 80,
						name: 'adr_invoice',
						readOnly: false
					},{
						xtype: 'textarea',
						fieldLabel: 'Delivery',
						growMin: 80,
						name: 'adr_ship',
						readOnly: false
					}]
				},{
					xtype: 'fieldset',
					title: 'Amount details',
					items: [{
						xtype: 'textfield',
						align: 'right',
						fieldLabel: '<b>Excl VAT</b>',
						anchor: '',
						width: 250,
						name: 'calc_amount_novat',
						readOnly: true
					},{
						xtype: 'textfield',
						align: 'right',
						fieldLabel: '<b>Net amount</b>',
						anchor: '',
						width: 250,
						name: 'calc_amount_final',
						readOnly: true
					}]
				}]
			},{
				flex: 2,
				xtype: 'panel',
				layout: {
					type: 'border',
					align: 'stretch'
				},
				border: false,
				items:[{
					region: 'center',
					flex: 2,
					xtype: 'grid',
					itemId: 'pStepsGrid',
					dockedItems: [{
						xtype: 'toolbar',
						items: [{
							itemId: 'add',
							text: 'Add',
							iconCls: 'icon-add',
							handler: function(){
								this.onBtnAdd({}) ;
							},
							scope: this,
							menu: []
						}, '-', {
							itemId: 'delete',
							text: 'Delete',
							iconCls: 'icon-delete',
							handler: function(){
								this.onBtnDelete() ;
							},
							scope: this
						}]
					}],
					columns: [{
						text: 'INV mode',
						width: 70,
						dataIndex: 'mode_inv',
						renderer: function(v) {
							return '<b>'+v+'</b>' ;
						},
						editor: {
							xtype: 'combobox',
							forceSelection: true,
							editable: false,
							store: {
								fields: ['id'],
								data : [
									{id:'STD'},
									{id:'FREE'}
								]
							},
							queryMode: 'local',
							displayField: 'id',
							valueField: 'id'
						}
					},{
						text: 'Product',
						width: 250,
						dataIndex: 'base_prod',
						renderer: function(v,m,r) {
							return '<b>'+r.get('base_prod')+'</b>'+'&#160;'+r.get('base_prod_txt') ;
						},
						editor: {
							xtype: 'op5crmbasebiblepicker',
							bibleId: 'PRODUCT',
							optimaModule: this.optimaModule
						}
					},{
						text: 'Qty',
						width: 60,
						dataIndex: 'base_qty',
						editor:{ xtype:'numberfield', hideTrigger:true }
					},{
						text: 'Price/ut',
						align: 'right',
						width: 60,
						dataIndex: 'join_price'
					},{
						text: 'Coef 1',
						align: 'right',
						width: 60,
						dataIndex: 'join_coef1'
					},{
						text: 'Coef 2',
						align: 'right',
						width: 60,
						dataIndex: 'join_coef2'
					},{
						text: '<b>Excl.VAT</b>',
						align: 'right',
						width: 80,
						dataIndex: 'calc_amount_novat',
						renderer: function(v) {
							return '<b>'+v+'</b>';
						}
					},{
						text: '<b>Net</b>',
						align: 'right',
						width: 80,
						dataIndex: 'calc_amount_final',
						renderer: function(v) {
							return '<b>'+v+'</b>';
						}
					}],
					plugins: [{
						ptype: 'rowediting',
						pluginId: 'rowediting',
						listeners: {
							edit: this.onAfterEdit,
							canceledit: this.onCancelEdit,
							scope: this
						}
					}],
					store: {
						model: 'BpSalesInvLigModel',
						data: [],
						proxy: {
							type: 'memory',
							reader: {
								type: 'json'
							}
						}
					}
				}]
			}]
		}) ;
		
		this.callParent() ;
		
		this.on('afterrender', function() {
			this.loadInv( this._invFilerecordId ) ;
		},this) ;
		this.on('beforedestroy',this.onBeforeDestroy,this) ;
		
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			default: break ;
		}
	},
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	loadInv: function( filerecordId ) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_bp_sales',
				_action: 'inv_getRecords',
				filter_invFilerecordId_arr: Ext.JSON.encode([filerecordId])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false || ajaxResponse.data.length != 1 ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoadInv(Ext.ux.dams.ModelManager.create('BpSalesInvModel',ajaxResponse.data[0])) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadInv: function( invRecord ) {
		this._invFilerecordId = invRecord.getId() ;
		
		//fHeader
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().loadRecord(invRecord) ;
		
		//gLigs
		this.down('#pStepsGrid').getEl().unmask() ;
		this.down('#pStepsGrid').getStore().loadRawData(invRecord.ligs().getRange()) ;
		
		// Title
		this.setTitle('Invoice: '+invRecord.get('id_inv')) ;
		
	},
	doReload: function() {
		this.loadInv( this._invFilerecordId ) ;
	},
	
	doSave: function() {
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		
		var recordData = form.getValues(false,false,false,true) ;
		
		var ligs = [] ;
		this.down('#pStepsGrid').getStore().each( function(ligRecord) {
			ligs.push(ligRecord.getData()) ;
		}) ;
		recordData['ligs'] = ligs ;
		recordData['inv_filerecord_id'] = this._invFilerecordId ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_bp_sales',
				_action: 'inv_setRecord',
				data: Ext.JSON.encode(recordData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				
				this.doReload() ;
			},
			callback: function() {
				//this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	onCancelEdit : function(editor, editObject){
		var store = editObject.store,
			record = editObject.record ;
		if( record.phantom ) {
			// Mod 2014-03 : if phantom set, remove record
			store.remove(record) ;
		}
	},
	onAfterEdit: function(editor, editObject) {
		var record = editObject.record ;
		// Mod 2014-03 : now actual record, unset phantom
		record.phantom = false ;
		this.down('#pStepsGrid').getView().getSelectionModel().deselectAll( true ) ;
		
		this.doSave() ;
	},
	
	onBtnAdd: function() {
		var newRecordIndex = 0 ;
		
		var newRecordValues = {
			mode_inv: 'STD'
		};
		
		var newModel = Ext.create('BpSalesInvLigModel',newRecordValues) ;
		
		this.down('#pStepsGrid').getStore().insert(newRecordIndex, newModel );
		this.down('#pStepsGrid').getStore().sync() ;
		
		// Mod 2014-03 : safely set "phantom" explicitly
		newModel.phantom = true ;
		
		this.down('#pStepsGrid').getPlugin('rowediting').startEdit(newRecordIndex, 0);
	},
	onBtnDelete: function() {
		var selection = this.down('#pStepsGrid').getView().getSelectionModel().getSelection()[0];
		if (selection) {
			this.down('#pStepsGrid').getStore().remove(selection);
			this.down('#pStepsGrid').getStore().sync() ;
			this.doSave() ;
		}
	},
	
	
	onBeforeDestroy: function() {
		if( true ) {
			this.optimaModule.postCrmEvent('datachange',{}) ;
		}
	}
});
