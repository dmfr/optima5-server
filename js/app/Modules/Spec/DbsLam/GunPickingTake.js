Ext.define('Optima5.Modules.Spec.DbsLam.GunPickingTake',{
	extend: 'Ext.form.Panel',
	
	requires: [
		'Ext.form.FieldSet',
		'Ext.form.field.Hidden',
		'Ext.form.field.Number'
	],
	
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
			}],
			layout: 'anchor',
			fieldDefaults: {
				labelWidth: 100,
				anchor: '100%'
			},
			items: [{
				xtype: 'fieldset',
				title: 'Container details',
				items: [{
					xtype: 'displayfield',
					name: 'display_current_adr',
					fieldStyle: 'font-weight:bold',
					fieldLabel: 'Position'
				},{
					xtype: 'displayfield',
					name: 'display_container_ref',
					fieldStyle: 'font-weight:bold',
					fieldLabel: 'Container Ref'
				},{
					xtype: 'displayfield',
					name: 'display_stk_prod',
					fieldStyle: 'font-weight:bold',
					fieldLabel: 'P/N'
				},{
					xtype: 'displayfield',
					name: 'display_qty',
					fieldStyle: 'font-weight:bold',
					fieldLabel: 'Quantity'
				}]
			},{
				xtype: 'fieldset',
				title: 'Action',
				items: [{
					hidden: true,
					xtype: 'hiddenfield',
					name: 'ask_currentStep'
				},{
					hidden: true,
					xtype: 'displayfield',
					name: 'ask_prod',
					fieldLabel: '<b>Notice</b>',
					fieldStyle: 'font-size:16px',
					value: '<b>Confirm P/N</b>'
				},{
					hidden: true,
					xtype: 'displayfield',
					name: 'ask_qty',
					fieldLabel: '<b>Notice</b>',
					fieldStyle: 'font-size:16px',
					value: '<b>Confirm Qty</b>'
				},{
					hidden: true,
					xtype: 'displayfield',
					name: 'display_error',
					//fieldLabel: '<b>Move To</b>',
					fieldStyle: 'font-size:16px ; color:red',
					value: ''
				}]
			},{
				xtype: 'fieldset',
				itemId: 'fsScanner',
				title: 'Scanner',
				items: [{
					xtype:'textfield',
					itemId: 'txtScan',
					flex:1,
					listeners : {
						specialkey: function(field, e){
							if (e.getKey() == e.ENTER) {
								this.handleSubmit() ;
							}
						},
						scope: this
					}
				}]
			},{
				xtype: 'fieldset',
				itemId: 'fsQty',
				title: 'Scanner',
				items: [{
					xtype:'numberfield',
					hideTrigger: true,
					fieldLabel: 'Qty',
					itemId: 'txtQty',
					flex:1,
					listeners : {
						specialkey: function(field, e){
							if (e.getKey() == e.ENTER) {
								this.handleSubmit() ;
							}
						},
						scope: this
					}
				}]
			},{
				xtype: 'container',
				hidden: true,
				itemId: 'fsSuccess',
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
		}) ;
		this.callParent() ;
		this.showLoadmask() ;
		this.doLoadTransferLig( this._transferligFilerecordId ) ;
	},
	doLoadTransferLig: function(transferligFilerecordId) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_getTransferLig',
				filter_transferLigFilerecordId_arr: Ext.JSON.encode([transferligFilerecordId])
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText),
					transferligRecord = null ;
				if( ajaxResponse.data && ajaxResponse.data.length == 1 ) {
					transferligRecord = Ext.create('DbsLamTransferLigModel',ajaxResponse.data[0]) ;
				}
				if( !transferligRecord ) {
					return ;
				}
				this.onLoadTransferLig(transferligRecord) ;
			},
			scope: this
		}) ;
	},
	onLoadTransferLig: function(transferligRecord) {
		this._transferligRecord = transferligRecord ;
		var formValues = {
			display_container_ref: transferligRecord.get('container_ref_display'),
			display_current_adr: transferligRecord.get('src_adr'),
			display_stk_prod: transferligRecord.get('stk_prod'),
			display_qty: transferligRecord.get('mvt_qty')
		};
		this.getForm().setValues(formValues)
		this.hideLoadmask() ;
		
		this.startValidation() ;
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
