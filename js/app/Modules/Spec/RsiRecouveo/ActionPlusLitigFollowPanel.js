Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusLitigFollowPanel',{
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
				title: 'Suivi du litige',
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
					fieldLabel : 'Suite litige',
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
							boxLabel  : 'Fin du litige<br><i>Retour dossier "en cours"</i>',
							name      : 'schedlock_next',
							inputValue: 'end'
						}
					]
				},{
					hidden: true,
					anchor: '',
					width: 200,
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'schedlock_schednew_date',
					fieldLabel: 'Date prévue'
				}]
			},{
				xtype: 'box',
				width: 16
			},{
				flex: 1,
				xtype: 'container',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: [{
					xtype: 'fieldset',
					padding: 10,
					title: 'Pièces courrier',
					layout: {
						type: 'anchor'
					},
					defaults: {
						anchor: '100%',
						labelWidth: 80
					},
					items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.AttachmentsFieldPanel',{
						name: 'attachments',
						optimaModule: this.optimaModule
					})]
				},{
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
			this.getForm().findField('schedlock_schednew_date').setVisible( fieldValue=='schednew' ) ;
		}
		this.fireEvent('change',field) ;
	}
}) ;
