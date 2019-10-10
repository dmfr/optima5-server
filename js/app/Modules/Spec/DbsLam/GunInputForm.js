Ext.define('Optima5.Modules.Spec.DbsLam.GunInputForm',{
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			tbar: [{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.handleQuit() ;
				},
				scope: this
			},'->',{
				itemId: 'tbReset',
				icon: 'images/op5img/ico_reload_small.gif',
				text: '<b>Reset</b>',
				handler: function() {
					this.handleReset() ;
				},
				scope: this
			}],
			layout: 'border',
			title: '&#160;',
			items: [],
			listeners: {
				afterrender: this.initComponentAfterRender
			}
		}) ;
		this.callParent() ;
		this.doLoadTransferStep( this._transferstepFilerecordId ) ;
	},
	initComponentAfterRender: function(panel) {
		//console.log('afterrender') ;
		panel.getEl().on('keypress',panel.onKeyPress,panel);
	},
	
	handleReset: function() {
		this.doLoadTransferStep( this._transferstepFilerecordId ) ;
	},
	
	onKeyPress: function(e) {
		var key = e.getKey();
		if( key === e.ENTER ){
			//console.dir(arguments) ;
			//console.dir(Ext.get(arguments[1])) ;
			this.fieldfocusNext(Ext.get(arguments[1]).component) ;
				//Ext.Msg.alert('ENTER Key Pressed!', 'omg!' );
		} else {
				//Ext.Msg.alert('Other Key Pressed!', key );
		}
	},
	getActiveForm: function() {
		if( this.down('tabpanel') ) {
			return this.down('tabpanel').getActiveTab() ;
		} else {
			return this.down('form') ;
		}
	},
	fieldfocusBegin: function() {
		var formPanel = this.getActiveForm() ;
		if( !formPanel ) {
			return ;
		}
		formPanel.items.each(function(field) {
			if( field.getXType()=='hiddenfield' ) {
				return ;
			}
			if( field.getValue && (Ext.isEmpty(field.getValue())||field.getValue()==0) ) {
				//console.dir(field) ;
				field.reset() ;
				field.focus() ;
				return false ;
			}
		});
		
	},
	fieldfocusNext: function(field) {
		var formPanel = this.getActiveForm() ;
		if( !formPanel ) {
			return ;
		}
		var idxCur = formPanel.items.indexOf( field ) ;
		if( idxCur == -1 ) {
			return ;
		}
		idxNext = idxCur + 1 ;
		
		var nextField = formPanel.items.getAt(idxNext) ;
		//console.dir(nextField) ;
		if( nextField._fieldFocusSkip ) {
			return this.fieldfocusNext(nextField) ;
		}
		if( nextField.itemId=='fsSubmit') {
			nextField.down('button').el.dom.click() ;
			return ;
		}
		if( true ) {
			//console.log('focus') ;
			nextField.focus() ;
			return ;
		}
	},
	
	doLoadTransferStep: function(transferstepFilerecordId) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferInput_getDocuments'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText),
					transferstepRow = null ;
				Ext.Array.each( ajaxResponse.data, function(row) {
					if( row.transferstep_filerecord_id == transferstepFilerecordId ) {
						transferstepRow = row ;
						return false ;
					}
				} ) ;
				if( !transferstepRow ) {
					return ;
				}
				var transferstepRecord = Ext.ux.dams.ModelManager.create('DbsLamGunInputSummaryModel',transferstepRow) ;
				this.onLoadTransferStep(transferstepRecord.getData()) ;
			},
			scope: this
		}) ;
	},
	onLoadTransferStep: function(transferstepRow) {
		this._transferstepRow = transferstepRow ;
		
		this.removeAll() ;
		
		if( !transferstepRow.pda_is_on ) {
			return ;
		}
		if( !transferstepRow.pdaspec_is_on ) {
			this.buildFormStandard( null ) ;
		} else {
			var inputObj = Ext.JSON.decode(transferstepRow.pdaspec_input_json) ;
			this.buildFormSpec(inputObj) ;
		}
		this.setTitle(transferstepRow.transfer_txt) ;
		if( transferstepRow.inputlist_is_on ) {
			this.buildSouthPoGrid() ;
		}
		this.hideLoadmask() ;
	},
	addCenter: function(pnl) {
		var centerPnl = this.down('panel[region=center]') ;
		if( centerPnl ) {
			this.remove(centerPnl) ;
		}
		Ext.apply(pnl,{
			region: 'center',
			flex: 1
		});
		this.add(pnl) ;
	},
	
	buildFormStandard: function(arrFormValues) {
		var cnt = 1 ;
		if( arrFormValues ) {
			cnt = arrFormValues.length ;
		}
		
		var forms = [] ;
		for( var i=0 ; i<cnt ; i++ ) {
			forms.push({
				xtype: 'form',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 10,
				border: false,
				layout: 'anchor',
				fieldDefaults: {
					labelAlign: 'top',
					labelWidth: 100,
					anchor: '100%'
				},
				items: [{
					xtype: 'hiddenfield',
					name: 'inputstack_level'
				},{
					xtype: 'combobox',
					itemId: 'champReference',
					name: 'stk_prod',
					fieldLabel: 'Product P/N',
					forceSelection:true,
					allowBlank:false,
					editable:true,
					typeAhead:false,
					selectOnFocus: false,
					selectOnTab: true,
					queryMode: 'remote',
					displayField: 'id',
					valueField: 'id',
					queryParam: 'filter',
					minChars: 2,
					fieldStyle: 'text-transform:uppercase',
					store: {
						autoLoad: true,
						fields: ['id','target_containertype'],
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_moduleId: 'spec_dbs_lam',
								_action: 'transferInput_getProdIds'
							},
							reader: {
								type: 'json',
								rootProperty: 'data'
							}
						}),
						listeners: {
							beforeload: function(store,options) {
								var transferstepRow = this._transferstepRow ;
								
								var params = options.getParams() ;
								Ext.apply(params,{
									transfer_filerecordId: transferstepRow.transfer_filerecord_id,
									transferStep_filerecordId: transferstepRow.transferstep_filerecord_id,
								}) ;
								options.setParams(params) ;
							},
							scope: this
						}
					},
					listeners: {
						select: function(cmb,selRecord) {
							if( selRecord && !Ext.isEmpty(selRecord.get('target_containertype')) ) {
								var targetContainerType = selRecord.get('target_containertype') ;
								var fieldContainerType = cmb.up('form').getForm().findField('container_type') ;
								if( fieldContainerType ) {
									fieldContainerType.setValue(targetContainerType) ;
								}
							}
						},
						scope: this
					}
				},{
					xtype: 'combobox',
					name: 'container_type',
					fieldLabel: 'Container type',
					anchor: '100%',
					forceSelection:true,
					allowBlank:false,
					editable:false,
					queryMode: 'local',
					displayField: 'container_type_txt',
					valueField: 'container_type',
					fieldStyle: 'text-transform:uppercase',
					store: {
						model: 'DbsLamCfgContainerTypeModel',
						data: Ext.Array.merge([{
							container_type:'',
							container_type_txt: '- Aucun -'
						}],Optima5.Modules.Spec.DbsLam.HelperCache.getContainerTypeAll()),
						proxy: {
							type: 'memory'
						},
						listeners: {
							scope: this
						}
					},
					listeners: {
						scope: this
					}
				},{
					xtype: 'textfield',
					name: 'container_ref',
					fieldLabel: 'Container Ref',
					anchor: '100%',
				},{
					xtype: 'textfield',
					name: 'stk_batch',
					fieldLabel: 'Batch',
					anchor: '100%',
					allowBlank:false,
				},{
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'stk_datelc',
					fieldLabel: 'DLUO',
					anchor: '100%',
					allowBlank:false,
				},{
					xtype: 'numberfield',
					name: 'mvt_qty',
					fieldLabel: 'Pallet/Bulk Quantity',
					allowNegative: false,
					allowBlank: false,
					minValue: 1,
					allowDecimals: false,
					anchor: '',
					width: 120
				}]
			});
		}
		
		var c = 0 ;
		Ext.Array.each(forms, function(form) {
			c++ ;
			Ext.apply(form,{
				title: 'Obj-'+c
			});
		}) ;
		
		var tpanel = {
			xtype: 'tabpanel',
			itemId: 'tpStandard',
			items: forms,
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				items: [{
					xtype: 'button',
					scale: 'large',
					icon: 'images/op5img/ico_ok_16.gif',
					text: 'OK!',
					handler: function() {
						this.handleSubmitFormStandard() ;
					},
					scope: this
				}]
			}]
		};
		this.addCenter(tpanel) ;
		
		if(true) {
			var transferstepRow = this._transferstepRow ;
			var tabPanel = this.down('#tpStandard') ;
			tabPanel.items.each( function(formPanel) {
				var form = formPanel.getForm() ;
				
				var formField ;
				if( (formField=form.findField('inputstack_level')) && !transferstepRow.stacking_is_on ) {
					formField.destroy() ;
				}
				if( (formField=form.findField('stk_batch')) && !transferstepRow.prodspec_is_batch ) {
					formField.destroy() ;
				}
				if( (formField=form.findField('stk_datelc')) && !transferstepRow.prodspec_is_dlc ) {
					formField.destroy() ;
				}
				if( (formField=form.findField('stk_sn')) && !transferstepRow.prodspec_is_sn ) {
					formField.destroy() ;
				}
			}) ;
		}
		
		if(arrFormValues) {
			var tabPanel = this.down('#tpStandard') ;
			var idx = 0 ;
			tabPanel.items.each( function(formPanel) {
				var form = formPanel.getForm() ;
				form.setValues(arrFormValues[idx]) ;
				
				idx++ ;
			}) ;
		}
		//console.dir('std form') ;
		this.down('#tpStandard').setActiveTab(0) ;
		this.fieldfocusBegin() ;
	},
	handleSubmitFormStandard() {
		var tabPanel = this.down('#tpStandard') ;
		
		var doAbort = false ;
		tabPanel.items.each( function(formPanel) {
			var form = formPanel.getForm() ;
			if( !form.isValid() ) {
				tabPanel.setActiveTab( formPanel ) ;
				doAbort = true ;
				return false ;
			}
		}) ;
		if( doAbort ) {
			this.fieldfocusBegin() ;
			return ;
		}
		
		var stkData_arrObjs = [] ;
		tabPanel.items.each( function(formPanel) {
			var form = formPanel.getForm() ;
			var formValues = form.getValues() ;
			stkData_arrObjs.push(formValues) ;
		}) ;
		this.buildFormSummary(stkData_arrObjs) ;
	},
	
	
	buildFormSpec: function(inputObj) {
		var formItems = [] ;
		Ext.Array.each( inputObj, function(inputObjField) {
			formItems.push({
				xtype: 'textfield',
				allowBlank: false,
				name: inputObjField.sql_var,
				fieldLabel: inputObjField.txt,
				anchor: '100%'
			});
		}) ;
		formItems.push({
			_fieldFocusSkip: true,
			xtype: 'box',
			height: 24
		},{
			xtype: 'container',
			itemId: 'fsSubmit',
			layout: {
				type: 'hbox',
				pack: 'center'
			},
			items: [{
				xtype: 'button',
				scale: 'large',
				icon: 'images/op5img/ico_ok_16.gif',
				text: 'OK!',
				handler: function() {
					this.handleSubmitFormSpec() ;
				},
				scope: this
			}]
		});
		
		var form = {
			itemId: 'fpSpec',
			xtype: 'form',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			border: false,
			layout: 'anchor',
			fieldDefaults: {
				labelAlign: 'top',
				labelWidth: 100,
				anchor: '100%'
			},
			items: formItems
		};
		
		this.addCenter(form) ;
		this.fieldfocusBegin() ;
	},
	handleSubmitFormSpec: function() {
		var formPanel = this.down('#fpSpec') ;
			form = formPanel.getForm() ;
		if( !form.isValid() ) {
			this.fieldfocusBegin() ;
			return ;
		}
		var formValues = form.getValues() ;
		
		var transferstepRow = this._transferstepRow ;
		if( !transferstepRow.pdaspec_is_on ) {
			return ;
		} else {
			var sqlProcess = transferstepRow.pdaspec_sql_process ;
		}
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferInput_processSql',
				sql_process: sqlProcess,
				sql_vars: Ext.JSON.encode(formValues)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( !ajaxResponse.success ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.doForwardSpecResult(ajaxResponse.data) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	doForwardSpecResult: function(objs) {
		if( objs.length < 1 ) {
			Ext.MessageBox.alert('Error / NA','Unexpected SQL return',function(){this.handleReset();},this) ;
			return ;
		}
		this.buildFormStandard(objs) ;
	},
	
	
	buildSouthPoGrid: function() {
		var transferstepRow = this._transferstepRow ;
		if( !transferstepRow ) {
			return ;
		}

		var grid = {
			xtype: 'grid',
			store: {
				model: 'DbsLamTransferInputPoModel',
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'transferInputPo_getLigs',
						transfer_filerecordId: transferstepRow.transfer_filerecord_id,
						transferStep_filerecordId: transferstepRow.transferstep_filerecord_id,
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				}),
				sorters: [{
					property: 'stk_prod',
					direction: 'ASC'
				}]
			},
			columns: [{
				dataIndex: 'status',
				text: '',
				width: 24,
				renderer: function(v,metadata,record) {
					if( record.get('qty_po') == null ) {
						metadata.tdCls = 'op5-spec-dbslam-po-init'
					} else if( record.get('qty_input') < record.get('qty_po') ) {
						metadata.tdCls = 'op5-spec-dbslam-po-partial'
					} else if( record.get('qty_input') > record.get('qty_po') ) {
						metadata.tdCls = 'op5-spec-dbslam-po-over'
					} else {
						metadata.tdCls = 'op5-spec-dbslam-po-complete'
					}
				}
			},{
				dataIndex: 'stk_prod',
				text: 'P/N',
				width: 150,
				renderer: function(v,m,r) {
					return v ;
				}
			},{
				dataIndex: 'qty_po',
				text: 'Expect',
				align: 'right',
				width: 80,
				editorTpl: {
					xtype: 'numberfield',
					allowBlank: false,
					minValue: 1
				}
			},{
				dataIndex: 'qty_input',
				text: 'Received',
				align: 'right',
				width: 80,
				renderer: function(v) {
					if( v>0 ) {
						return '<b>'+v+'</b>' ;
					}
					return v ;
				}
			}],
			listeners: {
				itemdblclick: function( grid, record, item, index, event ) {
					/*
					console.log('double click sur un item de la liste PO !') ;
					console.dir( arguments ) ;
					console.dir(record) ;
					console.dir(record.getData()) ;
					*/
					var refProduit = record.getData()['stk_prod'] ;
					this.down('#champReference').setValue( refProduit ) ;
					this.down('#gpPoList').collapse(Ext.Component.DIRECTION_BOTTOM,false) ;
				},
				scope: this
			}
		};
		Ext.apply(grid,{
			itemId: 'gpPoList',
			title: 'PO list',
			border: false,
			region: 'south',
			flex: 1,
			collapsible: true,
			collapsed: true,
			tools: [{
				type: 'refresh',
				handler: function() {
					this.down('#gpPoList').getStore().load() ;
				},
				scope: this
			}]
		}); 
		this.add( grid ) ;
	},
	
	
	buildFormSummary: function(stkData_arrObjs) {
		var forms = [] ;
		Ext.Array.each( stkData_arrObjs, function(stkData_obj) {
			forms.push({
				_stkData_obj: stkData_obj,
				xtype: 'form',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 10,
				border: false,
				layout: 'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 100,
					anchor: '100%'
				},
				items: [{
					xtype: 'fieldset',
					title: 'Summary',
					items: [{
						xtype: 'displayfield',
						name: 'container_type',
						fieldLabel: 'Container Ref'
					},{
						xtype: 'displayfield',
						name: 'container_ref',
						fieldLabel: 'Container Type'
					},{
						xtype: 'displayfield',
						name: 'stk_prod',
						fieldLabel: 'P/N'
					},{
						xtype: 'displayfield',
						name: 'stk_batch',
						fieldLabel: 'Batch'
					},{
						xtype: 'displayfield',
						name: 'stk_datelc',
						fieldLabel: 'DLUO'
					},{
						xtype: 'displayfield',
						name: 'mvt_qty',
						fieldLabel: 'Qty'
					}]
				},{
					xtype: 'fieldset',
					itemId: 'fsCount',
					title: 'Container count',
					items: [{
						fieldLabel: 'Count',
						anchor: '',
						width: 150,
						xtype: 'numberfield',
						name: 'submit_cnt',
						value: 1,
						minValue: 1,
						maxValue: 10
					}]
				}]
			});
		}) ;
		
		var c = 0 ;
		Ext.Array.each(forms, function(form) {
			c++ ;
			Ext.apply(form,{
				title: 'Obj-'+c
			});
		}) ;
		
		var tpanel = {
			xtype: 'tabpanel',
			itemId: 'tpSummary',
			items: forms,
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				items: [{
					margin: '0px 10px',
					xtype: 'button',
					scale: 'large',
					icon: 'images/op5img/ico_ok_16.gif',
					text: 'OK!',
					handler: function() {
						this.handleSubmitFormSummary(true) ;
					},
					scope: this
				},{
					margin: '0px 10px',
					xtype: 'button',
					scale: 'large',
					icon: 'images/op5img/ico_cancel_small.gif',
					text: 'Modify',
					handler: function() {
						this.handleSubmitFormSummary(false) ;
					},
					scope: this
				}]
			}]
		} ;
		
		this.addCenter(tpanel) ;
		
		if(true) {
			var transferstepRow = this._transferstepRow ;
			var tabPanel = this.down('#tpSummary') ;
			tabPanel.items.each( function(formPanel) {
				var form = formPanel.getForm() ;
				
				var formField ;
				if( (formField=form.findField('stk_batch')) && !transferstepRow.prodspec_is_batch ) {
					formField.destroy() ;
				}
				if( (formField=form.findField('stk_datelc')) && !transferstepRow.prodspec_is_dlc ) {
					formField.destroy() ;
				}
				if( (formField=form.findField('stk_sn')) && !transferstepRow.prodspec_is_sn ) {
					formField.destroy() ;
				}
				
				if( (stkData_arrObjs.length == 1) && Ext.isEmpty(stkData_arrObjs[0]['container_ref']) ) {
					formPanel.down('#fsCount').setVisible(true) ;
				} else {
					formPanel.down('#fsCount').destroy() ;
				}
			}) ;
		}
		
		if(true) {
			var tabPanel = this.down('#tpSummary') ;
			tabPanel.items.each( function(formPanel) {
				var form = formPanel.getForm() ;
				form.setValues(formPanel._stkData_obj) ;
			}) ;
		}
		this.down('#tpSummary').setActiveTab(0) ;
	},
	handleSubmitFormSummary: function(torf) {
		var tabPanel = this.down('#tpSummary') ;
		
		var stkData_arrObjs = [] ;
		tabPanel.items.each( function(formPanel) {
			var cnt=1 ;
			if( (tabPanel.items.getCount()==1) && formPanel.getForm().findField('submit_cnt') ) {
				cnt = formPanel.getForm().findField('submit_cnt').getValue() ;
			}
			for( var idx=0 ; idx<cnt ; idx++ ) {
				stkData_arrObjs.push( formPanel._stkData_obj );
			}
		}) ;
		if( !torf ) {
			// cancel
			return this.buildFormStandard(stkData_arrObjs) ;
		}
		
		var transferstepRow = this._transferstepRow ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferInput_submit',
				transfer_filerecordId: transferstepRow.transfer_filerecord_id,
				transferStep_filerecordId: transferstepRow.transferstep_filerecord_id,
				stkData_arrObjs: Ext.JSON.encode(stkData_arrObjs)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( !ajaxResponse.success ) {
					Ext.MessageBox.alert('Error',ajaxResponse.error||'Error') ;
					this.hideLoadmask() ;
					return ;
				}
				if( ajaxResponse.forward_transferlig_filerecord_id ) {
					this.fireEvent('openforwardtransferlig',this,ajaxResponse.forward_transferlig_filerecord_id) ;
				} else {
					this.handleReset() ;
				}
			},
			callback: function() {
				//this.hideLoadmask() ;
			},
			scope: this
		}) ;
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
	
	
	handleQuit: function() {
		this.fireEvent('quit') ;
	},
});
