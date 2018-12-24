Ext.define('Optima5.Modules.Spec.DbsLam.GunInputForm',{
	extend: 'Ext.form.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
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
			layout: 'fit',
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
	fieldfocusBegin: function() {
		var formPanel = this.down('form') ;
		if( !formPanel ) {
			return ;
		}
		formPanel.items.each(function(field) {
			if( field.getValue && (Ext.isEmpty(field.getValue())||field.getValue()==0) ) {
				//console.dir(field) ;
				field.reset() ;
				field.focus() ;
				return false ;
			}
		});
		
	},
	fieldfocusNext: function(field) {
		var formPanel = this.down('form') ;
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
		
		if( !transferstepRow.pda_is_on ) {
			return ;
		}
		if( !transferstepRow.pdaspec_is_on ) {
			this.buildFormStandard( {} ) ;
		} else {
			var inputObj = Ext.JSON.decode(transferstepRow.pdaspec_input_json) ;
			this.buildFormSpec(inputObj) ;
		}
		this.hideLoadmask() ;
	},
	
	buildFormStandard: function(formValues) {
		var form = {
			itemId: 'fpStandard',
			xtype: 'form',
			bodyCls: 'ux-noframe-bg',
			border: false,
			layout: 'anchor',
			fieldDefaults: {
				labelAlign: 'top',
				labelWidth: 100,
				anchor: '100%'
			},
			items: [{
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
				xtype: 'combobox',
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
					fields: ['id'],
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_dbs_lam',
							_action: 'prods_getIds'
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					}),
					listeners: {
						scope: this
					}
				},
				listeners: {
					scope: this
				}
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
			},{
				_fieldFocusSkip: true,
				xtype: 'box',
				height: 16
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
						this.handleSubmitFormStandard() ;
					},
					scope: this
				}]
			}]
		};
		
		this.removeAll() ;
		this.add(form) ;
		if(formValues) {
			var formPanel = this.down('#fpStandard'),
				form = formPanel.getForm() ;
			form.setValues(formValues) ;
		}
		//console.dir('std form') ;
		this.fieldfocusBegin() ;
	},
	handleSubmitFormStandard() {
		var formPanel = this.down('#fpStandard'),
			form = formPanel.getForm() ;
		if( !form.isValid() ) {
			this.fieldfocusBegin() ;
			return ;
		}
		var formValues = form.getFieldValues() ;
		
		var stkData_obj = formValues ;
		this.buildFormSummary(stkData_obj) ;
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
			border: false,
			layout: 'anchor',
			fieldDefaults: {
				labelAlign: 'top',
				labelWidth: 100,
				anchor: '100%'
			},
			items: formItems
		};
		
		this.removeAll() ;
		this.add(form) ;
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
		if( objs.length != 1 ) {
			Ext.MessageBox.alert('Error / NA','Unexpected SQL return',function(){this.handleReset();},this) ;
			return ;
		}
		var mvtObj = objs[0] ;
		this.buildFormStandard(mvtObj) ;
	},
	
	
	buildFormSummary: function(stkData_obj) {
		var form = {
			_stkData_obj: stkData_obj,
			itemId: 'fpSummary',
			xtype: 'form',
			bodyCls: 'ux-noframe-bg',
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
					name: 'mvt_qty',
					fieldLabel: 'P/N'
				}]
			},{
				xtype: 'container',
				itemId: 'fsSubmit',
				layout: {
					type: 'hbox',
					pack: 'center'
				},
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
		};
		
		this.removeAll() ;
		this.add(form) ;
		
		if(true) {
			var formPanel = this.down('#fpSummary'),
				form = formPanel.getForm() ;
			form.setValues(formPanel._stkData_obj) ;
		}
	},
	handleSubmitFormSummary: function(torf) {
		var formPanel = this.down('#fpSummary') ;
			stkData_obj = formPanel._stkData_obj ;
		if( !torf ) {
			// cancel
			return this.buildFormStandard(stkData_obj) ;
		}
		
		var transferstepRow = this._transferstepRow ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferInput_submit',
				transfer_filerecordId: transferstepRow.transfer_filerecord_id,
				transferStep_filerecordId: transferstepRow.transferstep_filerecord_id,
				stkData_obj: Ext.JSON.encode(stkData_obj)
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
	onSubmitResult: function() {
		
	},
	
	
	getCurValidationStep: function() {
		var val = this.getForm().findField('ask_currentStep').getValue() ;
		if( Ext.isEmpty(val) ) {
			return null ;
		}
		return val ;
	},
	getNextValidationStep: function( validStep ) {
		var steps = ['prod','qty'],
			stepIdx = Ext.Array.indexOf(steps,validStep) ;
		if( !validStep || stepIdx<0 ) {
			return steps[0] ;
		}
		if( stepIdx + 1 >= steps.length ) {
			return null ;
		}
		return steps[stepIdx+1] ;
	},
	startValidation: function() {
		this.setValidationStep(this.getNextValidationStep(null)) ;
	},
	setValidationStep: function( validStep ) {
		// hide All
		this.getForm().findField('ask_prod').setVisible(false) ;
		this.getForm().findField('ask_qty').setVisible(false) ;
		this.getForm().findField('display_error').setVisible(false) ;
		this.down('#fsScanner').setVisible(false) ;
		this.down('#fsQty').setVisible(false) ;
		
		switch( validStep ) {
			case 'prod' :
				this.getForm().findField('ask_prod').setVisible(true) ;
				this.down('#txtScan').reset(true) ;
				this.down('#fsScanner').setVisible(true) ;
				this.down('#txtScan').focus() ;
				break ;
			case 'qty' :
				this.getForm().findField('ask_qty').setVisible(true) ;
				this.down('#txtQty').reset(true) ;
				this.down('#fsQty').setVisible(true) ;
				this.down('#txtQty').focus() ;
				break ;
			default :
				return ;
		}
		this.getForm().findField('ask_currentStep').setValue(validStep) ;
	},
	handleSubmit: function() {
		var transferligRecord = this._transferligRecord ;
		var txtError = null ;
		switch( this.getCurValidationStep() ) {
			case 'prod' :
				var value = this.down('#txtScan').getValue() ;
				value = value.trim().toUpperCase() ;
				if( transferligRecord.get('stk_prod')==value ) {
					break ;
				}
				txtError = 'Invalid P/N' ;
				break ;
			case 'qty' :
				var value = this.down('#txtQty').getValue() ;
				value = parseFloat(value) ;
				if( transferligRecord.get('mvt_qty')==value ) {
					break ;
				}
				txtError = 'Invalid quantity' ;
				break ;
			default :
				txtError = 'Error ?' ;
				break ;
		}
		if( !txtError ) {
			// next
			// - if null => on Success
			// - else => setNext
			var nextValidationStep = this.getNextValidationStep( this.getCurValidationStep() ) ;
			if( !nextValidationStep ) {
				this.setValidationStep( null ) ;
				this.handleEnd() ;
			} else {
				this.setValidationStep(nextValidationStep) ;
			}
			return ;
		}
		
		// showError + delay setStep(same)
		this.setValidationStep(null) ;
		this.getForm().findField('display_error').setValue(txtError);
		this.getForm().findField('display_error').setVisible(true);
		Ext.defer( function() {
			this.setValidationStep(this.getCurValidationStep()) ;
		},3000,this) ;
	},
	
	
	
	handleEnd: function() {
		var transferligRecord = this._transferligRecord ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_setCommit',
				transfer_filerecordId: transferligRecord.get('transfer_filerecord_id'),
				transferStep_filerecordId: transferligRecord.get('transferstep_filerecord_id'),
				transferLig_filerecordIds: Ext.JSON.encode([transferligRecord.get('transferlig_filerecord_id')]),
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				this.onSuccess() ;
			},
			scope: this
		}) ;
	},
	onSuccess: function() {
		this.down('#fsScanner').setVisible(false);
		this.down('#fsSuccess').setVisible(true);
		Ext.defer( function() {
			this.fireEvent('quit') ;
		},1000,this) ;
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
