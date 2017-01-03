Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusClosePanel',{
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
				title: 'Demande de clôture',
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
				},{
					xtype      : 'fieldcontainer',
					fieldLabel : 'Fermeture',
					defaultType: 'radiofield',
					defaults: {
						flex: 1
					},
					layout: 'vbox',
					items: [
						{
							boxLabel  : 'Valider la fermeture<br><i>Issue à spécifier ci-dessous</i>',
							name      : 'schedlock_next',
							inputValue: 'close'
						},{
							boxLabel  : '<font color="red">Refus fermeture</font><br><i>Retour dossier "en cours"</i>',
							name      : 'schedlock_next',
							inputValue: 'end'
						}
					]
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'OPT_CLOSEACK',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					name: 'close_code',
					allowBlank: false,
					fieldLabel: 'Issue'
				})]
			},{
				xtype: 'box',
				width: 16
			},{
				flex: 1,
				xtype: 'fieldset',
				padding: 10,
				title: 'Observations',
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
		this.getForm().getFields().each( function(field) {
			field.on('change',function(field) {
				this.onFormChange(this,field) ;
			},this) ;
		},this) ;
	},
	
	onFormChange: function(form,field) {
		if( field.getName() == 'schedlock_next' ) {
			var fieldValue = form.getValues()['schedlock_next'] ;
			this.getForm().findField('close_code').setVisible( fieldValue=='close' ) ;
		}
		this.fireEvent('change',field) ;
	}
}) ;
