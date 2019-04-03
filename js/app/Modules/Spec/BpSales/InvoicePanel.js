Ext.define('Optima5.Modules.Spec.BpSales.InvoiceLinesEditableGrid',{
	extend: 'Ext.grid.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
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
			plugins: [{
				ptype: 'rowediting',
				pluginId: 'rowediting',
				listeners: {
					edit: this.onAfterEdit,
					canceledit: this.onCancelEdit,
					beforeedit: this.onBeforeEdit,
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
		}); 
		
		this.callParent() ;
		if( this.data ) {
			this.setData(this.data) ;
			this.data = null ;
		}
	},
	
	setData: function(data) {
		this.getStore().loadRawData(data) ;
	},
	setReadOnly: function(torf) {
		if( torf ) {
			this.getPlugin('rowediting').disable() ;
		} else {
			this.getPlugin('rowediting').enable() ;
		}
		this.down('toolbar').setVisible( !torf ) ;
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
		var record = editObject.record,
			newValues = editObject.newValues;
		// Mod 2014-03 : now actual record, unset phantom
		record.phantom = false ;
		this.getView().getSelectionModel().deselectAll( true ) ;
		
		var editKeys = ['edit_price','edit_coef1','edit_coef2','edit_coef3','edit_vat'] ;
		var joinKeys = ['join_price','join_coef1','join_coef2','join_coef3','join_vat'] ;
		var modKeys = ['mod_price','mod_coef1','mod_coef2','mod_coef3','mod_vat'] ;
		
		Ext.Array.each( editKeys, function(editKey,i) {
			var joinKey = joinKeys[i] ;
			if( newValues[editKey] === null ) {
				record.set(editKey,record.get(joinKey)) ;
			}
		}) ;
		
		var hasDiff = false ;
		Ext.Array.each( editKeys, function(editKey,i) {
			var joinKey = joinKeys[i] ;
			if( record.get(editKey) != record.get(joinKey) ) {
				hasDiff = true ;
			}
		}) ;
		if( hasDiff ) {
			record.set('mod_is_on',true) ;
			Ext.Array.each( modKeys, function(dstKey,i) {
				var srcKey = editKeys[i] ;
				record.set(dstKey,record.get(srcKey)) ;
			}) ;
		} else {
			record.set('mod_is_on',false) ;
			Ext.Array.each( modKeys, function(dstKey,i) {
				var srcKey = editKeys[i] ;
				record.set(dstKey,null) ;
			}) ;
		}
		
		record.set({
			edit_price: null,
			edit_coef1: null,
			edit_coef2: null,
			edit_coef3: null,
			edit_vat: null
		}) ;
		record.phantom = false ;
		record.dirty = false ;
		
		this.fireEvent('edited',this) ;
	},
	onBeforeEdit: function(editor, editObject) {
		var record = editObject.record,
			recordValues = record.data ;
		if( record.get('mod_is_on') ) {
			record.set({
				edit_price: recordValues.mod_price,
				edit_coef1: recordValues.mod_coef1,
				edit_coef2: recordValues.mod_coef2,
				edit_coef3: recordValues.mod_coef3,
				edit_vat: recordValues.mod_vat
			}) ;
		} else {
			record.set({
				edit_price: recordValues.join_price,
				edit_coef1: recordValues.join_coef1,
				edit_coef2: recordValues.join_coef2,
				edit_coef3: recordValues.join_coef3,
				edit_vat: recordValues.join_vat
			}) ;
		}
		record.phantom = false ;
		record.dirty = false ;
		
		return ;
	},
	
	onBtnAdd: function() {
		var newRecordIndex = 0 ;
		
		var newRecordValues = {
			
		};
		
		var newModel = Ext.create('BpSalesInvLigModel',newRecordValues) ;
		
		this.getStore().insert(newRecordIndex, newModel );
		this.getStore().sync() ;
		
		// Mod 2014-03 : safely set "phantom" explicitly
		newModel.phantom = true ;
		
		this.getPlugin('rowediting').startEdit(newRecordIndex, 0);
	},
	onBtnDelete: function() {
		var selection = this.getView().getSelectionModel().getSelection()[0];
		if (selection) {
			this.getStore().remove(selection);
			this.getStore().sync() ;
			this.fireEvent('edited',this) ;
		}
	}
});


