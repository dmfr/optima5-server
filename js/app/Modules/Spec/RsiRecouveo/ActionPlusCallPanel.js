Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallPanel',{
	extend:'Ext.form.Panel',
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				xtype: 'fieldset',
				title: 'Type d\'action',
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					xtype: 'displayfield',
					fieldLabel: 'Action',
					name: 'action_txt',
					value: ''
				},{
					hidden: true,
					xtype: 'displayfield',
					fieldLabel: 'Prévue le',
					name: 'action_sched',
					value: '',
					listeners: {
						change: function(field,val) {
							field.setVisible( !Ext.isEmpty(val) ) ;
						}
					}
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'ADR_TEL',
					cfgParam_emptyDisplayText: 'Saisie autre No Appel',
					optimaModule: this.optimaModule,
					accountRecord: this._accountRecord,
					name: 'adrtel_filerecord_id',
					allowBlank: false,
					fieldLabel: 'No Appel',
					listeners: {
						change: this.onSelectAdrTelName,
						scope: this
					}
				}),{
					xtype: 'textfield',
					name: 'adrtel_txt',
					fieldLabel: '&nbsp;',
					labelSeparator: '&nbsp;'
				},{
					xtype: 'checkboxfield',
					name: 'adrtel_new',
					boxLabel: 'Création nouveau contact ?'
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'OPT_CALLOUT',
					cfgParam_emptyDisplayText: 'Résultat de l\'appel',
					optimaModule: this.optimaModule,
					accountRecord: this._accountRecord,
					name: 'adrtel_result',
					allowBlank: false,
					fieldLabel: 'Résultat appel'
				}),Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'OPT_ADRSTATUS',
					cfgParam_emptyDisplayText: 'Pas de changement',
					optimaModule: this.optimaModule,
					accountRecord: this._accountRecord,
					name: 'adrtel_status',
					allowBlank: false,
					fieldLabel: 'Qualification'
				})]
			},{
				xtype: 'box',
				width: 16
			},{
				flex: 1,
				xtype: 'fieldset',
				padding: 10,
				title: 'Compte-rendu',
				layout: {
					type: 'anchor'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					xtype: 'textarea',
					name: 'txt',
					height: 150
				}]
			}]
		}) ;
		
		this.callParent() ;
		this.onSelectAdrTelName() ;
	},
	
	onSelectAdrTelName: function() {
		var cmb = this.getForm().findField('adrtel_filerecord_id'),
			adrObj = cmb.getNode(),
			adrField = this.getForm().findField('adrtel_txt'),
			adrNew = this.getForm().findField('adrtel_new'),
			adrStatus = this.getForm().findField('adrtel_status') ;
		adrField.reset() ;
		adrStatus.reset() ;
		adrNew.reset() ;
		if( adrObj ) {
			adrField.setValue( adrObj.nodeText ) ;
			adrField.setReadOnly(true) ;
			adrNew.setVisible(false);
			adrStatus.setVisible(true);
		} else {
			adrField.setReadOnly(false) ;
			adrNew.setVisible(true) ;
			adrStatus.setVisible(false);
		}
	}
}) ;
