Ext.define('Optima5.Modules.Spec.DbsLam.GunPickingTake',{
	extend: 'Ext.form.Panel',
	
	requires: ['Ext.form.FieldSet'],
	
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
					name: 'display_container_ref',
					fieldStyle: 'font-weight:bold',
					fieldLabel: 'Container Ref'
				},{
					xtype: 'displayfield',
					name: 'display_current_adr',
					fieldStyle: 'font-weight:bold',
					fieldLabel: 'Position'
				},{
					xtype: 'displayfield',
					name: 'display_stk_prod',
					fieldLabel: 'P/N'
				},{
					xtype: 'displayfield',
					name: 'display_qty',
					fieldLabel: 'Quantity'
				}]
			},{
				xtype: 'fieldset',
				title: 'Action',
				items: [{
					hidden: true,
					xtype: 'displayfield',
					name: 'display_switch',
					fieldLabel: '<b>Notice</b>',
					fieldStyle: 'font-size:16px ; color:blue',
					value: '<b>Switch Location</b>'
				},{
					xtype: 'displayfield',
					name: 'display_next_adr',
					fieldLabel: '<b>Move To</b>',
					fieldStyle: 'font-size:24px',
					value: ''
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
								this.handleScan() ;
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
			display_container_ref: transferligRecord.get('container_ref'),
			display_current_adr: transferligRecord.get('src_adr'),
			display_stk_prod: transferligRecord.get('stk_prod'),
			display_qty: transferligRecord.get('mvt_qty'),
			display_next_adr: transferligRecord.get('dst_adr')
		};
		this.getForm().setValues(formValues)
		this.hideLoadmask() ;
		this.down('#txtScan').focus() ;
	},
	

	
	onFailure: function( txtError ) {
		this.down('#fsScanner').setVisible(false);
		this.getForm().findField('display_error').setValue(txtError);
		this.getForm().findField('display_error').setVisible(true);
		Ext.defer( function() {
			this.getForm().findField('display_error').setVisible(false);
			this.down('#txtScan').reset() ;
			this.down('#fsScanner').setVisible(true);
			this.down('#txtScan').focus() ;
		},3000,this) ;
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
