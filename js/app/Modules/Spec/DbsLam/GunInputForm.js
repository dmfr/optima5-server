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
					this.doLoadTransferStep( this._transferstepFilerecordId ) ;
				},
				scope: this
			}],
			layout: 'fit',
			items: []
		}) ;
		this.callParent() ;
		this.doLoadTransferStep( this._transferstepFilerecordId ) ;
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
				selectOnFocus: true,
				selectOnTab: false,
				queryMode: 'remote',
				displayField: 'prod_id',
				valueField: 'id',
				queryParam: 'filter',
				minChars: 2,
				fieldStyle: 'text-transform:uppercase',
				store: {
					model: 'DbsLamProdComboboxModel',
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_dbs_lam',
							_action: 'prods_getGrid',
							limit: 20
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
				anchor: '',
				width: 120
			},{
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
						this.fireEvent('quit') ;
					},
					scope: this
				}]
			}]
		};
		
		this.removeAll() ;
		this.add(form) ;
	},
	
	
	buildFormSpec: function(inputObj) {
		var formItems = [] ;
		Ext.Array.each( inputObj, function(inputObjField) {
			formItems.push({
				xtype: 'textfield',
				name: inputObjField.sql_var,
				fieldLabel: inputObjField.txt,
				anchor: '100%'
			});
		}) ;
		formItems.push({
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
					this.fireEvent('quit') ;
				},
				scope: this
			}]
		});
		
		var form = {
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
	},
	
	
	buildSummary: function(mvtObj) {
		
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
