Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusBumpPanel',{
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
				}]
			},{
				xtype: 'box',
				width: 16
			},{
				flex: 1,
				xtype: 'container',
				layout: 'anchor',
				items: [{
					xtype: 'fieldset',
					title: 'Qualifier la reprise ?',
					checkboxToggle: true,
					checkboxName: 'bumptxt_is_on',
					defaults: {
						anchor: '100%',
						labelWidth: 80
					},
					items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
						cfgParam_id: 'OPT_BUMP',
						cfgParam_emptyDisplayText: 'Select...',
						optimaModule: this.optimaModule,
						name: 'bumptxt_code',
						allowBlank: false,
						fieldLabel: 'Motif'
					})]
				},{
					xtype: 'fieldset',
					title: 'Commentaire',
					defaults: {
						anchor: '100%',
						labelWidth: 80
					},
					items: [{
						style: 'margin-top: 4px;',
						xtype: 'textarea',
						name: 'txt',
						height: 84
					}]
				}]
			}]
		}) ;
		
		this.callParent() ;
		
		// Unmask reprise dossier ?
		this.getForm().setValues({
			bumptxt_is_on: false
		});
	}
}) ;
