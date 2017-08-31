Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileCreateLitigPanel',{
	extend:'Ext.form.Panel',
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: 'anchor',
			items: [{
				xtype: 'fieldset',
				padding: 10,
				title: 'Qualification litige',
				layout: {
					type: 'anchor'
				},
				fieldDefaults: {
					anchor: '100%',
					labelWidth: 90
				},
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'OPT_LITIG',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					name: 'litig_code',
					allowBlank: false,
					fieldLabel: 'Motif'
				}),{
					anchor: '',
					width: 200,
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'litig_nextdate',
					fieldLabel: 'Prochain suivi'
				},{
					xtype: 'fieldset',
					checkboxToggle: true,
					checkboxName: 'litig_ext_is_on',
					title: 'Affectation externe',
					items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
						fieldLabel: 'Destinataire',
						name: 'litig_ext_user',
						cfgParam_id: 'USER',
						cfgParam_emptyDisplayText: 'Select...',
						icon: 'images/op5img/ico_users_16.png',
						selectMode: 'SINGLE',
						optimaModule: this.optimaModule
					})]
				}]
			}]
		}) ;
		
		this.callParent() ;
		this.getForm().setValues({litig_ext_is_on:false}) ;
	}
}) ;
