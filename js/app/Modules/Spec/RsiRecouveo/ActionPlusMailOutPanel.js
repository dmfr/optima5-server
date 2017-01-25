Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel',{
	extend:'Ext.form.Panel',
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'fieldset',
				title: 'Type d\'action',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					flex: 1,
					xtype: 'displayfield',
					fieldLabel: 'Action',
					value: '<b>Courrier / Mail Sortant</b>'
				},{
					flex: 1,
					xtype: 'combobox',
					name: 'mail_model',
					fieldLabel: 'Modèle lettre',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['txt'],
						data : [
							{id: 'RELANCE_STD', txt:'Relance Standard'}
						]
					},
					queryMode: 'local',
					displayField: 'txt',
					valueField: 'id'
				}]
			},{
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				items: [{
					xtype: 'container',
					flex: 1,
					layout: {
						type: 'anchor'
					},
					defaults: {
						anchor: '100%'
					},
					items: [{
						xtype: 'fieldset',
						layout: {
							type: 'anchor'
						},
						defaults: {
							anchor: '100%'
						},
						checkboxToggle: true,
						collapsed: false, // fieldset initially collapsed
						title: 'Envoi postal',
						items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
							cfgParam_id: 'ADR_POSTAL',
							cfgParam_emptyDisplayText: 'Select...',
							optimaModule: this.optimaModule,
							accountRecord: this._accountRecord,
							name: 'adrpost_filerecord_id',
							allowBlank: false,
							fieldLabel: 'Adresse',
							listeners: {
								change: this.onSelectAdrPostal,
								scope: this
							}
						}),{
							xtype: 'textarea',
							name: 'adrpost_txt',
							fieldLabel: '&nbsp;',
							labelSeparator: '&nbsp;'
						},{
							xtype: 'checkboxfield',
							name: 'adrpost_new',
							boxLabel: 'Création nouveau contact ?'
						}]
					},{
						xtype: 'fieldset',
						layout: {
							type: 'anchor'
						},
						defaults: {
							anchor: '100%'
						},
						checkboxToggle: true,
						collapsed: true, // fieldset initially collapsed
						title: 'SMS',
						items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
							cfgParam_id: 'ADR_TEL',
							cfgParam_emptyDisplayText: 'Select...',
							optimaModule: this.optimaModule,
							accountRecord: this._accountRecord,
							name: 'adrtel_filerecord_id',
							allowBlank: false,
							fieldLabel: 'No.Mobile',
							listeners: {
								change: this.onSelectAdrTel,
								scope: this
							}
						}),{
							xtype: 'textfield',
							name: 'adrtel_txt',
							fieldLabel: 'No.Mobile'
						}]
					},{
						xtype: 'fieldset',
						layout: {
							type: 'anchor'
						},
						defaults: {
							anchor: '100%'
						},
						checkboxToggle: true,
						collapsed: true, // fieldset initially collapsed
						title: 'Email',
						items: [{
							xtype: 'textfield',
							name: 'adrmail_email',
							fieldLabel: 'Email'
						}]
					}]
				},{
					xtype: 'box',
					width: 16
				},{
					flex:1,
					xtype: 'fieldset',
					padding: 10,
					title: 'Paragraphe additionnel',
					layout: {
						type: 'anchor'
					},
					defaults: {
						anchor: '100%',
						labelWidth: 80
					},
					items: [{
						xtype: 'textarea',
						name: 'mail_txt',
						height: 150
					}]
				}]
			}]
		}) ;
		
		this.callParent() ;
		this.onSelectAdrPostal() ;
		this.onSelectAdrTel() ;
	},
	
	onSelectAdrPostal: function() {
		var cmb = this.getForm().findField('adrpost_filerecord_id'),
			adrObj = cmb.getNode(),
			adrField = this.getForm().findField('adrpost_txt'),
			adrNew = this.getForm().findField('adrpost_new') ;
		adrField.reset() ;
		adrNew.reset() ;
		if( adrObj ) {
			adrField.setValue( adrObj.nodeText ) ;
			adrField.setReadOnly(true) ;
			adrNew.setVisible(false);
		} else {
			adrField.setReadOnly(false) ;
			adrNew.setVisible(true) ;
		}
	},
	onSelectAdrTel: function() {
		var cmb = this.getForm().findField('adrtel_filerecord_id'),
			adrObj = cmb.getNode(),
			adrField = this.getForm().findField('adrtel_txt') ;
		adrField.reset() ;
		if( adrObj ) {
			adrField.setValue( adrObj.nodeText ) ;
			adrField.setReadOnly(true) ;
		} else {
			adrField.setReadOnly(false) ;
		}
	}
}) ;
