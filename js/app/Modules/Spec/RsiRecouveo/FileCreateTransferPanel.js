Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileCreateTransferPanel',{
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
				title: 'Transfert externe',
				layout: {
					type: 'anchor'
				},
				fieldDefaults: {
					anchor: '100%',
					labelWidth: 90
				},
				items: [{
					anchor: '',
					width: 200,
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'trsfr_nextdate',
					fieldLabel: 'Prochain suivi'
				},{
					xtype: 'textarea',
					height: 75,
					name: 'trsfr_txt',
					fieldLabel: 'Observation'
				}]
			}]
		}) ;
		
		this.callParent() ;
		this.getForm().setValues() ;
	}
}) ;
