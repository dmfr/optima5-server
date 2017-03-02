Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigPayPanel', {
	extend: 'Ext.form.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				padding: 8,
				xtype: 'container',
				layout: 'anchor',
				defaults: {
					anchor: '100%'
				},
				items: [{
					xtype: 'fieldset',
					checkboxToggle: true,
					checkboxName: 'pay_virement_on',
					title: 'Virement bancaire',
					fieldDefaults: {
						labelWidth: 135,
						anchor: '100%'
					},
					items: [{
						xtype: 'textfield',
						name: 'pay_virement_iban',
						fieldLabel: 'IBAN'
					},{
						xtype: 'textfield',
						name: 'pay_virement_bic',
						fieldLabel: 'BIC'
					},{
						xtype: 'textfield',
						name: 'pay_virement_titulaire',
						fieldLabel: 'Titulaire Cmpt.'
					},{
						xtype: 'textfield',
						name: 'pay_virement_domiciliation',
						fieldLabel: 'Domiciliation'
					}]
				},{
					xtype: 'fieldset',
					checkboxToggle: true,
					checkboxName: 'pay_cheque_on',
					title: 'Chèque bancaire',
					fieldDefaults: {
						labelWidth: 135,
						anchor: '100%'
					},
					items: [{
						xtype: 'textfield',
						name: 'pay_cheque_ordre',
						fieldLabel: 'Ordre'
					},{
						xtype: 'textarea',
						name: 'pay_cheque_adr',
						fieldLabel: 'Adresse Corresp.'
					}]
				}]
			},{
				flex: 1,
				padding: 8,
				xtype: 'container',
				layout: 'anchor',
				defaults: {
					labelWidth: 165,
					anchor: '100%'
				},
				items: [{
					xtype: 'fieldset',
					checkboxToggle: true,
					checkboxName: 'pay_cb_on',
					title: 'Carte bancaire',
					fieldDefaults: {
						labelWidth: 135,
						anchor: '100%'
					},
					items: [{
						xtype: 'textfield',
						name: 'pay_cb_website',
						fieldLabel: 'Site Web'
					}]
				},{
					xtype: 'fieldset',
					checkboxToggle: true,
					checkboxName: 'pay_mandat_on',
					title: 'Mandat cash',
					fieldDefaults: {
						labelWidth: 135,
						anchor: '100%'
					},
					items: [{
						xtype: 'textfield',
						name: 'pay_mandat_destinataire',
						fieldLabel: 'Ref.Destinataire'
					}]
				}]
			}],
			buttons: [{
				itemId: 'btnOk',
				xtype: 'button',
				text: 'OK',
				icon: 'images/op5img/ico_save_16.gif',
				handler: function( btn ) {
					this.handleSave() ;
				},
				scope: this
			},{
				itemId: 'btnCancel',
				xtype: 'button',
				text: 'Abandon',
				icon: 'images/op5img/ico_cancel_small.gif',
				handler: function( btn ) {
					this.destroy() ;
				},
				scope: this
			}]
		});
		this.callParent();
		this.getForm().setValues({
			pay_mandat_on: false,
			pay_cb_on: false,
			pay_cheque_on: false,
			pay_virement_on: false
		});
		this.doLoad() ;
	},
	doLoad: function() {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'config_loadMeta'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.getForm().setValues( ajaxResponse.data ) ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	},
	handleSave: function() {
		var form = this.getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		var formValues = this.getForm().getValues(false,false,false,true) ;
		
		/*
		Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
		*/
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'config_saveMeta',
				data: Ext.JSON.encode(formValues)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.destroy() ;
			},
			callback: function() {
			},
			scope: this
		}) ;
	}
});
