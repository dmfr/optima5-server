Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusJudicFollowPanel',{
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
				title: 'Suivi action judiciaire',
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
					fieldLabel : 'Suite action',
					defaultType: 'radiofield',
					defaults: {
						flex: 1
					},
					layout: 'vbox',
					items: [
						{
							boxLabel  : 'Planifier nouveau suivi<br><i>Date à renseigner ci-dessous</i>',
							name      : 'schedlock_next',
							inputValue: 'schednew'
						}, {
							boxLabel  : 'Fin de l\'action<br><i>Retour dossier "en cours"</i>',
							name      : 'schedlock_next',
							inputValue: 'end'
						}
					]
				},{
			}]
			},{
				xtype: 'box',
				width: 16
			},{
				flex: 1,
				xtype: 'component',
				itemId: 'fsNone',
			},{
				flex: 1,
				hidden: true,
				xtype: 'fieldset',
				itemId: 'fsNext',
				padding: 10,
				layout: {
					type: 'anchor'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					hidden: true,
					anchor: '',
					width: 200,
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'schedlock_schednew_date',
					fieldLabel: 'Date prévue'
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					hidden: true,
					cfgParam_id: 'OPT_JUDIC',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					name: 'schedlock_schednew_code',
					allowBlank: false,
					fieldLabel: 'Motif'
				}),{
					labelAlign: 'top',
					fieldLabel: 'Commentaire',
					xtype: 'textarea',
					name: 'txt',
					height: 100
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
			switch( fieldValue ) {
				case 'schednew' :
					this.down('#fsNone').setVisible(false) ;
					this.down('#fsNext').setVisible(true) ;
					this.down('#fsNext').setTitle('Suite action') ;
					break ;
				case 'end' :
					this.down('#fsNone').setVisible(false) ;
					this.down('#fsNext').setVisible(true) ;
					this.down('#fsNext').setTitle('Fin action') ;
					break ;
				default :
					this.down('#fsNone').setVisible(true) ;
					this.down('#fsNext').setVisible(false) ;
					break ;
					
			}
			this.getForm().findField('schedlock_schednew_code').setVisible( fieldValue=='schednew' ) ;
			this.getForm().findField('schedlock_schednew_date').setVisible( fieldValue=='schednew' ) ;
		}
		this.fireEvent('change',field) ;
	}
}) ;
