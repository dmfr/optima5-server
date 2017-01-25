Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailInPanel',{
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
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'OPT_MAILIN',
					cfgParam_emptyDisplayText: 'Type de courrier',
					optimaModule: this.optimaModule,
					accountRecord: this._accountRecord,
					name: 'adrpost_result',
					allowBlank: false,
					fieldLabel: 'Retour courrier'
				}),Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'OPT_ADRSTATUS',
					cfgParam_emptyDisplayText: 'Pas de changement',
					optimaModule: this.optimaModule,
					accountRecord: this._accountRecord,
					name: 'adrpost_status',
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
		this.onSelectAdrPostal() ;
	},
	
	onSelectAdrPostal: function() {
		var cmb = this.getForm().findField('adrpost_filerecord_id'),
			adrObj = cmb.getNode(),
			adrField = this.getForm().findField('adrpost_txt'),
			adrNew = this.getForm().findField('adrpost_new'),
			adrStatus = this.getForm().findField('adrpost_status') ;
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
