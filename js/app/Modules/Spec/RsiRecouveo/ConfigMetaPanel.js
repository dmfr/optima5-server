Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigMetaPanel', {
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
				flex: 3,
				padding: 8,
				xtype: 'container',
				layout: 'anchor',
				defaults: {
					anchor: '100%'
				},
				items: [{
					xtype: 'fieldset',
					title: 'Coordonnées générales',
					fieldDefaults: {
						labelWidth: 135,
						anchor: '100%'
					},
					items: [{
						xtype: 'textfield',
						name: 'gen_entity_name',
						fieldLabel: 'Raison Sociale'
					},{
						xtype: 'textarea',
						name: 'gen_entity_adr',
						fieldLabel: 'Adresse principale'
					},{
						xtype: 'textfield',
						name: 'gen_entity_siret',
						fieldLabel: 'SIRET'
					}]
				},{
					xtype: 'fieldset',
					title: 'Resources extérieures',
					fieldDefaults: {
						labelWidth: 135,
						anchor: '100%'
					},
					items: [{
						xtype: 'textfield',
						name: 'gen_ext_recouv',
						fieldLabel: 'Cabinet recouvrement'
					},{
						xtype: 'textfield',
						name: 'gen_ext_avocat',
						fieldLabel: 'Nom Avocat'
					}]
				},{
					xtype: 'fieldset',
					title: 'Pied de page courriers',
					fieldDefaults: {
						labelWidth: 135,
						anchor: '100%'
					},
					items: [{
						xtype: 'textarea',
						name: 'gen_mail_footer',
						fieldLabel: 'Pied de page'
					}]
				}]
			},{
				flex: 2,
				padding: 8,
				xtype: 'container',
				layout: 'anchor',
				defaults: {
					labelWidth: 165,
					anchor: '100%'
				},
				items: [{
					xtype: 'fieldset',
					title: 'Valeurs défaut / Scénarios',
					fieldDefaults: {
						labelWidth: 170,
						anchor: '100%'
					},
					items: [{
						xtype: 'numberfield',
						hideTrigger: true,
						name: 'static_inter_call',
						fieldLabel: 'Temps après appel'
					},{
						xtype: 'numberfield',
						hideTrigger: true,
						name: 'static_inter_voicemail',
						fieldLabel: 'Temps après message laissé'
					},{
						xtype: 'numberfield',
						hideTrigger: true,
						name: 'static_inter_mail',
						fieldLabel: 'Temps après courrier'
					},{
						xtype: 'numberfield',
						hideTrigger: true,
						name: 'static_grace_pay',
						fieldLabel: 'Temps de répit pour paiement'
					},{
						xtype: 'numberfield',
						hideTrigger: true,
						name: 'static_max_delay',
						fieldLabel: 'Délai max avant prochaine action'
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
