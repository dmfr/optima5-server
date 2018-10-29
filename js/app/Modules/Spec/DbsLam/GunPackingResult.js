Ext.define('Optima5.Modules.Spec.DbsLam.GunPackingResult',{
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
			},{
				icon: 'images/op5img/ico_print_16.png',
				text: '<b>'+this._printerIp+'</b>',
				handler: function() {
					
				},
				scope: this
			}],
			layout: 'anchor',
			fieldDefaults: {
				labelWidth: 100,
				anchor: '100%'
			},
			items: [{
				hidden: true,
				xtype: 'fieldset',
				itemId: 'fsDetails',
				title: 'Packing details',
				items: [{
					xtype: 'displayfield',
					name: 'display_trspt_code',
					fieldStyle: 'font-weight:bold',
					fieldLabel: 'Position'
				},{
					xtype: 'displayfield',
					name: 'display_trspt_id',
					fieldStyle: 'font-weight:bold',
					fieldLabel: 'Container Ref'
				},{
					xtype: 'displayfield',
					name: 'display_cde',
					//fieldStyle: 'font-weight:bold',
					fieldLabel: 'Container Ref'
				},{
					xtype: 'displayfield',
					name: 'display_stk_prod',
					//fieldStyle: 'font-weight:bold',
					fieldLabel: 'P/N'
				},{
					xtype: 'displayfield',
					name: 'display_qty',
					//fieldStyle: 'font-weight:bold',
					fieldLabel: 'Quantity'
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
					icon: 'images/op5img/ico_print_16.png',
					text: 'Print',
					handler: function() {
						this.handlePrint() ;
					},
					scope: this
				},{
					xtype: 'box',
					width: 32
				},{
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
		this.doLoadTransferCdePack( this._transferCdePackFilerecordId ) ;
	},
	doLoadTransferCdePack: function(transferCdePackFilerecordId) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferPacking_getPackingRecord',
				filter_transferCdePackFilerecordId: transferCdePackFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				this.onLoadTransferCdePack(ajaxResponse.record) ;
			},
			scope: this
		}) ;
	},
	onLoadTransferCdePack: function(packRecord) {
		this._transferCdePackRecord = packRecord ;
		
		var formValues = {
			display_trspt_code: packRecord.id_trspt_code,
			display_trspt_id: packRecord.id_trspt_id,
			display_cde: packRecord['cde'].cde_nr,
			display_stk_prod: packRecord['ligs'][0].stk_prod,
			display_qty: packRecord['ligs'][0].mvt_qty
		};
		this.getForm().setValues(formValues) ;
		this.down('#fsDetails').setVisible(true);
		
		this.hideLoadmask() ;
		this.onSuccess() ;
	},
	
	
	onSuccess: function() {
		this.down('#fsSuccess').setVisible(true);
		Ext.defer( function() {
			this.handlePrint() ;
		},200,this) ;
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
	
	handlePrint: function() {
		if( !this._transferCdePackRecord ) {
			Ext.MessageBox.alert('Error','Error') ;
			return ;
		}
		
		this.showLoadmask() ;
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_spool_transferCdePack',
			transferCdePack_filerecordIds: Ext.JSON.encode([this._transferCdePackRecord['transfercdepack_filerecord_id']]),
			printer_printerIp: this._printerIp
		} ;
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				//this.optimaModule.postCrmEvent('datachange') ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleQuit: function() {
		this.fireEvent('quit') ;
	},
});
