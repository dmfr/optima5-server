Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileCreateJudicPanel',{
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
				title: 'Qualification action externe',
				layout: {
					type: 'anchor'
				},
				fieldDefaults: {
					anchor: '100%',
					labelWidth: 90
				},
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'OPT_JUDIC',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					name: 'judic_code',
					allowBlank: false,
					fieldLabel: 'Motif'
				}),{
					anchor: '',
					width: 200,
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'judic_nextdate',
					fieldLabel: 'Prochain suivi'
				},{
					xtype: 'textarea',
					height: 75,
					name: 'judic_txt',
					fieldLabel: 'Observation'
				}]
			}]
		}) ;
		
		this.callParent() ;
		this.getForm().setValues({litig_ext_is_on:false}) ;
	}
}) ;