Ext.define('Optima5.Modules.Spec.BpSales.InvoicePanel',{
	extend:'Ext.window.Window',
	
	requires: [],
	
	initComponent: function() {
		
		var editRenderer = function(v,metaData,r, rowIndex, colIndex) {
			var header = this.headerCt.getHeaderAtIndex(colIndex),
				dataKey = header.dataIndex,
				joinKey = 'join_'+dataKey.split('_')[1],
				modKey = 'mod_'+dataKey.split('_')[1],
				color = ( r.get('mod_is_on') ? 'red' : 'black' ),
				v = ( r.get('mod_is_on') ? r.get(modKey) : r.get(joinKey) ) ;
				
			return '<font color="'+color+'">'+v+'</font>' ;
		}
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			tbar:[{
				hidden: true,
				itemId: 'tbSave',
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
					this.doSave() ;
				},
				scope:this
			},{
				hidden: true,
				itemId: 'tbDelete',
				iconCls:'icon-bible-delete',
				text:'Delete',
				handler: function() {
					this.handleDelete() ;
				},
				scope:this
			},{
				hidden: true,
				itemId: 'tbDownload',
				icon: 'images/op5img/ico_download_16.png',
				text:'Download',
				handler: function() {
					this.handleDownload() ;
				},
				scope:this
			},'->',{
				hidden: true,
				itemId: 'tbValidate',
				iconCls:'op5-sdomains-menu-updateschema',
				text:'Validate',
				handler: function() {
					this.handleValidate() ;
				},
				scope:this
			},{
				hidden: true,
				itemId: 'tbReopen',
				icon: 'images/op5img/ico_reload_small.gif',
				text:'Reopen',
				handler: function() {
					this.handleReopen() ;
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
						readOnly: !this._invNew
					},{
						xtype: 'op5crmbasebiblepicker',
						bibleId: 'CUSTOMER',
						optimaModule: this.optimaModule,
						fieldLabel: 'Customer',
						name: 'cli_link',
						readOnly: !this._invNew,
						listeners: {
							change: function(field,newValue,oldValue) {
								if( newValue != oldValue && this._invNew ) {
									this.doQueryCustomer(newValue) ;
								}
							},
							scope: this
						}
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
					title: 'Payment',
					items: [{
						xtype: 'textfield',
						fieldLabel: 'SIRET',
						name: 'cli_siret',
						readOnly: false,
						allowBlank: false
					},{
						xtype: 'op5crmbasebiblepicker',
						bibleId: 'CFG_FACTOR',
						optimaModule: this.optimaModule,
						fieldLabel: 'Factor mode',
						name: 'factor_link'
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
						fieldStyle: 'text-align: right',
						fieldLabel: '<b>Excl VAT</b>',
						anchor: '',
						width: 200,
						name: 'calc_amount_novat',
						readOnly: true
					},{
						xtype: 'textfield',
						fieldStyle: 'text-align: right',
						fieldLabel: '<b>Net amount</b>',
						anchor: '',
						width: 200,
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
				items:[Ext.create('Optima5.Modules.Spec.BpSales.InvoiceLinesEditableGrid',{
					region: 'center',
					flex: 2,
					itemId: 'pCalcLinesGrid',
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
							valueField: 'id',
							allowBlank: false
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
						dataIndex: 'edit_price',
						editor:{ xtype:'numberfield', hideTrigger:true, decimalPrecision:3 },
						renderer: editRenderer
					},{
						text: 'Coef 1',
						align: 'right',
						width: 60,
						dataIndex: 'edit_coef1',
						editor:{ xtype:'numberfield', hideTrigger:true, decimalPrecision:3 },
						renderer: editRenderer
					},{
						text: 'Coef 2',
						align: 'right',
						width: 60,
						dataIndex: 'edit_coef2',
						editor:{ xtype:'numberfield', hideTrigger:true, decimalPrecision:3 },
						renderer: editRenderer
					},{
						text: 'Coef 3',
						align: 'right',
						width: 60,
						dataIndex: 'edit_coef3',
						editor:{ xtype:'numberfield', hideTrigger:true, decimalPrecision:3 },
						renderer: editRenderer
					},{
						text: '<b>Excl.VAT</b>',
						align: 'right',
						width: 80,
						dataIndex: 'calc_amount_novat',
						renderer: function(v,metaData) {
							if( v < 0 ) {
								metaData.tdCls += ' op5-spec-bpsales-negatif' ;
							}
							v = Ext.util.Format.number( v, '0.000' )
							return '<b>'+v+'</b>';
						}
					},{
						text: 'VAT',
						align: 'right',
						width: 60,
						dataIndex: 'edit_vat',
						editor:{ xtype:'numberfield', hideTrigger:true, decimalPrecision:3 },
						renderer: editRenderer
					},{
						text: '<b>Net</b>',
						align: 'right',
						width: 80,
						dataIndex: 'calc_amount_final',
						renderer: function(v,metaData) {
							if( v < 0 ) {
								metaData.tdCls += ' op5-spec-bpsales-negatif' ;
							}
							v = Ext.util.Format.number( v, '0.000' )
							return '<b>'+v+'</b>';
						}
					}],
					listeners: {
						edited: function(editableGrid) {
							this.doSave();
						},
						scope: this
					}
				}),Ext.create('Optima5.Modules.Spec.BpSales.InvoiceLinesEditableGrid',{
					region: 'south',
					title: 'Static invoice lines',
					collapsible: true,
					collapsed: true,
					flex: 1,
					itemId: 'pStaticLinesGrid',
					columns: [{
						text: 'INV mode',
						width: 90,
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
									{id:'STATIC000'},
									{id:'STATIC055'},
									{id:'STATIC200'}
								]
							},
							queryMode: 'local',
							displayField: 'id',
							valueField: 'id',
							allowBlank: false
						}
					},{
						text: 'Description',
						width: 410,
						dataIndex: 'static_txt',
						editor: {
							xtype: 'textfield'
						}
					},{
						text: 'Amount',
						align: 'right',
						width: 60,
						dataIndex: 'static_amount',
						editor: {
							xtype:'numberfield',
							hideTrigger:true
						}
					},{
						text: '<b>Excl.VAT</b>',
						align: 'right',
						width: 80,
						dataIndex: 'calc_amount_novat',
						renderer: function(v) {
							v = Ext.util.Format.number( v, '0.000' )
							return '<b>'+v+'</b>';
						}
					},{
						text: 'VAT',
						align: 'right',
						width: 60,
						dataIndex: 'edit_vat',
						editor:{ xtype:'numberfield', hideTrigger:true, decimalPrecision:3 },
						renderer: editRenderer
					},{
						text: '<b>Net</b>',
						align: 'right',
						width: 80,
						dataIndex: 'calc_amount_final',
						renderer: function(v) {
							v = Ext.util.Format.number( v, '0.000' )
							return '<b>'+v+'</b>';
						}
					}],
					listeners: {
						edited: function(editableGrid) {
							this.doSave();
						},
						scope: this
					}
				})]
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
		
		var readOnly = invRecord.get('status_is_final') ;
		
		//toolbar
		this.down('toolbar').down('#tbSave').setVisible(!readOnly) ;
		this.down('toolbar').down('#tbDelete').setVisible(!readOnly) ;
		this.down('toolbar').down('#tbValidate').setVisible(!readOnly) ;
		this.down('toolbar').down('#tbDownload').setVisible(readOnly) ;
		this.down('toolbar').down('#tbReopen').setVisible(readOnly) ;
		
		//fHeader
		if( invRecord.get('id_coef') < 0 ) {
			this.down('#pHeaderForm').getForm().findField('calc_amount_novat').addCls('op5-spec-bpsales-negatif') ;
			this.down('#pHeaderForm').getForm().findField('calc_amount_final').addCls('op5-spec-bpsales-negatif') ;
		}
		this.down('#pHeaderForm').getForm().reset() ;
		this.down('#pHeaderForm').getForm().loadRecord(invRecord) ;
		this.down('#pHeaderForm').getForm().setValues({
			calc_amount_novat: Ext.util.Format.number(invRecord.get('calc_amount_novat'),'0.000'),
			calc_amount_final: Ext.util.Format.number(invRecord.get('calc_amount_final'),'0.000')
		});
		if( readOnly ) {
			this.down('#pHeaderForm').getForm().getFields().each(function(field) {
				field.setReadOnly( true ) ;
			}) ;
		}
		
		// ***Split lines***
		var ligsCalc = [],
			ligsStatic = [] ;
		invRecord.ligs().each(function(invLineRecord) {
			if( invLineRecord.get('mode_inv_is_calc') ) {
				ligsCalc.push( invLineRecord.getData() ) ;
			} else {
				ligsStatic.push( invLineRecord.getData() ) ;
			}
		}) ;
		
		//gLigs
		this.down('#pCalcLinesGrid').getEl().unmask() ;
		this.down('#pCalcLinesGrid').setData(ligsCalc) ;
		if( readOnly ) {
			this.down('#pCalcLinesGrid').setReadOnly(true) ;
		}
		
		this.down('#pStaticLinesGrid').getEl().unmask() ;
		this.down('#pStaticLinesGrid').setData(ligsStatic) ;
		if( ligsStatic.length > 0 ) {
			this.down('#pStaticLinesGrid').expand() ;
		} else {
			this.down('#pStaticLinesGrid').collapse() ;
		}
		if( readOnly ) {
			this.down('#pStaticLinesGrid').setReadOnly(true) ;
		}
		
		// Title
		this.setTitle('Invoice: '+invRecord.get('id_inv')) ;
		
	},
	doReload: function() {
		this.loadInv( this._invFilerecordId ) ;
	},
	
	doSave: function(doValidate) {
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
		if( doValidate && !form.isValid() ) {
			return ;
		}
		
		var recordData = form.getValues(false,false,false,true) ;
		
		var ligs = [] ;
		this.down('#pCalcLinesGrid').getStore().each( function(ligRecord) {
			ligs.push(ligRecord.getData()) ;
		}) ;
		this.down('#pStaticLinesGrid').getStore().each( function(ligRecord) {
			ligs.push(ligRecord.getData()) ;
		}) ;
		recordData['ligs'] = ligs ;
		recordData['inv_filerecord_id'] = this._invFilerecordId ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_bp_sales',
				_action: 'inv_setRecord',
				data: Ext.JSON.encode(recordData),
				validate: (doValidate ? 1:0)
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
	doDelete: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_bp_sales',
				_action: 'inv_deleteRecord',
				inv_filerecord_id: this._invFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					this.hideLoadmask() ;
					return ;
				}
				
				this.destroy() ;
			},
			callback: function() {
				//this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	doReopen: function() {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_bp_sales',
				_action: 'inv_reopenRecord',
				inv_filerecord_id: this._invFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.error || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					this.hideLoadmask() ;
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
	doQueryCustomer: function( cliLink ) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_bp_sales',
				_action: 'inv_queryCustomer',
				cli_link: cliLink
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == true ) {
					this.down('#pHeaderForm').getForm().setValues( ajaxResponse.data ) ;
				}
			},
			callback: function() {
				//this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	handleDelete: function() {
		Ext.Msg.confirm('Delete','Delete invoice ?',function(btn){
			if( btn=='yes' ) {
				this.doDelete() ;
			}
		},this);
	},
	handleValidate: function() {
		var formPanel = this.down('#pHeaderForm'),
			form = formPanel.getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		Ext.Msg.confirm('Validate invoice ?','Warning : Not editable beyond this action',function(btn){
			if( btn=='yes' ) {
				this.doSave(true) ;
			}
		},this);
	},
	handleReopen: function() {
		Ext.Msg.confirm('Reopen invoice ?','Reopen invoice ?',function(btn){
			if( btn=='yes' ) {
				this.doReopen() ;
			}
		},this);
	},
	handleDownload: function() {
		if( this._invFilerecordId ) {
			return this.openPrintPopup() ;
		}
	},
	openPrintPopup: function() {
		this.showLoadmask() ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_bp_sales',
				_action: 'inv_printDoc',
				inv_filerecord_id: this._invFilerecordId
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.openPrintPopupDo( this.getTitle(), jsonResponse.html, jsonResponse.filename ) ;
					this.doReload() ;
				} else {
					Ext.MessageBox.alert('Error','Print system disabled') ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	openPrintPopupDo: function(pageTitle, pageHtml, pageFilename) {
		this.optimaModule.createWindow({
			width:850,
			height:700,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: pageTitle,
			filename: pageFilename,
			items:[Ext.create('Ext.ux.dams.IFrameContent',{
				itemId: 'uxIFrame',
				content:pageHtml
			})],
			tbar:[{
				hidden: true,
				icon: 'images/op5img/ico_print_16.png',
				text: 'Print',
				handler: function(btn) {
					var uxIFrame = btn.up('window').down('#uxIFrame'),
						uxIFrameWindows = uxIFrame.getWin() ;
					if( uxIFrameWindows == null ) {
						Ext.MessageBox.alert('Problem','Printing disabled !') ;
						return ;
					}
					uxIFrameWindows.print() ;
				},
				scope: this
			},{
				icon: 'images/op5img/ico_save_16.gif',
				text: 'Save as PDF',
				handler: function(btn) {
					var win = btn.up('window'),
						uxIFrame = win.down('#uxIFrame') ;
					
					var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
					Ext.apply(exportParams,{
						_moduleId: 'spec_bp_sales',
						_action: 'util_htmlToPdf',
						filename: win.filename,
						html: Ext.JSON.encode(uxIFrame.content)
					}) ;
					Ext.create('Ext.ux.dams.FileDownloader',{
						renderTo: Ext.getBody(),
						requestParams: exportParams,
						requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
						requestMethod: 'POST'
					}) ;
				},
				scope: this
			}]
		}); 
	},
	
	
	onBeforeDestroy: function() {
		if( true ) {
			this.optimaModule.postCrmEvent('datachange',{}) ;
		}
	}
});
